import type { DiscDimension, DiscGraphValues } from '@/lib/scoring/disc';

const ORDER: DiscDimension[] = ['D', 'I', 'S', 'C'];

/**
 * Rank D, I, S, C from highest graph value to lowest.
 * Equal values keep the fixed order D, I, S, C so the result does not depend on engine sort stability.
 */
export function rankDiscDimensions(graph: DiscGraphValues): DiscDimension[] {
  return [...ORDER].sort((a, b) => {
    const delta = graph[b] - graph[a];
    if (delta !== 0) return delta;
    return ORDER.indexOf(a) - ORDER.indexOf(b);
  });
}

/**
 * Pattern code for one DISC graph in the v3 report.
 * Positive dimensions (value > 0) are joined from highest to lowest.
 * Exactly one positive dimension, or none, becomes "<X> MURNI" (the single highest when none are positive).
 * Four positive dimensions collapse to the top three.
 * This does not replace dominantDiscCode(), which scoring still stores.
 */
export function discGraphPatternCode(graph: DiscGraphValues): string {
  const ranked = rankDiscDimensions(graph);
  const positive = ranked.filter((dimension) => graph[dimension] > 0);
  if (positive.length === 0) return `${ranked[0]} MURNI`;
  if (positive.length === 1) return `${positive[0]} MURNI`;
  return positive.slice(0, 3).join('');
}

/** Every code discGraphPatternCode can emit: 4 pure, 12 pairs, 24 triples. */
export function reachableDiscPatternCodes(): string[] {
  const letters = ORDER;
  const codes: string[] = [];
  for (const letter of letters) codes.push(`${letter} MURNI`);

  for (let i = 0; i < letters.length; i++) {
    for (let j = 0; j < letters.length; j++) {
      if (i === j) continue;
      codes.push(`${letters[i]}${letters[j]}`);
    }
  }

  for (let i = 0; i < letters.length; i++) {
    for (let j = 0; j < letters.length; j++) {
      if (i === j) continue;
      for (let k = 0; k < letters.length; k++) {
        if (k === i || k === j) continue;
        codes.push(`${letters[i]}${letters[j]}${letters[k]}`);
      }
    }
  }

  return codes;
}

export interface DiscSubTraitPair {
  pairKey: string;
  high: DiscDimension;
  low: DiscDimension;
}

/**
 * Same high/low pair the scorer uses (highest dimension + lowest dimension).
 * A flat graph, where the highest value equals the lowest, is reported as BALANCE.
 * The stored English subTraits field is left unchanged.
 */
export function discSubTraitPair(graph: DiscGraphValues): DiscSubTraitPair {
  const ranked = rankDiscDimensions(graph);
  const high = ranked[0];
  const low = ranked[3];
  if (graph[high] === graph[low]) {
    return { pairKey: 'BALANCE', high, low };
  }
  return { pairKey: `${high}${low}`, high, low };
}
