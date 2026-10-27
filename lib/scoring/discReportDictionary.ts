import {
  DISC_DIMENSION_TRAIT_ROWS,
  DISC_PATTERN_ROWS,
  DISC_SPECIAL_STATUS_ROWS,
} from '@/lib/scoring/discKamusData';

export type DiscGraphKey = 'g1' | 'g2' | 'g3';
export type DiscTraitDimension = 'D' | 'I' | 'S' | 'C';
export type DiscSpecialStatusName = 'Transisi' | 'Super Syndrom' | 'Undershift';

export interface DiscPatternPoint {
  label: string;
  text: string;
}

export interface DiscPatternRecord {
  code: string;
  name: string;
  description: string;
  jobs: string[];
  characteristics?: DiscPatternPoint[] | null;
  cautions?: string[] | null;
  motivators?: string | null;
}

export interface DiscDimensionTraitRecord {
  dim: DiscTraitDimension;
  heading: string;
  potretDiri: string[];
  kelebihan: string[];
  kekurangan: string[];
  kecenderungan: string[];
  lingkunganCocok: string[];
  saranPerbaikan: string[];
}

export interface DiscSpecialStatusRecord {
  status: DiscSpecialStatusName;
  graphKey: DiscGraphKey;
  arti: string;
  context: string;
}

export interface DiscReportDictionary {
  patterns: Record<string, DiscPatternRecord>;
  traits: Record<DiscTraitDimension, DiscDimensionTraitRecord>;
  statuses: Record<string, DiscSpecialStatusRecord>;
}

export const DISC_PATTERN_LIST = DISC_PATTERN_ROWS as DiscPatternRecord[];
export const DISC_DIMENSION_TRAIT_LIST = DISC_DIMENSION_TRAIT_ROWS as DiscDimensionTraitRecord[];
export const DISC_SPECIAL_STATUS_LIST = DISC_SPECIAL_STATUS_ROWS as DiscSpecialStatusRecord[];

export const DISC_PATTERN_CODES: string[] = DISC_PATTERN_LIST.map((row) => row.code);

function indexBy<T extends object>(rows: T[], key: keyof T): Record<string, T> {
  return Object.fromEntries(rows.map((row) => [String(row[key]), row]));
}

export function discStatusKey(status: string, graphKey: string): string {
  return `${status}|${graphKey}`;
}

export function bundledDiscReportDictionary(): DiscReportDictionary {
  return {
    patterns: indexBy(DISC_PATTERN_LIST, 'code'),
    traits: indexBy(DISC_DIMENSION_TRAIT_LIST, 'dim') as Record<DiscTraitDimension, DiscDimensionTraitRecord>,
    statuses: Object.fromEntries(
      DISC_SPECIAL_STATUS_LIST.map((row) => [discStatusKey(row.status, row.graphKey), row])
    ),
  };
}

/**
 * findTypeInfo from refs/disc.md section 5.
 * Full code, then the first two dimensions, then the first dimension.
 * No match leaves the code without a name, description, or profession list.
 */
export function findDiscTypeInfo(
  dictionary: DiscReportDictionary,
  code: string
): { matchedCode: string | null; pattern: DiscPatternRecord | null } {
  const parts = code.split('-').filter(Boolean);
  const keys: string[] = [];
  if (parts.length > 0) keys.push(parts.join('-'));
  if (parts.length >= 2) keys.push(parts.slice(0, 2).join('-'));
  if (parts.length >= 1) keys.push(parts[0]);

  const seen = new Set<string>();
  for (const key of keys) {
    if (seen.has(key)) continue;
    seen.add(key);
    const pattern = dictionary.patterns[key];
    if (pattern) return { matchedCode: key, pattern };
  }
  return { matchedCode: null, pattern: null };
}

