'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  FileText,
  KeyRound,
  Loader2,
  Search,
  Upload,
  UserCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ActionPillLink, Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { RecommendationBadge } from '@/components/ui/RecommendationBadge';
import { EmployeeImportModal } from './EmployeeImportModal';
import { OverrideStatusModal } from './OverrideStatusModal';
import { ResetResultModal } from './ResetResultModal';

interface BundleCampaignViewProps {
  campaignId: number;
  campaignTitle: string;
  companyName?: string;
  selectedTests: Array<{ id: number; code: string; name: string }>;
  fallbackData: any;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal memuat data');
  return res.json();
};

const STATUS_CHIPS = [
  { key: 'ALL', label: 'Semua' },
  { key: 'DIREKOMENDASIKAN', label: 'Direkomendasikan' },
  { key: 'DIPERTIMBANGKAN', label: 'Dipertimbangkan' },
  { key: 'TIDAK_DIREKOMENDASIKAN', label: 'Tidak Direkomendasikan' },
  { key: 'PENDING', label: 'Belum Selesai' },
] as const;

const SCORE_COLUMNS = [
  { key: 'wpt', label: 'WPT' },
  { key: 'disc', label: 'DISC' },
  { key: 'bigfive', label: 'Big Five' },
  { key: 'papi', label: 'PAPI' },
  { key: 'msdt', label: 'MSDT' },
] as const;

