'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';
import { RECOMMENDATION_LABELS, RECOMMENDATION_STATUSES, type RecommendationStatus } from '@/lib/jobFit';

interface OverrideStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: number;
  participant: {
    id: number;
    full_name: string;
    recommendation_status: string | null;
    system_recommendation_status: string | null;
    assessor_override: boolean;
    assessor_notes: string | null;
  } | null;
  onSaved: () => void;
}

export function OverrideStatusModal({ isOpen, onClose, campaignId, participant, onSaved }: OverrideStatusModalProps) {
  const [status, setStatus] = useState<RecommendationStatus>('DIPERTIMBANGKAN');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!participant) return;
    setStatus((participant.recommendation_status as RecommendationStatus) || 'DIPERTIMBANGKAN');
    setNotes(participant.assessor_notes || '');
  }, [participant]);

  const submit = async (revert: boolean) => {
    if (!participant || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/client/campaigns/${campaignId}/participants/${participant.id}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: revert ? null : status, notes }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Gagal menyimpan keputusan asesor.');
        return;
      }
      toast.success(revert ? 'Status dikembalikan ke hasil sistem.' : 'Keputusan asesor tersimpan.');
      onSaved();
      onClose();
    } catch {
      toast.error('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keputusan Asesor">
      {participant && (
        <div className="space-y-4">
          <div className="text-xs text-slate-600">
            <div className="font-bold text-slate-900 text-sm">{participant.full_name}</div>
            <div>
              Hasil sistem:{' '}
              <strong>
                {participant.system_recommendation_status
                  ? RECOMMENDATION_LABELS[participant.system_recommendation_status as RecommendationStatus]
                  : 'Belum tersedia'}
              </strong>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Override bersifat opsional. Tanpa override, status mengikuti hasil perhitungan sistem.
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Akhir</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RecommendationStatus)}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl font-semibold"
            >
              {RECOMMENDATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {RECOMMENDATION_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan Asesor *</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Alasan perubahan status..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl"
            />
          </div>

          <div className="flex justify-between gap-3 pt-3 border-t border-slate-100">
            {participant.assessor_override ? (
              <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={() => submit(true)}>
                Kembalikan ke Hasil Sistem
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Batal
              </Button>
              <Button type="button" size="sm" disabled={isSaving || notes.trim().length < 5} onClick={() => submit(false)}>
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
