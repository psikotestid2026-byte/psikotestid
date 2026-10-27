/**
 * View-model for the theaim.id participant report (v3).
 * Formatting and narrative selection only. DISC pattern text comes from the
 * report dictionary (database when seeded, bundled copy otherwise).
 */

import { bundledDiscReportDictionary, type DiscReportDictionary } from '@/lib/scoring/discReportDictionary';
import {
  buildDiscDevelopmentAdvice,
  buildDiscGraphCards,
  buildDiscTraitSummary,
  mergeDiscDescriptionBlocks,
  type DiscGraphCardModel,
} from '@/lib/scoring/discReportView';
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

/** Integers print without a decimal. Other values keep one decimal and a comma. */
export function formatDecimal(value: unknown): string {
  const parsed = finiteNumber(value);
  if (parsed == null) return '-';
  const rounded = round1(parsed);
  const sign = rounded < 0 ? '-' : '';
  const [whole, frac] = Math.abs(rounded).toFixed(1).split('.');
  if (frac === '0') return `${sign}${whole}`;
  return `${sign}${whole},${frac}`;
}

/** Percentage with no space before the percent sign. Integers omit the decimal. */
export function formatPercent(value: unknown): string {
  const text = formatDecimal(value);
  return text === '-' ? '-' : `${text}%`;
}

/** Indonesian calendar date, for example "19 Oktober 2026". */
export function formatReportDate(value: unknown): string {
  if (value == null || value === '') return '-';
  const date = new Date(value as string | number | Date);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

/** "Kota, 19 Oktober 2026" when a city is stored, otherwise the date alone. */
export function reportValidationLine(
  participant: Record<string, unknown> | null | undefined,
  issuedAt: Date = new Date()
): string {
  const source = participant || {};
  const city = String(source.city || source.kota || source.report_city || '').trim();
  const raw = source.completed_at ?? source.report_date;
  const fromSession = raw == null || raw === '' ? '-' : formatReportDate(raw);
  const dateText = fromSession === '-' ? formatReportDate(issuedAt) : fromSession;
  return city ? `${city}, ${dateText}` : dateText;
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

export type DiscGraphView = DiscGraphCardModel;

export function discSectionModel(
  scoring: Record<string, any> | null | undefined,
  options?: { dictionary?: DiscReportDictionary | null }
) {
  const dictionary = options?.dictionary || bundledDiscReportDictionary();
  const graphs = buildDiscGraphCards(scoring, dictionary);
  const blocks = mergeDiscDescriptionBlocks(graphs, dictionary);
  const traits = buildDiscTraitSummary(scoring, dictionary);
  const development = buildDiscDevelopmentAdvice(scoring, dictionary);
  return { graphs, blocks, traits, development };
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

export type PapiBand = 'Low' | 'Middle' | 'High';

export interface PapiAspectRow {
  code: PapiAspect;
  name: string;
  score: number;
  scoreText: string;
  fraction: number;
  zone: PapiBand;
}

export interface PapiNarrativeItem {
  code: PapiAspect;
  name: string;
  score: number;
  scoreText: string;
  narrative: string;
  heading: string;
}

export const PAPI_HIGH_EMPTY = 'Tidak ada aspek berkategori High.';
export const PAPI_LOW_EMPTY = 'Tidak ada aspek berkategori Low.';

export interface PapiGroupView {
  category: string;
  color: string;
  rows: PapiAspectRow[];
}

const PAPI_LAYOUT: { category: string; color: string; aspects: PapiAspect[] }[] = [
  { category: 'Arah Kerja', color: '#2563eb', aspects: ['N', 'G', 'A'] },
  { category: 'Kepemimpinan', color: '#e8590c', aspects: ['L', 'P', 'I'] },
  { category: 'Aktivitas Kerja', color: '#16a34a', aspects: ['T', 'V'] },
  { category: 'Sifat Sosial', color: '#475569', aspects: ['X', 'S', 'B', 'O'] },
  { category: 'Gaya Kerja', color: '#7c3aed', aspects: ['R', 'D', 'C'] },
  { category: 'Temperamen', color: '#0891b2', aspects: ['Z', 'E', 'K'] },
  { category: 'Kepatuhan', color: '#b45309', aspects: ['F', 'W'] },
];

const PAPI_ASPECT_ORDER = Object.keys(PAPI_ASPECT_DETAILS) as PapiAspect[];

/** Kamus section 4.5: Low ≤3, Middle 4–5, High ≥6. A zero score is Low. */
export function papiZone(score: number): PapiBand {
  if (score >= 6) return 'High';
  if (score >= 4) return 'Middle';
  return 'Low';
}

function papiNarratives(scores: Record<string, unknown>, band: 'High' | 'Low'): PapiNarrativeItem[] {
  const items = PAPI_ASPECT_ORDER.flatMap((code) => {
    const detail = PAPI_ASPECT_DETAILS[code];
    const score = Math.max(0, finiteNumber(scores[code]) ?? 0);
    const zone = papiZone(score);
    if (zone !== band) return [];
    const scoreText = formatDecimal(score);
    return [{
      code,
      name: detail.name,
      score,
      scoreText,
      narrative: band === 'High' ? detail.high : detail.low,
      heading: `${code} – ${detail.name} (Skor ${scoreText})`,
    }];
  });
  items.sort((left, right) => {
    const byScore = band === 'High' ? right.score - left.score : left.score - right.score;
    if (byScore !== 0) return byScore;
    return PAPI_ASPECT_ORDER.indexOf(left.code) - PAPI_ASPECT_ORDER.indexOf(right.code);
  });
  return items;
}

export function papiSectionModel(scoring: Record<string, any> | null | undefined) {
  const scores = (scoring?.scores || {}) as Record<string, unknown>;
  const groups: PapiGroupView[] = PAPI_LAYOUT.map((group) => ({
    category: group.category,
    color: group.color,
    rows: group.aspects.map((code) => {
      const detail = PAPI_ASPECT_DETAILS[code];
      const score = Math.max(0, finiteNumber(scores[code]) ?? 0);
      return {
        code,
        name: detail.name,
        score,
        scoreText: formatDecimal(score),
        fraction: Math.max(0, Math.min(1, score / 9)),
        zone: papiZone(score),
      };
    }),
  }));

  return {
    ringkasan:
      'Asesmen PAPI Kostick mengukur 20 dimensi kebutuhan dan peran yang berkaitan dengan lingkungan profesional dan gaya kerja.',
    groups,
    high: papiNarratives(scores, 'High'),
    low: papiNarratives(scores, 'Low'),
    highEmpty: PAPI_HIGH_EMPTY,
    lowEmpty: PAPI_LOW_EMPTY,
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

/** The shared closing block stays for any report that includes a non-PAPI result. */
export function showsClosingSection(results: { test_code?: string | null }[] | null | undefined): boolean {
  const codes = (results || []).map((result) => normalizeTestCode(result?.test_code)).filter(Boolean);
  if (codes.length === 0) return true;
  return codes.some((code) => code !== 'papi');
}

export const DISC_COLORS = { D: '#D7263D', I: '#E8A317', S: '#2E9E5B', C: '#2D6CDF' } as const;
export const DISC_ORDER = DISC_LETTERS;
