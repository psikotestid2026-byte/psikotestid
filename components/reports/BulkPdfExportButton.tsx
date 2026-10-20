'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Download, Loader2 } from 'lucide-react';
import { collectBulkPdfFiles } from '@/lib/bulkPdfClient';

interface BulkPdfExportButtonProps {
  customerId: number | null;
  campaignId?: number | null;
  label?: string;
  className?: string;
  blockedMessage?: string | null;
  title?: string;
}

function triggerBrowserDownload(bytes: Uint8Array, fileName: string) {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  const blob = new Blob([copy], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function BulkPdfExportButton({
  customerId,
  campaignId = null,
  label = 'Unduh ZIP PDF',
  className = '',
  blockedMessage = null,
  title,
}: BulkPdfExportButtonProps) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  async function handleClick() {
    if (blockedMessage) {
      toast.error(blockedMessage);
      return;
    }
    if (!customerId) {
      toast.error('Perusahaan tidak ditemukan.');
      return;
    }

    setBusy(true);
    setProgress('Menyiapkan daftar peserta...');
    try {
      const result = await collectBulkPdfFiles({
        customerId,
        campaignId,
        onProgress: ({ completedParticipants, total }) => {
          setProgress(`Menyusun PDF ${completedParticipants} dari ${total} peserta...`);
        },
      });

      if (result.total === 0) {
        toast.error('Tidak ada peserta dengan hasil tes pada pilihan ini.');
        return;
      }

      triggerBrowserDownload(result.bytes, result.zipFileName);
      toast.success(`ZIP laporan ${result.total} peserta berhasil diunduh.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyusun ZIP laporan.';
      toast.error(message);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-busy={busy}
      title={title}
      className={className}
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {busy ? progress || 'Menyusun ZIP...' : label}
    </button>
  );
}
