'use client';

import { useState, useEffect } from 'react';
import { BrainCircuit, Timer } from 'lucide-react';
import { WelcomeStage } from '@/components/assessment/WelcomeStage';
import { BiodataStage } from '@/components/assessment/BiodataStage';
import { InstructionStage } from '@/components/assessment/InstructionStage';
import { QuestionStage } from '@/components/assessment/QuestionStage';
import { TransitionStage, DoneStage } from '@/components/assessment/CompletionStage';

export default function AssessmentClient({ initialData }: { initialData: any }) {
  const { campaign, customer, tests } = initialData;
  const [stage, setStage] = useState('welcome');
  const [participantId, setParticipantId] = useState<number | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (customer?.brand_color) {
      document.documentElement.style.setProperty('--brand-color', customer.brand_color);
    }
  }, [customer]);

  useEffect(() => {
    let timer: any;
    if (stage === 'questions' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            finishActiveTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [stage, timeLeft]);

  if (!campaign || tests.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Campaign Tidak Ditemukan</h1>
          <p className="text-slate-500">Sesi asesmen ini mungkin sudah tidak aktif atau link tidak valid.</p>
        </div>
      </div>
    );
  }

  const handleBiodataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setParticipantId(Date.now());
    setStage('instruction');
  };

  const startTest = () => {
    const t = tests[activeIdx];
    setCurrentQ(0);
    if (t.duration_sec > 0) setTimeLeft(t.duration_sec);
    setStage('questions');
  };

  const setAnswerValue = (val: any) => {
    const t = tests[activeIdx];
    setAnswers({
      ...answers,
      [t.id]: { ...(answers[t.id] || {}), [currentQ]: val }
    });
  };

  const nextQuestion = () => {
    if (currentQ < 9) {
      setCurrentQ(prev => prev + 1);
    } else {
      finishActiveTest();
    }
  };

  const prevQuestion = () => {
    if (currentQ > 0) setCurrentQ(prev => prev - 1);
  };

  const finishActiveTest = async () => {
    if (activeIdx < tests.length - 1) setStage('transition');
    else setStage('done');
  };

  const confirmNextTest = () => {
    setActiveIdx(prev => prev + 1);
    setStage('instruction');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentTest = tests[activeIdx];
  const brandColor = customer?.brand_color || '#2563eb';

  return (
    <div className="min-h-screen flex flex-col font-body bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-slate-200 bg-slate-50">
            {customer?.logo_url ? (
              <img src={customer.logo_url} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <BrainCircuit className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div>
            <div className="font-display font-bold text-slate-900 text-sm leading-tight">{customer?.company_name || 'Corporate'}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Portal Asesmen</div>
          </div>
        </div>
        {stage === 'questions' && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-1.5 rounded-full border border-red-100 font-mono font-bold text-sm">
            <Timer className="w-4 h-4" /><span>{formatTime(timeLeft)}</span>
          </div>
        )}
        <div className="hidden sm:block text-xs text-slate-300 font-bold">PsikoTest.id</div>
      </header>

      {stage === 'questions' && (
        <div className="bg-white border-b border-slate-100 px-4 py-2 sticky top-14 z-40">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">
              <span>{currentTest?.name} · Soal {currentQ + 1}/10</span>
              <span>{Math.round(((currentQ + 1) / 10) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-brand-500 h-full rounded-full transition-all duration-300" style={{ width: `${((currentQ + 1) / 10) * 100}%`, backgroundColor: brandColor }}></div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex items-center justify-center p-4">
        {stage === 'welcome' && <WelcomeStage customer={customer} tests={tests} onNext={() => setStage('biodata')} brandColor={brandColor} />}
        {stage === 'biodata' && <BiodataStage userName={userName} setUserName={setUserName} email={email} setEmail={setEmail} onSubmit={handleBiodataSubmit} brandColor={brandColor} />}
        {stage === 'instruction' && <InstructionStage currentTest={currentTest} onStart={startTest} brandColor={brandColor} />}
        {stage === 'questions' && <QuestionStage currentTest={currentTest} currentQ={currentQ} answers={answers} setAnswerValue={setAnswerValue} onPrev={prevQuestion} onNext={nextQuestion} brandColor={brandColor} />}
        {stage === 'transition' && <TransitionStage onConfirm={confirmNextTest} brandColor={brandColor} />}
        {stage === 'done' && <DoneStage userName={userName} customer={customer} />}
      </main>
    </div>
  );
}
