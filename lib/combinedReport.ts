/**
 * Helpers for the combined participant PDF and the bulk ZIP export.
 * Pure functions only — no database or PDF rendering — so they can be unit tested.
 */

import { PAPI_ASPECT_DETAILS } from '@/lib/scoring/papi';
import { MSDT_TYPE_DETAILS } from '@/lib/scoring/msdt';

export const INCLUDED_DETAIL_CODES = [
  'mbti',
  'disc',
  'bigfive',
  'enneagram',
  'riasec',
  'papi',
  'wpt',
  'msdt',
  'msai',
] as const;

/** Present on the cover summary, omitted from detail pages. */
export const SKIPPED_DETAIL_CODES = ['ist', 'tech_js'] as const;

/**
 * PDFs rendered inside one serverless invocation.
 * Budget: ESTIMATED_SECONDS_PER_PDF * batch size stays under maxDuration.
 */
export const BULK_PDF_BATCH_SIZE = 10;
export const BULK_PDF_BATCH_SIZE_CAP = 25;
export const BULK_PDF_MAX_DURATION_SECONDS = 300;
/** Conservative render time for one multi-instrument participant PDF. */
export const ESTIMATED_SECONDS_PER_PDF = 20;

export type BulkActor = { role: 'admin' } | { role: 'client'; customerId: number };

export type BulkScopeResult =
  | { ok: true; customerId: number }
  | { ok: false; status: 400 | 403; error: string };

export type CampaignOwnershipResult =
  | { ok: true }
  | { ok: false; status: 403 | 404; error: string };

export interface ZipNamedFile {
  name: string;
  data: Uint8Array;
}

export function normalizeTestCode(code: string | null | undefined): string {
  return String(code || '').trim().toLowerCase();
}

export function isSkippedDetailTest(code: string | null | undefined): boolean {
  const normalized = normalizeTestCode(code);
  return (SKIPPED_DETAIL_CODES as readonly string[]).includes(normalized);
}

/**
 * Detail pages are rendered for every scored instrument except IST and tech_js.
 * Unknown codes keep the existing generic fallback instead of failing the PDF.
 */
export function shouldRenderDetail(code: string | null | undefined): boolean {
  const normalized = normalizeTestCode(code);
  if (!normalized) return false;
  return !isSkippedDetailTest(normalized);
}

export function partitionReportResults<T extends { test_code?: string | null }>(results: T[] | null | undefined) {
  const detail: T[] = [];
  const skipped: T[] = [];
  for (const result of results || []) {
    if (shouldRenderDetail(result?.test_code)) detail.push(result);
    else skipped.push(result);
  }
  return { detail, skipped };
}

export function parseJsonObject(value: unknown): Record<string, any> | null {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
      return null;
    } catch {
      return null;
    }
  }
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, any>;
  return null;
}

export function resolveBigFiveScoring(
  scoring: unknown,
  rawAnswers: unknown,
  calculate: (answers: Record<string, string>) => { dimensions?: unknown } | null | undefined
): Record<string, any> | null {
  const parsed = parseJsonObject(scoring);
  if (parsed?.dimensions && typeof parsed.dimensions === 'object') return parsed;

  const answers = parseJsonObject(rawAnswers);
  if (!answers) return null;

  try {
    const computed = calculate(answers as Record<string, string>);
    if (computed && typeof computed === 'object' && (computed as { dimensions?: unknown }).dimensions) {
      return computed as Record<string, any>;
    }
    return null;
  } catch {
    return null;
  }
}

const PAPI_SCORE_CODES = Object.keys(PAPI_ASPECT_DETAILS);
const MSDT_SCORE_CODES = Object.keys(MSDT_TYPE_DETAILS);

type AnswerScoreCalculator = (
  answers: Record<string, any>
) => { scores?: unknown; dominantType?: unknown } | null | undefined;

function isFiniteScore(value: unknown): boolean {
  if (typeof value === 'boolean' || value == null || value === '') return false;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string' && value.trim() !== '') return Number.isFinite(Number(value));
  return false;
}

