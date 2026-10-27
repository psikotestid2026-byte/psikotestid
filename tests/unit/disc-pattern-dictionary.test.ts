import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { dominantDiscCode } from '@/lib/scoring/disc';
import { calcDiscType, checkDiscStatus, formatDiscKode } from '@/lib/scoring/discPatternCode';
import {
  DISC_PATTERN_CODES,
  bundledDiscReportDictionary,
  findDiscTypeInfo,
  mergeDiscDictionary,
  renderDiscDictionarySeedSql,
} from '@/lib/scoring/discReportDictionary';
import {
  buildDiscDevelopmentAdvice,
  buildDiscGraphCards,
  buildDiscTraitSummary,
  discCoreDimensions,
  mergeDiscDescriptionBlocks,
} from '@/lib/scoring/discReportView';

const screenshot = {
  g1: { D: 1, I: 5, S: -1, C: -6 },
  g2: { D: 1, I: 7, S: -2, C: 2 },
  g3: { D: -0.5, I: 1, S: -4, C: -4 },
};

const SECTION5_CODES = [
  'C',
  'D',
  'D-I',
  'D-I-S',
  'D-S',
  'D-C',
  'D-I-C',
  'D-S-I',
  'I',
  'I-S',
  'I-C',
  'I-S-C',
  'S',
  'S-C',
  'S-I',
  'S-I-C',
  'C-I',
  'C-D-I',
  'C-D-S',
  'C-S-D',
];

function parseKamus(markdown: string) {
  const section5 = markdown.split('## 5. Kamus Tipe')[1].split('## 6. Kamus Trait')[0];
  const patterns = [];
  for (const block of section5.split('\n### ').slice(1)) {
    const match = block.match(/^([A-Z](?:-[A-Z])*) — ([^\n]+)\n+(.+)\n\*\*Profesi cocok:\*\* ([^\n]+)/);
    if (!match || block.startsWith('Fallback')) continue;
    const jobs = match[4]
      .split(',')
      .map((job) => job.trim().replace(/\.$/, ''))
      .filter(Boolean);
    patterns.push({ code: match[1], name: match[2].trim(), description: match[3].trim(), jobs });
  }

  const section6 = markdown.split('## 6. Kamus Trait')[1].split('## 7. Struktur')[0];
  const aspectLabels = [
    ['potretDiri', 'Potret Diri'],
    ['kelebihan', 'Kelebihan'],
    ['kekurangan', 'Kekurangan'],
    ['kecenderungan', 'Kecenderungan'],
    ['lingkunganCocok', 'Lingkungan Cocok'],
    ['saranPerbaikan', 'Saran Perbaikan'],
  ] as const;
  const traits = [];
  for (const block of section6.split('\n### ').slice(1)) {
    const heading = block.match(/^([DISC]) — ([^\n]+)/);
    if (!heading) continue;
    const row: Record<string, string | string[]> = {
      dim: heading[1],
      heading: heading[0].split(' (warna')[0],
    };
    for (const [key, label] of aspectLabels) {
      const cell = block.match(new RegExp(`\\*\\*${label}\\*\\* \\| ([^|]+)\\|`));
      row[key] = cell ? cell[1].split(' · ').map((item) => item.trim()).filter(Boolean) : [];
    }
    traits.push(row);
  }

  const artis: Record<string, string> = {};
  for (const status of ['Transisi', 'Super Syndrom', 'Undershift']) {
    const row = markdown.match(new RegExp(`\\*\\*${status}\\*\\* \\| [^|]+\\| ([^|]+) \\|`));
    artis[status] = row ? row[1].trim() : '';
  }
  const context = markdown.match(/Grafik I \(([^)]+)\), Grafik II \(([^)]+)\), dan Grafik III \(([^)]+)\)/);
  return { patterns, traits, artis, context: context ? [context[1], context[2], context[3]] : [] };
}

