import { useState } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

interface QuestionStageProps {
  currentTest: any;
  currentQ: number;
  answers: any;
  setAnswerValue: (val: any) => void;
  onPrev: () => void;
  onNext: () => void;
  brandColor: string;
}

export function QuestionStage({
  currentTest,
  currentQ,
  answers,
  setAnswerValue,
  onPrev,
  onNext,
  brandColor,
}: QuestionStageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const questions = currentTest?.questions || [];
  const questionObj = questions[currentQ];
  const questionData = questionObj?.question_data || {};
  const questionType = questionObj?.question_type || 'multiple_choice';
  const isDisc = questionType === 'disc' || currentTest?.code?.toLowerCase() === 'disc';

  const testCode = currentTest?.code?.toLowerCase() || '';

  const getFallbackOptions = () => {
    if (testCode === 'riasec') return ['Suka', 'Tidak Suka'];
    if (testCode === 'bigfive') return ['Sangat Tidak Setuju', 'Tidak Setuju', 'Netral', 'Setuju', 'Sangat Setuju'];
    if (testCode === 'enneagram') return ['Sangat Tidak Sesuai', 'Tidak Sesuai', 'Netral', 'Sesuai', 'Sangat Sesuai'];
    if (testCode === 'msai') return ['Sangat Kurang', 'Kurang', 'Cukup', 'Baik', 'Sangat Baik'];
    if (questionType === 'true_false') return ['Benar', 'Salah'];
    return [];
  };

  const rawOptions: any[] =
    (questionData.options && questionData.options.length > 0)
      ? questionData.options
      : (questionData.items && questionData.items.length > 0)
      ? questionData.items
      : getFallbackOptions();

  const options: string[] = rawOptions.filter(
    (o) => o !== null && o !== undefined && String(o).trim() !== ''
  );

  const selectedAnswer = answers[currentTest?.id]?.[currentQ];

  // DISC Specific State Handling
  const discAnswer: { P: number | null; K: number | null } =
    isDisc && typeof selectedAnswer === 'object' && selectedAnswer !== null
      ? selectedAnswer
      : { P: null, K: null };

  const handleDiscSelect = (type: 'P' | 'K', idx: number) => {
    let nextP = discAnswer.P;
    let nextK = discAnswer.K;

    if (type === 'P') {
      if (nextP === idx) {
        nextP = null;
      } else {
        nextP = idx;
        if (nextK === idx) nextK = null;
      }
    } else {
      if (nextK === idx) {
        nextK = null;
      } else {
        nextK = idx;
        if (nextP === idx) nextP = null;
      }
    }

    setAnswerValue({ P: nextP, K: nextK });
  };

  const isEssay = questionType === 'essay' || questionType === 'short_answer';

  const isDiscValid = isDisc
    ? discAnswer.P !== null && discAnswer.K !== null && discAnswer.P !== discAnswer.K
    : true;

  const isNonDiscValid = !isDisc
    ? selectedAnswer !== undefined && selectedAnswer !== null && String(selectedAnswer).trim() !== ''
    : true;

  const isValidToAdvance = isDisc ? isDiscValid : isNonDiscValid;

  const questionText =
    questionData.text ||
    (isDisc
      ? `Pilihlah SATU yang PALING (P) & SATU yang KURANG (K) menggambarkan Anda:`
      : `Pertanyaan ${currentTest?.name || ''} nomor ${currentQ + 1}`);

  return (
    <div className="flex flex-col max-w-2xl w-full animate-fadeUp">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-10 min-h-[420px] flex flex-col justify-center">
        {/* Question Header */}
        <div className="text-center mb-8">
          {isDisc && (
            <span className="inline-block px-3.5 py-1.5 bg-indigo-50 text-indigo-700 font-extrabold text-xs uppercase tracking-wider rounded-full mb-3">
              Tes DISC · Wajib Pilih 1 Paling (P) & 1 Kurang (K)
            </span>
          )}
          <h3 className="text-xl md:text-3xl font-extrabold text-slate-900 leading-snug font-display">
            {questionText}
          </h3>
        </div>

        {/* DISC Dual Selection View */}
        {isDisc ? (
          <div className="space-y-3.5 w-full">
            {options.map((opt: string, idx: number) => {
              const isP = discAnswer.P === idx;
              const isK = discAnswer.K === idx;

              return (
                <div
                  key={idx}
                  className={`p-4 md:p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 ${
                    isP
                      ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                      : isK
                      ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs md:text-sm font-extrabold shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-base md:text-lg font-bold text-slate-800 leading-relaxed">
                      {opt}
                    </span>
                  </div>

                  {/* P & K Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDiscSelect('P', idx)}
                      className={`px-4 py-2 rounded-xl text-xs md:text-sm font-extrabold transition-all ${
                        isP
                          ? 'bg-emerald-600 text-white shadow-xs scale-105'
                          : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700'
                      }`}
                    >
                      {isP ? 'P (Paling)' : 'P'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDiscSelect('K', idx)}
                      className={`px-4 py-2 rounded-xl text-xs md:text-sm font-extrabold transition-all ${
                        isK
                          ? 'bg-amber-600 text-white shadow-xs scale-105'
                          : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700'
                      }`}
                    >
                      {isK ? 'K (Kurang)' : 'K'}
                    </button>
                  </div>
                </div>
              );
            })}

            {!isDiscValid && (
              <div className="mt-4 flex items-center justify-center gap-2 text-amber-700 text-xs md:text-sm font-bold bg-amber-50 py-3 px-4 rounded-xl border border-amber-200">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>Pilih 1 Paling (P) dan 1 Kurang (K) untuk melanjutkan.</span>
              </div>
            )}
          </div>
        ) : (
          /* Non-DISC Standard Questions View */
          isEssay ? (
            <div className="space-y-4 w-full">
              <textarea
                rows={5}
                value={selectedAnswer || ''}
                onChange={(e) => setAnswerValue(e.target.value)}
                placeholder="Tuliskan jawaban Anda di sini..."
                className="w-full p-4 md:p-5 border-2 border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 text-base md:text-lg font-medium"
              />
              {!isNonDiscValid && (
                <div className="flex items-center justify-center gap-2 text-rose-700 text-xs md:text-sm font-bold bg-rose-50 py-3 px-4 rounded-xl border border-rose-200">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>Wajib mengisikan jawaban sebelum melanjutkan.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3.5 w-full">
              {options.map((opt: string, idx: number) => {
                const isSelected = selectedAnswer === opt;
                return (
                  <div
                    key={idx}
                    onClick={() => setAnswerValue(opt)}
                    className={`p-4 md:p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between font-bold text-slate-800 hover:border-slate-300 ${
                      isSelected ? 'shadow-md' : 'bg-white border-slate-200'
                    }`}
                    style={
                      isSelected
                        ? { borderColor: brandColor, backgroundColor: `${brandColor}12`, color: '#0f172a' }
                        : {}
                    }
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-extrabold shrink-0 border ${
                          isSelected ? 'text-white border-transparent' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                        style={isSelected ? { backgroundColor: brandColor } : {}}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-base md:text-lg leading-relaxed font-bold">{opt}</span>
                    </div>
                    {isSelected && (
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: brandColor }}
                      />
                    )}
                  </div>
                );
              })}

              {!isNonDiscValid && (
                <div className="mt-4 flex items-center justify-center gap-2 text-rose-700 text-xs md:text-sm font-bold bg-rose-50 py-3 px-4 rounded-xl border border-rose-200">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>Pilih salah satu jawaban sebelum melanjutkan.</span>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between mt-8 gap-4 px-2">
        <button
          onClick={onPrev}
          disabled={currentQ === 0 || isSubmitting}
          className="flex items-center gap-2 text-slate-600 font-extrabold text-sm md:text-base px-6 py-3.5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 hover:text-slate-900 transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-5 h-5" /> Kembali
        </button>
        <button
          onClick={onNext}
          disabled={!isValidToAdvance || isSubmitting}
          className="flex items-center gap-2 text-white font-extrabold text-sm md:text-base px-10 py-3.5 rounded-2xl shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          style={{ backgroundColor: brandColor }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Menyimpan Jawaban...
            </>
          ) : (
            <>
              {currentQ === questions.length - 1 ? 'Selesai & Kirim' : 'Lanjut'} <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}



