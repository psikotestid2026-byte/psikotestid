'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Download, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { JobFitAdminData } from '@/lib/jobFitAdmin';

const TESTS = ['wpt', 'disc', 'bigfive', 'papi', 'msdt'] as const;
const fetcher = (url: string) => fetch(url).then((r) => r.json());

async function callApi(url: string, method: string, body: unknown) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) throw new Error(json.error || 'Permintaan gagal.');
  return json;
}

export default function JobFitClient({ initialData }: { initialData: JobFitAdminData }) {
  const { data, mutate } = useSWR<JobFitAdminData>('/api/admin/job-fit', fetcher, {
    fallbackData: initialData,
    refreshInterval: 10000,
  });
  const d = data || initialData;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Asesmen Jabatan</h1>
        <p className="text-sm text-slate-500">Monitoring penilaian, profil level jabatan, dan pemetaan jabatan.</p>
      </div>
      <ScoringSection data={d} onChanged={() => mutate()} />
      <ProfilesSection data={d} onChanged={() => mutate()} />
      <MappingsSection data={d} onChanged={() => mutate()} />
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
    dims: JSON.stringify(profile.dimension_profiles, null, 2),
  }));
  const [saving, setSaving] = useState(false);
  const total = TESTS.reduce((s, t) => s + (Number(form.weights[t]) || 0), 0);

  const save = async () => {
    let dims: unknown;
    try {
      dims = JSON.parse(form.dims);
    } catch {
      toast.error('Profil dimensi bukan JSON yang valid.');
      return;
    }
    setSaving(true);
    try {
      await callApi('/api/admin/job-fit/profiles', 'PUT', {
        level_code: profile.level_code,
        level_name: form.level_name,
        weights: Object.fromEntries(TESTS.map((t) => [t, form.weights[t] / 100])),
        min_scores: form.min_scores,
        threshold_recommended: form.threshold_recommended,
        threshold_considered: form.threshold_considered,
        dimension_profiles: dims,
        is_active: form.is_active,
      });
      toast.success(`Profil ${profile.level_code} tersimpan.`);
      onChanged();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const numInput = (value: number, onChange: (n: number) => void) => (
    <input
      type="number"
      className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-sm"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );

  return (
    <details className="border border-slate-100 rounded-xl">
      <summary className="cursor-pointer px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-slate-900">
          {profile.level_code} <span className="font-normal text-slate-500">- {profile.level_name}</span>
        </span>
        <Badge variant={form.is_active ? 'success' : 'default'}>{form.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
      </summary>
      <div className="p-4 space-y-4 border-t border-slate-100">
        <input
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          value={form.level_name}
          onChange={(e) => setForm({ ...form, level_name: e.target.value })}
          placeholder="Nama level"
        />
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
        <p className={`text-xs ${Math.abs(total - 100) > 1 ? 'text-red-600' : 'text-slate-500'}`}>Total bobot: {total}% (harus 100%)</p>
        <div className="flex flex-wrap gap-4 text-sm items-center">
          <label className="flex items-center gap-2">
            Ambang Direkomendasikan {numInput(form.threshold_recommended, (n) => setForm({ ...form, threshold_recommended: n }))}
          </label>
          <label className="flex items-center gap-2">
            Ambang Dipertimbangkan {numInput(form.threshold_considered, (n) => setForm({ ...form, threshold_considered: n }))}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Aktif
          </label>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Profil dimensi ideal (JSON)</p>
          <textarea
            className="w-full h-48 font-mono text-xs border border-slate-200 rounded-lg p-2"
            value={form.dims}
            onChange={(e) => setForm({ ...form, dims: e.target.value })}
          />
        </div>
        <Button size="sm" onClick={save} disabled={saving} icon={<Save className="w-4 h-4" />}>
          {saving ? 'Menyimpan...' : 'Simpan Profil'}
        </Button>
      </div>
    </details>
  );
}

function ProfilesSection({ data, onChanged }: { data: JobFitAdminData; onChanged: () => void }) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
      <h2 className="font-bold text-slate-900">Profil Level Jabatan</h2>
      <p className="text-xs text-slate-500">Perubahan berlaku untuk penilaian berikutnya. Gunakan "Hitung Ulang Semua" untuk menerapkan ke peserta yang sudah selesai.</p>
      {data.profiles.map((p: any) => (
        <ProfileRow key={`${p.id}-${p.updated_at}`} profile={p} onChanged={onChanged} />
      ))}
    </section>
  );
}

function MappingsSection({ data, onChanged }: { data: JobFitAdminData; onChanged: () => void }) {
  const [form, setForm] = useState({ jabatan_keyword: '', match_mode: 'PREFIX', level_code: data.profiles[0]?.level_code || 'STAF', priority: 50 });

  const submit = async () => {
    try {
      await callApi('/api/admin/job-fit/mappings', 'POST', form);
      toast.success('Pemetaan tersimpan.');
      setForm({ ...form, jabatan_keyword: '' });
      onChanged();
    } catch (e: any) {
      toast.error(e.message);
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

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
      <h2 className="font-bold text-slate-900">Pemetaan Jabatan ke Level</h2>
      <p className="text-xs text-slate-500">Prioritas lebih kecil dicek lebih dulu. Kata kunci yang lebih panjang menang pada prioritas yang sama.</p>
      <div className="flex flex-wrap gap-2 items-center">
        <input
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
          placeholder="Kata kunci jabatan, mis. KOORDINATOR"
          value={form.jabatan_keyword}
          onChange={(e) => setForm({ ...form, jabatan_keyword: e.target.value })}
        />
        <select className="border border-slate-200 rounded-lg px-2 py-2 text-sm" value={form.match_mode} onChange={(e) => setForm({ ...form, match_mode: e.target.value })}>
          <option value="PREFIX">Diawali</option>
          <option value="CONTAINS">Mengandung</option>
        </select>
        <select className="border border-slate-200 rounded-lg px-2 py-2 text-sm" value={form.level_code} onChange={(e) => setForm({ ...form, level_code: e.target.value })}>
          {data.profiles.map((p: any) => (
            <option key={p.level_code} value={p.level_code}>{p.level_code}</option>
          ))}
        </select>
        <input
          type="number"
          className="w-20 border border-slate-200 rounded-lg px-2 py-2 text-sm"
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
        />
        <Button size="sm" onClick={submit} disabled={!form.jabatan_keyword.trim()}>Tambah</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b">
              <th className="py-2 pr-2">No</th>
              <th className="pr-2">Kata Kunci</th>
              <th className="pr-2">Mode</th>
              <th className="pr-2">Level</th>
              <th className="pr-2">Prioritas</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.mappings.map((m: any, i: number) => (
              <tr key={m.id} className="border-b border-slate-50">
                <td className="py-1.5 pr-2">{i + 1}</td>
                <td className="pr-2 font-medium">{m.jabatan_keyword}</td>
                <td className="pr-2">{m.match_mode === 'PREFIX' ? 'Diawali' : 'Mengandung'}</td>
                <td className="pr-2">{m.level_code}</td>
                <td className="pr-2">{m.priority}</td>
                <td>
                  <button onClick={() => toggle(m)}>
                    <Badge variant={m.is_active ? 'success' : 'default'}>{m.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
