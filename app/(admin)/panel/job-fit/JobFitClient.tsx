'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Download, Plus, RefreshCw, Save, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Pagination';
import { DimensionProfileEditor } from '@/components/admin/DimensionProfileEditor';
import type { DimensionProfiles } from '@/lib/jobFit';
import type { JobFitAdminData } from '@/lib/jobFitAdmin';

const TESTS = ['wpt', 'disc', 'bigfive', 'papi', 'msdt'] as const;
const fetcher = (url: string) => fetch(url).then((r) => r.json());
const inputCls = 'border border-slate-200 rounded-lg px-3 py-2 text-sm';

async function callApi(url: string, method: string, body: unknown) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) throw new Error(json.error || 'Permintaan gagal.');
  return json;
}

type TabId = 'monitoring' | 'levels' | 'mappings';

export default function JobFitClient({ initialData }: { initialData: JobFitAdminData }) {
  const { data, mutate } = useSWR<JobFitAdminData>('/api/admin/job-fit', fetcher, {
    fallbackData: initialData,
    refreshInterval: 10000,
  });
  const d = data && Array.isArray((data as any).profiles) ? data : initialData;
  const [tab, setTab] = useState<TabId>('monitoring');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Asesmen Jabatan</h1>
        <p className="text-sm text-slate-500">Monitoring penilaian, level jabatan, dan pemetaan jabatan ke level.</p>
      </div>
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'monitoring', label: 'Monitoring & Kredensial' },
          { id: 'levels', label: `Level Jabatan (${d.profiles.length})` },
          { id: 'mappings', label: `Pemetaan Jabatan (${d.mappings.length})` },
        ]}
      />
      {tab === 'monitoring' && <ScoringSection data={d} onChanged={() => mutate()} />}
      {tab === 'levels' && <LevelsSection data={d} onChanged={() => mutate()} />}
      {tab === 'mappings' && <MappingsSection data={d} onChanged={() => mutate()} />}
    </div>
  );
}

