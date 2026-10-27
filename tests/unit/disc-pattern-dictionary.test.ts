import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { discSubTrait, dominantDiscCode } from '@/lib/scoring/disc';
import { discGraphPatternCode, discSubTraitPair, reachableDiscPatternCodes } from '@/lib/scoring/discPatternCode';
import {
  bundledDiscReportDictionary,
  fillDiscName,
  mergeDiscDictionary,
  renderDiscDictionarySeedSql,
} from '@/lib/scoring/discReportDictionary';
import { mergeDiscDescriptionBlocks, buildDiscGraphCards } from '@/lib/scoring/discReportView';

const screenshot = {
  g1: { D: 1, I: 5, S: -1, C: -6 },
  g2: { D: 1, I: 7, S: -2, C: 2 },
  g3: { D: -0.5, I: 1, S: -4, C: -4 },
};

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

describe('disc graph pattern code', () => {
  it('reproduces the three screenshot graphs', () => {
    expect(discGraphPatternCode(screenshot.g1)).toBe('ID');
    expect(discGraphPatternCode(screenshot.g2)).toBe('ICD');
    expect(discGraphPatternCode(screenshot.g3)).toBe('I MURNI');
  });

  it('keeps the stored dominant-code rule unchanged', () => {
    expect(dominantDiscCode(screenshot.g1)).toBe('I');
    expect(dominantDiscCode(screenshot.g2)).toBe('I');
    expect(dominantDiscCode(screenshot.g3)).toBe('I');
  });

  it('uses a pure code for one positive dimension and for an all-negative graph', () => {
    expect(discGraphPatternCode({ D: -2, I: 3, S: -1, C: -4 })).toBe('I MURNI');
    expect(discGraphPatternCode({ D: -1, I: -4, S: -2, C: -8 })).toBe('D MURNI');
    expect(discGraphPatternCode({ D: 0, I: 0, S: 0, C: 0 })).toBe('D MURNI');
    expect(discGraphPatternCode({ D: -1, I: -1, S: -4, C: -3 })).toBe('D MURNI');
  });

  it('collapses four positive dimensions to the top three', () => {
    expect(discGraphPatternCode({ D: 5, I: 4, S: 3, C: 2 })).toBe('DIS');
    expect(discGraphPatternCode({ D: 2, I: 2, S: 2, C: 2 })).toBe('DIS');
  });
});

describe('disc sub-trait pairs', () => {
  it('maps the screenshot graphs to Indonesian pair labels', () => {
    const dictionary = bundledDiscReportDictionary();
    expect(discSubTrait(screenshot.g1)).toBe('Self Confidence');
    expect(discSubTrait(screenshot.g2)).toBe('Enthusiasm');
    expect(discSubTrait(screenshot.g3)).toBe('Self Confidence');
    expect(discSubTraitPair(screenshot.g1).pairKey).toBe('IC');
    expect(discSubTraitPair(screenshot.g2).pairKey).toBe('IS');
    expect(discSubTraitPair(screenshot.g3).pairKey).toBe('IC');
    expect(dictionary.subTraits.IC.pairLabel).toBe('Kepercayaan Diri (I/C)');
    expect(dictionary.subTraits.IS.pairLabel).toBe('Antusiasme (I/S)');
  });

  it('uses Balance only when every dimension is equal', () => {
    expect(discSubTraitPair({ D: 2, I: 2, S: 2, C: 2 }).pairKey).toBe('BALANCE');
    expect(discSubTrait({ D: 2, I: 2, S: 2, C: 2 })).toBe('Independence');
  });
});

describe('disc description blocks', () => {
  it('keeps three blocks when every graph code differs', () => {
    const dictionary = bundledDiscReportDictionary();
    const cards = buildDiscGraphCards(screenshot, dictionary);
    const blocks = mergeDiscDescriptionBlocks(cards, dictionary, 'Selasmawati');
    expect(blocks.map((block) => block.header)).toEqual([
      'DESKRIPSI PERILAKU ADAPTASI — GRAPH 1 (MOST) (NEGOTIATOR)',
      'DESKRIPSI KEPRIBADIAN ASLI — GRAPH 2 (LEAST) (ASSESSOR)',
      'DESKRIPSI PERSEPSI DIRI — GRAPH 3 (CHANGE) (COMMUNICATOR)',
    ]);
    expect(blocks[0].description.startsWith('Merupakan Selasmawati pemimpin integratif')).toBe(true);
    expect(blocks[0].subTraits[0].heading).toBe('SUB TRAIT — KEPERCAYAAN DIRI (I/C)');
    expect(blocks[0].subTraits[0].narrative).toContain('Selasmawati jarang sekali ragu');
    expect(blocks[2].code).toBe('I MURNI');
    expect(blocks[2].meanings[0]).toContain('Perilaku Integratif');
  });

  it('merges non-adjacent graphs that share a code and keeps both sub-traits', () => {
    const dictionary = bundledDiscReportDictionary();
    const cards = buildDiscGraphCards(
      {
        g1: screenshot.g1,
        g2: { D: 3, I: -1, S: -2, C: -4 },
        g3: { D: 2, I: 6, S: -5, C: -1 },
      },
      dictionary
    );
    expect(cards.map((card) => `${card.code}/${card.pairKey}`)).toEqual(['ID/IC', 'D MURNI/DC', 'ID/IS']);
    const blocks = mergeDiscDescriptionBlocks(cards, dictionary, 'Selasmawati');
    expect(blocks.map((block) => block.graphKeys)).toEqual([['g1', 'g3'], ['g2']]);
    expect(blocks[0].header).toBe(
      'DESKRIPSI PERILAKU ADAPTASI & PERSEPSI DIRI — GRAPH 1 & 3 (MOST & CHANGE) (NEGOTIATOR)'
    );
    expect(blocks[0].meanings).toHaveLength(2);
    expect(blocks[0].subTraits.map((item) => item.pairKey)).toEqual(['IC', 'IS']);
    expect(blocks[0].description).toContain('pemimpin integratif');
    expect(blocks[1].patternName).toBe('ESTABLISHER');
  });
});

