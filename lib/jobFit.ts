/**
 * Job-fit engine for the mandatory 5-test bundle (WPT, DISC, Big Five, PAPI, MSDT).
 * Pure functions only: no database, no I/O. Easy to unit test and cheap to run for
 * hundreds of participants at once.
 *
 * Each instrument is normalised to a 0-100 "fit" score relative to the participant's
 * job-level profile (weights, ideal dimensions and thresholds live in
 * jabatan_level_profiles so admins can tune them without a deploy).
 */

export const BUNDLE_TEST_CODES = ['wpt', 'disc', 'bigfive', 'papi', 'msdt'] as const;
export type BundleTestCode = (typeof BUNDLE_TEST_CODES)[number];

export const RECOMMENDATION_STATUSES = [
  'DIREKOMENDASIKAN',
  'DIPERTIMBANGKAN',
  'TIDAK_DIREKOMENDASIKAN',
] as const;
export type RecommendationStatus = (typeof RECOMMENDATION_STATUSES)[number];

export const RECOMMENDATION_LABELS: Record<RecommendationStatus, string> = {
  DIREKOMENDASIKAN: 'Direkomendasikan',
  DIPERTIMBANGKAN: 'Dipertimbangkan',
  TIDAK_DIREKOMENDASIKAN: 'Tidak Direkomendasikan',
};

export function isRecommendationStatus(value: unknown): value is RecommendationStatus {
  return typeof value === 'string' && (RECOMMENDATION_STATUSES as readonly string[]).includes(value);
}

export interface DimensionProfiles {
  wpt?: { floor?: number; ceil?: number };
  disc?: { ideal?: string[] };
  /** Positive weight = higher is better, negative weight = lower is better (e.g. neuroticism). */
  bigfive?: Partial<Record<'E' | 'A' | 'C' | 'N' | 'O', number>>;
  papi?: { high?: string[]; low?: string[] };
  /** Fit score (0-100) per MSDT dominant style code. */
  msdt?: Record<string, number>;
}

export interface LevelProfile {
  level_code: string;
  level_name: string;
  weights: Record<BundleTestCode, number>;
  min_scores: Record<BundleTestCode, number>;
  threshold_recommended: number;
  threshold_considered: number;
  dimension_profiles: DimensionProfiles;
  /** False only for levels that do not take MSDT (seeded STAF). Omitted means required. */
  requires_msdt?: boolean;
}

export interface JabatanMapping {
  jabatan_keyword: string;
  match_mode: 'PREFIX' | 'CONTAINS';
  level_code: string;
  priority: number;
}

export const FALLBACK_LEVEL_CODE = 'STAF';

export const FALLBACK_LEVEL_PROFILE: LevelProfile = {
  level_code: FALLBACK_LEVEL_CODE,
  level_name: 'Staf / Kontrak',
  weights: { wpt: 0.2, disc: 0.2, bigfive: 0.25, papi: 0.2, msdt: 0.15 },
  min_scores: { wpt: 50, disc: 50, bigfive: 50, papi: 50, msdt: 50 },
  threshold_recommended: 72,
  threshold_considered: 55,
  dimension_profiles: {
    disc: { ideal: ['S', 'C', 'I'] },
    bigfive: { E: 0.1, A: 0.25, C: 0.35, N: -0.2, O: 0.1 },
    papi: { high: ['N', 'G', 'C', 'D', 'W'], low: ['Z', 'K'] },
    msdt: { E: 95, Dv: 90, Ba: 80, Bu: 85, Mi: 60, Co: 55, Au: 40, Ds: 20 },
  },
};

