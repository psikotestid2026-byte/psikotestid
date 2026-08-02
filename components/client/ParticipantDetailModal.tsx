import React from 'react';
import { X, Download, BrainCircuit, User, Mail, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import { DiscThreeCharts } from '@/components/reports/DiscCharts';
import { DiscScoreResult } from '@/lib/scoring/disc';

interface ParticipantDetailModalProps {
  participant: any;
  onClose: () => void;
}

export function ParticipantDetailModal({ participant, onClose }: ParticipantDetailModalProps) {
  if (!participant) return null;

  const testResults = Array.isArray(participant.test_results)
    ? participant.test_results
    : typeof participant.test_results === 'string'
    ? JSON.parse(participant.test_results)
    : [];

  const discResult = testResults.find((r: any) => r.scoring_data && r.scoring_data.g1);
  const scoring: DiscScoreResult | null = discResult?.scoring_data || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white">{participant.full_name}</h2>
              <p className="text-xs text-slate-400">Sesi: {participant.campaign_title || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {discResult && (
              <a
                href={`/api/reports/disc/${discResult.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                <Download className="w-4 h-4" /> Download PDF Report
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6">
          {/* Identity Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
            <div>
              <div className="text-slate-400 font-medium flex items-center gap-1.5 mb-1"><User className="w-3.5 h-3.5" /> Nama</div>
              <div className="font-bold text-slate-800">{participant.full_name}</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium flex items-center gap-1.5 mb-1"><Mail className="w-3.5 h-3.5" /> Email</div>
              <div className="font-bold text-slate-800 truncate">{participant.email}</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium flex items-center gap-1.5 mb-1"><Calendar className="w-3.5 h-3.5" /> Tanggal</div>
              <div className="font-bold text-slate-800">{new Date(participant.created_at || Date.now()).toLocaleDateString('id-ID')}</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium flex items-center gap-1.5 mb-1"><CheckCircle className="w-3.5 h-3.5" /> Status</div>
              <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 inline-block">
                {participant.status || 'COMPLETED'}
              </span>
            </div>
          </div>

          {scoring ? (
            <>
              {/* Profile Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">Hasil Analisis DISC</span>
                    <h3 className="text-2xl font-bold font-display text-white mt-1">
                      {scoring.dominantLabel} — {scoring.dominantType}
                    </h3>
                    <p className="text-xs text-indigo-200 mt-1 max-w-xl">
                      Sub-Trait Utama: <strong>{scoring.subTraits.g3}</strong> (Graph 3 Change).
                      {scoring.hasStressPotential && (
                        <span className="inline-flex items-center gap-1 text-amber-300 ml-2 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" /> Terindikasi Penyesuaian Style (Stress Potential)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 DISC SVG Charts */}
              <div>
                <h4 className="font-display font-bold text-slate-900 text-base mb-2">Tiga Grafik DISC (Most, Least, Change)</h4>
                <DiscThreeCharts g1={scoring.g1} g2={scoring.g2} g3={scoring.g3} />
              </div>

              {/* Score Table */}
              <div>
                <h4 className="font-display font-bold text-slate-900 text-base mb-3">Tabel Ringkasan Skor Mentah & Konversi Grafik</h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-xs text-center">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="py-3 px-4 text-left">Kategori / Dimensi</th>
                        <th className="py-3 px-4 text-red-600">D (Dominance)</th>
                        <th className="py-3 px-4 text-amber-600">I (Influence)</th>
                        <th className="py-3 px-4 text-emerald-600">S (Steadiness)</th>
                        <th className="py-3 px-4 text-blue-600">C (Compliance)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                      <tr>
                        <td className="py-2.5 px-4 text-left font-sans font-semibold text-slate-800">Most (Paling)</td>
                        <td>{scoring.most.D}</td>
                        <td>{scoring.most.I}</td>
                        <td>{scoring.most.S}</td>
                        <td>{scoring.most.C}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-left font-sans font-semibold text-slate-800">Least (Kurang)</td>
                        <td>{scoring.least.D}</td>
                        <td>{scoring.least.I}</td>
                        <td>{scoring.least.S}</td>
                        <td>{scoring.least.C}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-left font-sans font-semibold text-slate-800">Change (Selisih)</td>
                        <td>{scoring.change.D}</td>
                        <td>{scoring.change.I}</td>
                        <td>{scoring.change.S}</td>
                        <td>{scoring.change.C}</td>
                      </tr>
                      <tr className="bg-slate-50 font-bold">
                        <td className="py-2.5 px-4 text-left font-sans font-bold text-slate-900">Graph 1 (MOST)</td>
                        <td className="text-red-600">{scoring.g1.D}</td>
                        <td className="text-amber-600">{scoring.g1.I}</td>
                        <td className="text-emerald-600">{scoring.g1.S}</td>
                        <td className="text-blue-600">{scoring.g1.C}</td>
                      </tr>
                      <tr className="bg-slate-50 font-bold">
                        <td className="py-2.5 px-4 text-left font-sans font-bold text-slate-900">Graph 2 (LEAST)</td>
                        <td className="text-red-600">{scoring.g2.D}</td>
                        <td className="text-amber-600">{scoring.g2.I}</td>
                        <td className="text-emerald-600">{scoring.g2.S}</td>
                        <td className="text-blue-600">{scoring.g2.C}</td>
                      </tr>
                      <tr className="bg-slate-50 font-bold">
                        <td className="py-2.5 px-4 text-left font-sans font-bold text-slate-900">Graph 3 (CHANGE)</td>
                        <td className="text-red-600">{scoring.g3.D}</td>
                        <td className="text-amber-600">{scoring.g3.I}</td>
                        <td className="text-emerald-600">{scoring.g3.S}</td>
                        <td className="text-blue-600">{scoring.g3.C}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Development Recommendations */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h4 className="font-display font-bold text-slate-900 text-sm mb-3">Saran & Catatan Pengelolaan HR</h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  {scoring.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
              <BrainCircuit className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-base">Belum Ada Hasil Tes DISC</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Kandidat ini belum menyelesaikan tes DISC atau sedang mengerjakan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