export function BundleCampaignView({
  campaignId,
  campaignTitle,
  companyName,
  selectedTests,
  fallbackData,
}: BundleCampaignViewProps) {
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [unit, setUnit] = useState('');
  const [sort, setSort] = useState('name');
  const [dir, setDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<{ id: number; full_name: string } | 'ALL' | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<any>(null);

  // Debounce search (300ms) and reset to the first page.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sort, dir });
    if (q) params.set('q', q);
    if (status !== 'ALL') params.set('status', status);
    if (unit) params.set('unit', unit);
    return params.toString();
  }, [page, limit, sort, dir, q, status, unit]);

  const isDefaultQuery = page === 1 && limit === 10 && sort === 'name' && dir === 'asc' && !q && status === 'ALL' && !unit;

  const { data, isLoading, mutate } = useSWR(
    `/api/client/campaigns/${campaignId}/results?${queryString}`,
    fetcher,
    {
      fallbackData: isDefaultQuery ? fallbackData : undefined,
      keepPreviousData: true,
      revalidateOnFocus: false,
      // Live progress while scoring is still running for some participants.
      refreshInterval: (latest) => (latest?.summary?.processing > 0 ? 5000 : 0),
    }
  );

  const rows: any[] = data?.rows || [];
  const total: number = data?.total || 0;
  const summary = data?.summary || {};
  const totalTests: number = data?.total_tests || selectedTests.length || 5;
  const units: string[] = data?.units || [];

  const toggleSort = (key: string) => {
    if (sort === key) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSort(key);
      setDir(key === 'score' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  const SortHeader = ({ k, label, className = '' }: { k: string; label: string; className?: string }) => (
    <th className={`py-3 px-3 ${className}`}>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1 uppercase tracking-wider font-semibold hover:text-indigo-600"
      >
        {label}
        {sort === k ? (
          dir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </button>
    </th>
  );

  const exportUrl = `/api/client/campaigns/${campaignId}/results/export?${new URLSearchParams({
    sort,
    dir,
    ...(q ? { q } : {}),
    ...(status !== 'ALL' ? { status } : {}),
    ...(unit ? { unit } : {}),
  }).toString()}`;

  return (
    <div className="w-full space-y-6 animate-fadeUp">
      <ActionPillLink href="/clients/campaigns" size="sm" variant="outline" icon={<ArrowLeft className="w-4 h-4" />}>
        Kembali ke Daftar Campaign
      </ActionPillLink>

      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/30 text-emerald-300 px-3 py-0.5 rounded-full border border-emerald-400/30">
            Paket Wajib {selectedTests.length} Tes · CMP-{campaignId}
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{campaignTitle}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {selectedTests.map((t) => (
              <span
                key={t.id}
                className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs rounded-lg border border-indigo-400/30"
              >
                {t.code?.toUpperCase()}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            Peserta masuk lewat <span className="font-mono text-indigo-300">/clients/test/login</span> dengan username & password.
            {companyName ? ` (${companyName})` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            onClick={() => setIsImportOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl"
            icon={<Upload className="w-4 h-4" />}
          >
            Impor Karyawan
          </Button>
          <Button
            onClick={() => setResetTarget('ALL')}
            variant="danger"
            className="text-xs rounded-xl"
          >
            Reset Semua Hasil
          </Button>
          <ActionPillLink
            href={`/api/client/campaigns/${campaignId}/participants/credentials`}
            size="sm"
            variant="ghost"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
            icon={<KeyRound className="w-4 h-4 text-indigo-300" />}
          >
            Unduh Data Login Karyawan
          </ActionPillLink>
        </div>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Karyawan', value: summary.total },
          { label: 'Direkomendasikan', value: summary.direkomendasikan, tone: 'text-emerald-600' },
          { label: 'Dipertimbangkan', value: summary.dipertimbangkan, tone: 'text-amber-600' },
          { label: 'Tidak Direkomendasikan', value: summary.tidak_direkomendasikan, tone: 'text-red-600' },
          { label: 'Belum Selesai', value: summary.belum, tone: 'text-slate-500' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</div>
            <div className={`text-2xl font-extrabold ${item.tone || 'text-slate-900'}`}>{item.value ?? '-'}</div>
          </div>
        ))}
      </div>

      <Card noPadding className="overflow-hidden border border-slate-200 shadow-sm">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <h3 className="font-display font-bold text-sm text-slate-800">Rekap Hasil Asesmen Karyawan</h3>
              {(isLoading || summary.processing > 0) && (
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {summary.processing > 0 ? `${summary.processing} hasil sedang diproses` : 'Memuat'}
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari nama, jabatan, atau unit kerja..."
                  className="pl-9 w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <select
                value={unit}
                onChange={(e) => {
                  setUnit(e.target.value);
                  setPage(1);
                }}
                className="py-2 px-3 text-xs border border-slate-300 rounded-xl bg-white font-semibold"
              >
                <option value="">Semua Unit Kerja</option>
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <ActionPillLink
                href={exportUrl}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                icon={<Download className="w-3.5 h-3.5" />}
              >
                Unduh Rekap Excel
              </ActionPillLink>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUS_CHIPS.map((chip) => (
              <Button
                key={chip.key}
                type="button"
                size="sm"
                variant={status === chip.key ? 'primary' : 'outline'}
                onClick={() => {
                  setStatus(chip.key);
                  setPage(1);
                }}
              >
                {chip.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500">
                <th className="py-3 px-3 uppercase tracking-wider font-semibold w-12">No</th>
                <SortHeader k="name" label="Nama" />
                <SortHeader k="position" label="Jabatan" />
                <SortHeader k="unit" label="Unit Kerja" />
                {SCORE_COLUMNS.map((c) => (
                  <SortHeader key={c.key} k={c.key} label={c.label} className="text-center" />
                ))}
                <SortHeader k="score" label="Skor Gabungan" className="text-center" />
                <SortHeader k="status" label="Status Rekomendasi" />
                <SortHeader k="progress" label="Progres" className="text-center" />
                <th className="py-3 px-3 uppercase tracking-wider font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-slate-400">
                    {isLoading ? 'Memuat data...' : 'Tidak ada karyawan yang cocok dengan pencarian.'}
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 text-slate-400 font-mono">{(page - 1) * limit + idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-slate-900 min-w-[180px]">
                      {r.full_name}
                      {r.username && <div className="text-[10px] text-slate-400 font-mono font-normal">@{r.username}</div>}
                    </td>
                    <td className="py-3 px-3 text-slate-600 min-w-[200px]">{r.position || '-'}</td>
                    <td className="py-3 px-3 text-slate-500">{r.unit_work || '-'}</td>
                    {SCORE_COLUMNS.map((c) => (
                      <td key={c.key} className="py-3 px-3 text-center font-semibold text-slate-700">
                        {r.tests?.[c.key]?.score != null ? Number(r.tests[c.key].score).toFixed(1) : '-'}
                      </td>
                    ))}
                    <td className="py-3 px-3 text-center font-extrabold text-slate-900">
                      {r.recommendation_score != null ? Number(r.recommendation_score).toFixed(1) : '-'}
                    </td>
                    <td className="py-3 px-3">
                      <RecommendationBadge
                        status={r.recommendation_status}
                        scoringStatus={r.scoring_status}
                        overridden={r.assessor_override}
                      />
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">
                      {r.tests_done}/{r.tests_required ?? totalTests}
                      {r.tests_done >= (r.tests_required ?? totalTests) ? ' ✓' : ''}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {r.tests_done >= (r.tests_required ?? totalTests) && r.scoring_status === 'DONE' && (
                        <ActionPillLink
                          href={`/api/reports/participant/${r.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="sm"
                          variant="secondary"
                          className="mr-2"
                          icon={<FileText className="w-3.5 h-3.5" />}
                        >
                          PDF
                        </ActionPillLink>
                      )}
                      {(r.tests_done > 0 || r.status === 'COMPLETED') && (
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          className="mr-2"
                          onClick={() => setResetTarget({ id: Number(r.id), full_name: r.full_name })}
                        >
                          Reset
                        </Button>
                      )}
                      {r.system_recommendation_status && (
                        <Button type="button" size="sm" variant="outline" onClick={() => setOverrideTarget(r)}>
                          Override
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={(p) => setPage(Math.max(1, p))}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      </Card>

      <EmployeeImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        campaignId={campaignId}
        campaignTitle={campaignTitle}
        onSuccess={() => mutate()}
      />
      <ResetResultModal
        isOpen={resetTarget !== null}
        onClose={() => setResetTarget(null)}
        campaignId={campaignId}
        target={resetTarget}
        onDone={() => mutate()}
      />
      <OverrideStatusModal
        isOpen={!!overrideTarget}
        onClose={() => setOverrideTarget(null)}
        campaignId={campaignId}
        participant={overrideTarget}
        onSaved={() => mutate()}
      />
    </div>
  );
}
