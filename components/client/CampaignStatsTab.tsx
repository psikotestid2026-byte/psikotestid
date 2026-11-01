'use client';

import React from 'react';
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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import {
  PieChart as PieIcon,
  BarChart3,
  Radar as RadarIcon,
  Activity,
  Layers,
  Award,
  Users,
  Loader2,
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

  if (isLoading && !data) {
    return (
      <Card className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold">Menghitung visualisasi statistik asesmen...</p>
      </Card>
    );
  }

  const summary = data?.summary || {};
  const unitStats = data?.unitStats || [];
  const jobLevelStats = data?.jobLevelStats || [];
  const avgScores = data?.avgScores || {};
  const scoreDistribution = data?.scoreDistribution || [];

  // 1. Data Pie Chart Status Rekomendasi
  const pieData = [
    { name: 'Direkomendasikan', value: Number(summary.direkomendasikan || 0), color: RECOMMENDATION_COLORS['Direkomendasikan'] },
    { name: 'Dipertimbangkan', value: Number(summary.dipertimbangkan || 0), color: RECOMMENDATION_COLORS['Dipertimbangkan'] },
    { name: 'Tidak Direkomendasikan', value: Number(summary.tidak_direkomendasikan || 0), color: RECOMMENDATION_COLORS['Tidak Direkomendasikan'] },
    { name: 'Belum Selesai', value: Number(summary.belum || 0), color: RECOMMENDATION_COLORS['Belum Selesai'] },
  ].filter((item) => item.value > 0);

  // 2. Data Radar Rata-Rata Alat Tes
  const radarData = [
    { subject: 'WPT (Logika/Kognitif)', score: Number(avgScores.avg_wpt || 0), fullMark: 100 },
    { subject: 'DISC (Kepribadian)', score: Number(avgScores.avg_disc || 0), fullMark: 100 },
    { subject: 'Big Five (Karakter)', score: Number(avgScores.avg_bigfive || 0), fullMark: 100 },
    { subject: 'PAPI (Gaya Kerja)', score: Number(avgScores.avg_papi || 0), fullMark: 100 },
    { subject: 'MSDT (Gaya Manajerial)', score: Number(avgScores.avg_msdt || 0), fullMark: 100 },
  ];

  return (
    <div className="space-y-6">
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
            <Activity className="w-4 h-4 text-blue-600" />
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

      {/* Row 1: Pie Chart & Radar Chart */}
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

        {/* Radar Chart: Average Test Scores */}
        <Card className="border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <RadarIcon className="w-4 h-4 text-indigo-600" />
              <h4 className="font-display font-bold text-sm text-slate-900">
                Profil Rata-Rata per Alat Tes
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Skala 0 - 100
            </span>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius={90}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" />
                <Radar
                  name="Rata-rata Skor"
                  dataKey="score"
                  stroke="#4f46e5"
                  fill="#6366f1"
                  fillOpacity={0.45}
                />
                <Tooltip
                  formatter={(val: any) => [`${val} Poin`, 'Rata-Rata']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', fontSize: '12px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Row 2: Bar Chart - Distribusi Skor & Status per Level Jabatan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Sebaran Rentang Skor */}
        <Card className="border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <h4 className="font-display font-bold text-sm text-slate-900">
                Sebaran Rentang Nilai Rekomendasi
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Jumlah Peserta</span>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="bucket" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} Orang`, 'Jumlah Karyawan']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Jumlah Peserta" />
              </BarChart>
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

      {/* Row 3: Unit Kerja Bar Chart */}
      <Card className="border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h4 className="font-display font-bold text-sm text-slate-900">
              Distribusi Rekomendasi per Unit Kerja (Top 12 Terbanyak)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Berdasarkan Unit Penempatan</span>
        </div>

        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={unitStats}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 80, bottom: 10 }}
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
      </Card>
    </div>
  );
}

