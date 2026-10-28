'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import Link from 'next/link';
import { BrainCircuit, Timer, AlertTriangle, CheckCircle2, RefreshCw, Copy, Maximize, Minimize, LogOut, ArrowLeft } from 'lucide-react';
import { WelcomeStage } from '@/components/assessment/WelcomeStage';
import { BiodataStage } from '@/components/assessment/BiodataStage';
import { InstructionStage } from '@/components/assessment/InstructionStage';
import { QuestionStage } from '@/components/assessment/QuestionStage';
import { TransitionStage, DoneStage } from '@/components/assessment/CompletionStage';
import { BundleProgress } from '@/components/assessment/BundleProgress';
import {
  buildParticipantSubmitBody,
  clearTabAssessmentBindings,
  decideTabSession,
  legacyProgressStorageKey,
  progressStorageKey,
  tabSessionStorageKey,
} from '@/lib/assessmentSession';
import {
  acquireSubmitLock,
  planConfirmNext,
  planQuestionAdvance,
  releaseSubmitLock,
  routeToMissingTest,
  type SubmitLock,
} from '@/lib/assessmentAdvance';
import { submitBiodata, startBundleSession } from '../actions';

export default function AssessmentClient({ initialData }: { initialData: any }) {
  const { campaign, customer, tests, sessionUser, existingParticipant } = initialData;
  const isBundle = campaign?.campaign_mode === 'MANDATORY_BUNDLE';
  const [completedTestIds, setCompletedTestIds] = useState<number[]>(initialData.completedTestIds || []);
  // Mandatory bundle: resume at the first test that has no stored result on the server.
  const firstPendingIdx = Math.max(
    0,
    tests.findIndex((t: any) => !(initialData.completedTestIds || []).includes(t.id))
  );
  const [stage, setStage] = useState('welcome');
  const [isStarting, setIsStarting] = useState(false);
  const [participantId, setParticipantId] = useState<number | null>(existingParticipant?.id || null);
  const [activeIdx, setActiveIdx] = useState(isBundle ? firstPendingIdx : 0);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [copiedHrMsg, setCopiedHrMsg] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const submitLockRef = useRef<SubmitLock>({ held: false });
  const questionStepRef = useRef(false);
  const confirmLockRef = useRef(false);

  const initialName = existingParticipant?.full_name || sessionUser?.name || '';
  const initialEmail = existingParticipant?.email || sessionUser?.email || '';

  const [userName, setUserName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phoneNumber, setPhoneNumber] = useState(existingParticipant?.phone_number || '');
  const [nik, setNik] = useState(existingParticipant?.nik || '');
  const [resetCount, setResetCount] = useState(Number(existingParticipant?.reset_count ?? 0));
  const [boundReady, setBoundReady] = useState(false);
  const [tabToken, setTabToken] = useState<string | null>(initialData.assessmentToken || null);
  const [sessionHalt, setSessionHalt] = useState<{ boundName: string } | null>(null);
  const tokenRef = useRef<string | null>(initialData.assessmentToken || null);
  const boundParticipantRef = useRef<number | null>(existingParticipant?.id ? Number(existingParticipant.id) : null);
  const boundNameRef = useRef(initialName);
  const boundEmailRef = useRef(String(initialEmail || '').toLowerCase());
  const haltedRef = useRef(false);
  const ignoreIncomingRef = useRef(false);

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

  const rememberBound = (token: string, participantIdValue: number, name: string, emailValue: string) => {
    tokenRef.current = token;
    setTabToken(token);
    boundParticipantRef.current = participantIdValue;
    boundNameRef.current = name;
    boundEmailRef.current = emailValue.trim().toLowerCase();
    if (campaign?.id) {
      try {
        sessionStorage.setItem(tabSessionStorageKey(Number(campaign.id)), token);
      } catch {
        // Private mode can reject storage; the in-memory refs still guard this render.
      }
    }
  };

  const haltTab = (boundName: string) => {
    haltedRef.current = true;
    ignoreIncomingRef.current = true;
    setSessionHalt({ boundName: boundName || 'peserta ini' });
  };

  // Bind this tab before paint so a refreshed cookie cannot render the other participant.
  useLayoutEffect(() => {
    if (!campaign?.id) {
      setBoundReady(true);
      return;
    }
    const campaignId = Number(campaign.id);
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(tabSessionStorageKey(campaignId));
    } catch {
      stored = null;
    }
    const decision = decideTabSession({
      storedToken: stored,
      incomingToken: initialData.assessmentToken || null,
      campaignId,
    });

    if (decision.action === 'stop') {
      haltTab(decision.boundName);
      setBoundReady(true);
      return;
    }

    if (decision.action === 'anonymous') {
      tokenRef.current = null;
      setTabToken(null);
      setBoundReady(true);
      return;
    }

    rememberBound(decision.token, decision.participantId, decision.name, decision.email);
    if (!decision.cookieMismatch) {
      setBoundReady(true);
      return;
    }

    ignoreIncomingRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/test/session', {
          headers: { 'x-assessment-token': decision.token },
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        const ownedId = Number(data?.participant?.id);
        if (!res.ok || ownedId !== decision.participantId) {
          haltTab(decision.name);
          setBoundReady(true);
          return;
        }
        const owned = data.participant;
        setParticipantId(ownedId);
        setUserName(owned.full_name || decision.name);
        setEmail(owned.email || decision.email);
        setPhoneNumber(owned.phone_number || '');
        setNik(owned.nik || '');
        setResetCount(Number(owned.reset_count || 0));
        setCompletedTestIds(Array.isArray(data.completedTestIds) ? data.completedTestIds.map(Number) : []);
        if (String(owned.status) === 'COMPLETED') setStage('already_completed');
        setBoundReady(true);
      } catch {
        if (cancelled) return;
        haltTab(decision.name);
        setBoundReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // The binding is decided once per mount. Later cookie changes are watched separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.id]);

  useEffect(() => {
    if (!boundReady || !boundEmailRef.current) return;
    let stop = false;
    const checkCookie = async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const cookieEmail = String(data?.user?.email || '').toLowerCase();
        if (stop || !cookieEmail || cookieEmail === boundEmailRef.current) return;
        ignoreIncomingRef.current = true;
        if (!tokenRef.current) haltTab(boundNameRef.current);
      } catch {
        // A failed poll must not switch the participant.
      }
    };
    const timer = window.setInterval(checkCookie, 2500);
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkCookie();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stop = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [boundReady]);

  // Progress is keyed by the bound participant id, not the shared login cookie.
  const storageKey =
    boundReady && !sessionHalt && campaign?.id && participantId
      ? progressStorageKey(Number(campaign.id), Number(participantId), resetCount)
      : null;

  // Restore state from LocalStorage on mount
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      const legacyKey =
        campaign?.id && email
          ? legacyProgressStorageKey(Number(campaign.id), email, resetCount)
          : null;
      const saved = localStorage.getItem(storageKey) || (legacyKey ? localStorage.getItem(legacyKey) : null);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.participantId && Number(parsed.participantId) !== Number(participantId)) {
          return;
        }
        if (parsed.answers && Object.keys(parsed.answers).length > 0) {
          setAnswers(parsed.answers);
        }
        if (parsed.participantId) setParticipantId(parsed.participantId);
        if (typeof parsed.activeIdx === 'number' && parsed.activeIdx < tests.length) {
          setActiveIdx(isBundle ? Math.max(parsed.activeIdx, firstPendingIdx) : parsed.activeIdx);
        }
        // Guard against stale progress: if the saved question-count "fingerprint"
        // for the active test no longer matches the freshly loaded question list
        // (e.g. question_banks was deduped/re-seeded after the participant started),
        // discard the mismatched saved state instead of silently desyncing indices.
        const savedActiveIdx = typeof parsed.activeIdx === 'number' ? parsed.activeIdx : 0;
        const savedTest = tests[savedActiveIdx];
        const savedFingerprint = parsed.questionCounts;
        const currentFingerprint = tests.map((t: any) => t?.questions?.length || 0);
        const fingerprintMatches =
          !savedFingerprint ||
          (Array.isArray(savedFingerprint) &&
            savedFingerprint.length === currentFingerprint.length &&
            savedFingerprint.every((c: number, i: number) => c === currentFingerprint[i]));

        if (!fingerprintMatches) {
          console.warn('Saved progress fingerprint mismatch (question bank changed) - resetting progress.');
          localStorage.removeItem(storageKey);
          toast.info('Data soal telah diperbarui, progres pengerjaan Anda direset ke awal tes ini.');
        } else {
          if (parsed.answers && Object.keys(parsed.answers).length > 0) {
            setAnswers(parsed.answers);
          }
          if (parsed.participantId) setParticipantId(parsed.participantId);
          const behindServer = isBundle && typeof parsed.activeIdx === 'number' && parsed.activeIdx < firstPendingIdx;
          if (typeof parsed.activeIdx === 'number' && parsed.activeIdx < tests.length) {
            setActiveIdx(isBundle ? Math.max(parsed.activeIdx, firstPendingIdx) : parsed.activeIdx);
          }
          if (typeof parsed.currentQ === 'number' && !behindServer) {
            const maxQ = savedTest?.questions?.length ? savedTest.questions.length - 1 : 0;
            setCurrentQ(Math.min(parsed.currentQ, Math.max(maxQ, 0)));
          }
          if (behindServer) {
            // Local progress points at a test already stored on the server: restart at the next test.
            setCurrentQ(0);
            setStage('instruction');
          } else if (parsed.stage && parsed.stage !== 'done' && parsed.stage !== 'welcome') {
            setStage(parsed.stage);
          }
          if (typeof parsed.timeLeft === 'number' && parsed.timeLeft > 0 && !behindServer) {
            setTimeLeft(parsed.timeLeft);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load localStorage progress:', e);
      // Corrupt JSON - drop it so it doesn't keep failing on every mount.
      try { localStorage.removeItem(storageKey); } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, tests.length]);

  // Persist state to LocalStorage when changed
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined' || sessionHalt) return;
    if (boundParticipantRef.current && Number(participantId) !== boundParticipantRef.current) return;
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
        // Fingerprint of question-list lengths per test, used to detect
        // question_banks changes between save and resume.
        questionCounts: tests.map((t: any) => t?.questions?.length || 0),
        updatedAt: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save progress to localStorage:', e);
    }
  }, [storageKey, answers, participantId, activeIdx, currentQ, stage, timeLeft, tests, sessionHalt]);

  useEffect(() => {
    if (!boundReady || ignoreIncomingRef.current || haltedRef.current) return;
    const incomingId = Number(existingParticipant?.id || 0);
    if (boundParticipantRef.current && incomingId && incomingId !== boundParticipantRef.current) {
      ignoreIncomingRef.current = true;
      if (!tokenRef.current) haltTab(boundNameRef.current);
      return;
    }

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
      const nextId = Number(existingParticipant.id);
      setParticipantId(nextId);
      boundParticipantRef.current = nextId;
    }
    if (existingParticipant?.reset_count != null) {
      setResetCount(Number(existingParticipant.reset_count) || 0);
    }
  }, [sessionUser, existingParticipant, boundReady, userName, email]);

  useEffect(() => {
    questionStepRef.current = false;
  }, [currentQ]);

  useEffect(() => {
    if (stage !== 'transition') confirmLockRef.current = false;
  }, [stage]);

  useEffect(() => {
    if (customer?.brand_color) {
      document.documentElement.style.setProperty('--brand-color', customer.brand_color);
    }
  }, [customer]);

  useEffect(() => {
    if (!boundReady || ignoreIncomingRef.current || haltedRef.current) return;
    const incomingId = Number(existingParticipant?.id || 0);
    if (boundParticipantRef.current && incomingId && incomingId !== boundParticipantRef.current) return;
    if (existingParticipant?.status === 'COMPLETED') {
      setStage('already_completed');
    }
  }, [existingParticipant, boundReady]);

  useEffect(() => {
    let timer: any;
    const currentTestCode = tests[activeIdx]?.code?.toLowerCase();

    if (!haltedRef.current && !sessionHalt && stage === 'questions' && timeLeft > 0) {
      timer = setInterval(() => {
        let expired = false;
        setTimeLeft(prev => {
          if (prev <= 1) {
            expired = true;
            return 0;
          }
          return prev - 1;
        });
        if (!expired) return;
        clearInterval(timer);
        if (haltedRef.current) return;
        if (currentTestCode === 'wpt') {
          toast.info('Waktu pengerjaan tes WPT telah habis! Jawaban Anda otomatis dikirim.');
          void finishActiveTest();
        } else {
          toast.warning('Waktu alokasi pengerjaan telah selesai, namun Anda masih dapat meninjau dan menyelesaikan jawaban sebelum menekan tombol Selesai.');
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [stage, timeLeft, activeIdx, tests, sessionHalt]);

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

  if (!boundReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-500">Memuat sesi asesmen...</p>
      </div>
    );
  }

  if (sessionHalt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-3xl border border-amber-200 p-8 text-center shadow-xl max-w-lg w-full space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 font-display">Sesi Berubah</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Sesi berganti ke akun lain. Silakan login ulang sebagai <strong>{sessionHalt.boundName}</strong>.
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Jawaban di tab ini tidak dikirim dan tidak menyelesaikan tes untuk akun yang lain.
          </p>
          <Link
            href="/clients/test/login?switch=1"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-slate-900 text-white font-bold text-xs rounded-2xl"
          >
            <LogOut className="w-4 h-4" /> Login ulang sebagai {sessionHalt.boundName}
          </Link>
        </div>
      </div>
    );
  }

  const handleBiodataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await submitBiodata(campaign.id, userName, email, phoneNumber, nik);
      if (!res.success) {
        if (res.error === 'ALREADY_COMPLETED') {
          setStage('already_completed');
        } else if (res.error === 'KUOTA_HABIS') {
          setStage('kuota_habis');
        } else if (res.error === 'NOT_PRE_REGISTERED') {
          setStage('not_pre_registered');
        } else {
          toast.error('Gagal mendaftar: ' + (res.error || 'Terjadi kesalahan'));
        }
        return;
      }
      const nextId = Number(res.participantId);
      setParticipantId(nextId);
      if (res.assessmentToken) {
        rememberBound(res.assessmentToken, nextId, userName, email);
      } else {
        boundParticipantRef.current = nextId;
      }
      setStage('instruction');
    } catch (err: any) {
      toast.error('Gagal mendaftar: ' + err.message);
    }
  };

  const handleBundleStart = async () => {
    if (!participantId || isStarting) return;
    setIsStarting(true);
    try {
      const res = await startBundleSession(participantId, tokenRef.current || undefined);
      if (res.alreadyCompleted) {
        setStage('already_completed');
        return;
      }
      // Everything already stored on the server but not yet marked complete: finalize directly.
      if (completedTestIds.length >= tests.length) {
        await finalizeBundle();
        return;
      }
      setStage('instruction');
    } catch (err: any) {
      toast.error('Gagal memulai asesmen: ' + (err?.message || 'Terjadi kesalahan'));
    } finally {
      setIsStarting(false);
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
    const plan = planQuestionAdvance({
      locked: submitLockRef.current.held,
      stepping: questionStepRef.current,
      currentQ,
      totalQuestions,
    });
    if (plan.type === 'ignore') return;
    if (plan.type === 'next-question') {
      questionStepRef.current = true;
      setCurrentQ((prev) => prev + 1);
      return;
    }
    void finishActiveTest();
  };

  const prevQuestion = () => {
    if (submitLockRef.current.held || questionStepRef.current) return;
    if (currentQ > 0) setCurrentQ(prev => prev - 1);
  };

  const jumpToQuestion = (idx: number) => {
    if (submitLockRef.current.held || questionStepRef.current) return;
    if (idx >= 0 && idx < totalQuestions) {
      setCurrentQ(idx);
    }
  };

  // A question counts as "answered" for navigator purposes; DISC requires both P & K set.
  const isQuestionAnswered = (idx: number) => {
    const t = tests[activeIdx];
    const val = answers[t?.id]?.[idx];
    const isDiscTest = t?.code?.toLowerCase() === 'disc';
    if (isDiscTest) {
      return (
        val &&
        typeof val === 'object' &&
        val.P !== null &&
        val.P !== undefined &&
        val.K !== null &&
        val.K !== undefined &&
        val.P !== val.K
      );
    }
    return val !== undefined && val !== null && String(val).trim() !== '';
  };

  const postSubmit = async (input: { testId?: number; answers?: unknown; action?: 'mark_completed' }) => {
    const built = buildParticipantSubmitBody({
      halted: haltedRef.current,
      boundParticipantId: boundParticipantRef.current,
      token: tokenRef.current,
      testId: input.testId,
      answers: input.answers,
      action: input.action,
    });
    if (!built.ok) {
      if (built.reason === 'halted') haltTab(boundNameRef.current);
      throw new Error('Sesi asesmen tidak valid. Jawaban tidak dikirim.');
    }
    const res = await fetch('/api/test/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(built.body),
    });
    const result = await res.json().catch(() => ({}));
    if (result?.code === 'SESSION_MISMATCH') {
      haltTab(boundNameRef.current);
    }
    return { res, result };
  };

  const reopenMissingTest = (result: { missing_tests?: unknown; error?: string }) => {
    const target = routeToMissingTest(tests, result?.missing_tests);
    if (!target) return false;
    toast.error(result?.error || 'Masih ada tes yang belum selesai. Silakan kerjakan tes tersebut.');
    setActiveIdx(target.index);
    setCurrentQ(0);
    setStage('instruction');
    return true;
  };

  const finalizeBundle = async () => {
    const { res, result } = await postSubmit({ action: 'mark_completed' });
    if (!res.ok || !result.success) {
      if (reopenMissingTest(result)) return;
      throw new Error(result.error || 'Gagal menyelesaikan asesmen.');
    }
    setStage('done');
  };

  const finishActiveTest = async () => {
    if (haltedRef.current) return;
    if (!acquireSubmitLock(submitLockRef.current)) return;
    setIsSaving(true);
    const t = tests[activeIdx];
    try {
      const { res, result } = await postSubmit({
        testId: t.id,
        answers: answers[t.id] || {},
      });
      if (!res.ok || !result.success) {
        toast.error(result.error || 'Gagal menyimpan jawaban tes.');
        return;
      }

      toast.success(`Jawaban tes ${t.name || 'psikotes'} berhasil disimpan!`);
      const nowCompleted = completedTestIds.includes(t.id) ? completedTestIds : [...completedTestIds, t.id];
      setCompletedTestIds(nowCompleted);

      if (activeIdx < tests.length - 1) {
        setStage('transition');
      } else if (isBundle) {
        await finalizeBundle();
      } else {
        const marked = await postSubmit({ action: 'mark_completed' });
        if (!marked.res.ok || !marked.result.success) {
          if (reopenMissingTest(marked.result)) return;
          toast.error(marked.result.error || 'Gagal menyelesaikan asesmen.');
          return;
        }
        setStage('done');
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan saat menyimpan jawaban: ' + err.message);
    } finally {
      releaseSubmitLock(submitLockRef.current);
      setIsSaving(false);
    }
  };

  const confirmNextTest = () => {
    if (planConfirmNext(confirmLockRef.current || submitLockRef.current.held) === 'ignore') return;
    confirmLockRef.current = true;
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
          {userName ? (
            <span className="hidden sm:inline max-w-[140px] truncate text-xs font-bold text-slate-600" title={userName}>
              {userName}
            </span>
          ) : null}
          <button
            onClick={() => {
              clearTabAssessmentBindings();
              signOut({ callbackUrl: '/clients/test/login' });
            }}
            className="text-xs text-red-500 font-bold hover:underline"
          >
            Logout
          </button>
        </div>
      </header>

      {isBundle && ['instruction', 'questions', 'transition'].includes(stage) && (
        <BundleProgress tests={tests} activeIdx={activeIdx} completedTestIds={completedTestIds} brandColor={brandColor} />
      )}

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
            <div className="flex items-center gap-1.5 overflow-x-auto py-2 mt-1 no-scrollbar">
              {Array.from({ length: totalQuestions }).map((_, idx) => {
                const isActive = idx === currentQ;
                const answered = isQuestionAnswered(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isSaving}
                    onClick={() => jumpToQuestion(idx)}
                    title={`Soal ${idx + 1}${answered ? ' (terjawab)' : ''}`}
                    className={`shrink-0 w-7 h-7 rounded-lg text-[11px] font-bold flex items-center justify-center border transition-all ${
                      isActive
                        ? 'text-white shadow-sm scale-105'
                        : answered
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                    style={isActive ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex items-center justify-center p-4">
        {stage === 'welcome' && (
          <WelcomeStage
            customer={customer}
            tests={tests}
            onNext={isBundle && participantId ? handleBundleStart : () => setStage('biodata')}
            brandColor={brandColor}
            sessionUser={sessionUser}
            ctaLabel={isBundle && participantId ? (completedTestIds.length > 0 ? 'Lanjutkan Asesmen' : 'Mulai Asesmen') : undefined}
            isStarting={isStarting}
          />
        )}
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
        {stage === 'questions' && (
          <QuestionStage
            currentTest={currentTest}
            currentQ={currentQ}
            answers={answers}
            setAnswerValue={setAnswerValue}
            onPrev={prevQuestion}
            onNext={nextQuestion}
            brandColor={brandColor}
            isSubmitting={isSaving}
          />
        )}
        {stage === 'transition' && <TransitionStage onConfirm={confirmNextTest} brandColor={brandColor} disabled={confirmLockRef.current} />}
        {stage === 'done' && (
          <DoneStage
            userName={userName}
            customer={customer}
            bundleParticipantId={isBundle ? participantId : null}
            assessmentToken={tabToken}
          />
        )}

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
          <div className="flex flex-col max-w-lg w-full animate-fadeUp">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xl space-y-5">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-2xl font-bold">
                ⚠️
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 font-display">Tes Sudah Pernah Dikerjakan</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Halo <strong className="text-slate-900">{userName || 'Peserta'}</strong> ({email}), Anda telah menyelesaikan seluruh rangkaian sesi tes psikotes untuk <strong className="text-slate-900">{campaign.title}</strong> sebelumnya.
              </p>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 font-extrabold leading-relaxed">
                Sesi tes ini <strong>hanya dapat dikerjakan 1 (satu) kali dan tidak dapat diulang</strong>.
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Seluruh jawaban dan hasil analisis psikotes Anda telah tersimpan dengan aman dan terkirim ke Tim HR Perusahaan. Terima kasih atas partisipasi Anda!
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                  clearTabAssessmentBindings();
                  signOut({ callbackUrl: '/clients/test/login' });
                }}
                  className="w-full sm:w-1/2 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <LogOut className="w-4 h-4 text-slate-400" /> Logout / Keluar Sesi
                </button>
                <Link
                  href="/clients/test/login"
                  className="w-full sm:w-1/2 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all border border-slate-200"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-500" /> Portal Login Peserta
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