describe('disc calcType and checkStatus', () => {
  it('resolves the screenshot graphs with kamus fallback', () => {
    expect(calcDiscType(screenshot.g1)).toBe('I-D');
    expect(calcDiscType(screenshot.g2)).toBe('I-C-D');
    expect(calcDiscType(screenshot.g3)).toBe('I');
    expect(formatDiscKode('I')).toBe('I MURNI');
    expect(formatDiscKode('I-C-D')).toBe('I-C-D');
    expect(checkDiscStatus(screenshot.g1)).toBeNull();
    expect(checkDiscStatus(screenshot.g2)).toBeNull();
    expect(checkDiscStatus(screenshot.g3)).toBeNull();

    const dictionary = bundledDiscReportDictionary();
    expect(findDiscTypeInfo(dictionary, 'I-D')).toMatchObject({ matchedCode: 'I', pattern: { name: 'COMMUNICATOR' } });
    expect(findDiscTypeInfo(dictionary, 'I-C-D')).toMatchObject({ matchedCode: 'I-C', pattern: { name: 'ASSESSOR' } });
    expect(findDiscTypeInfo(dictionary, 'I').pattern?.name).toBe('COMMUNICATOR');
  });

  it('keeps the stored dominant-code rule unchanged', () => {
    expect(dominantDiscCode(screenshot.g1)).toBe('I');
    expect(dominantDiscCode(screenshot.g2)).toBe('I');
    expect(dominantDiscCode(screenshot.g3)).toBe('I');
  });

  it('keeps zeros, breaks ties D > I > S > C, and covers the status edges', () => {
    expect(calcDiscType({ D: 1, I: 1, S: 0, C: -3 })).toBe('D-I-S');
    expect(calcDiscType({ D: 5, I: 4, S: 3, C: 0 })).toBe('D-I-S-C');
    expect(calcDiscType({ D: -8, I: 0, S: -3, C: -1 })).toBe('I');
    expect(calcDiscType({ D: -5, I: -1, S: -4, C: -8 })).toBe('I');
    expect(calcDiscType({ D: 2, I: -1, S: 5, C: -3 })).toBe('S-D');
    expect(findDiscTypeInfo(bundledDiscReportDictionary(), 'S-D-C').matchedCode).toBe('S');
    expect(findDiscTypeInfo(bundledDiscReportDictionary(), 'D-I-S-C').matchedCode).toBe('D-I');
    expect(findDiscTypeInfo(bundledDiscReportDictionary(), 'Z')).toEqual({ matchedCode: null, pattern: null });

    expect(checkDiscStatus({ D: 0, I: 0, S: 0, C: 0 })).toBe('Transisi');
    expect(checkDiscStatus({ D: 1, I: 1, S: 1, C: 1 })).toBe('Transisi');
    expect(checkDiscStatus({ D: -1, I: -1, S: -1, C: -1 })).toBe('Transisi');
    expect(checkDiscStatus({ D: 2, I: 2, S: 2, C: 2 })).toBe('Transisi');
    expect(checkDiscStatus({ D: 3, I: 3, S: 3, C: 3 })).toBe('Super Syndrom');
    expect(checkDiscStatus({ D: -3, I: -4, S: -5, C: -6 })).toBe('Undershift');
  });
});

