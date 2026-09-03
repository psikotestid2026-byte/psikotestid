'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { BrainCircuit, Timer, AlertTriangle, CheckCircle2, RefreshCw, Copy, Maximize, Minimize } from 'lucide-react';
import { WelcomeStage } from '@/components/assessment/WelcomeStage';
import { BiodataStage } from '@/components/assessment/BiodataStage';
import { InstructionStage } from '@/components/assessment/InstructionStage';
import { QuestionStage } from '@/components/assessment/QuestionStage';
import { TransitionStage, DoneStage } from '@/components/assessment/CompletionStage';
import { submitBiodata, submitTestResult, markTestCompleted } from '../actions';

export default function AssessmentClient({ initialData }: { initialData: any }) {
  const { campaign, customer, tests, sessionUser, existingParticipant } = initialData;
  const [stage, setStage] = useState('welcome');
  const [participantId, setParticipantId] = useState<number | null>(existingParticipant?.id || null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [copiedHrMsg, setCopiedHrMsg] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const initialName = existingParticipant?.full_name || sessionUser?.name || '';
  const initialEmail = existingParticipant?.email || sessionUser?.email || '';

  const [userName, setUserName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phoneNumber, setPhoneNumber] = useState(existingParticipant?.phone_number || '');
  const [nik, setNik] = useState(existingParticipant?.nik || '');

  // Fullscreen event listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        toast.error('Gagal masuk mode layar penuh: ' + err.message);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // LocalStorage Key based on campaign and participant/email
  const storageKey = campaign?.id ? `psikotest_progress_c${campaign.id}_${email || participantId || 'guest'}` : null;

  // Restore state from LocalStorage on mount
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers && Object.keys(parsed.answers).length > 0) {
          setAnswers(parsed.answers);
        }
        if (parsed.participantId) setParticipantId(parsed.participantId);
        if (typeof parsed.activeIdx === 'number' && parsed.activeIdx < tests.length) {
          setActiveIdx(parsed.activeIdx);
        }
        if (typeof parsed.currentQ === 'number') {
          setCurrentQ(parsed.currentQ);
        }
        if (parsed.stage && parsed.stage !== 'done' && parsed.stage !== 'welcome') {
          setStage(parsed.stage);
        }
        if (typeof parsed.timeLeft === 'number' && parsed.timeLeft > 0) {
          setTimeLeft(parsed.timeLeft);
        }
      }
    } catch (e) {
      console.error('Failed to load localStorage progress:', e);
    }
  }, [storageKey, tests.length]);

  // Persist state to LocalStorage when changed
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    if (stage === 'done') {
      localStorage.removeItem(storageKey);
      return;
    }
    try {
      const dataToSave = {
        answers,
        participantId,
        activeIdx,
        currentQ,
        stage,
        timeLeft,
        updatedAt: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save progress to localStorage:', e);
    }
  }, [storageKey, answers, participantId, activeIdx, currentQ, stage, timeLeft]);

  useEffect(() => {
    if (existingParticipant?.full_name) {
      setUserName(existingParticipant.full_name);
    } else if (sessionUser?.name && !userName) {
      setUserName(sessionUser.name);
    }

    if (existingParticipant?.email) {
      setEmail(existingParticipant.email);
    } else if (sessionUser?.email && !email) {
      setEmail(sessionUser.email);
    }

    if (existingParticipant?.id) {
      setParticipantId(existingParticipant.id);
    }
  }, [sessionUser, existingParticipant]);

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
    try {
      const pid = await submitBiodata(campaign.id, userName, email, phoneNumber, nik);
      setParticipantId(pid);
      setStage('instruction');
    } catch (err: any) {
      if (err.message?.includes('ALREADY_COMPLETED')) {
        setStage('already_completed');
      } else if (err.message?.includes('KUOTA_HABIS')) {
        setStage('kuota_habis');
      } else if (err.message?.includes('NOT_PRE_REGISTERED')) {
        setStage('not_pre_registered');
      } else {
        toast.error('Gagal mendaftar: ' + err.message);
      }
    }
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

  const currentTest = tests[activeIdx];
  const totalQuestions = currentTest?.questions?.length || 1;
  const brandColor = customer?.brand_color || '#2563eb';

  const nextQuestion = () => {
    if (currentQ < totalQuestions - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      finishActiveTest();
    }
  };

  const prevQuestion = () => {
    if (currentQ > 0) setCurrentQ(prev => prev - 1);
  };

  const finishActiveTest = async () => {
    const t = tests[activeIdx];
    try {
      if (participantId) {
        const res = await fetch('/api/test/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participant_id: participantId,
            test_id: t.id,
            answers: answers[t.id] || {},
          }),
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
          toast.error(result.error || 'Gagal menyimpan jawaban tes.');
          return;
        }
      }

      if (activeIdx < tests.length - 1) {
        setStage('transition');
      } else {
        if (participantId) {
          await fetch('/api/test/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'mark_completed',
              participant_id: participantId,
            }),
          });
        }
        setStage('done');
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan saat menyimpan jawaban: ' + err.message);
    }
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
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs"
            title={isFullscreen ? 'Keluar Mode Layar Penuh' : 'Mode Layar Penuh'}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-indigo-600" /> : <Maximize className="w-3.5 h-3.5 text-slate-600" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}</span>
          </button>
          <button onClick={() => signOut({ callbackUrl: '/clients/test/login' })} className="text-xs text-red-500 font-bold hover:underline">Logout</button>
        </div>
      </header>

      {stage === 'questions' && (
        <div className="bg-white border-b border-slate-100 px-4 py-2 sticky top-14 z-40">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">
              <span>{currentTest?.name} · Soal {currentQ + 1}/{totalQuestions}</span>
              <span>{Math.round(((currentQ + 1) / totalQuestions) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-brand-500 h-full rounded-full transition-all duration-300" style={{ width: `${((currentQ + 1) / totalQuestions) * 100}%`, backgroundColor: brandColor }}></div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex items-center justify-center p-4">
        {stage === 'welcome' && <WelcomeStage customer={customer} tests={tests} onNext={() => setStage('biodata')} brandColor={brandColor} sessionUser={sessionUser} />}
        {stage === 'biodata' && (
          <BiodataStage 
            userName={userName} 
            setUserName={setUserName} 
            email={email} 
            setEmail={setEmail} 
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            nik={nik}
            setNik={setNik}
            onSubmit={handleBiodataSubmit} 
            brandColor={brandColor}
            isGoogleVerified={Boolean(sessionUser?.email)}
          />
        )}
        {stage === 'instruction' && <InstructionStage currentTest={currentTest} onStart={startTest} brandColor={brandColor} />}
        {stage === 'questions' && <QuestionStage currentTest={currentTest} currentQ={currentQ} answers={answers} setAnswerValue={setAnswerValue} onPrev={prevQuestion} onNext={nextQuestion} brandColor={brandColor} />}
        {stage === 'transition' && <TransitionStage onConfirm={confirmNextTest} brandColor={brandColor} />}
        {stage === 'done' && <DoneStage userName={userName} customer={customer} />}

        {stage === 'kuota_habis' && (
          <div className="flex flex-col max-w-lg w-full animate-fadeUp">
            <div className="bg-white rounded-3xl border border-red-200 p-6 sm:p-8 text-center shadow-xl space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100 shadow-sm">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 bg-red-100 text-red-700 font-bold text-[11px] uppercase tracking-wider rounded-full mb-2">
                  Akses Ujian Belum Tersedia
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 font-display">Kuota Tes Sudah Habis</h2>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                Halo <strong className="text-slate-800">{userName || email || 'Peserta'}</strong>, mohon maaf atas ketidaknyamanannya.
                Sisa kuota pengerjaan untuk sesi tes <strong>{campaign?.title}</strong> di <strong>{customer?.company_name || 'Perusahaan'}</strong> saat ini sedang habis terpakai oleh peserta lain.
              </p>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left space-y-2 text-xs text-amber-900 font-medium">
                <div className="font-bold text-amber-950 flex items-center gap-1.5 text-sm">
                  💡 Informasi Penting untuk Anda:
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  <li><strong>Status Ujian Aman:</strong> Waktu ujian Anda belum berjalan dan jawaban Anda belum ada yang hilang.</li>
                  <li><strong>Data Diri Tersimpan:</strong> Anda tidak perlu mengisi ulang biodata saat kembali nanti.</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Langkah yang Perlu Dilakukan:
                </div>
                <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside">
                  <li>
                    <strong>Hubungi Tim HRD / Rekrutmen {customer?.company_name || 'Penyelenggara'}:</strong> Beritahukan bahwa kuota tes untuk sesi <em>"{campaign?.title}"</em> perlu ditambahkan.
                  </li>
                  <li>
                    <strong>Muat Ulang Halaman:</strong> Setelah tim HRD memperbarui kuota tes, klik tombol di bawah untuk mencoba kembali.
                  </li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const msg = `Halo Tim HRD ${customer?.company_name || ''}, saya ${userName || email} ingin menginfokan bahwa kuota tes untuk sesi "${campaign?.title}" telah habis saat saya mencoba mulai. Mohon bantuan penambahan kuota tes. Terima kasih!`;
                    navigator.clipboard.writeText(msg);
                    setCopiedHrMsg(true);
                    toast.success('Pesan konfirmasi ke HRD berhasil disalin!');
                    setTimeout(() => setCopiedHrMsg(false), 3000);
                  }}
                  className="flex-1 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  {copiedHrMsg ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copiedHrMsg ? 'Pesan Tersalin!' : 'Salin Pesan ke HRD'}
                </button>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="flex-1 py-3.5 px-4 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: brandColor }}
                >
                  <RefreshCw className="w-4 h-4" /> Coba Lagi / Reload
                </button>
              </div>
            </div>
          </div>
        )}

        {stage === 'not_pre_registered' && (
          <div className="flex flex-col max-w-md w-full animate-fadeUp">
            <div className="bg-white rounded-3xl border border-amber-200 p-8 text-center shadow-xl space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-2xl font-bold">
                🔒
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Akses Ditolak (Undangan Khusus)</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Email Anda (<strong>{email}</strong>) belum didaftarkan oleh HR untuk sesi tes <strong>{campaign.title}</strong> ini.
              </p>
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-extrabold leading-snug">
                Sesi tes ini bersifat terbatas. Silakan hubungi HR perusahaan Anda untuk mendaftarkan email ini.
              </div>
            </div>
          </div>
        )}

        {stage === 'already_completed' && (
          <div className="flex flex-col max-w-md w-full animate-fadeUp">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xl space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-2xl font-bold">
                ⚠️
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Tes Sudah Pernah Dikerjakan</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Halo <strong>{userName}</strong> ({email}), Anda telah menyelesaikan seluruh rangkaian sesi tes psikotes untuk <strong>{campaign.title}</strong> sebelumnya.
              </p>
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-extrabold leading-snug">
                Sesi tes ini <strong>hanya dapat dikerjakan 1 (satu) kali dan tidak dapat diulang</strong>.
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seluruh jawaban dan hasil analisis psikotes Anda telah tersimpan dengan aman dan terkirim ke Tim HR Perusahaan. Terima kasih!
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
