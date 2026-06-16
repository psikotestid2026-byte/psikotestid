import { UserCheck, ClipboardList, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface WelcomeStageProps {
  customer: any;
  tests: any[];
  onNext: () => void;
  brandColor: string;
}

export function WelcomeStage({ customer, tests, onNext, brandColor }: WelcomeStageProps) {
  return (
    <div className="flex flex-col items-center text-center max-w-lg w-full animate-fadeUp">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl" style={{ background: brandColor }}>
        <UserCheck className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight font-display">Selamat Datang</h1>
      <p className="text-slate-500 mb-8 leading-relaxed">Anda diundang untuk mengikuti rangkaian asesmen oleh <strong className="text-slate-800">{customer?.company_name}</strong>.</p>
      
      <Card className="w-full text-left mb-8">
        <h3 className="font-bold text-slate-800 mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-brand-600" /> Rangkaian Tes
        </h3>
        <div className="space-y-2">
          {tests.map((t: any, i: number) => (
            <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs" style={{ backgroundColor: brandColor }}>{i + 1}</div>
                <div className="text-sm font-bold text-slate-800">{t.name}</div>
              </div>
              <div className="text-[10px] font-bold text-slate-400">±{Math.round(t.duration_sec / 60)} Menit</div>
            </div>
          ))}
        </div>
      </Card>

      <button 
        onClick={onNext} 
        className="w-full text-white font-bold py-4 rounded-2xl text-base shadow-lg flex items-center justify-center gap-2 group transition-all hover:opacity-90" 
        style={{ backgroundColor: brandColor }}
      >
        Mulai <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
