/**
 * View-model for the theaim.id participant report (v3).
 * Formatting and narrative selection only. Narratives are copied from the
 * scoring dictionaries already on the platform; this module does not author new ones.
 */

import { discSubTrait, dominantDiscCode, type DiscGraphValues } from '@/lib/scoring/disc';
import { findDiscTypeInfo } from '@/lib/scoring/disc_dictionary';
import { PAPI_ASPECT_DETAILS, type PapiAspect } from '@/lib/scoring/papi';
import { MSDT_TYPE_DETAILS, type MsdtDimension } from '@/lib/scoring/msdt';
import { WPT_CATEGORIES } from '@/lib/scoring/wpt';
import { getResultSummary, readWptReportFigures } from '@/lib/reportSummary';
import { isSkippedDetailTest, normalizeTestCode, partitionReportResults } from '@/lib/combinedReport';

export const REPORT_FOOTER = 'Laporan ini diterbitkan secara resmi & terverifikasi oleh theaim.id';

export const CATATAN_KETERBATASAN =
  'Hasil asesmen ini menggambarkan kecenderungan pada saat tes dilakukan dan sebaiknya digunakan bersama informasi lain, bukan sebagai satu-satunya dasar keputusan.';

/** Axis used by the current DISC charts (norm table), not the spec draft of -18..18. */
export const DISC_AXIS_MIN = -16;
export const DISC_AXIS_MAX = 18;

/** IQ norm bounds stored in WPT_RS_TO_IQ. The gauge uses these; the report never says IQ. */
export const WPT_NORM_MIN = 59;
export const WPT_NORM_MAX = 146;

export const V3_TEST_CODES = ['disc', 'bigfive', 'papi', 'wpt', 'msdt'] as const;

export type V3TestCode = (typeof V3_TEST_CODES)[number];

const DISC_LETTERS = ['D', 'I', 'S', 'C'] as const;

export function isV3TestCode(code: string | null | undefined): code is V3TestCode {
  return (V3_TEST_CODES as readonly string[]).includes(normalizeTestCode(code));
}

function finiteNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round1(value: number): number {
  const scaled = value * 10;
  const rounded = scaled < 0 ? -Math.round(Math.abs(scaled)) : Math.round(scaled);
  return rounded / 10;
}

/** One decimal place, comma separator. Non-numeric values render as "-". */
export function formatDecimal(value: unknown): string {
  const parsed = finiteNumber(value);
  if (parsed == null) return '-';
  const rounded = round1(parsed);
  const sign = rounded < 0 ? '-' : '';
  const [whole, frac] = Math.abs(rounded).toFixed(1).split('.');
  return `${sign}${whole},${frac}`;
}

/** Percentage with one decimal and no space before the percent sign. */
export function formatPercent(value: unknown): string {
  const text = formatDecimal(value);
  return text === '-' ? '-' : `${text}%`;
}

export function formatIdDateTime(value: unknown): string {
  if (value == null || value === '') return '-';
  const date = new Date(value as string | number | Date);
  if (Number.isNaN(date.getTime())) return '-';
  const datePart = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Jakarta',
  })
    .format(date)
    .replace('.', ':');
  return `${datePart} - ${timePart} WIB`;
}

export function sessionStatusLabel(status: unknown): string {
  const value = String(status || '').trim().toUpperCase();
  if (value === 'COMPLETED') return 'Selesai';
  if (value === 'RUNNING') return 'Berjalan';
  if (!value) return '-';
  return String(status);
}

function textOrDash(value: unknown): string {
  const text = String(value ?? '').trim();
  return text || '-';
}