function readScoreMap(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function hasEveryScore(scores: unknown, codes: readonly string[]): boolean {
  const map = readScoreMap(scores);
  if (!map) return false;
  return codes.every((code) => isFiniteScore(map[code]));
}

/**
 * Stored PAPI is usable only when every aspect has a numeric score.
 * Rows submitted before scoring was added keep {completed, total_answers, submitted_at}.
 */
export function hasCompletePapiScores(scoring: unknown): boolean {
  const parsed = parseJsonObject(scoring);
  return hasEveryScore(parsed?.scores, PAPI_SCORE_CODES);
}

/**
 * Stored MSDT is usable when the dominant style is a known code and every dimension is numeric.
 */
export function hasCompleteMsdtScores(scoring: unknown): boolean {
  const parsed = parseJsonObject(scoring);
  if (!parsed) return false;
  const dominant = String(parsed.dominantType ?? '').trim();
  if (!MSDT_SCORE_CODES.includes(dominant)) return false;
  return hasEveryScore(parsed.scores, MSDT_SCORE_CODES);
}

function answerRecord(rawAnswers: unknown): Record<string, any> | null {
  const answers = parseJsonObject(rawAnswers);
  if (!answers || Object.keys(answers).length === 0) return null;
  return answers;
}

function resolveStoredOrComputed(
  scoring: unknown,
  rawAnswers: unknown,
  isComplete: (value: unknown) => boolean,
  calculate: AnswerScoreCalculator
): Record<string, any> | null {
  const parsed = parseJsonObject(scoring);
  if (parsed && isComplete(parsed)) return parsed;

  const answers = answerRecord(rawAnswers);
  if (!answers) return parsed;

  try {
    const computed = calculate(answers);
    if (computed && typeof computed === 'object' && isComplete(computed)) {
      return computed as Record<string, any>;
    }
    return parsed;
  } catch {
    return parsed;
  }
}

/** In-memory PAPI score. Keeps a complete stored payload; otherwise scores raw answers. Never writes. */
export function resolvePapiScoring(
  scoring: unknown,
  rawAnswers: unknown,
  calculate: AnswerScoreCalculator
): Record<string, any> | null {
  return resolveStoredOrComputed(scoring, rawAnswers, hasCompletePapiScores, calculate);
}

/** In-memory MSDT score. Same contract as resolvePapiScoring. */
export function resolveMsdtScoring(
  scoring: unknown,
  rawAnswers: unknown,
  calculate: AnswerScoreCalculator
): Record<string, any> | null {
  return resolveStoredOrComputed(scoring, rawAnswers, hasCompleteMsdtScores, calculate);
}

export interface ReportScoreCalculators {
  papi: AnswerScoreCalculator;
  msdt: AnswerScoreCalculator;
}

/**
 * Copy report rows with PAPI/MSDT scoring filled in memory when the stored payload is incomplete.
 * Other instruments are returned as-is. The input rows are not mutated.
 */
export function hydrateReportScores<T extends { test_code?: string | null; scoring_data?: unknown; raw_answers?: unknown }>(
  results: T[] | null | undefined,
  calculators: ReportScoreCalculators
): T[] {
  if (!Array.isArray(results)) return [];
  return results.map((result) => {
    if (!result || typeof result !== 'object') return result;
    const code = normalizeTestCode(result.test_code);
    if (code !== 'papi' && code !== 'msdt') return result;

    const resolved =
      code === 'papi'
        ? resolvePapiScoring(result.scoring_data, result.raw_answers, calculators.papi)
        : resolveMsdtScoring(result.scoring_data, result.raw_answers, calculators.msdt);

    if (!resolved || resolved === result.scoring_data) return result;
    return { ...result, scoring_data: resolved };
  });
}

export function resolveBulkBatchSize(
  envValue?: string | null,
  fallback: number = BULK_PDF_BATCH_SIZE
): number {
  const parsed = Number(String(envValue ?? '').trim());
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(BULK_PDF_BATCH_SIZE_CAP, parsed);
}

export function planBulkBatches(total: number, batchSize: number = BULK_PDF_BATCH_SIZE) {
  const size = Math.max(1, Math.floor(batchSize) || BULK_PDF_BATCH_SIZE);
  const count = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
  const batches: { offset: number; limit: number }[] = [];
  for (let offset = 0; offset < count; offset += size) {
    batches.push({ offset, limit: Math.min(size, count - offset) });
  }
  return batches;
}

export function clampBulkLimit(requested: number | null | undefined, batchSize: number = BULK_PDF_BATCH_SIZE): number {
  const cap = Math.max(1, Math.floor(batchSize) || BULK_PDF_BATCH_SIZE);
  if (requested == null || !Number.isFinite(requested) || requested <= 0) return cap;
  return Math.min(cap, Math.floor(requested));
}

export function parseOptionalPositiveInt(
  value: string | null | undefined
): { ok: true; value: number | null } | { ok: false } {
  if (value == null || value.trim() === '') return { ok: true, value: null };
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return { ok: false };
  return { ok: true, value: parsed };
}

export function parseOffsetParam(value: string | null | undefined): { ok: true; value: number } | { ok: false } {
  if (value == null || value.trim() === '') return { ok: true, value: 0 };
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return { ok: false };
  return { ok: true, value: parsed };
}

export function resolveBulkCustomer(actor: BulkActor, requestedCustomerId: number | null): BulkScopeResult {
  if (actor.role === 'admin') {
    if (!requestedCustomerId) {
      return { ok: false, status: 400, error: 'Pilih satu perusahaan untuk mengunduh laporan.' };
    }
    return { ok: true, customerId: requestedCustomerId };
  }

  if (requestedCustomerId && Number(requestedCustomerId) !== Number(actor.customerId)) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }

  return { ok: true, customerId: Number(actor.customerId) };
}

