import { WPT_CATEGORIES } from '@/lib/scoring/wpt';

/**
 * Builds the short "Skor / Ringkasan" text shown in the combined participant report
 * summary table. Never renders "undefined": scorers that only return a dominantLabel
 * (e.g. PAPI, Enneagram) fall back to a label derived from their own fields.
 */
export interface SummaryScoring {
  dominantLabel?: string | number | null;
  dominantType?: string | null;
  dominantInfo?: { name?: string } | null;
  wingCode?: string | null;
  score?: string | number;
  wptScore?: string | number;
  raw_score?: string | number | null;
  iq?: string | number | null;
  label?: string | null;
  type?: string | null;
  interestCode?: string | null;
  ranking?: string[] | null;
  quadrantScores?: Record<string, number | null> | null;
  total_answers?: number;
  dimensions?: Record<string, { category?: string | null }> | null;
}

const MSAI_QUADRANTS = ['Adhocracy', 'Market', 'Hierarchy', 'Clan'] as const;

export const BIG_FIVE_SECTION_TITLE = 'LAPORAN BIG FIVE INVENTORY (BFI)';

/** Prefix a detail-page heading so Big Five shares the same 1..N sequence as the other instruments. */
export function numberedSectionTitle(sectionNumber: number | null | undefined, title: string): string {
  if (sectionNumber == null || !Number.isFinite(sectionNumber) || sectionNumber < 1) return title;
  return `${Math.trunc(sectionNumber)}. ${title}`;
}

function finiteNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function labelForIq(iq: number): string {
  for (const category of WPT_CATEGORIES) {
    if (iq >= category.minIQ) return category.label;
  }
  return WPT_CATEGORIES[WPT_CATEGORIES.length - 1]?.label || '';
}

/**
 * WPT stores IQ on `score` (and `iq`). The raw correct-count is `raw_score` out of 50.
 * Never treat `score` as the raw count.
 */
export function readWptReportFigures(
  sc: Pick<SummaryScoring, 'raw_score' | 'iq' | 'score' | 'wptScore' | 'label'> | null | undefined
): { rawScore: number | null; iq: number | null; label: string } {
  const rawScore = finiteNumber(sc?.raw_score);
  const iq = finiteNumber(sc?.iq) ?? finiteNumber(sc?.score) ?? finiteNumber(sc?.wptScore);
  const provided = sc?.label != null ? String(sc.label).trim() : '';
  const label = provided || (iq != null ? labelForIq(iq) : '');
  return { rawScore, iq, label };
}

/** Highest Competing Values quadrant. Ties keep the canonical quadrant order and are joined. */
export function msaiMainProfile(
  scores: Record<string, number | null | undefined> | null | undefined
): string | null {
  if (!scores) return null;
  let best = Number.NEGATIVE_INFINITY;
  const winners: string[] = [];
  for (const name of MSAI_QUADRANTS) {
    const value = finiteNumber(scores[name]);
    if (value == null) continue;
    if (value > best) {
      best = value;
      winners.length = 0;
      winners.push(name);
    } else if (value === best) {
      winners.push(name);
    }
  }
  return winners.length > 0 ? winners.join(' / ') : null;
}

export function getResultSummary(
  code: string | null | undefined,
  sc: SummaryScoring | null | undefined
): string {
  if (!sc) return 'Selesai';
  const c = (code || '').toLowerCase();

  if (c === 'bigfive' && sc.dimensions) {
    const parts = ['E', 'A', 'C', 'N', 'O']
      .map((dim) => {
        const category = sc.dimensions?.[dim]?.category;
        return category ? `${dim} ${category}` : null;
      })
      .filter((part): part is string => Boolean(part));
    if (parts.length > 0) return parts.join(' · ');
  }

  if (c === 'enneagram' && sc.dominantLabel) {
    const label = /^\d+$/.test(String(sc.dominantLabel)) ? `Tipe ${sc.dominantLabel}` : String(sc.dominantLabel);
    const name = sc.dominantInfo?.name;
    const wing = sc.wingCode ? ` · Wing ${sc.wingCode}` : '';
    return name ? `${label} (${name})${wing}` : `${label}${wing}`;
  }

  if (c === 'mbti' && sc.type && String(sc.type).trim() && String(sc.type).trim() !== '----') {
    return String(sc.type).trim().toUpperCase();
  }

  if (c === 'riasec') {
    const code = String(sc.interestCode || '').trim() || (Array.isArray(sc.ranking) ? sc.ranking.slice(0, 3).join('') : '');
    if (code) return code.toUpperCase();
  }

  if (c === 'msai') {
    const profile = msaiMainProfile(sc.quadrantScores);
    if (profile) return profile;
  }

  if (sc.dominantLabel) {
    return sc.dominantType ? `${sc.dominantLabel} (${sc.dominantType})` : String(sc.dominantLabel);
  }
  if (sc.score !== undefined || sc.wptScore !== undefined) {
    return `Skor Kognitif: ${sc.score ?? sc.wptScore}`;
  }
  if (sc.total_answers) return `${sc.total_answers} Terjawab`;
  return 'Selesai';
}
