import type { DimensionProfiles } from '@/lib/jobFit';

export const LEVEL_CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,29}$/;
export const BUNDLE_TESTS = ['wpt', 'disc', 'bigfive', 'papi', 'msdt'] as const;
const DISC_LETTERS = ['D', 'I', 'S', 'C'];
const BIGFIVE_KEYS = ['E', 'A', 'C', 'N', 'O'];
const PAPI_ASPECTS = 'NGALPITVXSBORDCZEKFW'.split('');
const MSDT_TYPES = ['E', 'Dv', 'Ba', 'Bu', 'Mi', 'Co', 'Au', 'Ds'];

function isFiniteBetween(v: unknown, min: number, max: number): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
}

/** Returns an Indonesian error message, or null when the profile is valid. */
export function validateDimensionProfiles(input: unknown): string | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'Profil dimensi harus berupa objek.';
  const d = input as DimensionProfiles;

  if (d.wpt) {
    const { floor, ceil } = d.wpt;
    if (floor != null && !isFiniteBetween(floor, 0, 200)) return 'Batas bawah WPT tidak valid.';
    if (ceil != null && !isFiniteBetween(ceil, 0, 200)) return 'Batas atas WPT tidak valid.';
    if (floor != null && ceil != null && ceil <= floor) return 'Batas atas WPT harus lebih besar dari batas bawah.';
  }
  if (d.disc?.ideal) {
    if (!Array.isArray(d.disc.ideal) || d.disc.ideal.some((l) => !DISC_LETTERS.includes(String(l)))) {
      return 'Huruf DISC ideal hanya boleh D, I, S, atau C.';
    }
  }
  if (d.bigfive) {
    for (const [k, v] of Object.entries(d.bigfive)) {
      if (!BIGFIVE_KEYS.includes(k) || !isFiniteBetween(v, -1, 1)) return 'Bobot Big Five harus antara -1 dan 1.';
    }
  }
  if (d.papi) {
    for (const list of [d.papi.high, d.papi.low]) {
      if (list && (!Array.isArray(list) || list.some((a) => !PAPI_ASPECTS.includes(String(a))))) {
        return 'Aspek PAPI tidak dikenal.';
      }
    }
  }
  if (d.msdt) {
    for (const [k, v] of Object.entries(d.msdt)) {
      if (!MSDT_TYPES.includes(k) || !isFiniteBetween(v, 0, 100)) return 'Nilai MSDT harus antara 0 dan 100.';
    }
  }
  return null;
}

export interface ProfileInput {
  weights: Record<string, number>;
  min_scores: Record<string, number>;
  threshold_recommended: number;
  threshold_considered: number;
}

/** Validates numeric parts shared by create and update. */
export function validateProfileNumbers(body: any): { ok: true; value: ProfileInput } | { ok: false; error: string } {
  const weights: Record<string, number> = {};
  const min_scores: Record<string, number> = {};
  for (const t of BUNDLE_TESTS) {
    const w = Number(body?.weights?.[t]);
    const m = Number(body?.min_scores?.[t]);
    if (!isFiniteBetween(w, 0, 1)) return { ok: false, error: `Bobot ${t.toUpperCase()} tidak valid.` };
    if (!isFiniteBetween(m, 0, 100)) return { ok: false, error: `Skor minimum ${t.toUpperCase()} tidak valid.` };
    weights[t] = w;
    min_scores[t] = m;
  }
  const sum = BUNDLE_TESTS.reduce((s, t) => s + weights[t], 0);
  if (Math.abs(sum - 1) > 0.01) return { ok: false, error: 'Total bobot harus sama dengan 100%.' };

  const rec = Number(body?.threshold_recommended);
  const con = Number(body?.threshold_considered);
  if (!isFiniteBetween(rec, 0, 100) || !isFiniteBetween(con, 0, 100) || con >= rec) {
    return { ok: false, error: 'Ambang Direkomendasikan harus lebih besar dari ambang Dipertimbangkan.' };
  }
  return { ok: true, value: { weights, min_scores, threshold_recommended: rec, threshold_considered: con } };
}