export function assertCampaignOwnership(
  customerId: number,
  campaignCustomerId: number | null
): CampaignOwnershipResult {
  if (campaignCustomerId == null || !Number.isFinite(campaignCustomerId)) {
    return { ok: false, status: 404, error: 'Sesi ujian tidak ditemukan.' };
  }
  if (Number(campaignCustomerId) !== Number(customerId)) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }
  return { ok: true };
}

export function participantPdfFileName(fullName: string | null | undefined, participantId: number): string {
  const slug = String(fullName || 'Kandidat')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80);
  const safe = slug || 'Kandidat';
  const id = Number.isFinite(participantId) ? Math.trunc(participantId) : 0;
  return `Laporan-Psikotes-${safe}-${id}.pdf`;
}

export function bulkZipFileName(
  companyName: string | null | undefined,
  campaignTitle?: string | null,
  dateStamp: string = new Date().toISOString().slice(0, 10)
): string {
  const slug = (value: string) =>
    value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 40);

  const company = slug(String(companyName || 'Perusahaan')) || 'Perusahaan';
  const batch = campaignTitle ? slug(String(campaignTitle)) : '';
  const batchPart = batch ? `-${batch}` : '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateStamp) ? dateStamp : 'export';
  return `Laporan-Peserta-${company}${batchPart}-${date}.zip`;
}

export function bulkReportUrl(params: {
  customerId: number;
  campaignId?: number | null;
  offset?: number;
  limit?: number;
  format?: 'manifest' | 'zip';
}): string {
  const query = new URLSearchParams();
  query.set('customerId', String(params.customerId));
  if (params.campaignId) query.set('campaignId', String(params.campaignId));
  if (params.offset) query.set('offset', String(params.offset));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.format === 'manifest') query.set('format', 'manifest');
  return `/api/reports/bulk/pdf?${query.toString()}`;
}

export function groupResultsByParticipant<T extends { participant_id?: number | string | null }>(
  rows: T[] | null | undefined
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows || []) {
    const key = String(row?.participant_id ?? '');
    if (!key) continue;
    const list = grouped.get(key);
    if (list) list.push(row);
    else grouped.set(key, [row]);
  }
  return grouped;
}

export function dedupeFileNames<T extends { name: string }>(files: T[]): T[] {
  const seen = new Map<string, number>();
  return files.map((file) => {
    const count = seen.get(file.name) || 0;
    seen.set(file.name, count + 1);
    if (count === 0) return file;
    const dot = file.name.lastIndexOf('.');
    const name =
      dot > 0
        ? `${file.name.slice(0, dot)}-${count + 1}${file.name.slice(dot)}`
        : `${file.name}-${count + 1}`;
    return { ...file, name };
  });
}
