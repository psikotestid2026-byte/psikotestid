import type { DiscGraphValues } from '@/lib/scoring/disc';
import { discGraphPatternCode, discSubTraitPair } from '@/lib/scoring/discPatternCode';
import {
  bundledDiscReportDictionary,
  fillDiscName,
  type DiscGraphKey,
  type DiscReportDictionary,
} from '@/lib/scoring/discReportDictionary';

export interface DiscGraphCardModel {
  key: DiscGraphKey;
  title: string;
  subtitle: string;
  values: DiscGraphValues;
  code: string;
  patternName: string;
  subTraitLabel: string;
  meaning: string;
  blockTitle: string;
  pairKey: string;
}

export interface DiscSubTraitSection {
  pairKey: string;
  heading: string;
  narrative: string;
}

export interface DiscDescriptionBlock {
  graphKeys: DiscGraphKey[];
  header: string;
  meanings: string[];
  code: string;
  patternName: string;
  description: string;
  subTraits: DiscSubTraitSection[];
  jobs: string[];
}

const GRAPH_FACE: Record<DiscGraphKey, { title: string; subtitle: string; marker: string; mode: string }> = {
  g1: {
    title: 'GRAPH 1',
    subtitle: 'MOST Mask, Public Self',
    marker: '1',
    mode: 'MOST',
  },
  g2: {
    title: 'GRAPH 2',
    subtitle: 'LEAST Core, Private Self',
    marker: '2',
    mode: 'LEAST',
  },
  g3: {
    title: 'GRAPH 3',
    subtitle: 'CHANGE Mirror, Perceived Self',
    marker: '3',
    mode: 'CHANGE',
  },
};

function readValues(source: Record<string, any> | null | undefined): DiscGraphValues {
  return {
    D: Number.isFinite(Number(source?.D)) ? Number(source?.D) : 0,
    I: Number.isFinite(Number(source?.I)) ? Number(source?.I) : 0,
    S: Number.isFinite(Number(source?.S)) ? Number(source?.S) : 0,
    C: Number.isFinite(Number(source?.C)) ? Number(source?.C) : 0,
  };
}

export function buildDiscGraphCards(
  scoring: Record<string, any> | null | undefined,
  dictionary: DiscReportDictionary = bundledDiscReportDictionary()
): DiscGraphCardModel[] {
  const keys: DiscGraphKey[] = ['g1', 'g2', 'g3'];
  return keys.map((key) => {
    const face = GRAPH_FACE[key];
    const values = readValues(scoring?.[key]);
    const code = discGraphPatternCode(values);
    const pair = discSubTraitPair(values);
    const pattern = dictionary.patterns[code];
    const subTrait = dictionary.subTraits[pair.pairKey];
    const meaning = dictionary.graphMeanings[key];
    return {
      key,
      title: face.title,
      subtitle: face.subtitle,
      values,
      code,
      patternName: pattern?.name || code,
      subTraitLabel: subTrait?.pairLabel || pair.pairKey,
      meaning: meaning.meaning,
      blockTitle: meaning.title,
      pairKey: pair.pairKey,
    };
  });
}

function uniqueInOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

export function discDescriptionHeader(cards: DiscGraphCardModel[], patternName: string): string {
  const titles = uniqueInOrder(cards.map((card) => card.blockTitle.replace(/^DESKRIPSI /, '')));
  const title = `DESKRIPSI ${titles.join(' & ')}`;
  const graphList = `GRAPH ${cards.map((card) => GRAPH_FACE[card.key].marker).join(' & ')}`;
  const modes = cards.map((card) => GRAPH_FACE[card.key].mode).join(' & ');
  return `${title} — ${graphList} (${modes}) (${patternName})`;
}

/**
 * Graphs that share a pattern code become one description block.
 * Order follows the first time each code appears from Graph 1 to Graph 3,
 * so Graph 1 and Graph 3 can merge even when Graph 2 sits between them.
 */
export function mergeDiscDescriptionBlocks(
  cards: DiscGraphCardModel[],
  dictionary: DiscReportDictionary,
  participantName: string | null | undefined
): DiscDescriptionBlock[] {
  const order: string[] = [];
  const groups = new Map<string, DiscGraphCardModel[]>();
  for (const card of cards) {
    const existing = groups.get(card.code);
    if (!existing) {
      groups.set(card.code, [card]);
      order.push(card.code);
    } else {
      existing.push(card);
    }
  }

  return order.map((code) => {
    const group = groups.get(code) || [];
    const pattern = dictionary.patterns[code];
    const patternName = pattern?.name || group[0]?.patternName || code;
    const subTraits: DiscSubTraitSection[] = [];
    const seenPairs = new Set<string>();
    for (const card of group) {
      if (seenPairs.has(card.pairKey)) continue;
      seenPairs.add(card.pairKey);
      const record = dictionary.subTraits[card.pairKey];
      const label = record?.pairLabel || card.subTraitLabel;
      subTraits.push({
        pairKey: card.pairKey,
        heading: `SUB TRAIT — ${label.toLocaleUpperCase('id-ID')}`,
        narrative: fillDiscName(record?.narrative || '', participantName),
      });
    }
    return {
      graphKeys: group.map((card) => card.key),
      header: discDescriptionHeader(group, patternName),
      meanings: group.map((card) => card.meaning),
      code,
      patternName,
      description: fillDiscName(pattern?.description || '', participantName),
      subTraits,
      jobs: pattern?.jobs || [],
    };
  });
}
