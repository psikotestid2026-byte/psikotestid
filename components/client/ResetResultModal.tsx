'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ResetResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: number;
  /** null target = reset every participant that has results. */
  target: { id: number; full_name: string } | 'ALL' | null;
  onDone: () => void;
}

export function ResetResultModal({ isOpen, onClose, campaignId, target, onDone }: ResetResultModalProps) {
  const [reason, setReason] = useState('Reset hasil trial');
  const [confirmText, setConfirmText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const isAll = target === 'ALL';

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setReason('Reset hasil trial');
    }
  }, [isOpen, target]);

  const submit = async () => {
    if (!target || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/client/campaigns/${campaignId}/participants/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(target === 'ALL' ? { all: true, reason } : { participant_ids: [target.id], reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Gagal mereset hasil.');
        return;
      }
      toast.success(`${data.reset} peserta berhasil direset dan dapat mengulang asesmen.`);
      onDone();
      onClose();
    } catch {
      toast.error('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const canSubmit = !isAll || confirmText.trim().toUpperCase() === 'RESET';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset Hasil Asesmen">
      <div className="space-y-4 text-sm">
        <p className="text-slate-600">
          {isAll
            ? 'Seluruh hasil peserta pada kampanye ini akan direset.'
            : `Hasil asesmen ${typeof target === 'object' && target ? target.full_name : ''} akan direset.`}{' '}
          Peserta dapat mengerjakan kelima tes dari awal dengan username dan password yang sama. Kuota tidak dipotong lagi, dan hasil lama
          tetap tersimpan sebagai arsip.
        </p>
        <input
          className="w-full border border-slate-200 rounded-lg px-3 py-2"
          value={reason}
          maxLength={500}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Alasan reset"
        />
        {isAll && (
          <input
            className="w-full border border-slate-200 rounded-lg px-3 py-2"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder='Ketik "RESET" untuk konfirmasi'
          />
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>Batal</Button>
          <Button variant="danger" size="sm" onClick={submit} disabled={isSaving || !canSubmit}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Reset Hasil
          </Button>
        </div>
      </div>
    </Modal>
  );
}