export function coverFields(participant: Record<string, unknown> | null | undefined) {
  const source = participant || {};
  return [
    { label: 'Nama kandidat', value: textOrDash(source.full_name) },
    { label: 'Email kandidat', value: textOrDash(source.email) },
    { label: 'No. telepon', value: textOrDash(source.phone_number || source.masked_phone) },
    { label: 'Posisi (level posisi)', value: textOrDash(source.position || source.job_title || source.level) },
    { label: 'Instansi / perusahaan', value: textOrDash(source.company_name) },
    { label: 'Kurikulum', value: textOrDash(source.curriculum_name || source.curriculum) },
    { label: 'Sesi ujian', value: textOrDash(source.campaign_title) },
    { label: 'Status', value: sessionStatusLabel(source.status) },
    { label: 'Mulai ujian', value: formatIdDateTime(source.started_at) },
    { label: 'Selesai ujian', value: formatIdDateTime(source.completed_at) },
  ];
}

export function orderDetailResults<T extends { test_code?: string | null }>(detail: T[]): T[] {
  const buckets = new Map<string, T[]>();
  const legacy: T[] = [];
  for (const row of detail) {
    const code = normalizeTestCode(row?.test_code);
    if (isV3TestCode(code)) {
      const list = buckets.get(code) || [];
      list.push(row);
      buckets.set(code, list);
    } else {
      legacy.push(row);
    }
  }
  const v3: T[] = [];
  for (const code of V3_TEST_CODES) {
    v3.push(...(buckets.get(code) || []));
  }
  return [...v3, ...legacy];
}

export function orderCoverResults<T extends { test_code?: string | null }>(results: T[] | null | undefined): T[] {
  const { detail, skipped } = partitionReportResults(results);
  return [...orderDetailResults(detail), ...skipped];
}

const SUMMARY_TITLES: Record<string, string> = {
  disc: 'DISC',
  bigfive: 'Big Five Personality Test',
  papi: 'PAPI Kostick',
  wpt: 'Tes Kognitif',
  msdt: 'Management Style Diagnostic Test',
};

const SUMMARY_ICONS: Record<string, string> = {
  disc: 'D',
  bigfive: 'B',
  papi: 'P',
  wpt: 'K',
  msdt: 'M',
  mbti: 'M',
  riasec: 'R',
  enneagram: 'E',
  msai: 'S',
  ist: 'I',
};

export function summaryTitle(code: string | null | undefined, testName?: string | null): string {
  const normalized = normalizeTestCode(code);
  if (SUMMARY_TITLES[normalized]) return SUMMARY_TITLES[normalized];
  const name = String(testName || '').trim();
  if (name) return name;
  return normalized ? normalized.toUpperCase() : 'Tes';
}

export function summaryIcon(code: string | null | undefined): string {
  const normalized = normalizeTestCode(code);
  if (SUMMARY_ICONS[normalized]) return SUMMARY_ICONS[normalized];
  const letter = normalized.replace(/[^a-z0-9]/g, '').charAt(0);
  return letter ? letter.toUpperCase() : 'T';
}

