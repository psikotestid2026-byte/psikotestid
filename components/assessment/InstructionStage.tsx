import { DiscExampleCard } from './DiscExampleCard';

interface InstructionStageProps {
  currentTest: any;
  onStart: () => void;
  brandColor: string;
}

export function InstructionStage({ currentTest, onStart, brandColor }: InstructionStageProps) {
  const isDisc = currentTest?.code?.toLowerCase() === 'disc';

  return (
    <div className="flex flex-col max-w-xl w-full animate-fadeUp">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-6 text-white" style={{ backgroundColor: brandColor }}>
          <h2 className="text-xl font-bold mb-1 font-display">Instruksi: {currentTest?.name}</h2>
          <p className="text-white/80 text-xs">Mohon baca dengan teliti sebelum memulai.</p>
        </div>
        <div className="p-6 text-sm text-slate-600 leading-relaxed">
          <p>
            Ini adalah instruksi untuk tes {currentTest?.name}. Jawablah setiap pertanyaan dengan teliti dan jujur sesuai dengan diri Anda yang sebenarnya. 
            Waktu pengerjaan tes ini adalah ±{Math.round(currentTest?.duration_sec / 60)} menit.
          </p>
          
          {isDisc && <DiscExampleCard />}

          <p className="text-xs text-slate-500 italic mt-4">{currentTest?.instructions}</p>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={onStart} 
            className="w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all hover:opacity-90 active:scale-95" 
            style={{ backgroundColor: brandColor }}
          >
            Mulai Tes Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