describe('disc dictionary completeness', () => {
  const dictionary = bundledDiscReportDictionary();

  it('resolves every reachable code', () => {
    const reachable = reachableDiscPatternCodes();
    expect(reachable).toHaveLength(40);
    expect(Object.keys(dictionary.patterns).sort()).toEqual([...reachable].sort());
    for (const code of reachable) {
      const pattern = dictionary.patterns[code];
      expect(pattern.name.trim().length).toBeGreaterThan(0);
      expect(sentences(pattern.description).length).toBeGreaterThanOrEqual(3);
      expect(sentences(pattern.description).length).toBeLessThanOrEqual(5);
      expect(pattern.jobs.length).toBeGreaterThanOrEqual(4);
      expect(pattern.jobs.length).toBeLessThanOrEqual(8);
      expect(pattern.description).toContain('{nama}');
      expect(pattern.description).not.toMatch(/—|–/);
    }
  });

  it('covers twelve pairs plus balance with Indonesian narratives', () => {
    const keys = Object.keys(dictionary.subTraits).sort();
    expect(keys).toEqual(['BALANCE', 'CD', 'CI', 'CS', 'DC', 'DI', 'DS', 'IC', 'ID', 'IS', 'SC', 'SD', 'SI']);
    for (const record of Object.values(dictionary.subTraits)) {
      expect(record.pairLabel).toContain(record.labelId);
      const count = sentences(record.narrative).length;
      expect(count).toBeGreaterThanOrEqual(4);
      expect(count).toBeLessThanOrEqual(7);
      expect(record.narrative).toContain('{nama}');
      expect(record.narrative).not.toMatch(/—|–/);
    }
    expect(fillDiscName(dictionary.subTraits.IC.narrative, 'Selasmawati')).toContain('Selasmawati jarang sekali ragu');
  });

  it('keeps the three graph meaning paragraphs', () => {
    expect(dictionary.graphMeanings.g1.meaning).toContain('Perilaku Adaptasi (Public Self)');
    expect(dictionary.graphMeanings.g2.meaning).toContain('Perilaku Saat Tekanan (Private Self)');
    expect(dictionary.graphMeanings.g3.meaning).toContain('Perilaku Integratif (Integrated Self / Perilaku Asli)');
  });

  it('matches the committed seed SQL', () => {
    const filePath = path.join(process.cwd(), 'drizzle/seeds/disc_dictionary.sql');
    const sql = readFileSync(filePath, 'utf8');
    expect(sql).toBe(renderDiscDictionarySeedSql());
    expect(sql).toContain('ON CONFLICT (code) DO UPDATE');
    expect(sql).toContain('ON CONFLICT (pair_key) DO UPDATE');
    expect(sql).toContain('ON CONFLICT (graph_key) DO UPDATE');
    expect(sql).not.toMatch(/\b(DROP|TRUNCATE|DELETE)\b/i);
  });

  it('falls back when database rows are empty and overrides a seeded name', () => {
    const fallback = bundledDiscReportDictionary();
    expect(mergeDiscDictionary(fallback, { patterns: [], subTraits: [], graphMeanings: [] })).toBe(fallback);
    const merged = mergeDiscDictionary(fallback, {
      patterns: [{ code: 'ID', name: 'NEGOSIATOR KHUSUS', description: '', jobs: ['PENGAJAR'] }],
      subTraits: [],
      graphMeanings: [],
    });
    expect(merged.patterns.ID.name).toBe('NEGOSIATOR KHUSUS');
    expect(merged.patterns.ID.description).toBe(fallback.patterns.ID.description);
    expect(merged.patterns.ID.jobs).toEqual(['PENGAJAR']);
    expect(merged.patterns.ICD.name).toBe('ASSESSOR');
  });
});
