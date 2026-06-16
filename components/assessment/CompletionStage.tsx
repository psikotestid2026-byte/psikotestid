import { CheckCircle2, ArrowRight, Check } from 'lucide-react';

interface TransitionStageProps {
  onConfirm: () => void;
  brandColor: string;
}

export function TransitionStage({ onConfirm, brandColor }: TransitionStageProps) {
  return (
    <div className="flex flex-col items-center text-center max-w-md w-full animate-fadeUp">
      <div className="w-20 h-20 rounded-3xl bg-green-50 flex items-center justify-center mb-6 animate-pulse2">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>
      <h2 className="text-2xl font-extrabold text-slate-900 mb-2 font-display">Tes Selesai!</h2>
      <p className="text-slate-500 mb-8 leading-relaxed">Bagus! Lanjut ke tes berikutnya.</p>
      <button 
        onClick={onConfirm} 
        className="w-full text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 hover:opacity-90" 
        style={{ backgroundColor: brandColor }}
      >
        Lanjut ke Tes Berikutnya <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}

interface DoneStageProps {
  userName: string;
  customer: any;
}

export function DoneStage({ userName, customer }: DoneStageProps) {
  return (
    <div className="flex flex-col items-center text-center max-w-md w-full animate-fadeUp">
      <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mb-6 shadow-xl animate-pulse2">
        <Check className="w-12 h-12 text-white" />
      </div>
      <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight font-display">Terima Kasih</h2>
      <p className="text-slate-500 mb-8 leading-relaxed"><strong className="text-slate-800">{userName}</strong>, Anda telah menyelesaikan seluruh rangkaian asesmen.</p>
      <div className="bg-white border border-slate-200 rounded-3xl p-6 text-left w-full shadow-sm mb-8">
        <p className="text-sm text-slate-600 leading-relaxed">Pihak <strong>{customer?.company_name}</strong> akan memproses data Anda. Anda dapat menutup halaman ini sekarang.</p>
      </div>
      <p className="text-[10px] text-slate-300 uppercase tracking-[0.3em] font-bold">PsikoTest.id Enterprise</p>
    </div>
  );
}