const DEFAULT_WPT_FLOOR = 60;
const DEFAULT_WPT_CEIL = 120;

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function finite(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function asObject(value: unknown): Record<string, any> | null {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : null;
}

/** Normalises a position string for keyword matching. */
export function normalizePosition(position: string | null | undefined): string {
  return String(position || '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves a job level code from a free-text position.
 * Mappings are evaluated by ascending priority, then longest keyword first.
 */
export function resolveJobLevel(
  position: string | null | undefined,
  mappings: JabatanMapping[],
  fallback: string = FALLBACK_LEVEL_CODE
): string {
  const normalized = normalizePosition(position);
  if (!normalized) return fallback;

  const ordered = [...mappings].sort(
    (a, b) => a.priority - b.priority || b.jabatan_keyword.length - a.jabatan_keyword.length
  );

  for (const mapping of ordered) {
    const keyword = String(mapping.jabatan_keyword || '').toUpperCase();
    if (!keyword) continue;
    const hit =
      mapping.match_mode === 'CONTAINS' ? normalized.includes(keyword) : normalized.startsWith(keyword);
    if (hit) return mapping.level_code;
  }
  return fallback;
}

/** Like resolveJobLevel, but also reports which mapping matched (null when the fallback was used). */
export function explainJobLevel(
  position: string | null | undefined,
  mappings: JabatanMapping[],
  fallback: string = FALLBACK_LEVEL_CODE
): { level_code: string; matched: JabatanMapping | null } {
  const normalized = normalizePosition(position);
  if (!normalized) return { level_code: fallback, matched: null };

  const ordered = [...mappings].sort(
    (a, b) => a.priority - b.priority || b.jabatan_keyword.length - a.jabatan_keyword.length
  );
  for (const mapping of ordered) {
    const keyword = String(mapping.jabatan_keyword || '').toUpperCase();
    if (!keyword) continue;
    const hit = mapping.match_mode === 'CONTAINS' ? normalized.includes(keyword) : normalized.startsWith(keyword);
    if (hit) return { level_code: mapping.level_code, matched: mapping };
  }
  return { level_code: fallback, matched: null };
}

// ---------------------------------------------------------------------------
// Per-instrument normalisation (0-100)
// ---------------------------------------------------------------------------

export function scoreWpt(scoring: unknown, profile: LevelProfile): number | null {
  const sc = asObject(scoring);
  if (!sc) return null;
  const iq = finite(sc.iq) ?? finite(sc.score);
  if (iq == null) return null;
  const floor = profile.dimension_profiles.wpt?.floor ?? DEFAULT_WPT_FLOOR;
  const ceil = profile.dimension_profiles.wpt?.ceil ?? DEFAULT_WPT_CEIL;
  if (ceil <= floor) return null;
  return round2(clamp(((iq - floor) / (ceil - floor)) * 100));
}

function discLetterFit(letter: string | undefined, ideal: string[]): number {
  if (!letter) return 50;
  const idx = ideal.indexOf(letter);
  return idx === -1 ? 50 : clamp(100 - idx * 12);
}

export function scoreDisc(scoring: unknown, profile: LevelProfile): number | null {
  const sc = asObject(scoring);
  if (!sc) return null;
  const code = String(sc.dominantLabel || '')
    .toUpperCase()
    .replace(/[^DISC]/g, '');
  if (!code) return null;
  const ideal = (profile.dimension_profiles.disc?.ideal || FALLBACK_LEVEL_PROFILE.dimension_profiles.disc!.ideal!).map(
    (l) => String(l).toUpperCase()
  );
  const primary = discLetterFit(code[0], ideal);
  if (code.length < 2) return round2(primary);
  const secondary = discLetterFit(code[1], ideal);
  return round2(primary * 0.7 + secondary * 0.3);
}

export function scoreBigFive(scoring: unknown, profile: LevelProfile): number | null {
  const sc = asObject(scoring);
  const dims = asObject(sc?.dimensions);
  if (!dims) return null;
  const weights = profile.dimension_profiles.bigfive || FALLBACK_LEVEL_PROFILE.dimension_profiles.bigfive!;

  let weighted = 0;
  let totalWeight = 0;
  for (const dim of ['E', 'A', 'C', 'N', 'O'] as const) {
    const w = finite(weights[dim]);
    const percent = finite(dims[dim]?.percent);
    if (w == null || w === 0 || percent == null) continue;
    // Likert mean maps to 20-100 %, rescale to 0-100.
    const scaled = clamp(((percent - 20) / 80) * 100);
    const fit = w < 0 ? 100 - scaled : scaled;
    weighted += Math.abs(w) * fit;
    totalWeight += Math.abs(w);
  }
  if (totalWeight === 0) return null;
  return round2(weighted / totalWeight);
}

export function scorePapi(scoring: unknown, profile: LevelProfile): number | null {
  const sc = asObject(scoring);
  const scores = asObject(sc?.scores);
  if (!scores) return null;
  const cfg = profile.dimension_profiles.papi || FALLBACK_LEVEL_PROFILE.dimension_profiles.papi!;

  const mean = (aspects: string[] | undefined, invert: boolean): number | null => {
    const values = (aspects || [])
      .map((a) => finite(scores[a]))
      .filter((v): v is number => v != null)
      .map((v) => {
        const pct = clamp((v / 9) * 100);
        return invert ? 100 - pct : pct;
      });
    if (values.length === 0) return null;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  };

  const high = mean(cfg.high, false);
  const low = mean(cfg.low, true);
  if (high == null && low == null) return null;
  if (high == null) return round2(low as number);
  if (low == null) return round2(high);
  return round2(high * 0.75 + low * 0.25);
}

export function scoreMsdt(scoring: unknown, profile: LevelProfile): number | null {
  const sc = asObject(scoring);
  if (!sc) return null;
  const type = String(sc.dominantType || '').trim();
  if (!type) return null;
  const table = profile.dimension_profiles.msdt || FALLBACK_LEVEL_PROFILE.dimension_profiles.msdt!;
  const fit = finite(table[type]);
  return fit == null ? null : round2(clamp(fit));
}

const TEST_SCORERS: Record<BundleTestCode, (scoring: unknown, profile: LevelProfile) => number | null> = {
  wpt: scoreWpt,
  disc: scoreDisc,
  bigfive: scoreBigFive,
  papi: scorePapi,
  msdt: scoreMsdt,
};

// ---------------------------------------------------------------------------
// Composite
// ---------------------------------------------------------------------------

export interface JobFitBreakdown {
  level_code: string;
  level_name: string;
  tests: Partial<Record<BundleTestCode, { score: number; weight: number; min_score: number; below_min: boolean }>>;
  composite: number;
  thresholds: { recommended: number; considered: number };
  below_min: BundleTestCode[];
  gated: boolean;
  formula_version: 1;
}

export interface JobFitResult {
  composite: number;
  status: RecommendationStatus;
  scores: Partial<Record<BundleTestCode, number>>;
  breakdown: JobFitBreakdown;
}

/** Instruments that count for this level. MSDT is dropped when requires_msdt is false. */
export function scoredBundleCodes(profile: Pick<LevelProfile, 'requires_msdt'>): BundleTestCode[] {
  return profile.requires_msdt === false
    ? BUNDLE_TEST_CODES.filter((code) => code !== 'msdt')
    : [...BUNDLE_TEST_CODES];
}

export type JobFitFailure = { ok: false; missing: BundleTestCode[] };

export function statusFromComposite(
  composite: number,
  profile: Pick<LevelProfile, 'threshold_recommended' | 'threshold_considered'>
): RecommendationStatus {
  if (composite >= profile.threshold_recommended) return 'DIREKOMENDASIKAN';
  if (composite >= profile.threshold_considered) return 'DIPERTIMBANGKAN';
  return 'TIDAK_DIREKOMENDASIKAN';
}

/**
 * @param scoringByCode scoring_data JSON keyed by lowercase test code.
 * Returns the codes that could not be scored when any instrument is missing or malformed.
 */
export function computeJobFit(
  scoringByCode: Partial<Record<string, unknown>>,
  profile: LevelProfile
): ({ ok: true } & JobFitResult) | JobFitFailure {
  const active = scoredBundleCodes(profile);
  const scores: Partial<Record<BundleTestCode, number>> = {};
  const missing: BundleTestCode[] = [];

  for (const code of active) {
    const value = TEST_SCORERS[code](scoringByCode[code], profile);
    if (value == null) missing.push(code);
    else scores[code] = value;
  }
  if (missing.length > 0) return { ok: false, missing };

  const activeWeight = active.reduce((sum, code) => sum + profile.weights[code], 0) || 1;
  const composite = round2(
    active.reduce((sum, code) => sum + (scores[code] as number) * profile.weights[code], 0) / activeWeight
  );

  const belowMin = active.filter((code) => (scores[code] as number) < profile.min_scores[code]);
  let status = statusFromComposite(composite, profile);
  // A high composite cannot hide a clearly failing instrument.
  const gated = status === 'DIREKOMENDASIKAN' && belowMin.length > 0;
  if (gated) status = 'DIPERTIMBANGKAN';

  const tests: JobFitBreakdown['tests'] = {};
  for (const code of active) {
    tests[code] = {
      score: scores[code] as number,
      weight: profile.weights[code] / activeWeight,
      min_score: profile.min_scores[code],
      below_min: belowMin.includes(code),
    };
  }

  return {
    ok: true,
    composite,
    status,
    scores,
    breakdown: {
      level_code: profile.level_code,
      level_name: profile.level_name,
      tests,
      composite,
      thresholds: { recommended: profile.threshold_recommended, considered: profile.threshold_considered },
      below_min: belowMin,
      gated,
      formula_version: 1,
    },
  };
}

/** Builds a LevelProfile from a jabatan_level_profiles row. */
export function levelProfileFromRow(row: Record<string, any>): LevelProfile {
  const num = (v: unknown, fallback: number) => finite(v) ?? fallback;
  return {
    level_code: String(row.level_code),
    level_name: String(row.level_name),
    weights: {
      wpt: num(row.weight_wpt, 0.2),
      disc: num(row.weight_disc, 0.2),
      bigfive: num(row.weight_bigfive, 0.2),
      papi: num(row.weight_papi, 0.2),
      msdt: num(row.weight_msdt, 0.2),
    },
    min_scores: {
      wpt: num(row.min_score_wpt, 50),
      disc: num(row.min_score_disc, 50),
      bigfive: num(row.min_score_bigfive, 50),
      papi: num(row.min_score_papi, 50),
      msdt: num(row.min_score_msdt, 50),
    },
    threshold_recommended: num(row.threshold_recommended, 75),
    threshold_considered: num(row.threshold_considered, 55),
    dimension_profiles: (asObject(row.dimension_profiles) as DimensionProfiles) || {},
    requires_msdt: row.requires_msdt !== false && row.requires_msdt !== 'f',
  };
}

// ---------------------------------------------------------------------------
// Fit details (actual vs ideal), stored alongside the breakdown for reporting
// ---------------------------------------------------------------------------

export interface FitDetails {
  wpt?: { iq: number; floor: number; ceil: number };
  disc?: { dominant: string; ideal: string[] };
  bigfive?: Partial<Record<'E' | 'A' | 'C' | 'N' | 'O', { percent: number; weight: number }>>;
  papi?: { high: Array<{ aspect: string; value: number }>; low: Array<{ aspect: string; value: number }> };
  msdt?: { type: string; fit: number };
}

/** Collects the raw values behind each normalised score so the report can explain the match. */
export function buildFitDetails(scoringByCode: Partial<Record<string, unknown>>, profile: LevelProfile): FitDetails {
  const details: FitDetails = {};

  const wpt = asObject(scoringByCode.wpt);
  const iq = finite(wpt?.iq) ?? finite(wpt?.score);
  if (iq != null) {
    details.wpt = {
      iq,
      floor: profile.dimension_profiles.wpt?.floor ?? DEFAULT_WPT_FLOOR,
      ceil: profile.dimension_profiles.wpt?.ceil ?? DEFAULT_WPT_CEIL,
    };
  }

  const disc = asObject(scoringByCode.disc);
  const dominant = String(disc?.dominantLabel || '').toUpperCase().replace(/[^DISC]/g, '');
  if (dominant) {
    details.disc = {
      dominant,
      ideal: (profile.dimension_profiles.disc?.ideal || []).map((l) => String(l).toUpperCase()),
    };
  }

  const dims = asObject(asObject(scoringByCode.bigfive)?.dimensions);
  if (dims) {
    const weights = profile.dimension_profiles.bigfive || {};
    details.bigfive = {};
    for (const dim of ['E', 'A', 'C', 'N', 'O'] as const) {
      const percent = finite(dims[dim]?.percent);
      const weight = finite(weights[dim]);
      if (percent != null && weight != null && weight !== 0) details.bigfive[dim] = { percent, weight };
    }
  }

  const scores = asObject(asObject(scoringByCode.papi)?.scores);
  if (scores) {
    const cfg = profile.dimension_profiles.papi || {};
    const pick = (list?: string[]) =>
      (list || [])
        .map((aspect) => ({ aspect, value: finite(scores[aspect]) }))
        .filter((x): x is { aspect: string; value: number } => x.value != null);
    details.papi = { high: pick(cfg.high), low: pick(cfg.low) };
  }

  if (profile.requires_msdt !== false) {
    const msdt = asObject(scoringByCode.msdt);
    const type = String(msdt?.dominantType || '').trim();
    const fit = finite((profile.dimension_profiles.msdt || {})[type]);
    if (type && fit != null) details.msdt = { type, fit };
  }

  return details;
}
