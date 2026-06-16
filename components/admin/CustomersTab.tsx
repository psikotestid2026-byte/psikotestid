import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';

interface CustomersTabProps {
  data: any;
}

export function CustomersTab({ data }: CustomersTabProps) {
  return (
    <div className="max-w-5xl mx-auto animate-fadeUp">
      <h2 className="font-display font-bold text-lg text-slate-900 mb-6">Manajemen Perusahaan Customer</h2>
      <Card noPadding className="overflow-hidden mb-8">
        <Table headers={["Nama Perusahaan / Email", "Tanggal Daftar"]} isEmpty={data.customers.length === 0}>
          {data.customers.map((c: any) => (
            <tr key={c.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-4 px-4">
                <div className="font-bold text-slate-800">{c.company_name}</div>
                <div className="text-xs text-slate-400">{c.email}</div>
              </td>
              <td className="py-4 px-4 text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
