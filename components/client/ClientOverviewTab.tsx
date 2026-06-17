import { Brain, Users, Building, Activity } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface ClientOverviewTabProps {
  data: any;
}

export function ClientOverviewTab({ data }: ClientOverviewTabProps) {
  return (
    <div className="w-full animate-fadeUp">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Total Kuota Tersedia</h3>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center"><Brain className="w-4 h-4 text-blue-600" /></div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{data.quotas.reduce((acc: any, q: any) => acc + q.quota, 0)}</div>
          <p className="text-xs text-slate-400">Dari {data.quotas.length} jenis tes</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Total Peserta Selesai</h3>
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center"><Users className="w-4 h-4 text-green-600" /></div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{data.participants.filter((p:any) => p.status === 'COMPLETED').length}</div>
          <p className="text-xs text-slate-400">Kandidat</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Campaign Aktif</h3>
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center"><Building className="w-4 h-4 text-purple-600" /></div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{data.campaigns.length}</div>
          <p className="text-xs text-slate-400">Sesi ujian berjalan</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card noPadding>
          <div className="p-6">
            <h2 className="font-display font-bold text-lg text-slate-900 mb-4">Rincian Kuota</h2>
            <div className="space-y-4">
              {data.quotas.length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-4">Belum ada kuota</div>
              ) : data.quotas.map((q: any) => {
                const test = data.tests.find((t: any) => t.id === q.test_id);
                return (
                  <div key={q.id} className="flex items-center justify-between border-b border-slate-50 pb-3">
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{test?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-400">{test?.code}</div>
                    </div>
                    <div className="font-mono font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-lg">{q.quota}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
        
        <Card noPadding>
          <div className="p-6">
            <h2 className="font-display font-bold text-lg text-slate-900 mb-4">Riwayat Penggunaan Terakhir</h2>
            <div className="space-y-4">
              {data.transactions.length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-4">Belum ada transaksi</div>
              ) : data.transactions.slice(0, 5).map((t: any) => (
                <div key={t.id} className="flex items-start gap-3 border-b border-slate-50 pb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.type === 'DEBIT' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-800 truncate">{t.description}</div>
                    <div className="text-xs text-slate-400">{new Date(t.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className={`text-sm font-bold shrink-0 ${t.type === 'DEBIT' ? 'text-red-600' : 'text-green-600'}`}>
                    {t.type === 'DEBIT' ? '-' : '+'}{t.quantity}
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
