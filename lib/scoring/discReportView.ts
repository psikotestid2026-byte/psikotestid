import type { DiscDimension, DiscGraphValues } from '@/lib/scoring/disc';
import {
  calcDiscType,
  checkDiscStatus,
  discMainDimension,
  discPositiveDimensions,
  formatDiscKode,
  type DiscSpecialStatusName,
} from '@/lib/scoring/discPatternCode';
import {
  bundledDiscReportDictionary,
  discStatusKey,
  findDiscTypeInfo,
  type DiscGraphKey,
  type DiscPatternPoint,
  type DiscReportDictionary,
  type DiscTraitDimension,
} from '@/lib/scoring/discReportDictionary';

export interface DiscGraphCardModel {
  key: DiscGraphKey;
  title: string;
  label: string;
  values: DiscGraphValues;
  code: string;
  kodeText: string | null;
  status: DiscSpecialStatusName | null;
  patternName: string;
  matchedCode: string | null;
}

export interface DiscDescriptionBlock {
  graphKeys: DiscGraphKey[];
  header: string;
  kind: 'type' | 'status';
  code: string;
  kodeText: string | null;
  patternName: string;
  description: string;
  jobs: string[];
  characteristics: DiscPatternPoint[];
  cautions: string[];
  motivators: string;
  status: DiscSpecialStatusName | null;
  arti: string;
  context: string;
}

export interface DiscTraitAspect {
  label: string;
  items: string[];
}

export interface DiscTraitSummary {
  heading: string;
  dims: DiscTraitDimension[];
  aspects: DiscTraitAspect[];
}

export interface DiscDevelopmentAdvice {
  items: string[];
}

const GRAPH_FACE: Record<DiscGraphKey, { title: string; label: string }> = {
  g1: { title: 'Grafik I', label: 'Adaptif / Public Self / MOST' },
  g2: { title: 'Grafik II', label: 'Alami / Private Self / LEAST' },
  g3: { title: 'Grafik III', label: 'Gabungan / Perceived Self / CHANGE' },
};

const GRAPH_KEYS: DiscGraphKey[] = ['g1', 'g2', 'g3'];
const TRAIT_ORDER: DiscTraitDimension[] = ['D', 'I', 'S', 'C'];

const TRAIT_ASPECTS: { key: 'potretDiri' | 'kelebihan' | 'kekurangan' | 'kecenderungan' | 'lingkunganCocok'; label: string }[] = [
  { key: 'potretDiri', label: 'Potret Diri' },
  { key: 'kelebihan', label: 'Kelebihan' },
  { key: 'kekurangan', label: 'Kekurangan' },
  { key: 'kecenderungan', label: 'Kecenderungan' },
  { key: 'lingkunganCocok', label: 'Lingkungan Cocok' },
];

function readValues(source: Record<string, unknown> | null | undefined): DiscGraphValues {
  const record = source || {};
  return {
    D: Number.isFinite(Number(record.D)) ? Number(record.D) : 0,
    I: Number.isFinite(Number(record.I)) ? Number(record.I) : 0,
    S: Number.isFinite(Number(record.S)) ? Number(record.S) : 0,
    C: Number.isFinite(Number(record.C)) ? Number(record.C) : 0,
  };
}

function readGraphs(scoring: Record<string, unknown> | null | undefined): Record<DiscGraphKey, DiscGraphValues> {
  const source = scoring || {};
  return {
    g1: readValues(source.g1 as Record<string, unknown> | undefined),
    g2: readValues(source.g2 as Record<string, unknown> | undefined),
    g3: readValues(source.g3 as Record<string, unknown> | undefined),
  };
}

/** Status replaces the type code, so that graph contributes no dimensions. */
function contributedDimensions(values: DiscGraphValues): DiscDimension[] {
  if (checkDiscStatus(values)) return [];
  return discPositiveDimensions(values);
}

export function discCoreDimensions(graphs: Record<DiscGraphKey, DiscGraphValues>): DiscTraitDimension[] {
  const lists = GRAPH_KEYS.map((key) => contributedDimensions(graphs[key]));
  const intersection = TRAIT_ORDER.filter((dimension) => lists.every((list) => list.includes(dimension)));
  if (intersection.length > 0) return intersection;
  if (lists[0].length > 0) return lists[0];
  return [discMainDimension(graphs.g3)];
}

