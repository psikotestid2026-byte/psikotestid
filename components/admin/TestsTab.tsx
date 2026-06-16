import { Card } from '@/components/ui/Card';

interface TestsTabProps {
  data: any;
}

export function TestsTab({ data }: TestsTabProps) {
  return (
    <div className="max-w-5xl mx-auto animate-fadeUp">
      <h2 className="font-display font-bold text-lg text-slate-900 mb-6">Alat Tes & Bank Soal</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {data.tests.map((t: any) => (
          <button key={t.id} className="bg-white hover:bg-slate-50 border border-slate-200 p-5 rounded-2xl text-left shadow-sm transition-all focus:ring-2 focus:ring-brand-500 outline-none">
            <span className="bg-brand-50 text-brand-700 border border-brand-100 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{t.code}</span>
            <h3 className="font-display font-extrabold text-slate-900 mt-2">{t.name}</h3>
            <p className="text-xs text-brand-700 font-bold mt-1">Rp {Number(t.price).toLocaleString('id-ID')}</p>
            <p className="text-[10px] text-slate-400 mt-1">{Math.round(t.duration_sec/60)} Menit · {t.is_active ? 'Aktif' : 'Nonaktif'}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
