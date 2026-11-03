'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { ActionPillLink } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RecommendationBadge } from '@/components/ui/RecommendationBadge';
import {
  PieChart as PieIcon,
  Layers,
  Award,
  Users,
  FileDown,
  AlertTriangle,
  Loader2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface CampaignStatsTabProps {
  campaignId: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal memuat statistik asesmen');
  return res.json();
};

const RECOMMENDATION_COLORS: Record<string, string> = {
  Direkomendasikan: '#10b981', // emerald-500
  Dipertimbangkan: '#f59e0b', // amber-500
  'Tidak Direkomendasikan': '#ef4444', // red-500
  'Belum Selesai': '#94a3b8', // slate-400
};

export function CampaignStatsTab({ campaignId }: CampaignStatsTabProps) {
  const { data, isLoading } = useSWR(
    `/api/client/campaigns/${campaignId}/stats`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  const [selectedUnit, setSelectedUnit] = useState<any | null>(null);

  if (isLoading && !data) {
    return (
      <Card className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold">Menghitung visualisasi statistik asesmen...</p>
      </Card>
    );
  }

  const summary = data?.summary || {};
  const unitStats: any[] = data?.unitStats || [];
  const jobLevelStats = data?.jobLevelStats || [];
  const avgScores = data?.avgScores || {};

  // Data Pie Chart Status Rekomendasi
  const pieData = [
    { name: 'Direkomendasikan', value: Number(summary.direkomendasikan || 0), color: RECOMMENDATION_COLORS['Direkomendasikan'] },
    { name: 'Dipertimbangkan', value: Number(summary.dipertimbangkan || 0), color: RECOMMENDATION_COLORS['Dipertimbangkan'] },
    { name: 'Tidak Direkomendasikan', value: Number(summary.tidak_direkomendasikan || 0), color: RECOMMENDATION_COLORS['Tidak Direkomendasikan'] },
    { name: 'Belum Selesai', value: Number(summary.belum || 0), color: RECOMMENDATION_COLORS['Belum Selesai'] },
  ].filter((item) => item.value > 0);

  const handleBarClick = (entry: any) => {
    if (entry && (entry.unit || entry.activePayload?.[0]?.payload?.unit)) {
      const clickedUnitName = entry.unit || entry.activePayload[0].payload.unit;
      const found = unitStats.find((u) => u.unit === clickedUnitName);
      if (found) setSelectedUnit(found);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header: Download PDF */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="font-display font-bold text-sm text-slate-900">
            Ringkasan Statistik & Grafik Evaluasi
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualisasi analisis hasil psikotes dan pemetaan kompetensi karyawan sesi ini.
          </p>
        </div>

        <ActionPillLink
          href={`/api/client/campaigns/${campaignId}/stats/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 self-start sm:self-auto shadow-sm"
          icon={<FileDown className="w-3.5 h-3.5" />}
        >
          Unduh PDF Statistik
        </ActionPillLink>
      </div>

      {/* Verification Notice Banner */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-bold text-amber-950">Data ini belum divalidasi secara manual.</strong> Nilai dan status rekomendasi bersifat sementara dan dapat berubah setelah proses verifikasi oleh tim HR.
        </p>
      </div>

      {/* KPI Highlight Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rata-Rata Skor</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {avgScores.avg_overall ? `${avgScores.avg_overall}` : '-'}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Skor gabungan rekomendasi (skala 100)</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tingkat Rekomendasi</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">
            {summary.total > 0
              ? `${Math.round(((Number(summary.direkomendasikan || 0) + Number(summary.dipertimbangkan || 0)) / Number(summary.total)) * 100)}%`
              : '0%'}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Direkomendasikan + Dipertimbangkan</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tes Selesai Dinilai</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-blue-600">
            {summary.done ?? (Number(summary.total || 0) - Number(summary.belum || 0))}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Dari total {summary.total || 0} karyawan</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Belum Mengisi</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-700">{summary.belum ?? 0}</div>
          <p className="text-[11px] text-slate-500 font-medium">Peserta belum menyelesaikan tes</p>
        </div>
      </div>

      {/* Row 1: Pie Chart & Hasil Rekomendasi per Level Jabatan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart: Status Rekomendasi */}
        <Card className="border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-600" />
              <h4 className="font-display font-bold text-sm text-slate-900">
                Distribusi Status Rekomendasi
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Total {summary.total || 0} Karyawan
            </span>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} Orang`, name]}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Stacked Bar Chart: Status per Level Jabatan */}
        <Card className="border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h4 className="font-display font-bold text-sm text-slate-900">
                Hasil Rekomendasi per Level Jabatan
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Komparasi Level</span>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={jobLevelStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="level" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Bar dataKey="direkomendasikan" stackId="a" fill="#10b981" name="Direkomendasikan" />
                <Bar dataKey="dipertimbangkan" stackId="a" fill="#f59e0b" name="Dipertimbangkan" />
                <Bar dataKey="tidak_direkomendasikan" stackId="a" fill="#ef4444" name="Tidak Direkomendasikan" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Row 2: Unit Kerja Bar Chart with Drill Down Modal */}
      <Card className="border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h4 className="font-display font-bold text-sm text-slate-900">
              Distribusi Rekomendasi per Unit Kerja (Top 12 Terbanyak)
            </h4>
          </div>
          <span className="text-[11px] text-indigo-600 font-medium bg-indigo-50 px-2.5 py-1 rounded-lg">
            💡 Klik bar / nama unit kerja untuk melihat daftar orangnya
          </span>
        </div>

        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={unitStats}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 80, bottom: 10 }}
              onClick={handleBarClick}
              className="cursor-pointer"
            >
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis
                dataKey="unit"
                type="category"
                tick={{ fill: '#334155', fontSize: 10, fontWeight: 600 }}
                width={120}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', fontSize: '12px' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey="direkomendasikan" stackId="a" fill="#10b981" name="Direkomendasikan" />
              <Bar dataKey="dipertimbangkan" stackId="a" fill="#f59e0b" name="Dipertimbangkan" />
              <Bar dataKey="tidak_direkomendasikan" stackId="a" fill="#ef4444" name="Tidak Rekomendasi" />
              <Bar dataKey="belum" stackId="a" fill="#cbd5e1" name="Belum Selesai" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Click Badges per Unit */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 mr-1">Pilih Detail Unit:</span>
          {unitStats.map((u) => (
            <button
              key={u.unit}
              type="button"
              onClick={() => setSelectedUnit(u)}
              className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-700 font-medium transition-colors border border-slate-200 flex items-center gap-1"
            >
              <span>{u.unit}</span>
              <span className="text-[10px] bg-white px-1.5 py-0.2 rounded font-bold text-slate-600 border border-slate-200">
                {u.total}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Modal Drill Detail Unit Kerja */}
      <Modal
        isOpen={selectedUnit !== null}
        onClose={() => setSelectedUnit(null)}
        title={`Daftar Karyawan: ${selectedUnit?.unit || ''} (${selectedUnit?.total || 0} Orang)`}
        maxWidthClassName="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-emerald-700 font-semibold">
              Direkomendasikan: <strong>{selectedUnit?.direkomendasikan || 0}</strong>
            </span>
            <span className="text-amber-700 font-semibold">
              Dipertimbangkan: <strong>{selectedUnit?.dipertimbangkan || 0}</strong>
            </span>
            <span className="text-red-700 font-semibold">
              Tidak Rekomendasi: <strong>{selectedUnit?.tidak_direkomendasikan || 0}</strong>
            </span>
            <span className="text-slate-500 font-semibold">
              Belum Selesai: <strong>{selectedUnit?.belum || 0}</strong>
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
            {(!selectedUnit?.participants || selectedUnit.participants.length === 0) ? (
              <p className="p-6 text-center text-xs text-slate-400">Tidak ada data peserta pada unit ini.</p>
            ) : (
              selectedUnit.participants.map((person: any, idx: number) => (
                <div key={person.id || idx} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 text-[11px] w-6 text-right shrink-0">{idx + 1}.</span>
                      <span className="font-bold text-slate-900 truncate">{person.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 pl-8 truncate">{person.position || '-'}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {person.score ? (
                      <span className="font-mono text-xs font-extrabold text-slate-700">
                        {person.score}
                      </span>
                    ) : null}
                    <RecommendationBadge status={person.status} />
                    <ActionPillLink
                      href={`/clients/participants/${person.id}`}
                      target="_blank"
                      size="sm"
                      variant="ghost"
                      className="text-indigo-600 hover:text-indigo-700 p-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </ActionPillLink>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
