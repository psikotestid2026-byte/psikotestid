'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Search,
  BookOpen,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  savePaymentMethod,
  togglePaymentMethodStatus,
  deletePaymentMethod
} from './actions';

const TiptapEditor = dynamic(() => import('@/components/ui/TiptapEditor'), {
  ssr: false,
  loading: () => <div className="p-4 border rounded-xl text-xs text-slate-400">Memuat Rich Text Editor...</div>,
});

interface PaymentMethodItem {
  id: number;
  code: string;
  name: string;
  type: string;
  provider: string;
  admin_fee_flat: string | number;
  is_active: boolean;
  sort_order: number;
  instruction_id?: number | null;
  instruction_title?: string | null;
  instruction_content?: string | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PaymentMethodsAdminPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/admin/payment-methods', fetcher, {
    refreshInterval: 15000,
  });

  const rawList: PaymentMethodItem[] = data?.data || [];

  // Group by unique payment method ID
  const paymentMethods: PaymentMethodItem[] = Array.from(
    rawList.reduce((map, item) => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
      return map;
    }, new Map<number, PaymentMethodItem>()).values()
  );

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PaymentMethodItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'VIRTUAL_ACCOUNT',
    provider: 'MANUAL',
    admin_fee_flat: 0,
    is_active: true,
    sort_order: 1,
    instruction_title: '',
    instruction_content: '',
  });

  // Instruction detail modal state
  const [viewInstructionItem, setViewInstructionItem] = useState<PaymentMethodItem | null>(null);

  // Advanced Filtering
  const filtered = paymentMethods.filter((pm) => {
    const matchesSearch =
      pm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pm.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pm.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || pm.type === filterType;
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'ACTIVE' && pm.is_active) ||
      (filterStatus === 'INACTIVE' && !pm.is_active);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      name: '',
      type: 'VIRTUAL_ACCOUNT',
      provider: 'MANUAL',
      admin_fee_flat: 0,
      is_active: true,
      sort_order: paymentMethods.length + 1,
      instruction_title: '',
      instruction_content: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PaymentMethodItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      type: item.type,
      provider: item.provider,
      admin_fee_flat: Number(item.admin_fee_flat || 0),
      is_active: item.is_active,
      sort_order: item.sort_order || 1,
      instruction_title: item.instruction_title || '',
      instruction_content: item.instruction_content || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await savePaymentMethod({
        id: editingItem?.id,
        ...formData,
      });
      toast.success(editingItem ? 'Metode pembayaran berhasil diperbarui!' : 'Metode pembayaran baru berhasil ditambahkan!');
      setIsModalOpen(false);
      mutate();
    } catch (err: any) {
      toast.error('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: PaymentMethodItem) => {
    try {
      await togglePaymentMethodStatus(item.id, !item.is_active);
      toast.success(`Status ${item.name} berhasil diubah.`);
      mutate();
    } catch (err: any) {
      toast.error('Gagal mengubah status: ' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus metode pembayaran ini sepaket dengan instruksinya?')) return;
    setDeletingId(id);
    try {
      await deletePaymentMethod(id);
      toast.success('Metode pembayaran berhasil dihapus.');
      mutate();
    } catch (err: any) {
      toast.error('Gagal menghapus: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-500/30 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold text-indigo-200 mb-2">
            <CreditCard className="w-3.5 h-3.5" /> Financial Payment Gateway Gateway Master
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Metode Pembayaran & Petunjuk Transfer</h1>
          <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
            Kelola pilihan saluran pembayaran (Bank Transfer BCA, QRIS, Virtual Account) beserta rincian petunjuk langkah pembayaran yang ditampilkan ke Klien HR.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => mutate()}
            className="px-3.5 py-2 bg-indigo-900/60 hover:bg-indigo-900 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border border-indigo-500/40"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" /> Tambah Metode Pembayaran
          </button>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari Kode, Nama, Provider..."
              className="pl-9 w-full py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Multi Advanced Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filter:
            </div>

            {/* Filter Type */}
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="py-1.5 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="ALL">Semua Tipe Saluran</option>
              <option value="BANK_TRANSFER">Bank Transfer Manual</option>
              <option value="VIRTUAL_ACCOUNT">Virtual Account (VA)</option>
              <option value="QR_CODE">QRIS / E-Wallet</option>
            </select>

            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="py-1.5 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif Sahaja</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
            Memuat daftar metode pembayaran...
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Tidak ada metode pembayaran yang ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Kode & Nama Metode</th>
                  <th className="py-3 px-4">Tipe & Provider</th>
                  <th className="py-3 px-4">Biaya Admin (Flat)</th>
                  <th className="py-3 px-4">Petunjuk Transfer</th>
                  <th className="py-3 px-4">Urutan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.map((pm, index) => {
                  const rowNumber = startIndex + index + 1;
                  return (
                    <tr key={pm.id} className="hover:bg-slate-50 transition-all">
                      {/* Row Number */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">
                        {rowNumber}
                      </td>

                      {/* Code & Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          {pm.name}
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 font-semibold">
                          {pm.code}
                        </span>
                      </td>

                      {/* Type & Provider */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[10px] block w-fit mb-0.5">
                          {pm.type}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Provider: {pm.provider}
                        </span>
                      </td>

                      {/* Admin Fee */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        Rp {Number(pm.admin_fee_flat || 0).toLocaleString('id-ID')}
                      </td>

                      {/* Instruction Summary */}
                      <td className="py-3.5 px-4">
                        {pm.instruction_title ? (
                          <button
                            onClick={() => setViewInstructionItem(pm)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-[11px] inline-flex items-center gap-1 border border-indigo-100"
                          >
                            <BookOpen className="w-3 h-3 text-indigo-600" /> Lihat Petunjuk
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum ada petunjuk</span>
                        )}
                      </td>

                      {/* Sort Order */}
                      <td className="py-3.5 px-4 font-mono text-center font-bold text-slate-700">
                        {pm.sort_order}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(pm)}
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1 transition-all ${
                            pm.is_active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {pm.is_active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aktif
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" /> Nonaktif
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(pm)}
                          className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg transition-all"
                          title="Edit Metode & Petunjuk"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(pm.id)}
                          disabled={deletingId === pm.id}
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-lg transition-all disabled:opacity-50"
                          title="Hapus"
                        >
                          {deletingId === pm.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Menampilkan <strong className="text-slate-900">{filtered.length > 0 ? startIndex + 1 : 0}</strong> -{' '}
            <strong className="text-slate-900">{Math.min(startIndex + pageSize, filtered.length)}</strong> dari{' '}
            <strong className="text-slate-900">{filtered.length}</strong> metode pembayaran
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-bold text-slate-800">
              Halaman {safePage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Add / Edit Payment Method */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                {editingItem ? 'Edit Metode Pembayaran & Petunjuk' : 'Tambah Metode Pembayaran Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Unik (Metode)</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: BCA_VA, QRIS"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Tampilan Metode</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Transfer Bank BCA (Manual)"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Saluran</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                    <option value="VIRTUAL_ACCOUNT">VIRTUAL_ACCOUNT</option>
                    <option value="QR_CODE">QR_CODE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Provider Gateway</label>
                  <input
                    type="text"
                    required
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    placeholder="Contoh: MANUAL, XENDIT, MIDTRANS"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Biaya Admin Flat (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.admin_fee_flat}
                    onChange={(e) => setFormData({ ...formData, admin_fee_flat: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Urutan Tampil</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Publikasi</label>
                  <select
                    value={formData.is_active ? '1' : '0'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === '1' })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="1">Aktif</option>
                    <option value="0">Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* Payment Instructions Section */}
              <div className="border-t border-slate-200 pt-4 mt-2 space-y-3">
                <h4 className="font-bold text-indigo-900 flex items-center gap-1.5 text-sm">
                  <FileText className="w-4 h-4 text-indigo-600" /> Petunjuk Pembayaran & Transfer
                </h4>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Petunjuk</label>
                  <input
                    type="text"
                    value={formData.instruction_title}
                    onChange={(e) => setFormData({ ...formData, instruction_title: e.target.value })}
                    placeholder="Contoh: Transfer Manual BCA atau Pembayaran via m-BCA"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Langkah / Konten Petunjuk (Rich Text / Format List)</label>
                  <TiptapEditor
                    value={formData.instruction_content}
                    onChange={(html) => setFormData({ ...formData, instruction_content: html })}
                    placeholder="Tuliskan petunjuk langkah transfer..."
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {saving ? 'Memproses...' : 'Simpan Metode Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Instructions */}
      {viewInstructionItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-indigo-950 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                {viewInstructionItem.instruction_title || viewInstructionItem.name}
              </h3>
              <button
                onClick={() => setViewInstructionItem(null)}
                className="text-slate-400 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 text-xs text-slate-700 leading-relaxed space-y-3">
              <div
                className="prose prose-xs prose-instruction max-w-none space-y-2 text-slate-800"
                dangerouslySetInnerHTML={{
                  __html: viewInstructionItem.instruction_content || '<p class="italic text-slate-400">Tidak ada instruksi khusus.</p>',
                }}
              />
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setViewInstructionItem(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
