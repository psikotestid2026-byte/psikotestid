'use client';

import { useState } from 'react';
import { DiscExampleCard } from './DiscExampleCard';
import { AlertTriangle, CheckSquare } from 'lucide-react';

interface InstructionStageProps {
  currentTest: any;
  onStart: () => void;
  brandColor: string;
}

export function InstructionStage({ currentTest, onStart, brandColor }: InstructionStageProps) {
  const isDisc = currentTest?.code?.toLowerCase() === 'disc';
  const [hasAgreed, setHasAgreed] = useState(false);

  return (
    <div className="flex flex-col max-w-xl w-full animate-fadeUp">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-6 text-white" style={{ backgroundColor: brandColor }}>
          <h2 className="text-xl font-bold mb-1 font-display">Instruksi: {currentTest?.name}</h2>
          <p className="text-white/80 text-xs">Mohon baca dengan teliti sebelum memulai.</p>
        </div>

        <div className="p-6 text-sm text-slate-600 leading-relaxed space-y-4">
          <p>
            Ini adalah instruksi untuk tes {currentTest?.name}. Jawablah setiap pertanyaan dengan teliti dan jujur sesuai dengan diri Anda yang sebenarnya. 
            Waktu pengerjaan tes ini adalah ±{Math.round((currentTest?.duration_sec || 600) / 60)} menit.
          </p>
          
          {isDisc && <DiscExampleCard />}

          {currentTest?.instructions && (
            <p className="text-xs text-slate-500 italic border-l-2 border-indigo-200 pl-3 py-1">
              {currentTest.instructions}
            </p>
          )}

          {/* Single Attempt Warning Banner & Mandatory Agreement Checkbox */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs space-y-2.5">
            <div className="font-extrabold text-amber-900 flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>PERHATIAN — PERATURAN PENGERJAAN TES:</span>
            </div>

            <p className="text-amber-800 leading-relaxed font-semibold">
              Sesi tes psikotes online ini <strong>hanya dapat dikerjakan 1 (satu) kali dan tidak dapat diulang</strong>. 
              Pastikan koneksi internet Anda stabil dan Anda berada di lingkungan yang tenang sebelum menekan tombol mulai.
            </p>

            <label className="flex items-start gap-2.5 pt-2 border-t border-amber-200/80 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-amber-300 focus:ring-indigo-500 mt-0.5"
              />
              <span className="text-[11px] font-extrabold text-amber-950 leading-tight">
                Saya telah membaca, memahami, dan mengerti bahwa tes ini hanya dapat dikerjakan 1 (satu) kali dan tidak dapat diulang.
              </span>
            </label>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={onStart}
            disabled={!hasAgreed}
            className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all ${
              hasAgreed
                ? 'hover:opacity-90 active:scale-95 cursor-pointer'
                : 'opacity-40 cursor-not-allowed'
            }`}
            style={{ backgroundColor: brandColor }}
          >
            {hasAgreed ? 'Mulai Tes Sekarang ➔' : 'Centang Ceklis Konfirmasi Di Atas Untuk Memulai'}
          </button>
        </div>
      </div>
    </div>
  );
}
