import { bulkReportUrl, dedupeFileNames } from '@/lib/combinedReport';
import { buildStoredZip, readStoredZip, type StoredZipEntry } from '@/lib/zipStore';

export interface BulkManifest {
  success?: boolean;
  total: number;
  batchSize: number;
  maxDurationSeconds: number;
  estimatedSecondsPerPdf: number;
  batches: { offset: number; limit: number }[];
  zipFileName: string;
  error?: string;
}

export interface BulkCollectResult {
  total: number;
  zipFileName: string;
  bytes: Uint8Array;
  files: StoredZipEntry[];
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (body && typeof body.error === 'string' && body.error.trim()) return body.error;
  } catch {
    // Response body was not JSON.
  }
  return `Permintaan gagal (${response.status}).`;
}

/**
 * Downloads every batch of participant PDFs and merges them into one ZIP.
 * Batches run one after another so a ~250 person export stays inside
 * the per-invocation maxDuration.
 */
export async function collectBulkPdfFiles(options: {
  customerId: number;
  campaignId?: number | null;
  fetchImpl?: typeof fetch;
  onProgress?: (info: {
    completedParticipants: number;
    total: number;
    batchIndex: number;
    batchCount: number;
  }) => void;
}): Promise<BulkCollectResult> {
  const fetchImpl = options.fetchImpl || fetch;
  const manifestResponse = await fetchImpl(
    bulkReportUrl({
      customerId: options.customerId,
      campaignId: options.campaignId,
      format: 'manifest',
    }),
    { credentials: 'same-origin' }
  );

  if (!manifestResponse.ok) {
    throw new Error(await readErrorMessage(manifestResponse));
  }

  const manifest = (await manifestResponse.json()) as BulkManifest;
  if (!manifest || !Array.isArray(manifest.batches) || typeof manifest.total !== 'number') {
    throw new Error('Respons daftar laporan tidak valid.');
  }
  if (manifest.total > 0 && manifest.batches.length === 0) {
    throw new Error('Respons daftar laporan tidak valid.');
  }
  if (manifest.total === 0) {
    return {
      total: 0,
      zipFileName: manifest.zipFileName || 'Laporan-Peserta.zip',
      bytes: new Uint8Array(),
      files: [],
    };
  }

  const files: StoredZipEntry[] = [];
  let completed = 0;
  for (let index = 0; index < manifest.batches.length; index++) {
    const batch = manifest.batches[index];
    const batchResponse = await fetchImpl(
      bulkReportUrl({
        customerId: options.customerId,
        campaignId: options.campaignId,
        offset: batch.offset,
        limit: batch.limit,
      }),
      { credentials: 'same-origin' }
    );
    if (!batchResponse.ok) {
      throw new Error(await readErrorMessage(batchResponse));
    }

    const entries = readStoredZip(new Uint8Array(await batchResponse.arrayBuffer()));
    files.push(...entries);
    completed += Number(batch.limit) || entries.length;
    options.onProgress?.({
      completedParticipants: Math.min(completed, manifest.total),
      total: manifest.total,
      batchIndex: index,
      batchCount: manifest.batches.length,
    });
  }

  const unique = dedupeFileNames(files);
  return {
    total: manifest.total,
    zipFileName: manifest.zipFileName || 'Laporan-Peserta.zip',
    files: unique,
    bytes: buildStoredZip(unique),
  };
}
