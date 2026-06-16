import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FileDown } from 'lucide-react';

interface ParticipantsTabProps {
  data: any;
}

export function ParticipantsTab({ data }: ParticipantsTabProps) {
  return (
    <div className="max-w-5xl mx-auto animate-fadeUp">
      <h2 className="font-display font-bold text-lg text-slate-900 mb-6">Hasil Kandidat</h2>
      <Card noPadding className="overflow-hidden">
        <Table headers={["Nama Kandidat", "Email", "Status", "Aksi"]} isEmpty={data.participants.length === 0}>
          {data.participants.map((p: any) => (
            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-4 px-4 font-bold text-slate-800">{p.full_name}</td>
              <td className="py-4 px-4 text-slate-500">{p.email}</td>
              <td className="py-4 px-4">
                <Badge variant={p.status === 'COMPLETED' ? 'success' : 'warning'}>
                  {p.status}
                </Badge>
              </td>
              <td className="py-4 px-4 text-right">
                <Button variant="outline" size="sm" disabled={p.status !== 'COMPLETED'} icon={<FileDown />}>
                  Unduh PDF
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
