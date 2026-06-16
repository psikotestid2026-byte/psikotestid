import { ChevronLeft, ChevronRight } from 'lucide-react';

interface QuestionStageProps {
  currentTest: any;
  currentQ: number;
  answers: any;
  setAnswerValue: (val: any) => void;
  onPrev: () => void;
  onNext: () => void;
  brandColor: string;
}

export function QuestionStage({ currentTest, currentQ, answers, setAnswerValue, onPrev, onNext, brandColor }: QuestionStageProps) {
  return (
    <div className="flex flex-col max-w-2xl w-full animate-fadeUp">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-12 min-h-[400px] flex flex-col justify-center text-center">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug mb-10">
          Ini adalah contoh pertanyaan tes {currentTest?.name} nomor {currentQ + 1}?
        </h3>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(opt => {
            const isSelected = answers[currentTest?.id]?.[currentQ] === opt;
            return (
              <div 
                key={opt}
                onClick={() => setAnswerValue(opt)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'bg-blue-50' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                style={isSelected ? { borderColor: brandColor, backgroundColor: `${brandColor}10` } : {}}
              >
                Pilihan Jawaban {opt}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-between mt-8 gap-4 px-2">
        <button 
          onClick={onPrev} 
          disabled={currentQ === 0} 
          className="flex items-center gap-2 text-slate-400 font-bold text-sm px-6 py-3 rounded-2xl border border-slate-200 hover:bg-white hover:text-slate-600 transition-all disabled:opacity-20"
        >
          <ChevronLeft className="w-5 h-5" /> Kembali
        </button>
        <button 
          onClick={onNext} 
          className="flex items-center gap-2 text-white font-bold text-sm px-10 py-3 rounded-2xl shadow-lg transition-all hover:opacity-90" 
          style={{ backgroundColor: brandColor }}
        >
          Lanjut <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