export interface DiscDictionaryRows {
  patterns: {
    code: string;
    name: string;
    description: string;
    jobs: unknown;
    characteristics?: unknown;
    cautions?: unknown;
    motivators?: unknown;
  }[];
  traits: {
    dim: string;
    heading: string;
    potretDiri: unknown;
    kelebihan: unknown;
    kekurangan: unknown;
    kecenderungan: unknown;
    lingkunganCocok: unknown;
    saranPerbaikan: unknown;
  }[];
  statuses: { status: string; graphKey: string; arti: string; context: string }[];
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function pickList(value: unknown, current: string[] | undefined): string[] {
  const list = asStringList(value);
  return list.length > 0 ? list : current || [];
}

function asCharacteristicList(value: unknown): DiscPatternPoint[] | null {
  let source = value;
  if (typeof value === 'string') {
    try {
      source = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(source)) return null;
  const points: DiscPatternPoint[] = [];
  for (const item of source) {
    if (!item || typeof item !== 'object') continue;
    const label = String((item as { label?: unknown }).label || '').trim();
    const text = String((item as { text?: unknown }).text || '').trim();
    if (!label || !text) continue;
    points.push({ label, text });
  }
  return points.length > 0 ? points : null;
}

const TRAIT_DIMS = new Set<DiscTraitDimension>(['D', 'I', 'S', 'C']);
const STATUS_NAMES = new Set<DiscSpecialStatusName>(['Transisi', 'Super Syndrom', 'Undershift']);
const GRAPH_KEYS = new Set<DiscGraphKey>(['g1', 'g2', 'g3']);

/** DB rows override the bundled copy per key. Empty result sets keep the bundled dictionary. */
export function mergeDiscDictionary(
  fallback: DiscReportDictionary,
  rows: DiscDictionaryRows | null | undefined
): DiscReportDictionary {
  if (!rows) return fallback;
  const hasPatterns = rows.patterns.length > 0;
  const hasTraits = rows.traits.length > 0;
  const hasStatuses = rows.statuses.length > 0;
  if (!hasPatterns && !hasTraits && !hasStatuses) return fallback;

  const patterns = { ...fallback.patterns };
  if (hasPatterns) {
    for (const row of rows.patterns) {
      const code = String(row.code || '').trim();
      if (!code) continue;
      const current = patterns[code];
      const jobs = asStringList(row.jobs);
      const characteristics =
        row.characteristics == null
          ? current?.characteristics ?? null
          : asCharacteristicList(row.characteristics) ?? current?.characteristics ?? null;
      const cautions =
        row.cautions == null ? current?.cautions ?? null : pickList(row.cautions, current?.cautions ?? undefined);
      const motivatorText = String(row.motivators ?? '').trim();
      patterns[code] = {
        code,
        name: String(row.name || current?.name || '').trim(),
        description: String(row.description || current?.description || '').trim(),
        jobs: jobs.length > 0 ? jobs : current?.jobs || [],
        characteristics,
        cautions: cautions && cautions.length > 0 ? cautions : null,
        motivators: motivatorText || current?.motivators || null,
      };
    }
  }

  const traits = { ...fallback.traits };
  if (hasTraits) {
    for (const row of rows.traits) {
      const dim = String(row.dim || '').trim() as DiscTraitDimension;
      if (!TRAIT_DIMS.has(dim)) continue;
      const current = traits[dim];
      traits[dim] = {
        dim,
        heading: String(row.heading || current?.heading || dim).trim(),
        potretDiri: pickList(row.potretDiri, current?.potretDiri),
        kelebihan: pickList(row.kelebihan, current?.kelebihan),
        kekurangan: pickList(row.kekurangan, current?.kekurangan),
        kecenderungan: pickList(row.kecenderungan, current?.kecenderungan),
        lingkunganCocok: pickList(row.lingkunganCocok, current?.lingkunganCocok),
        saranPerbaikan: pickList(row.saranPerbaikan, current?.saranPerbaikan),
      };
    }
  }

  const statuses = { ...fallback.statuses };
  if (hasStatuses) {
    for (const row of rows.statuses) {
      const status = String(row.status || '').trim() as DiscSpecialStatusName;
      const graphKey = String(row.graphKey || '').trim() as DiscGraphKey;
      if (!STATUS_NAMES.has(status) || !GRAPH_KEYS.has(graphKey)) continue;
      const current = statuses[discStatusKey(status, graphKey)];
      const context = String(row.context ?? '').trim();
      statuses[discStatusKey(status, graphKey)] = {
        status,
        graphKey,
        arti: String(row.arti || current?.arti || '').trim(),
        context: context || current?.context || '',
      };
    }
  }

  return { patterns, traits, statuses };
}

function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function jsonb(value: unknown): string {
  return `${sqlLiteral(JSON.stringify(value))}::jsonb`;
}

function jsonbOrNull(value: unknown): string {
  if (value == null) return 'NULL';
  return jsonb(value);
}

function textOrNull(value: string | null | undefined): string {
  if (value == null || value.trim() === '') return 'NULL';
  return sqlLiteral(value);
}

export function renderDiscDictionarySeedSql(): string {
  const patternValues = DISC_PATTERN_LIST.map((row, index) => {
    const suffix = index === DISC_PATTERN_LIST.length - 1 ? '' : ',';
    return `  (${sqlLiteral(row.code)}, ${sqlLiteral(row.name)}, ${sqlLiteral(row.description)}, ${jsonb(row.jobs)}, ${jsonbOrNull(row.characteristics)}, ${jsonbOrNull(row.cautions)}, ${textOrNull(row.motivators)}, TRUE, NOW())${suffix}`;
  });
  const traitValues = DISC_DIMENSION_TRAIT_LIST.map((row, index) => {
    const suffix = index === DISC_DIMENSION_TRAIT_LIST.length - 1 ? '' : ',';
    return `  (${sqlLiteral(row.dim)}, ${sqlLiteral(row.heading)}, ${jsonb(row.potretDiri)}, ${jsonb(row.kelebihan)}, ${jsonb(row.kekurangan)}, ${jsonb(row.kecenderungan)}, ${jsonb(row.lingkunganCocok)}, ${jsonb(row.saranPerbaikan)}, NOW())${suffix}`;
  });
  const statusValues = DISC_SPECIAL_STATUS_LIST.map((row, index) => {
    const suffix = index === DISC_SPECIAL_STATUS_LIST.length - 1 ? '' : ',';
    return `  (${sqlLiteral(row.status)}, ${sqlLiteral(row.graphKey)}, ${sqlLiteral(row.arti)}, ${sqlLiteral(row.context)}, NOW())${suffix}`;
  });
  const codeList = DISC_PATTERN_CODES.map((code) => sqlLiteral(code)).join(', ');

  return [
    '-- Idempotent DISC kamus seed. Strings are copied from refs/disc.md and refs/kamus-tambahan-ID-ICD.md.',
    '-- Re-running updates section 5 patterns, section 6 traits, section 4.5 statuses, and the I-D / I-C-D supplement.',
    '-- Pattern codes outside the bundled list are marked inactive. Sub-trait and graph-meaning rows are marked inactive.',
    '',
    'INSERT INTO disc_patterns (code, name, description, jobs, characteristics, cautions, motivators, is_active, updated_at)',
    'VALUES',
    ...patternValues,
    'ON CONFLICT (code) DO UPDATE SET',
    '  name = EXCLUDED.name,',
    '  description = EXCLUDED.description,',
    '  jobs = EXCLUDED.jobs,',
    '  characteristics = EXCLUDED.characteristics,',
    '  cautions = EXCLUDED.cautions,',
    '  motivators = EXCLUDED.motivators,',
    '  is_active = EXCLUDED.is_active,',
    '  updated_at = NOW();',
    '',
    'UPDATE disc_patterns',
    'SET is_active = FALSE, updated_at = NOW()',
    `WHERE code NOT IN (${codeList});`,
    '',
    'UPDATE disc_subtraits',
    'SET is_active = FALSE;',
    '',
    'UPDATE disc_graph_meanings',
    'SET is_active = FALSE;',
    '',
    'INSERT INTO disc_dimension_traits (dim, heading, potret_diri, kelebihan, kekurangan, kecenderungan, lingkungan_cocok, saran_perbaikan, updated_at)',
    'VALUES',
    ...traitValues,
    'ON CONFLICT (dim) DO UPDATE SET',
    '  heading = EXCLUDED.heading,',
    '  potret_diri = EXCLUDED.potret_diri,',
    '  kelebihan = EXCLUDED.kelebihan,',
    '  kekurangan = EXCLUDED.kekurangan,',
    '  kecenderungan = EXCLUDED.kecenderungan,',
    '  lingkungan_cocok = EXCLUDED.lingkungan_cocok,',
    '  saran_perbaikan = EXCLUDED.saran_perbaikan,',
    '  updated_at = NOW();',
    '',
    'INSERT INTO disc_special_statuses (status, graph_key, arti, context, updated_at)',
    'VALUES',
    ...statusValues,
    'ON CONFLICT (status, graph_key) DO UPDATE SET',
    '  arti = EXCLUDED.arti,',
    '  context = EXCLUDED.context,',
    '  updated_at = NOW();',
    '',
  ].join('\n');
}
