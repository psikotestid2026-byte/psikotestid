import { describe, it, expect } from 'vitest';
import { collectBulkPdfFiles } from '@/lib/bulkPdfClient';
import { buildStoredZip } from '@/lib/zipStore';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function zipResponse(files: { name: string; data: Uint8Array }[]) {
  const zip = buildStoredZip(files);
  return new Response(Buffer.from(zip), { status: 200, headers: { 'Content-Type': 'application/zip' } });
}

describe('collectBulkPdfFiles', () => {
  it('merges sequential batches into one zip', async () => {
    const calls: string[] = [];
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url.includes('format=manifest')) {
        return jsonResponse({
          success: true,
          total: 3,
          batchSize: 2,
          maxDurationSeconds: 300,
          estimatedSecondsPerPdf: 20,
          zipFileName: 'Laporan-Peserta-Acme-2026-10-16.zip',
          batches: [
            { offset: 0, limit: 2 },
            { offset: 2, limit: 1 },
          ],
        });
      }
      if (url.includes('offset=2')) {
        return zipResponse([{ name: 'c.pdf', data: Uint8Array.of(3) }]);
      }
      return zipResponse([
        { name: 'a.pdf', data: Uint8Array.of(1) },
        { name: 'b.pdf', data: Uint8Array.of(2) },
      ]);
    }) as typeof fetch;

    const progress: number[] = [];
    const result = await collectBulkPdfFiles({
      customerId: 7,
      campaignId: 4,
      fetchImpl,
      onProgress: (info) => progress.push(info.completedParticipants),
    });

    expect(calls[0]).toContain('/api/reports/bulk/pdf?');
    expect(calls[0]).toContain('customerId=7');
    expect(calls[0]).toContain('campaignId=4');
    expect(calls[0]).toContain('format=manifest');
    expect(calls).toHaveLength(3);
    expect(result.total).toBe(3);
    expect(result.files.map((file) => file.name)).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
    expect(result.zipFileName).toBe('Laporan-Peserta-Acme-2026-10-16.zip');
    expect(progress).toEqual([2, 3]);
    expect(result.bytes.byteLength).toBeGreaterThan(22);
  });

  it('returns an empty result when the company has no scored participants', async () => {
    const fetchImpl = (async () =>
      jsonResponse({
        total: 0,
        batchSize: 10,
        maxDurationSeconds: 300,
        estimatedSecondsPerPdf: 20,
        batches: [],
        zipFileName: 'kosong.zip',
      })) as typeof fetch;

    const result = await collectBulkPdfFiles({ customerId: 1, fetchImpl });
    expect(result.total).toBe(0);
    expect(result.files).toEqual([]);
  });

  it('surfaces forbidden responses from the server', async () => {
    const fetchImpl = (async () => jsonResponse({ error: 'Forbidden' }, 403)) as typeof fetch;
    await expect(collectBulkPdfFiles({ customerId: 2, fetchImpl })).rejects.toThrow('Forbidden');
  });
});
