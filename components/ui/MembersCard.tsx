'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { UserPlus, Pencil, Trash2, Mail, User, ShieldCheck, Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Member {
  id: string;
  email: string;
  full_name: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

/** Manages the HR logins (Google accounts) of one company. Pass customerId only from the admin panel. */
export function MembersCard({ customerId }: { customerId?: number | string }) {
  const url = `/api/client/members${customerId ? `?customer_id=${customerId}` : ''}`;
  const { data, mutate } = useSWR(url, fetcher);

  const [busy, setBusy] = useState(false);

  // Modal State for Add & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');

  // Delete Confirmation State
  const [deleteMember, setDeleteMember] = useState<Member | null>(null);

  const call = async (method: string, body: unknown, okMessage: string) => {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        throw new Error(json.error || 'Permintaan gagal.');
      }
      toast.success(okMessage);
      await mutate();
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormName('');
    setFormEmail('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setFormName(m.full_name || '');
    setFormEmail(m.email || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (busy) return;
    setIsModalOpen(false);
    setEditingMember(null);
    setFormName('');
    setFormEmail('');
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim()) {
      toast.error('Email wajib diisi.');
      return;
    }

    if (editingMember) {
      // Edit existing member
      const success = await call(
        'PATCH',
        { id: editingMember.id, full_name: formName.trim(), email: formEmail.trim().toLowerCase() },
        'Data akun HR berhasil diperbarui.'
      );
      if (success) {
        handleCloseModal();
      }
    } else {
      // Add new member
      const success = await call(
        'POST',
        { full_name: formName.trim(), email: formEmail.trim().toLowerCase() },
        'Akun HR berhasil ditambahkan.'
      );
      if (success) {
        handleCloseModal();
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteMember) return;
    const success = await call('DELETE', { id: deleteMember.id }, 'Akun HR berhasil dihapus.');
    if (success) {
      setDeleteMember(null);
    }
  };

  const members: Member[] = data?.members || [];
  const currentEmail: string = (data?.current_email || '').toLowerCase();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-display font-bold text-slate-900 text-base">Akun HR</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Setiap akun masuk dengan Google menggunakan email yang didaftarkan di sini.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 self-start sm:self-auto gap-1.5 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Tambah HR
        </Button>
      </div>

      <ul className="divide-y divide-slate-100">
        {members.map((m) => {
          const isCurrent = m.email.toLowerCase() === currentEmail;
          return (
            <li key={m.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-600 font-bold text-xs uppercase mt-0.5">
                  {(m.full_name || m.email).slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 text-sm">{m.full_name || '-'}</p>
                    {isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold border border-blue-200">
                        Anda
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{m.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <Badge variant={m.status === 'ACTIVE' ? 'success' : 'default'}>
                  {m.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                </Badge>

                {/* Edit Button */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => handleOpenEdit(m)}
                  className="px-2.5 py-1.5 text-xs text-slate-700 hover:text-indigo-600 hover:border-indigo-300"
                  title="Edit Akun HR"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" />
                  Edit
                </Button>

                {/* Toggle Status Button */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    call(
                      'PATCH',
                      { id: m.id, status: m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' },
                      'Status akun HR diperbarui.'
                    )
                  }
                  className="px-2.5 py-1.5 text-xs"
                >
                  {m.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                </Button>

                {/* Delete Button */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || isCurrent}
                  onClick={() => setDeleteMember(m)}
                  className="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 hover:border-red-200 disabled:opacity-30"
                  title={isCurrent ? 'Tidak dapat menghapus akun sendiri' : 'Hapus Akun HR'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </li>
          );
        })}

        {members.length === 0 && (
          <li className="py-6 text-center text-xs text-slate-500">
            Belum ada akun HR yang didaftarkan.
          </li>
        )}
      </ul>

      {/* Modal Add / Edit Member */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingMember ? 'Edit Akun HR' : 'Tambah Akun HR'}
      >
        <form onSubmit={handleSaveMember} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nama Lengkap / Jabatan
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Irvan (HR Director)"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Google Akun *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="email.google@perusahaan.com"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Akun HR wajib login menggunakan akun Google dengan email ini.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={handleCloseModal}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={busy || !formEmail.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingMember ? 'Simpan Perubahan' : 'Tambah Akun'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteMember}
        onClose={() => !busy && setDeleteMember(null)}
        title="Hapus Akun HR"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin menghapus akun HR{' '}
            <strong className="text-slate-900 font-bold">
              {deleteMember?.full_name ? `${deleteMember.full_name} (${deleteMember.email})` : deleteMember?.email}
            </strong>?
          </p>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => setDeleteMember(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={handleDelete}
              className="gap-1.5"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