describe('disc description blocks', () => {
  it('keeps three blocks for the screenshot codes and uses section 5 text', () => {
    const dictionary = bundledDiscReportDictionary();
    const cards = buildDiscGraphCards(screenshot, dictionary);
    const blocks = mergeDiscDescriptionBlocks(cards, dictionary);
    expect(blocks.map((block) => block.header)).toEqual([
      'Grafik I (Adaptif / Public Self / MOST) · KODE: I-D · COMMUNICATOR',
      'Grafik II (Alami / Private Self / LEAST) · KODE: I-C-D · ASSESSOR',
      'Grafik III (Gabungan / Perceived Self / CHANGE) · KODE: I MURNI · COMMUNICATOR',
    ]);
    expect(blocks[0].description).toBe(dictionary.patterns.I.description);
    expect(blocks[1].description).toBe(dictionary.patterns['I-C'].description);
    expect(blocks[1].jobs).toEqual(dictionary.patterns['I-C'].jobs);
    expect(blocks.every((block) => block.description.includes('{nama}'))).toBe(false);
  });

  it('merges graphs that share a code and keeps differing Transisi graphs apart', () => {
    const dictionary = bundledDiscReportDictionary();
    const shared = buildDiscGraphCards(
      {
        g1: { D: -1, I: 4, S: -2, C: -3 },
        g2: { D: 4, I: -1, S: -2, C: 1 },
        g3: { D: -2, I: 3, S: -1, C: -5 },
      },
      dictionary
    );
    expect(shared.map((card) => card.code)).toEqual(['I', 'D-C', 'I']);
    const merged = mergeDiscDescriptionBlocks(shared, dictionary);
    expect(merged.map((block) => block.graphKeys)).toEqual([['g1', 'g3'], ['g2']]);
    expect(merged[0].header).toBe(
      'Grafik I (Adaptif / Public Self / MOST) & Grafik III (Gabungan / Perceived Self / CHANGE) · KODE: I MURNI · COMMUNICATOR'
    );
    expect(merged[1].patternName).toBe('CHALLENGER');

    const flat = buildDiscGraphCards(
      {
        g1: { D: 0, I: 0, S: 0, C: 0 },
        g2: { D: 1, I: 1, S: 1, C: 1 },
        g3: { D: -1, I: -1, S: -1, C: -1 },
      },
      dictionary
    );
    const statusBlocks = mergeDiscDescriptionBlocks(flat, dictionary);
    expect(statusBlocks).toHaveLength(3);
    expect(statusBlocks.map((block) => block.context)).toEqual([
      'masalah lingkungan kerja/peran sosial',
      'masalah pribadi/keluarga yang memengaruhi stabilitas emosi dasar',
      'bimbang arah kontribusi/peran',
    ]);
    expect(statusBlocks[0].arti).toContain('belum menunjukkan pola dominan yang jelas');
  });

  it('combines coreDims and unions Saran Perbaikan', () => {
    const summary = buildDiscTraitSummary(screenshot);
    const advice = buildDiscDevelopmentAdvice(screenshot);
    expect(discCoreDimensions(screenshot)).toEqual(['I']);
    expect(summary.dims).toEqual(['I']);
    expect(summary.aspects.find((aspect) => aspect.label === 'Potret Diri')?.items[0]).toBe('Ramah');
    expect(advice.items).toEqual([
      'Berkonsentrasi pada tugas',
      'Memperhitungkan resiko',
      'Menggunakan prinsip kehati-hatian',
      'Mempelajari fakta-fakta',
      'Berhati-hati sebelum memutuskan',
      'Menghargai kebutuhan orang lain',
      'Sabar dengan orang lain',
      'Mengkomunikasikan alasan di balik keputusan',
      'Peduli terhadap perincian',
      'Mengembangkan pendekatan yang lebih sabar',
      'Mendelegasikan tugas penting',
      'Cepat membuat keputusan',
      'Berkompromi dengan orang lain',
      'Memulai dan memfasilitasi diskusi',
      'Mendukung kerja sama',
    ]);

    const shifted = {
      g1: { D: 4, I: 5, S: 6, C: 7 },
      g2: { D: 4, I: 5, S: 6, C: 7 },
      g3: { D: 3, I: 8, S: 4, C: 9 },
    };
    expect(checkDiscStatus(shifted.g1)).toBe('Super Syndrom');
    expect(discCoreDimensions(shifted)).toEqual(['C']);
    expect(buildDiscDevelopmentAdvice(shifted).items).toEqual([]);
  });
});

