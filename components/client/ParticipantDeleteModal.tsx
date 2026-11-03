'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

interface ParticipantDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: number;
  participant: { id: number; full_name: string } | null;
  onSuccess: () => void;
}

export function ParticipantDeleteModal({
  isOpen,
  onClose,
  campaignId,
  participant,
  onSuccess,
}: ParticipantDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!participant) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/client/campaigns/${campaignId}/participants/${participant.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Gagal menghapus peserta.');
        return;
      }

      toast.success(data.message || `Peserta ${participant.full_name} berhasil dihapus.`);
      onSuccess();
      onClose();
    } catch {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Konfirmasi Hapus Peserta"
      maxWidthClassName="max-w-md"
    >
      <div className="space-y-4">
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs text-red-900 leading-relaxed">
            Apakah Anda yakin ingin menghapus peserta <strong>{participant?.full_name}</strong>?
            <p className="mt-1 text-[11px] text-red-700">
              Data peserta beserta riwayat hasil tesnya pada sesi ini akan dihapus secara permanen.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isDeleting}>
            Batal
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={isDeleting}
            onClick={handleDelete}
            icon={isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          >
            {isDeleting ? 'Menghapus...' : 'Ya, Hapus Peserta'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

