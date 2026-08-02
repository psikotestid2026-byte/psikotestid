import React from 'react';
import { CheckCircle2, HelpCircle } from 'lucide-react';

export function DiscExampleCard() {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 my-6 text-left shadow-sm">
      <div className="flex items-center gap-2 mb-3 text-indigo-700 font-bold text-sm">
        <HelpCircle className="w-5 h-5" />
        <span>Contoh Pengisian Soal DISC (Wajib Memilih 2 Jawaban)</span>
      </div>

      <p className="text-xs text-slate-600 mb-4 leading-relaxed">
        Pada setiap soal DISC, pilih <strong>1 P (Paling)</strong> untuk pernyataan yang paling sesuai dengan Anda, dan <strong>1 K (Kurang)</strong> untuk yang paling tidak sesuai.
      </p>

      <div className="space-y-2.5 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-300 bg-emerald-50/50">
          <span className="text-xs font-semibold text-slate-800">A. Mudah bergaul, ramah, dan menyenangkan</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-3 py-1 rounded-md text-xs font-bold bg-emerald-600 text-white shadow-xs">
              P (Paling)
            </span>
            <span className="px-3 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-400">
              K
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-700">B. Mempercayai orang lain</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-3 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-400">P</span>
            <span className="px-3 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-400">K</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-700">C. Petualang, berani mengambil risiko</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-3 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-400">P</span>
            <span className="px-3 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-400">K</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border border-amber-300 bg-amber-50/50">
          <span className="text-xs font-semibold text-slate-800">D. Toleran, menghormati orang lain</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-3 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-400">P</span>
            <span className="px-3 py-1 rounded-md text-xs font-bold bg-amber-600 text-white shadow-xs">
              K (Kurang)
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-emerald-700">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        <span>Contoh di atas BENAR karena memilih 1 Paling (A) dan 1 Kurang (D).</span>
      </div>
    </div>
  );
}
