'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { UserPlus, Loader2 } from 'lucide-react';

interface ParticipantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: number;
  onSuccess: () => void;
}

export function ParticipantFormModal({
  isOpen,
  onClose,
  campaignId,
  onSuccess,
}: ParticipantFormModalProps) {
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [unitWork, setUnitWork] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [jobLevelCode, setJobLevelCode] = useState('STAF');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Nama lengkap peserta wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/client/campaigns/${campaignId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          position: position.trim(),
          unit_work: unitWork.trim(),
          employee_id: employeeId.trim(),
          email: email.trim(),
          phone_number: phoneNumber.trim(),
          job_level_code: jobLevelCode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Gagal menambahkan peserta.');
        return;
      }

      toast.success(`Karyawan ${data.participant?.full_name || fullName} berhasil ditambahkan!`);
      // Reset form
      setFullName('');
      setPosition('');
      setUnitWork('');
      setEmployeeId('');
      setEmail('');
      setPhoneNumber('');
      setJobLevelCode('STAF');

      onSuccess();
      onClose();
    } catch {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Peserta Asesmen Manual"
      maxWidthClassName="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Contoh: Budi Santoso"
            className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan / Posisi</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Contoh: STAF CRM & MARCOMM"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Unit Kerja / Cabang</label>
            <input
              type="text"
              value={unitWork}
              onChange={(e) => setUnitWork(e.target.value)}
              placeholder="Contoh: DEPOK - KPP"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">NIK / No. Karyawan</label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="Contoh: 123456"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat / Level Jabatan</label>
            <select
              value={jobLevelCode}
              onChange={(e) => setJobLevelCode(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="STAF">STAF (4 Tes Wajib)</option>
              <option value="SUPERVISOR">SUPERVISOR (5 Tes + MSDT)</option>
              <option value="MANAJER">MANAJER (5 Tes + MSDT)</option>
              <option value="HOD">HEAD OF DEPT (5 Tes + MSDT)</option>
              <option value="DIREKTUR">DIREKTUR (5 Tes + MSDT)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email (Opsional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Otomatis jika kosong"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp / HP</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Contoh: 08123456789"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          Username dan password akun tes login karyawan akan digenerate otomatis dan langsung dapat diunduh pada menu <strong>Unduh Data Login Karyawan</strong>.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Peserta'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

