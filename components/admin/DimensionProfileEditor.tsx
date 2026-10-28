'use client';

import { useState } from 'react';
import type { DimensionProfiles } from '@/lib/jobFit';

const DISC = ['D', 'I', 'S', 'C'];
const BIGFIVE: Array<[string, string]> = [
  ['E', 'Ekstraversi'],
  ['A', 'Keramahan'],
  ['C', 'Kehati-hatian'],
  ['N', 'Neurotisisme (negatif = lebih rendah lebih baik)'],
  ['O', 'Keterbukaan'],
];
const PAPI = 'NGALPITVXSBORDCZEKFW'.split('');
const MSDT = ['E', 'Dv', 'Ba', 'Bu', 'Mi', 'Co', 'Au', 'Ds'];

const input = 'w-20 border border-slate-200 rounded-lg px-2 py-1 text-sm';
const chip = (on: boolean, tone = 'indigo') =>
  `px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
    on
      ? tone === 'red'
        ? 'bg-red-50 border-red-300 text-red-700'
        : 'bg-indigo-50 border-indigo-300 text-indigo-700'
      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
  }`;

/** Structured editor for dimension_profiles. The JSON tab stays available for advanced edits. */
export function DimensionProfileEditor({
  value,
  onChange,
}: {
  value: DimensionProfiles;
  onChange: (next: DimensionProfiles) => void;
}) {
  const [mode, setMode] = useState<'form' | 'json'>('form');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const ideal = value.disc?.ideal || [];
  const high = value.papi?.high || [];
  const low = value.papi?.low || [];

  const set = (patch: Partial<DimensionProfiles>) => onChange({ ...value, ...patch });
  const num = (v: string) => (v === '' ? 0 : Number(v));

  const toggleDisc = (l: string) =>
    set({ disc: { ideal: ideal.includes(l) ? ideal.filter((x) => x !== l) : [...ideal, l] } });

  const cyclePapi = (a: string) => {
    const next = { high: high.filter((x) => x !== a), low: low.filter((x) => x !== a) };
    if (!high.includes(a) && !low.includes(a)) next.high.push(a);
    else if (high.includes(a)) next.low.push(a);
    set({ papi: next });
  };

  if (mode === 'json') {
    return (
      <div className="space-y-2">
        <textarea
          className="w-full h-56 font-mono text-xs border border-slate-200 rounded-lg p-2"
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            try {
              onChange(JSON.parse(e.target.value));
              setJsonError(null);
            } catch {
              setJsonError('JSON belum valid, perubahan belum diterapkan.');
            }
          }}
        />
        {jsonError && <p className="text-xs text-red-600">{jsonError}</p>}
        <button type="button" className="text-xs font-bold text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-600" onClick={() => setMode('form')}>
          Kembali ke form
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-sm">
      <section>
        <h4 className="font-bold text-slate-800 mb-1">WPT: rentang IQ untuk skor 0-100</h4>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Batas bawah</label>
          <input type="number" className={input} value={value.wpt?.floor ?? 60} onChange={(e) => set({ wpt: { ...value.wpt, floor: num(e.target.value) } })} />
          <label className="text-xs text-slate-500">Batas atas</label>
          <input type="number" className={input} value={value.wpt?.ceil ?? 120} onChange={(e) => set({ wpt: { ...value.wpt, ceil: num(e.target.value) } })} />
        </div>
      </section>

      <section>
        <h4 className="font-bold text-slate-800 mb-1">DISC: huruf ideal (urutan klik = prioritas)</h4>
        <div className="flex flex-wrap gap-2 items-center">
          {DISC.map((l) => (
            <button type="button" key={l} className={chip(ideal.includes(l))} onClick={() => toggleDisc(l)}>
              {l}
              {ideal.includes(l) ? ` (${ideal.indexOf(l) + 1})` : ''}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h4 className="font-bold text-slate-800 mb-1">Big Five: bobot dimensi (-1 sampai 1)</h4>
        <div className="grid sm:grid-cols-2 gap-2">
          {BIGFIVE.map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="number"
                step="0.05"
                min={-1}
                max={1}
                className={input}
                value={value.bigfive?.[k as 'E'] ?? 0}
                onChange={(e) => set({ bigfive: { ...value.bigfive, [k]: num(e.target.value) } })}
              />
              <span>
                <b>{k}</b> {label}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h4 className="font-bold text-slate-800 mb-1">PAPI Kostick: klik aspek untuk memilih Tinggi lalu Rendah lalu kosong</h4>
        <div className="flex flex-wrap gap-1.5">
          {PAPI.map((a) => (
            <button
              type="button"
              key={a}
              className={chip(high.includes(a) || low.includes(a), low.includes(a) ? 'red' : 'indigo')}
              onClick={() => cyclePapi(a)}
              title={high.includes(a) ? 'Tinggi lebih baik' : low.includes(a) ? 'Rendah lebih baik' : 'Tidak dihitung'}
            >
              {a}
              {high.includes(a) ? ' ↑' : low.includes(a) ? ' ↓' : ''}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h4 className="font-bold text-slate-800 mb-1">MSDT: nilai kecocokan tiap tipe (0-100)</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MSDT.map((k) => (
            <label key={k} className="flex items-center gap-2 text-xs text-slate-600">
              <b className="w-6">{k}</b>
              <input
                type="number"
                min={0}
                max={100}
                className={input}
                value={value.msdt?.[k] ?? 0}
                onChange={(e) => set({ msdt: { ...value.msdt, [k]: num(e.target.value) } })}
              />
            </label>
          ))}
        </div>
      </section>

      <button
        type="button"
        className="text-xs font-bold text-slate-500 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-600"
        onClick={() => {
          setJsonText(JSON.stringify(value, null, 2));
          setJsonError(null);
          setMode('json');
        }}
      >
        Edit sebagai JSON (lanjutan)
      </button>
    </div>
  );
}
