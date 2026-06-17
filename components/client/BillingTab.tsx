import { useState } from 'react';
import { mutate } from 'swr';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createOrder } from '@/app/(client)/clients/actions';

interface BillingTabProps {
  data: any;
}

export function BillingTab({ data }: BillingTabProps) {
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    if (!data.customer?.id || !data.tests?.length) {
      alert('Data tidak lengkap');
      return;
    }
    
    // For demo: buy 10 quota of the first test
    const qtyStr = window.prompt(`Beli kuota untuk ${data.tests[0].name}. Masukkan jumlah:`, "10");
    if (!qtyStr) return;
    
    const qty = parseInt(qtyStr, 10);
    if (isNaN(qty) || qty <= 0) return;

    setLoading(true);
    try {
      await createOrder(data.customer.id, data.tests[0].id, qty);
      await mutate('/api/client/data');
      alert('Berhasil membuat order tagihan!');
    } catch (err: any) {
      alert('Gagal membuat order: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fadeUp">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display font-bold text-lg text-slate-900">Tagihan & Beli Kuota</h2>
        <Button onClick={handleBuy} disabled={loading}>Beli Kuota Baru</Button>
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
                  <Button variant="outline" size="sm" onClick={() => alert('Fitur Cara Bayar (Xendit) akan segera hadir!')}>Cara Bayar</Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
