import { useState } from 'react';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { createOrder } from '@/app/(client)/clients/actions';

interface BillingTabProps {
  data: any;
}

export function BillingTab({ data }: BillingTabProps) {
  const [loading, setLoading] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [buyQty, setBuyQty] = useState(10);

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.customer?.id || !data.tests?.length) {
      toast.error('Data tidak lengkap');
      return;
    }
    
    if (isNaN(buyQty) || buyQty <= 0) return;

    setLoading(true);
    try {
      await createOrder(data.customer.id, data.tests[0].id, buyQty);
      await mutate('/api/client/data');
      toast.success('Berhasil membuat order tagihan!');
      setIsBuyModalOpen(false);
    } catch (err: any) {
      toast.error('Gagal membuat order: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full animate-fadeUp">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display font-bold text-lg text-slate-900">Tagihan & Beli Kuota</h2>
        <Button onClick={() => setIsBuyModalOpen(true)} disabled={loading}>Beli Kuota Baru</Button>
      </div>
      <Card noPadding className="overflow-hidden">
        <Table headers={["Invoice", "Tanggal", "Total Harga", "Status", "Aksi"]} isEmpty={data.orders.length === 0}>
          {data.orders.map((o: any) => (
            <tr key={o.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-4 px-4 font-bold text-slate-800">{o.invoice_code}</td>
              <td className="py-4 px-4 text-slate-500">{new Date(o.created_at).toLocaleDateString()}</td>
              <td className="py-4 px-4 font-semibold text-slate-900">Rp {Number(o.total_amount).toLocaleString('id-ID')}</td>
              <td className="py-4 px-4">
                <Badge variant={o.status === 'PAID' ? 'success' : 'warning'}>{o.status}</Badge>
              </td>
              <td className="py-4 px-4 text-right">
                {o.status === 'PENDING' && (
                  <Button variant="outline" size="sm" onClick={() => toast.info('Fitur Cara Bayar (Xendit) akan segera hadir!')}>Cara Bayar</Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal isOpen={isBuyModalOpen} onClose={() => setIsBuyModalOpen(false)} title="Beli Kuota Tes">
        <form onSubmit={handleBuy} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Alat Tes</label>
            <input 
              type="text" 
              disabled
              value={data.tests?.[0]?.name || 'Loading...'}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 text-slate-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Jumlah Kuota</label>
            <input 
              type="number" 
              required
              min="1"
              value={buyQty}
              onChange={(e) => setBuyQty(parseInt(e.target.value) || 0)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsBuyModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={loading || buyQty <= 0}>{loading ? 'Memproses...' : 'Buat Tagihan'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
