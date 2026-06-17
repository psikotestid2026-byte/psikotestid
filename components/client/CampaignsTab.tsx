import { useState } from 'react';
import { mutate } from 'swr';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Copy, FileDown } from 'lucide-react';
import { createCampaign, closeCampaign } from '@/app/(client)/clients/actions';

interface CampaignsTabProps {
  data: any;
}

export function CampaignsTab({ data }: CampaignsTabProps) {
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const title = window.prompt('Masukkan Nama Campaign Baru:');
    if (!title || !data.customer?.id) return;
    
    setLoading(true);
    try {
      await createCampaign(data.customer.id, title);
      await mutate('/api/client/data');
    } catch (err: any) {
      alert('Gagal membuat campaign: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (campaignId: number) => {
    if (!window.confirm('Yakin ingin menutup campaign ini?')) return;
    
    setLoading(true);
    try {
      await closeCampaign(campaignId);
      await mutate('/api/client/data');
    } catch (err: any) {
      alert('Gagal menutup campaign: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fadeUp">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display font-bold text-lg text-slate-900">Campaign Asesmen</h2>
        <Button onClick={handleCreate} disabled={loading}>Buat Campaign Baru</Button>
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
                  <button className="text-slate-400 hover:text-brand-600" title="Copy Link" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/clients/test/${c.id}`)}>
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </td>
              <td className="py-4 px-4">
                <Badge variant={c.is_active ? 'success' : 'default'}>{c.is_active ? 'Aktif' : 'Selesai'}</Badge>
              </td>
              <td className="py-4 px-4 text-right">
                {c.is_active && (
                  <Button variant="outline" size="sm" onClick={() => handleClose(c.id)} disabled={loading}>Tutup</Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
