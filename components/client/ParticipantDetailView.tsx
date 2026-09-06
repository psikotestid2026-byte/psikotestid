'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Download,
  BrainCircuit,
  User,
  Mail,
  Calendar,
  CheckCircle,
  AlertTriangle,
  History,
  CheckCircle2,
  Clock,
  Building,
} from 'lucide-react';
import { DiscThreeCharts } from '@/components/reports/DiscCharts';
import { DiscScoreResult } from '@/lib/scoring/disc';
import { getDiscProfileInterpretation } from '@/lib/scoring/interpretations';

interface ParticipantDetailViewProps {
  participantData: any;
  participantId: number;
}

export function ParticipantDetailView({ participantData, participantId }: ParticipantDetailViewProps) {
  const candidate = participantData?.participant || {};
  const currentTestResults = participantData?.current_test_results || [];
  const cumulativeHistory = participantData?.cumulative_history || [];

  const discResult = currentTestResults.find((r: any) => r.scoring_data && r.scoring_data.g1);
  const scoring: DiscScoreResult | null = discResult?.scoring_data || null;

  return (
    <div className="w-full space-y-6 animate-fadeUp">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/clients/participants"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Hasil Kandidat
        </Link>
      </div>

      {/* Candidate Profile Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/30 text-emerald-300 px-3 py-0.5 rounded-full border border-emerald-400/30">
              Laporan Individu Kandidat
            </span>
            <span className="text-xs text-indigo-300 font-mono">
              Sesi: {candidate.campaign_title || '-'}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">{candidate.full_name}</h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
            <span className="flex items-center gap-1.5 font-mono">
              <Mail className="w-3.5 h-3.5 text-indigo-400" /> {candidate.email}
            </span>
            {candidate.phone_number && (
              <span className="flex items-center gap-1.5 font-mono">
                📱 {candidate.phone_number}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-indigo-400" /> {candidate.company_name}
            </span>
          </div>
        </div>

        {/* Action Button Header */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href={`/api/reports/participant/${candidate.id || participantId}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" /> Download PDF Report Resmi
          </a>
        </div>
      </div>

      {/* SECTION A: Rekapitulasi & Riwayat Campaign Kandidat (Per Orang / Cumulative History) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" /> Rekapitulasi & Riwayat Tes Candidate Per Orang
            </h3>
            <p className="text-xs text-slate-500">
              Riwayat partisipasi kandidat ini dalam berbagai sesi campaign & tes psikotes perusahaan Anda.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">
            Total Sesi: {cumulativeHistory.length} Campaign
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Tanggal Sesi</th>
                <th className="p-3">Nama Campaign Sesi Tes</th>
                <th className="p-3">Instrumen Tes & Hasil Skor</th>
                <th className="p-3">Status Ujian</th>
              </tr>
            </thead>
            <tbody>
              {cumulativeHistory.map((item: any, idx: number) => {
                const results = Array.isArray(item.test_results)
                  ? item.test_results
                  : typeof item.test_results === 'string'
                  ? JSON.parse(item.test_results)
                  : [];

                return (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-500">
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </td>

                    <td className="p-3 font-bold text-slate-900">
                      {item.campaign_title}
                      {item.campaign_id === candidate.campaign_id && (
                        <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-bold">
                          Sesi Aktif Ini
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      {results.length === 0 ? (
                        <span className="text-slate-400 italic">Belum Ada Skor</span>
                      ) : (
                        <div className="space-y-1">
                          {results.map((r: any, rIdx: number) => {
                            const sc = r.scoring_data;
                            let labelStr = '';
                            let isDone = false;

                            if (sc?.dominantLabel) {
                              labelStr = `${sc.dominantLabel} (${sc.dominantType})`;
                              isDone = true;
                            } else if (sc?.score || sc?.wptScore) {
                              labelStr = `Skor: ${sc.score || sc.wptScore}`;
                              isDone = true;
                            } else if (sc || item.status === 'COMPLETED') {
                              labelStr = 'Selesai (Jawaban Tersimpan)';
                              isDone = true;
                            } else {
                              labelStr = 'Sedang Dikerjakan';
                              isDone = false;
                            }

                            return (
                              <div key={rIdx} className="flex items-center gap-2">
                                <span className="font-mono font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200 text-[10px]">
                                  {r.test_code?.toUpperCase() || 'TES'}
                                </span>
                                <span className={`font-bold text-[11px] ${isDone ? 'text-emerald-700' : 'text-slate-400 italic'}`}>
                                  {labelStr}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    <td className="p-3">
                      <Badge variant={item.status === 'COMPLETED' ? 'success' : 'warning'}>
                        {item.status === 'COMPLETED' ? 'SELESAI' : 'BELUM MENGERJAKAN'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION B: Detail Report Analisis Hasil Tes (DISC Charts & Tables) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-600" /> Detail Laporan Hasil Analisis Asesmen Psikotes
          </h3>
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
                    Sub-Trait Utama: <strong>{scoring.subTraits?.g3 || '-'}</strong> (Graph 3 Change).
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

            {/* Score Breakdown Table */}
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

            {/* Narrative Profile & Interpretations */}
            {(() => {
              const interp = getDiscProfileInterpretation(scoring.dominantLabel);
              return (
                <div className="space-y-4">
                  {/* Recommended Roles Banner */}
                  <div className="bg-gradient-to-r from-emerald-900 to-slate-900 p-6 rounded-2xl text-white shadow-sm border border-emerald-800 space-y-3">
                    <h4 className="font-display font-bold text-emerald-300 text-sm flex items-center gap-2">
                      💼 Proyeksi Penempatan Posisi / Profesi / Bidang Ideal
                    </h4>
                    <p className="text-xs text-emerald-100/90 leading-relaxed">{interp.rolesNarrative}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {interp.recommendedRoles.map((role, idx) => (
                        <span key={idx} className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 font-semibold px-3 py-1 rounded-xl text-xs">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-indigo-50/60 p-5 rounded-2xl border border-indigo-100 space-y-3">
                      <h4 className="font-display font-bold text-indigo-950 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Deskripsi Profil & Kekuatan Kerja
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed">{interp.generalDescription}</p>
                      <div className="pt-2 border-t border-indigo-100 space-y-1.5">
                        <span className="text-[11px] font-bold text-indigo-900">Uraian Kekuatan Utama:</span>
                        <p className="text-xs text-slate-600 leading-relaxed">{interp.strengthsNarrative}</p>
                        <ul className="mt-2 space-y-1 text-xs text-slate-600">
                          {interp.strengths.map((str, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold">•</span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                      <h4 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-600" /> Gaya Komunikasi & Lingkungan Ideal
                      </h4>
                      <div className="space-y-2 text-xs text-slate-700">
                        <div>
                          <strong className="text-slate-900">Gaya Komunikasi:</strong> {interp.communicationStyle}
                        </div>
                        <div>
                          <strong className="text-slate-900">Lingkungan Ideal:</strong> {interp.idealEnvironment}
                        </div>
                        <div className="pt-2 border-t border-slate-200 space-y-1.5">
                          <strong className="text-amber-800">Uraian Area Pengembangan / Risiko:</strong>
                          <p className="text-xs text-slate-600 leading-relaxed">{interp.weaknessesNarrative}</p>
                          <ul className="mt-1 space-y-1 text-xs text-slate-600">
                            {interp.weaknesses.map((wk, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-amber-600 font-bold">•</span>
                                <span>{wk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conflict Potential & Best Treatments */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 space-y-3">
                      <h4 className="font-display font-bold text-amber-950 text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" /> Potensi Konflik Kerja & Solusi
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed">{interp.conflictsNarrative}</p>
                      <div className="space-y-2 text-xs">
                        {interp.potentialConflicts.map((cnf, idx) => (
                          <div key={idx} className="p-3 bg-white rounded-xl border border-amber-200/80 space-y-1">
                            <p className="text-amber-900 font-semibold">⚡ Pemicu: {cnf.trigger}</p>
                            <p className="text-slate-600">⚠️ Dampak: {cnf.impact}</p>
                            <p className="text-emerald-700 font-medium">💡 Solusi: {cnf.solution}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-200 space-y-3">
                      <h4 className="font-display font-bold text-blue-950 text-sm flex items-center gap-2">
                        🌟 Treatment Terbaik (Pendekatan Efektif Atasan & HR)
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed">{interp.treatmentsNarrative}</p>
                      <ul className="space-y-2 text-xs text-slate-700">
                        {interp.bestTreatments.map((trm, idx) => (
                          <li key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-blue-100">
                            <span className="w-2 h-2 rounded-full bg-blue-600 mt-1 shrink-0" />
                            <span>{trm}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                </div>
              );
            })()}


            {/* Development Recommendations */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h4 className="font-display font-bold text-slate-900 text-sm mb-3">Saran & Catatan Pengelolaan HR</h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {scoring.recommendations?.map((rec, i) => (
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
            <h3 className="font-bold text-slate-800 text-base">Belum Ada Hasil Tes Psikotes</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Kandidat ini belum menyelesaikan tes psikotes atau sedang mengerjakan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