export function discDevelopmentDimensions(graphs: Record<DiscGraphKey, DiscGraphValues>): DiscTraitDimension[] {
  const result: DiscTraitDimension[] = [];
  for (const key of GRAPH_KEYS) {
    for (const dimension of contributedDimensions(graphs[key])) {
      if (!result.includes(dimension)) result.push(dimension);
    }
  }
  return result;
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

export function buildDiscGraphCards(
  scoring: Record<string, unknown> | null | undefined,
  dictionary: DiscReportDictionary = bundledDiscReportDictionary()
): DiscGraphCardModel[] {
  const graphs = readGraphs(scoring);
  return GRAPH_KEYS.map((key) => {
    const face = GRAPH_FACE[key];
    const values = graphs[key];
    const code = calcDiscType(values);
    const status = checkDiscStatus(values);
    const found = findDiscTypeInfo(dictionary, code);
    return {
      key,
      title: face.title,
      label: face.label,
      values,
      code,
      kodeText: status ? null : formatDiscKode(code),
      status,
      patternName: status ? '' : found.pattern?.name || '',
      matchedCode: status ? null : found.matchedCode,
    };
  });
}

function blockHeader(cards: DiscGraphCardModel[], patternName: string, kodeText: string | null, status: string | null): string {
  const faces = cards.map((card) => `${card.title} (${card.label})`).join(' & ');
  if (status) return `${faces} · ${status}`;
  const parts = [faces];
  if (kodeText) parts.push(`KODE: ${kodeText}`);
  if (patternName) parts.push(patternName);
  return parts.join(' · ');
}

/**
 * Graphs that share a calcType code become one block.
 * A special status replaces the code. Transisi stays separate per graph
 * because section 4.5 gives each graph its own context sentence.
 * Super Syndrom and Undershift share one explanation, so those graphs merge.
 */
export function mergeDiscDescriptionBlocks(
  cards: DiscGraphCardModel[],
  dictionary: DiscReportDictionary = bundledDiscReportDictionary()
): DiscDescriptionBlock[] {
  const order: string[] = [];
  const groups = new Map<string, DiscGraphCardModel[]>();
  for (const card of cards) {
    const statusRecord = card.status ? dictionary.statuses[discStatusKey(card.status, card.key)] : undefined;
    const groupKey = card.status
      ? `status:${card.status}:${statusRecord?.arti || ''}:${statusRecord?.context || ''}`
      : `code:${card.code}`;
    const existing = groups.get(groupKey);
    if (!existing) {
      groups.set(groupKey, [card]);
      order.push(groupKey);
    } else {
      existing.push(card);
    }
  }

  return order.map((groupKey) => {
    const group = groups.get(groupKey) || [];
    const first = group[0];
    if (first.status) {
      const record = dictionary.statuses[discStatusKey(first.status, first.key)];
      return {
        graphKeys: group.map((card) => card.key),
        header: blockHeader(group, '', null, first.status),
        kind: 'status',
        code: first.code,
        kodeText: null,
        patternName: '',
        description: '',
        jobs: [],
        characteristics: [],
        cautions: [],
        motivators: '',
        status: first.status,
        arti: record?.arti || '',
        context: record?.context || '',
      };
    }
    const found = findDiscTypeInfo(dictionary, first.code);
    const patternName = found.pattern?.name || '';
    return {
      graphKeys: group.map((card) => card.key),
      header: blockHeader(group, patternName, first.kodeText, null),
      kind: 'type',
      code: first.code,
      kodeText: first.kodeText,
      patternName,
      description: found.pattern?.description || '',
      jobs: found.pattern?.jobs || [],
      characteristics: found.pattern?.characteristics || [],
      cautions: found.pattern?.cautions || [],
      motivators: found.pattern?.motivators || '',
      status: null,
      arti: '',
      context: '',
    };
  });
}

export function buildDiscTraitSummary(
  scoring: Record<string, unknown> | null | undefined,
  dictionary: DiscReportDictionary = bundledDiscReportDictionary()
): DiscTraitSummary {
  const graphs = readGraphs(scoring);
  const dims = discCoreDimensions(graphs);
  const heading = ['Kamus Trait Dimensi Utama', ...dims.map((dim) => dictionary.traits[dim].heading)].join(' · ');
  const aspects = TRAIT_ASPECTS.map((aspect) => ({
    label: aspect.label,
    items: uniqueInOrder(dims.flatMap((dim) => dictionary.traits[dim][aspect.key])),
  }));
  return { heading, dims, aspects };
}

export function buildDiscDevelopmentAdvice(
  scoring: Record<string, unknown> | null | undefined,
  dictionary: DiscReportDictionary = bundledDiscReportDictionary()
): DiscDevelopmentAdvice {
  const graphs = readGraphs(scoring);
  const dims = discDevelopmentDimensions(graphs);
  return {
    items: uniqueInOrder(dims.flatMap((dim) => dictionary.traits[dim].saranPerbaikan)),
  };
}