function withPeriod(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function hasilUtama(code: string | null | undefined, scoring: Record<string, any> | null | undefined): string {
  const normalized = normalizeTestCode(code);
  if (normalized === 'wpt') {
    const { iq } = readWptReportFigures(scoring);
    return iq == null ? 'Skor Kognitif: -' : `Skor Kognitif: ${formatDecimal(iq)}`;
  }
  if (normalized === 'msdt') {
    const model = msdtSectionModel(scoring);
    if (model.code !== '-') return model.name !== '-' ? `${model.code} - ${model.name}` : model.code;
  }
  if (normalized === 'papi') {
    const label = String(scoring?.dominantLabel || '').trim();
    if (label) return label;
  }
  return getResultSummary(normalized, scoring);
}

export function coverStatus(code: string | null | undefined): string {
  return isSkippedDetailTest(code) ? 'Selesai (tanpa lampiran)' : 'Selesai';
}

export interface DiscGraphView {
  key: 'g1' | 'g2' | 'g3';
  title: string;
  subtitle: string;
  howToRead: string;
  values: DiscGraphValues;
  subTrait: string;
  narrative: string | null;
}

function readGraph(scoring: Record<string, any> | null | undefined, key: 'g1' | 'g2' | 'g3'): DiscGraphValues {
  const source = scoring?.[key] || {};
  return {
    D: finiteNumber(source.D) ?? 0,
    I: finiteNumber(source.I) ?? 0,
    S: finiteNumber(source.S) ?? 0,
    C: finiteNumber(source.C) ?? 0,
  };
}

function graphNarrative(values: DiscGraphValues): string | null {
  const info = findDiscTypeInfo(dominantDiscCode(values));
  const text = info?.description?.trim();
  return text || null;
}

const DISC_GRAPH_META: {
  key: 'g1' | 'g2' | 'g3';
  title: string;
  subtitle: string;
  howToRead: string;
  cardTitle: string;
}[] = [
  {
    key: 'g1',
    title: 'GRAPH 1 · MOST',
    subtitle: 'Diri Adaptif (Public Self)',
    howToRead:
      'Cara membaca: perilaku yang ditampilkan di lingkungan kerja. Titik di atas garis 0 berarti kecenderungan lebih kuat pada dimensi itu, di bawah garis berarti lebih rendah.',
    cardTitle: 'Perilaku adaptasi · Graph 1 (MOST)',
  },
  {
    key: 'g2',
    title: 'GRAPH 2 · LEAST',
    subtitle: 'Diri Alami (Private Self)',
    howToRead:
      'Cara membaca: perilaku alami yang cenderung tidak ditampilkan di lingkungan kerja. Penafsiran titik sama dengan Graph 1.',
    cardTitle: 'Perilaku alami · Graph 2 (LEAST)',
  },
  {
    key: 'g3',
    title: 'GRAPH 3 · CHANGE',
    subtitle: 'Persepsi Diri (Perceived Self)',
    howToRead:
      'Cara membaca: selisih Graph 1 dan Graph 2. Selisih besar menandakan adanya penyesuaian gaya.',
    cardTitle: 'Persepsi diri · Graph 3 (CHANGE)',
  },
];

export function discSectionModel(scoring: Record<string, any> | null | undefined) {
  const graphs = DISC_GRAPH_META.map((meta) => {
    const values = readGraph(scoring, meta.key);
    const stored = scoring?.subTraits?.[meta.key];
    const subTrait = String(stored || '').trim() || discSubTrait(values);
    return {
      ...meta,
      values,
      subTrait,
      narrative: graphNarrative(values),
    };
  });

  const kode = String(scoring?.dominantLabel || '').trim();
  const primary = kode ? findDiscTypeInfo(kode) : null;
  const label = primary?.name || String(scoring?.dominantType || '').trim();
  const profil = primary?.description?.trim() || null;
  const penempatan = primary?.jobs?.trim() || null;
  const graph3 = graphs[2]?.narrative || null;
  const stressFlag =
    typeof scoring?.hasStressPotential === 'boolean'
      ? scoring.hasStressPotential
      : dominantDiscCode(graphs[0].values)[0] !== dominantDiscCode(graphs[1].values)[0];

  return {
    kode: kode || '-',
    label: label || '-',
    subtrait: graphs[2]?.subTrait || '-',
    stress: stressFlag ? 'Ya (Terindikasi Penyesuaian Style)' : 'Normal',
    graphs,
    profil: profil && profil !== graph3 ? profil : null,
    penempatan,
  };
}

export const BIG_FIVE_DIMENSIONS = [
  { code: 'E', name: 'Extraversion', hint: 'Kecenderungan sosial' },
  { code: 'A', name: 'Agreeableness', hint: 'Kecenderungan kooperatif' },
  { code: 'C', name: 'Conscientiousness', hint: 'Kedisiplinan dan tanggung jawab' },
  { code: 'N', name: 'Neuroticism', hint: 'Stabilitas emosi' },
  { code: 'O', name: 'Openness', hint: 'Keterbukaan terhadap pengalaman' },
] as const;

export function bigFiveBars(dimensions: Record<string, any> | null | undefined) {
  return BIG_FIVE_DIMENSIONS.map((dim) => {
    const data = dimensions?.[dim.code];
    const percent = finiteNumber(data?.percent);
    const narrative = String(data?.narrative || '').trim();
    return {
      ...dim,
      percent,
      percentText: percent == null ? '-' : formatPercent(percent),
      category: String(data?.category || '').trim() || '-',
      narrative: narrative || null,
      barWidth: percent == null ? 0 : Math.max(0, Math.min(100, percent)),
    };
  });
}

export interface PapiAspectRow {
  code: PapiAspect;
  name: string;
  score: number;
  scoreText: string;
  fraction: number;
}

export interface PapiGroupView {
  category: string;
  color: string;
  rows: PapiAspectRow[];
}

const PAPI_LAYOUT: { category: string; color: string; aspects: { code: PapiAspect; name: string }[] }[] = [
  {
    category: 'Arah Kerja',
    color: '#2563eb',
    aspects: [
      { code: 'N', name: 'Ketekunan Menyelesaikan Tugas' },
      { code: 'G', name: 'Peran Pekerja Keras' },
      { code: 'A', name: 'Ambisi Pencapaian Target' },
    ],
  },
  {
    category: 'Kepemimpinan',
    color: '#e8590c',
    aspects: [
      { code: 'L', name: 'Peran Kepemimpinan' },
      { code: 'P', name: 'Pengendalian Orang Lain' },
      { code: 'I', name: 'Pengambilan Keputusan' },
    ],
  },
  {
    category: 'Aktivitas Kerja',
    color: '#16a34a',
    aspects: [
      { code: 'T', name: 'Kecepatan Kerja' },
      { code: 'V', name: 'Tipe Enerjik' },
    ],
  },
  {
    category: 'Sifat Sosial',
    color: '#475569',
    aspects: [
      { code: 'X', name: 'Kebutuhan Diperhatikan' },
      { code: 'S', name: 'Orientasi Sosial' },
      { code: 'B', name: 'Orientasi Kelompok' },
      { code: 'O', name: 'Kehangatan Hubungan' },
    ],
  },
  {
    category: 'Gaya Kerja',
    color: '#7c3aed',
    aspects: [
      { code: 'R', name: 'Tipe Teoretis & Analitis' },
      { code: 'D', name: 'Perhatian pada Detail' },
      { code: 'C', name: 'Tipe Teratur' },
    ],
  },
  {
    category: 'Temperamen',
    color: '#0891b2',
    aspects: [
      { code: 'Z', name: 'Kebutuhan Perubahan' },
      { code: 'E', name: 'Pengendalian Emosi' },
      { code: 'K', name: 'Ketegasan & Daya Saing' },
    ],
  },
  {
    category: 'Kepatuhan',
    color: '#b45309',
    aspects: [
      { code: 'F', name: 'Kebutuhan Dukungan' },
      { code: 'W', name: 'Kebutuhan Aturan & Pengawasan' },
    ],
  },
];

/** Rendah 1-3, Sedang 4-6, Tinggi 7-9. A zero score sits with Rendah. */
export function papiZone(score: number): 'Rendah' | 'Sedang' | 'Tinggi' {
  if (score >= 7) return 'Tinggi';
  if (score >= 4) return 'Sedang';
  return 'Rendah';
}

export function papiSectionModel(scoring: Record<string, any> | null | undefined) {
  const scores = (scoring?.scores || {}) as Record<string, unknown>;
  const groups: PapiGroupView[] = PAPI_LAYOUT.map((group) => ({
    category: group.category,
    color: group.color,
    rows: group.aspects.map((aspect) => {
      const raw = finiteNumber(scores[aspect.code]) ?? 0;
      const score = Math.max(0, raw);
      return {
        code: aspect.code,
        name: aspect.name,
        score,
        scoreText: formatDecimal(score),
        fraction: Math.max(0, Math.min(1, score / 9)),
      };
    }),
  }));

  const parts: string[] = [];
  for (const group of groups) {
    for (const row of group.rows) {
      const detail = PAPI_ASPECT_DETAILS[row.code];
      if (!detail) continue;
      const zone = papiZone(row.score);
      const template = zone === 'Tinggi' ? detail.high : zone === 'Rendah' ? detail.low : detail.desc;
      if (template) parts.push(withPeriod(`${row.name} (${row.code}): ${template}`));
    }
  }

  return {
    ringkasan:
      'Asesmen PAPI Kostick mengukur 20 dimensi kebutuhan dan peran yang berkaitan dengan lingkungan profesional dan gaya kerja.',
    groups,
    narrative: parts.length > 0 ? parts.join(' ') : null,
  };
}

export function wptGaugeAngle(iq: number | null | undefined): number | null {
  if (iq == null || !Number.isFinite(iq)) return null;
  const span = WPT_NORM_MAX - WPT_NORM_MIN;
  const ratio = Math.min(1, Math.max(0, (iq - WPT_NORM_MIN) / span));
  return ratio * 180 - 90;
}

export function wptSectionModel(scoring: Record<string, any> | null | undefined) {
  const figures = readWptReportFigures(scoring);
  const direct = typeof scoring?.description === 'string' ? scoring.description.trim() : '';
  let narrative = direct || null;
  if (!narrative && figures.iq != null) {
    const category = WPT_CATEGORIES.find((item) => figures.iq != null && figures.iq >= item.minIQ);
    narrative = category?.description?.trim() || null;
  }
  return {
    score: figures.iq,
    scoreText: figures.iq == null ? '-' : formatDecimal(figures.iq),
    angle: wptGaugeAngle(figures.iq),
    narrative,
  };
}

export function msdtSectionModel(scoring: Record<string, any> | null | undefined) {
  const rawType = String(scoring?.dominantType || '').trim();
  const labelCode = String(scoring?.dominantLabel || '').split('-')[0]?.trim() || '';
  const code = rawType || labelCode;
  const detail = MSDT_TYPE_DETAILS[code as MsdtDimension];
  return {
    code: code || '-',
    name: detail?.name || textOrDash(scoring?.dominantLabel),
    narrative: detail?.narrative?.trim() || null,
  };
}

function readPlatformText(source: Record<string, unknown> | null | undefined, keys: string[]): string | null {
  if (!source) return null;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export function buildClosingContent(
  participant: Record<string, unknown> | null | undefined,
  summaries: { title: string; summary: string }[]
): { executive: string | null; recommendation: string | null } {
  const platformExecutive = readPlatformText(participant, [
    'ringkasan_eksekutif',
    'executive_summary',
    'executiveSummary',
  ]);
  const executive =
    platformExecutive ||
    (summaries.length > 0 ? summaries.map((item) => `${item.title}: ${item.summary}`).join('\n') : null);

  const platformRecommendation = readPlatformText(participant, ['rekomendasi', 'recommendation']);
  let recommendation = platformRecommendation;
  if (!recommendation && Array.isArray(participant?.recommendations)) {
    const lines = participant.recommendations
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim());
    if (lines.length > 0) recommendation = lines.join('\n');
  }

  return { executive, recommendation };
}

export function sectionSummaries(
  results: { test_code?: string | null; test_name?: string | null; scoring_data?: any }[]
) {
  return results.map((result) => ({
    title: summaryTitle(result.test_code, result.test_name),
    summary: hasilUtama(result.test_code, result.scoring_data),
  }));
}

export const DISC_COLORS = { D: '#D7263D', I: '#E8A317', S: '#2E9E5B', C: '#2D6CDF' } as const;
export const DISC_ORDER = DISC_LETTERS;
