import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

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

  return (
    <div className="w-full animate-fadeUp">
      <h2 className="font-display font-bold text-lg text-slate-900 mb-6">Manajemen Perusahaan Customer & Kuota</h2>
      <Card noPadding className="overflow-hidden mb-8">
        <Table headers={["Nama Perusahaan / Email", "Kuota Tes", "Tanggal Daftar", "Aksi"]} isEmpty={data.customers.length === 0}>
          {data.customers.map((c: any) => {
            const customerQuotas = data.quotas?.filter((q: any) => q.customer_id === c.id) || [];
            return (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
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
                    <span className="text-xs text-slate-400">Belum ada kuota</span>
                  )}
                </td>
                <td className="py-4 px-4 text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
                <td className="py-4 px-4 text-right">
                  <Button onClick={() => handleOpenModal(c)} size="sm" variant="outline">Atur Kuota</Button>
                </td>
              </tr>
            );
          })}
        </Table>
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
                onChange={(e) => setSelectedTest(e.target.value)}
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
                onChange={(e) => setDiffAmount(e.target.value)}
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
