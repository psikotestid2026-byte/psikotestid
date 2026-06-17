import { useState } from 'react';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Copy, FileDown } from 'lucide-react';
import { createCampaign, closeCampaign } from '@/app/(client)/clients/actions';

interface CampaignsTabProps {
  data: any;
}

export function CampaignsTab({ data }: CampaignsTabProps) {
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [closeId, setCloseId] = useState<number | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignTitle || !data.customer?.id) return;
    
    setLoading(true);
    try {
      await createCampaign(data.customer.id, campaignTitle);
      await mutate('/api/client/data');
      toast.success('Campaign berhasil dibuat!');
      setIsCreateOpen(false);
      setCampaignTitle('');
    } catch (err: any) {
      toast.error('Gagal membuat campaign: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (!closeId) return;
    setLoading(true);
    try {
      await closeCampaign(closeId);
      await mutate('/api/client/data');
      toast.success('Campaign berhasil ditutup!');
      setCloseId(null);
    } catch (err: any) {
      toast.error('Gagal menutup campaign: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fadeUp">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display font-bold text-lg text-slate-900">Campaign Asesmen</h2>
        <Button onClick={() => setIsCreateOpen(true)} disabled={loading}>Buat Campaign Baru</Button>
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
                  <Button variant="outline" size="sm" onClick={() => setCloseId(c.id)} disabled={loading}>Tutup</Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Buat Campaign Baru">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Nama Campaign</label>
            <input 
              type="text" 
              required
              value={campaignTitle}
              onChange={(e) => setCampaignTitle(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
              placeholder="Contoh: Rekrutmen Staff IT 2026"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Batal</Button>
            <Button type="submit" disabled={loading || !campaignTitle}>{loading ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={closeId !== null} onClose={() => setCloseId(null)} title="Tutup Campaign">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Yakin ingin menutup campaign ini? Kandidat tidak akan bisa mengakses link tes lagi.</p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setCloseId(null)}>Batal</Button>
            <Button onClick={handleClose} disabled={loading}>{loading ? 'Menutup...' : 'Ya, Tutup'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
