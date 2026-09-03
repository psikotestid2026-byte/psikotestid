'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { CheckCircle2, ArrowRight, Check, LogOut, ShieldCheck } from 'lucide-react';

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
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          signOut({ callbackUrl: '/clients/test/login' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center text-center max-w-md w-full animate-fadeUp">
      <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mb-6 shadow-xl animate-pulse2">
        <Check className="w-12 h-12 text-white stroke-[3]" />
      </div>
      <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight font-display">Terima Kasih</h2>
      <p className="text-slate-600 mb-6 leading-relaxed">
        Halo <strong className="text-slate-900">{userName || 'Peserta'}</strong>, Anda telah berhasil menyelesaikan seluruh rangkaian asesmen psikotes.
      </p>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 text-left w-full shadow-sm space-y-4 mb-6">
        <p className="text-sm text-slate-600 leading-relaxed">
          Seluruh jawaban Anda telah tersimpan secara aman dan terkirim otomatis ke Tim HRD <strong>{customer?.company_name || 'Perusahaan'}</strong>.
        </p>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-950 font-semibold">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Sesi otomatis logout dalam <strong>{countdown} detik</strong>...</span>
          </div>
          <span className="font-mono text-xs px-2 py-0.5 bg-emerald-200/80 rounded-md font-bold text-emerald-900">
            0:0{countdown}
          </span>
        </div>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: '/clients/test/login' })}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl text-xs shadow-md flex items-center justify-center gap-2 transition-all mb-4"
      >
        <LogOut className="w-4 h-4 text-slate-400" /> Logout Sekarang
      </button>

      <p className="text-[10px] text-slate-300 uppercase tracking-[0.3em] font-bold">PsikoTest.id Enterprise</p>
    </div>
  );
}
