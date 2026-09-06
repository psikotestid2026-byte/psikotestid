import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';

interface CustomersTabProps {
  data: any;
  onAdjustQuota?: (customerId: number, testId: number, diff: number) => void;
  loading?: boolean;
}

export function CustomersTab({ data, onAdjustQuota, loading = false }: CustomersTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState<number | ''>('');
  const [diffAmount, setDiffAmount] = useState<number | ''>('');

  // Search & Filter & Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [quotaFilter, setQuotaFilter] = useState('ALL'); // ALL, HAS_QUOTA, NO_QUOTA
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const customers = data?.customers || [];

  const handleOpenModal = (customer: any) => {
    setSelectedCustomer(customer);
    setSelectedTest('');
    setDiffAmount('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCustomer && selectedTest !== '' && diffAmount !== '' && onAdjustQuota) {
      onAdjustQuota(selectedCustomer.id, Number(selectedTest), Number(diffAmount));
      setIsModalOpen(false);
    }
  };

  // Filtered customers calculation
  const filteredCustomers = customers.filter((c: any) => {
    const matchesSearch =
      c.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const customerQuotas = data.quotas?.filter((q: any) => q.customer_id === c.id) || [];
    const hasQuota = customerQuotas.some((q: any) => q.quota > 0);

    const matchesQuota =
      quotaFilter === 'ALL' ||
      (quotaFilter === 'HAS_QUOTA' && hasQuota) ||
      (quotaFilter === 'NO_QUOTA' && !hasQuota);

    return matchesSearch && matchesQuota;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + pageSize);

  return (
    <div className="w-full animate-fadeUp space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" /> Manajemen Perusahaan Customer & Kuota
          </h2>
          <p className="text-xs text-slate-500">Kelola lisensi kuota alat tes dan akun corporate pelanggan.</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari Nama Perusahaan atau Email..."
              className="pl-9 w-full py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filter Kuota:
            </span>
            <select
              value={quotaFilter}
              onChange={(e) => {
                setQuotaFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="py-1.5 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="ALL">Semua Perusahaan</option>
              <option value="HAS_QUOTA">Memiliki Kuota Active</option>
              <option value="NO_QUOTA">Belum Memiliki Kuota</option>
            </select>
          </div>
        </div>
      </div>

      <Card noPadding className="overflow-hidden mb-4">
        <Table headers={["#", "Nama Perusahaan / Email", "Kuota Tes", "Tanggal Daftar", "Aksi"]} isEmpty={paginatedCustomers.length === 0}>
          {paginatedCustomers.map((c: any, index: number) => {
            const rowNumber = startIndex + index + 1;
            const customerQuotas = data.quotas?.filter((q: any) => q.customer_id === c.id) || [];
            return (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-4 text-center font-mono font-bold text-slate-400 text-xs w-12">
                  {rowNumber}
                </td>
                <td className="py-4 px-4">
                  <div className="font-bold text-slate-800">{c.company_name}</div>
                  <div className="text-xs text-slate-400">{c.email}</div>
                </td>
                <td className="py-4 px-4">
                  {customerQuotas.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {customerQuotas.map((q: any) => {
                        const test = data.tests?.find((t: any) => t.id === q.test_id);
                        return (
                          <span key={q.id} className="bg-brand-50 text-brand-700 text-[10px] font-bold px-2 py-1 rounded border border-brand-100">
                            {test?.code || q.test_id}: {q.quota}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Belum ada kuota</span>
                  )}
                </td>
                <td className="py-4 px-4 text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString('id-ID')}</td>
                <td className="py-4 px-4 text-right">
                  <Button onClick={() => handleOpenModal(c)} size="sm" variant="outline">Atur Kuota</Button>
                </td>
              </tr>
            );
          })}
        </Table>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Menampilkan <strong className="text-slate-900">{filteredCustomers.length > 0 ? startIndex + 1 : 0}</strong> -{' '}
            <strong className="text-slate-900">{Math.min(startIndex + pageSize, filteredCustomers.length)}</strong> dari{' '}
            <strong className="text-slate-900">{filteredCustomers.length}</strong> customer
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
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Atur Kuota Manual">
        {selectedCustomer && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm font-semibold text-slate-700 mb-2">Customer: {selectedCustomer.company_name}</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Alat Tes</label>
              <select 
                required
                value={selectedTest}
                onChange={(e) => setSelectedTest(e.target.value ? Number(e.target.value) : '')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="" disabled>-- Pilih Tes --</option>
                {data.tests?.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Penyesuaian (Gunakan - untuk mengurangi)</label>
              <input 
                type="number" 
                required
                value={diffAmount}
                onChange={(e) => setDiffAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="Contoh: 10 atau -5"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Memproses...' : 'Simpan Kuota'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