function ScoringSection({ data, onChanged }: { data: JobFitAdminData; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, body: Record<string, unknown>) => {
    setBusy(key);
    try {
      const res = await callApi('/api/admin/job-fit/scoring', 'POST', body);
      toast.success(`Selesai: ${res.succeeded} berhasil, ${res.failed} gagal dari ${res.processed} peserta.`);
      onChanged();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const countFor = (campaignId: string, status: string) =>
    data.statusCounts.find((c: any) => c.campaign_id === campaignId && c.scoring_status === status)?.total ?? 0;

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <h2 className="font-bold text-slate-900">Monitoring Penilaian & Kredensial</h2>
      {data.campaigns.length === 0 && <p className="text-sm text-slate-500">Belum ada kampanye paket wajib.</p>}
      {data.campaigns.map((c: any) => (
        <div key={c.id} className="border border-slate-100 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900">{c.title}</p>
            <p className="text-xs text-slate-500">{c.company_name}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="success">Selesai {countFor(c.id, 'DONE')}</Badge>
              <Badge variant="info">Diproses {countFor(c.id, 'PROCESSING')}</Badge>
              <Badge variant="danger">Gagal {countFor(c.id, 'FAILED')}</Badge>
              <Badge>Menunggu {countFor(c.id, 'PENDING')}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`/api/client/campaigns/${c.id}/participants/credentials`}>
              <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>Excel Username & Password</Button>
            </a>
            <Button
              variant="outline"
              size="sm"
              disabled={busy !== null}
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={() => run(`f-${c.id}`, { campaign_id: c.id, scope: 'FAILED' })}
            >
              Ulangi yang Gagal
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy !== null}
              onClick={() => {
                if (confirm('Hitung ulang skor seluruh peserta yang sudah selesai? Override asesor tetap dipertahankan.')) {
                  run(`a-${c.id}`, { campaign_id: c.id, scope: 'ALL' });
                }
              }}
            >
              Hitung Ulang Semua
            </Button>
          </div>
        </div>
      ))}

      {data.failed.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b">
                <th className="py-2 pr-2">No</th>
                <th className="pr-2">Nama</th>
                <th className="pr-2">Jabatan</th>
                <th className="pr-2">Penyebab</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.failed.map((p: any, i: number) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="py-2 pr-2">{i + 1}</td>
                  <td className="pr-2 font-medium">{p.full_name}</td>
                  <td className="pr-2 text-slate-600">{p.position}</td>
                  <td className="pr-2 text-red-600 text-xs">{p.scoring_error}</td>
                  <td className="text-right">
                    <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => run(`p-${p.id}`, { participant_id: p.id })}>
                      Ulangi
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ProfileRow({ profile, onChanged }: { profile: any; onChanged: () => void }) {
  const [form, setForm] = useState(() => ({
    level_name: profile.level_name as string,
    weights: Object.fromEntries(TESTS.map((t) => [t, Math.round(Number(profile[`weight_${t}`]) * 100)])) as Record<string, number>,
    min_scores: Object.fromEntries(TESTS.map((t) => [t, Number(profile[`min_score_${t}`])])) as Record<string, number>,
    threshold_recommended: Number(profile.threshold_recommended),
    threshold_considered: Number(profile.threshold_considered),
    is_active: Boolean(profile.is_active),
    dims: (profile.dimension_profiles || {}) as DimensionProfiles,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = TESTS.reduce((s, t) => s + (Number(form.weights[t]) || 0), 0);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await callApi('/api/admin/job-fit/profiles', 'PUT', {
        level_code: profile.level_code,
        level_name: form.level_name,
        weights: Object.fromEntries(TESTS.map((t) => [t, form.weights[t] / 100])),
        min_scores: form.min_scores,
        threshold_recommended: form.threshold_recommended,
        threshold_considered: form.threshold_considered,
        dimension_profiles: form.dims,
        is_active: form.is_active,
      });
      toast.success(`Level ${profile.level_code} tersimpan.`);
      onChanged();
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const numInput = (value: number, onChange: (n: number) => void) => (
    <input type="number" className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-sm" value={value} onChange={(e) => onChange(Number(e.target.value))} />
  );

  return (
    <details className="border border-slate-200 rounded-xl bg-white">
      <summary className="cursor-pointer px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-slate-900">
          {profile.level_code} <span className="font-normal text-slate-500">- {profile.level_name}</span>
        </span>
        <Badge variant={form.is_active ? 'success' : 'default'}>{form.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
      </summary>
      <div className="p-4 space-y-5 border-t border-slate-100">
        <label className="block text-xs font-bold text-slate-500 uppercase">
          Nama level
          <input className={`${inputCls} w-full mt-1 font-normal normal-case`} value={form.level_name} onChange={(e) => setForm({ ...form, level_name: e.target.value })} />
        </label>

        <table className="text-sm">
          <thead>
            <tr className="text-xs text-slate-500 text-left">
              <th className="pr-4">Instrumen</th>
              <th className="pr-4">Bobot (%)</th>
              <th>Skor Minimum</th>
            </tr>
          </thead>
          <tbody>
            {TESTS.map((t) => (
              <tr key={t}>
                <td className="pr-4 py-1 font-medium uppercase">{t}</td>
                <td className="pr-4">{numInput(form.weights[t], (n) => setForm({ ...form, weights: { ...form.weights, [t]: n } }))}</td>
                <td>{numInput(form.min_scores[t], (n) => setForm({ ...form, min_scores: { ...form.min_scores, [t]: n } }))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={`text-xs ${Math.abs(total - 100) > 1 ? 'text-red-600 font-bold' : 'text-slate-500'}`}>Total bobot: {total}% (harus 100%)</p>

        <div className="flex flex-wrap gap-4 text-sm items-center">
          <label className="flex items-center gap-2">Ambang Direkomendasikan {numInput(form.threshold_recommended, (n) => setForm({ ...form, threshold_recommended: n }))}</label>
          <label className="flex items-center gap-2">Ambang Dipertimbangkan {numInput(form.threshold_considered, (n) => setForm({ ...form, threshold_considered: n }))}</label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Aktif
          </label>
        </div>
        {form.threshold_considered >= form.threshold_recommended && (
          <p className="text-xs text-red-600 font-bold">Ambang Direkomendasikan harus lebih besar dari ambang Dipertimbangkan.</p>
        )}

        <div>
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Profil ideal per instrumen</p>
          <DimensionProfileEditor value={form.dims} onChange={(dims) => setForm({ ...form, dims })} />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        <Button size="sm" onClick={save} disabled={saving} icon={<Save className="w-4 h-4" />}>
          {saving ? 'Menyimpan...' : 'Simpan Level'}
        </Button>
      </div>
    </details>
  );
}

function LevelsSection({ data, onChanged }: { data: JobFitAdminData; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ level_code: '', level_name: '', copy_from: 'STAF' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setSaving(true);
    setError(null);
    try {
      await callApi('/api/admin/job-fit/profiles', 'POST', {
        ...form,
        level_code: form.level_code.trim().toUpperCase().replace(/\s+/g, '_'),
      });
      toast.success('Level baru dibuat. Atur bobot dan profilnya, lalu tambahkan pemetaan jabatan.');
      setOpen(false);
      setForm({ level_code: '', level_name: '', copy_from: 'STAF' });
      onChanged();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500 max-w-2xl">
          Perubahan berlaku untuk penilaian berikutnya. Gunakan "Hitung Ulang Semua" di tab Monitoring untuk menerapkan ke peserta yang sudah selesai. Level tidak
          dihapus, hanya dinonaktifkan.
        </p>
        <Button size="sm" onClick={() => setOpen(true)} icon={<Plus className="w-4 h-4" />}>Tambah Level</Button>
      </div>
      {data.profiles.map((p: any) => (
        <ProfileRow key={`${p.id}-${p.updated_at}`} profile={p} onChanged={onChanged} />
      ))}

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Tambah Level Jabatan">
        <div className="space-y-3 text-sm">
          <label className="block text-xs font-bold text-slate-500 uppercase">
            Kode level
            <input className={`${inputCls} w-full mt-1 font-normal`} placeholder="mis. KOORDINATOR" value={form.level_code} onChange={(e) => setForm({ ...form, level_code: e.target.value })} />
          </label>
          <label className="block text-xs font-bold text-slate-500 uppercase">
            Nama level
            <input className={`${inputCls} w-full mt-1 font-normal`} placeholder="mis. Koordinator Program" value={form.level_name} onChange={(e) => setForm({ ...form, level_name: e.target.value })} />
          </label>
          <label className="block text-xs font-bold text-slate-500 uppercase">
            Salin bobot dan profil dari
            <select className={`${inputCls} w-full mt-1 font-normal`} value={form.copy_from} onChange={(e) => setForm({ ...form, copy_from: e.target.value })}>
              {data.profiles.map((p: any) => (
                <option key={p.level_code} value={p.level_code}>{p.level_code} - {p.level_name}</option>
              ))}
            </select>
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Batal</Button>
            <Button size="sm" onClick={create} disabled={saving || !form.level_code.trim() || !form.level_name.trim()}>
              {saving ? 'Membuat...' : 'Buat Level'}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

type MappingForm = { id?: string; jabatan_keyword: string; match_mode: string; level_code: string; priority: number };

function MappingsSection({ data, onChanged }: { data: JobFitAdminData; onChanged: () => void }) {
  const activeLevels = data.profiles.filter((p: any) => p.is_active);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [editing, setEditing] = useState<MappingForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [probe, setProbe] = useState('');
  const [probeResult, setProbeResult] = useState<any>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    return data.mappings.filter(
      (m: any) => (!q || m.jabatan_keyword.includes(q)) && (!levelFilter || m.level_code === levelFilter)
    );
  }, [data.mappings, search, levelFilter]);
  const pageRows = filtered.slice((page - 1) * limit, page * limit);

  const startNew = () => {
    setError(null);
    setEditing({ jabatan_keyword: '', match_mode: 'PREFIX', level_code: activeLevels[0]?.level_code || 'STAF', priority: 50 });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      if (editing.id) await callApi('/api/admin/job-fit/mappings', 'PATCH', editing);
      else await callApi('/api/admin/job-fit/mappings', 'POST', editing);
      toast.success('Pemetaan tersimpan.');
      setEditing(null);
      onChanged();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (m: any) => {
    try {
      await callApi('/api/admin/job-fit/mappings', 'PATCH', { id: m.id, is_active: !m.is_active });
      onChanged();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const runProbe = async () => {
    try {
      const res = await fetch(`/api/admin/job-fit/resolve?position=${encodeURIComponent(probe)}`);
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error || 'Gagal menguji jabatan.');
      setProbeResult(json);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <section className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
        <h3 className="font-bold text-slate-900 text-sm">Uji Jabatan</h3>
        <p className="text-xs text-slate-500">Ketik nama jabatan untuk melihat level dan kata kunci yang akan dipakai.</p>
        <div className="flex flex-wrap gap-2">
          <input className={`${inputCls} flex-1 min-w-[240px]`} placeholder="mis. HEAD OF DESIGN, PLANNING AND CONTROL" value={probe} onChange={(e) => setProbe(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runProbe()} />
          <Button size="sm" variant="outline" onClick={runProbe} disabled={!probe.trim()}>Uji</Button>
        </div>
        {probeResult && (
          <p className="text-sm">
            Level: <b>{probeResult.level_code}</b>{' '}
            <span className="text-slate-500">
              {probeResult.matched
                ? `(cocok dengan "${probeResult.matched.jabatan_keyword}", mode ${probeResult.matched.match_mode === 'PREFIX' ? 'Diawali' : 'Mengandung'})`
                : '(tidak ada kata kunci cocok, memakai level bawaan)'}
            </span>
          </p>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-4 flex flex-wrap items-center gap-2 border-b border-slate-100">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input className={`${inputCls} w-full pl-9`} placeholder="Cari kata kunci jabatan" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className={inputCls} value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}>
            <option value="">Semua level</option>
            {data.profiles.map((p: any) => (
              <option key={p.level_code} value={p.level_code}>{p.level_code}</option>
            ))}
          </select>
          <Button size="sm" onClick={startNew} icon={<Plus className="w-4 h-4" />}>Tambah Pemetaan</Button>
        </div>
        <p className="px-4 py-2 text-xs text-slate-500">Prioritas lebih kecil dicek lebih dulu. Pada prioritas yang sama, kata kunci yang lebih panjang menang.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 bg-slate-50 border-y border-slate-100">
                <th className="py-2 px-4">No</th>
                <th className="px-2">Kata Kunci</th>
                <th className="px-2">Mode</th>
                <th className="px-2">Level</th>
                <th className="px-2">Prioritas</th>
                <th className="px-2">Status</th>
                <th className="px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400 text-sm">Tidak ada pemetaan yang cocok.</td></tr>
              )}
              {pageRows.map((m: any, i: number) => (
                <tr key={m.id} className="border-b border-slate-50">
                  <td className="py-2 px-4 text-slate-400 font-mono">{(page - 1) * limit + i + 1}</td>
                  <td className="px-2 font-medium">{m.jabatan_keyword}</td>
                  <td className="px-2">{m.match_mode === 'PREFIX' ? 'Diawali' : 'Mengandung'}</td>
                  <td className="px-2">{m.level_code}</td>
                  <td className="px-2">{m.priority}</td>
                  <td className="px-2"><Badge variant={m.is_active ? 'success' : 'default'}>{m.is_active ? 'Aktif' : 'Nonaktif'}</Badge></td>
                  <td className="px-4 text-right whitespace-nowrap">
                    <Button type="button" size="sm" variant="outline" className="mr-2" onClick={() => { setError(null); setEditing({ id: m.id, jabatan_keyword: m.jabatan_keyword, match_mode: m.match_mode, level_code: m.level_code, priority: Number(m.priority) }); }}>Edit</Button>
                    <Button type="button" size="sm" variant={m.is_active ? 'danger' : 'outline'} onClick={() => toggle(m)}>{m.is_active ? 'Nonaktifkan' : 'Aktifkan'}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} limit={limit} total={filtered.length} itemLabel="pemetaan" onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }} />
      </div>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Pemetaan' : 'Tambah Pemetaan'}>
        {editing && (
          <div className="space-y-3 text-sm">
            <label className="block text-xs font-bold text-slate-500 uppercase">
              Kata kunci jabatan
              <input className={`${inputCls} w-full mt-1 font-normal`} value={editing.jabatan_keyword} onChange={(e) => setEditing({ ...editing, jabatan_keyword: e.target.value })} placeholder="mis. KOORDINATOR" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-bold text-slate-500 uppercase">
                Mode
                <select className={`${inputCls} w-full mt-1 font-normal`} value={editing.match_mode} onChange={(e) => setEditing({ ...editing, match_mode: e.target.value })}>
                  <option value="PREFIX">Diawali</option>
                  <option value="CONTAINS">Mengandung</option>
                </select>
              </label>
              <label className="block text-xs font-bold text-slate-500 uppercase">
                Prioritas
                <input type="number" className={`${inputCls} w-full mt-1 font-normal`} value={editing.priority} onChange={(e) => setEditing({ ...editing, priority: Number(e.target.value) })} />
              </label>
            </div>
            <label className="block text-xs font-bold text-slate-500 uppercase">
              Level
              <select className={`${inputCls} w-full mt-1 font-normal`} value={editing.level_code} onChange={(e) => setEditing({ ...editing, level_code: e.target.value })}>
                {activeLevels.map((p: any) => (
                  <option key={p.level_code} value={p.level_code}>{p.level_code} - {p.level_name}</option>
                ))}
              </select>
            </label>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Batal</Button>
              <Button size="sm" onClick={save} disabled={saving || !editing.jabatan_keyword.trim()}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
