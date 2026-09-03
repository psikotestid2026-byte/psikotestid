import { Loader2, Brain } from 'lucide-react';

export default function AssessmentLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Animated Progress Bar */}
      <div className="w-full h-1 bg-slate-200 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-500 via-emerald-500 to-indigo-600 animate-pulse w-full" />
      </div>

      {/* Header Skeleton */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center animate-pulse">
            <Brain className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="space-y-1">
            <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-8 w-24 bg-slate-100 rounded-xl animate-pulse" />
      </header>

      {/* Main Content Loading Skeleton */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-xl text-center space-y-5 animate-fadeUp">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-extrabold text-slate-900 font-display">Memuat Sesi Asesmen...</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sistem sedang menyiapkan data kuesioner dan instrumen psikotes Anda. Mohon tunggu sebentar.
            </p>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-indigo-600 h-full w-2/3 rounded-full animate-pulse" />
          </div>

          <p className="text-[10px] text-slate-400 font-mono">PsikoTest.id Enterprise Platform</p>
        </div>
      </main>

      {/* Footer Skeleton */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        Menghubungkan secara aman ke Server Asesmen...
      </footer>
    </div>
  );
}