describe('disc dictionary matches refs/disc.md', () => {
  const markdown = readFileSync(path.join(process.cwd(), 'refs/disc.md'), 'utf8');
  const parsed = parseKamus(markdown);
  const dictionary = bundledDiscReportDictionary();

  it('copies every section 5 entry verbatim', () => {
    expect(parsed.patterns.map((row) => row.code)).toEqual(SECTION5_CODES);
    expect(DISC_PATTERN_CODES).toEqual(SECTION5_CODES);
    expect(Object.keys(dictionary.patterns)).toEqual(SECTION5_CODES);
    for (const row of parsed.patterns) {
      expect(dictionary.patterns[row.code]).toEqual(row);
      expect(markdown).toContain(row.description);
      expect(markdown).toContain(row.name);
      for (const job of row.jobs) expect(markdown).toContain(job);
    }
  });

  it('copies section 6 traits and section 4.5 status text verbatim', () => {
    expect(parsed.traits.map((row) => row.dim)).toEqual(['D', 'I', 'S', 'C']);
    for (const row of parsed.traits) {
      expect(dictionary.traits[row.dim as 'D']).toEqual(row);
      for (const items of Object.values(row)) {
        if (!Array.isArray(items)) continue;
        for (const item of items) expect(markdown).toContain(item);
      }
    }
    expect(parsed.context).toEqual([
      'masalah lingkungan kerja/peran sosial',
      'masalah pribadi/keluarga yang memengaruhi stabilitas emosi dasar',
      'bimbang arah kontribusi/peran',
    ]);
    for (const [status, arti] of Object.entries(parsed.artis)) {
      expect(arti.length).toBeGreaterThan(0);
      expect(markdown).toContain(arti);
      for (const graphKey of ['g1', 'g2', 'g3'] as const) {
        const record = dictionary.statuses[`${status}|${graphKey}`];
        expect(record.arti).toBe(arti);
        expect(record.context).toBe(status === 'Transisi' ? parsed.context[['g1', 'g2', 'g3'].indexOf(graphKey)] : '');
        if (record.context) expect(markdown).toContain(record.context);
      }
    }
  });

  it('matches the committed seed SQL and deactivates rows outside section 5', () => {
    const filePath = path.join(process.cwd(), 'drizzle/seeds/disc_dictionary.sql');
    const sql = readFileSync(filePath, 'utf8');
    expect(sql).toBe(renderDiscDictionarySeedSql());
    expect(sql).toContain('ON CONFLICT (code) DO UPDATE');
    expect(sql).toContain('ON CONFLICT (dim) DO UPDATE');
    expect(sql).toContain('ON CONFLICT (status, graph_key) DO UPDATE');
    expect(sql).toContain('UPDATE disc_patterns');
    expect(sql).toContain('SET is_active = FALSE, updated_at = NOW()');
    expect(sql).toContain('UPDATE disc_subtraits');
    expect(sql).toContain('UPDATE disc_graph_meanings');
    expect(sql).toContain('WHERE code NOT IN (');
    expect(sql).not.toMatch(/\b(DROP|TRUNCATE|DELETE)\b/i);
    expect(sql).not.toContain('NEGOTIATOR');
    expect(sql).toContain('LOGICAL THINKER');
  });

  it('keeps the bundled copy when database rows are empty and overrides a seeded name', () => {
    const fallback = bundledDiscReportDictionary();
    expect(mergeDiscDictionary(fallback, { patterns: [], traits: [], statuses: [] })).toBe(fallback);
    const merged = mergeDiscDictionary(fallback, {
      patterns: [{ code: 'I', name: 'COMMUNICATOR KHUSUS', description: '', jobs: ['Journalist'] }],
      traits: [],
      statuses: [],
    });
    expect(merged.patterns.I.name).toBe('COMMUNICATOR KHUSUS');
    expect(merged.patterns.I.description).toBe(fallback.patterns.I.description);
    expect(merged.patterns.I.jobs).toEqual(['Journalist']);
    expect(merged.patterns.D.name).toBe('ESTABLISHER');
  });
});
