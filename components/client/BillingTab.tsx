import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface BillingTabProps {
  data: any;
}

export function BillingTab({ data }: BillingTabProps) {
  return (
    <div className="max-w-5xl mx-auto animate-fadeUp">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display font-bold text-lg text-slate-900">Tagihan & Beli Kuota</h2>
        <Button>Beli Kuota Baru</Button>
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
                  <Button variant="outline" size="sm">Cara Bayar</Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
