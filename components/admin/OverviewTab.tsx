import { Users, CheckCircle, Link as LinkIcon, Hourglass, Wallet, Activity } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface OverviewTabProps {
  data: any;
  onApproveOrder?: (id: number) => void;
}

export function OverviewTab({ data, onApproveOrder }: OverviewTabProps) {
  return (
    <div className="w-full animate-fadeUp">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Total Perusahaan/Customer</h3>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center"><Users className="w-4 h-4 text-blue-600" /></div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{data.customers.length}</div>
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Total Tes Selesai</h3>
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-green-600" /></div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{data.submissions.length}</div>
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Total Campaign Aktif</h3>
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center"><LinkIcon className="w-4 h-4 text-purple-600" /></div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{data.campaigns.length}</div>
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Pesanan Tertunda</h3>
            <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center"><Hourglass className="w-4 h-4 text-yellow-600" /></div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1 text-yellow-600 animate-pulse">{data.topups.length}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card noPadding>
          <div className="p-6">
            <h2 className="font-display font-bold text-lg text-slate-900 mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-yellow-600" /> Pesanan & Top Up Tertunda</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 pb-2 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="py-2">Perusahaan</th>
                    <th className="py-2">Nominal</th>
                    <th className="py-2">Bukti</th>
                    <th className="py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.topups.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-slate-400">Tidak ada pengajuan pending</td></tr>
                  ) : data.topups.map((t: any) => (
                    <tr key={t.id}>
                      <td className="py-3 font-bold">{t.customer_id}</td>
                      <td className="py-3 font-semibold text-brand-700">Rp {Number(t.total_amount).toLocaleString('id-ID')}</td>
                      <td className="py-3 text-slate-300">Belum ada bukti</td>
                      <td className="py-3 text-right">
                        <Button onClick={() => onApproveOrder && onApproveOrder(t.id)} size="sm" variant="primary" className="text-[10px]">Setujui</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        <Card noPadding>
          <div className="p-6">
            <h2 className="font-display font-bold text-lg text-slate-900 mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-brand-600" /> Log Aktivitas Platform</h2>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {data.logs.map((l: any) => (
                <div key={l.id} className="flex items-start gap-3 border-b border-slate-50 pb-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${l.type === 'DEBIT' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{l.description}</div>
                    <div className="text-[10px] text-slate-400">{new Date(l.created_at).toLocaleString()}</div>
                  </div>
                  <div className={`text-xs font-bold shrink-0 ${l.type === 'DEBIT' ? 'text-red-600' : 'text-green-600'}`}>
                    {l.type === 'DEBIT' ? '-' : '+'}{l.quantity} Kuota
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
