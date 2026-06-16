import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Copy, FileDown } from 'lucide-react';

interface CampaignsTabProps {
  data: any;
}

export function CampaignsTab({ data }: CampaignsTabProps) {
  return (
    <div className="max-w-5xl mx-auto animate-fadeUp">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display font-bold text-lg text-slate-900">Campaign Asesmen</h2>
        <Button>Buat Campaign Baru</Button>
      </div>
      <Card noPadding className="overflow-hidden">
        <Table headers={["Nama Campaign", "Link Ujian", "Status", "Aksi"]} isEmpty={data.campaigns.length === 0}>
          {data.campaigns.map((c: any) => (
            <tr key={c.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-4 px-4 font-bold text-slate-800">{c.title}</td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                  <code className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded truncate max-w-[200px]">
                    {window.location.origin}/clients/test/{c.id}
                  </code>
                  <button className="text-slate-400 hover:text-brand-600" title="Copy Link">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </td>
              <td className="py-4 px-4">
                <Badge variant={c.is_active ? 'success' : 'default'}>{c.is_active ? 'Aktif' : 'Selesai'}</Badge>
              </td>
              <td className="py-4 px-4 text-right">
                <Button variant="outline" size="sm">Tutup</Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
