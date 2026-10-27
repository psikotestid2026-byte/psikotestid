import type { DiscDimension, DiscGraphValues } from '@/lib/scoring/disc';

const ORDER: DiscDimension[] = ['D', 'I', 'S', 'C'];

export type DiscSpecialStatusName = 'Transisi' | 'Super Syndrom' | 'Undershift';

/**
 * Rank D, I, S, C from highest graph value to lowest.
 * Equal values keep the fixed order D, I, S, C.
 */
export function rankDiscDimensions(graph: DiscGraphValues): DiscDimension[] {
  return [...ORDER].sort((a, b) => {
    const delta = graph[b] - graph[a];
    if (delta !== 0) return delta;
    return ORDER.indexOf(a) - ORDER.indexOf(b);
  });
}

/**
 * calcType from refs/disc.md section 4.4.
 * Dimensions with value >= 0, highest first, joined with '-'.
 * When every value is negative, the code is the single highest dimension.
 * This does not replace dominantDiscCode(), which scoring still stores.
 */
export function calcDiscType(graph: DiscGraphValues): string {
  const ranked = rankDiscDimensions(graph);
  const kept = ranked.filter((dimension) => graph[dimension] >= 0);
  const chosen = kept.length > 0 ? kept : [ranked[0]];
  return chosen.join('-');
}

/**
 * checkStatus from refs/disc.md section 4.5.
 * Transisi is tested first because its closed range overlaps the other two
 * when every score sits near zero.
 */
export function checkDiscStatus(graph: DiscGraphValues): DiscSpecialStatusName | null {
  const values = ORDER.map((dimension) => graph[dimension]);
  if (values.every((value) => value >= -2 && value <= 2)) return 'Transisi';
  if (values.every((value) => value > 0)) return 'Super Syndrom';
  if (values.every((value) => value < 0)) return 'Undershift';
  return null;
}

/** Single-dimension codes use the report form "I MURNI". Multi-dimension codes keep the dashes. */
export function formatDiscKode(code: string): string {
  return code.includes('-') ? code : `${code} MURNI`;
}

/** Dimensions with value >= 0, in calcType order. Empty when every value is negative. */
export function discPositiveDimensions(graph: DiscGraphValues): DiscDimension[] {
  return rankDiscDimensions(graph).filter((dimension) => graph[dimension] >= 0);
}

/** Highest dimension on Grafik III (scaleChange). Tie-break D > I > S > C. */
export function discMainDimension(change: DiscGraphValues): DiscDimension {
  return rankDiscDimensions(change)[0];
}
