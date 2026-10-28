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
    expect(findDiscTypeInfo(dictionary, 'I-D')).toMatchObject({
      matchedCode: 'I-D',
      pattern: { name: 'PERSUADER / CONVINCER' },
    });
    expect(findDiscTypeInfo(dictionary, 'I-C-D')).toMatchObject({
      matchedCode: 'I-C-D',
      pattern: { name: 'LEADER / DECISIVE' },
    });
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
    expect(checkDiscStatus({ D: 1, I: 1, S: 1, C: 1 })).toBe('Super Syndrom');
    expect(checkDiscStatus({ D: -1, I: -1, S: -1, C: -1 })).toBe('Undershift');
    expect(checkDiscStatus({ D: 2, I: 2, S: 2, C: 2 })).toBe('Super Syndrom');
    expect(checkDiscStatus({ D: 3, I: 3, S: 3, C: 3 })).toBe('Super Syndrom');
    expect(checkDiscStatus({ D: -3, I: -4, S: -5, C: -6 })).toBe('Undershift');
  });

  it('follows refs/disc.md 4.5, with Super Syndrom and Undershift ahead of the Transisi band', () => {
    // before = Transisi checked first (the previous bug). after = current checkDiscStatus.
    const samples: { label: string; graph: { D: number; I: number; S: number; C: number }; before: string | null; after: string | null }[] = [
      { label: 'semua nol', graph: { D: 0, I: 0, S: 0, C: 0 }, before: 'Transisi', after: 'Transisi' },
      { label: 'datar campur tanda', graph: { D: 2, I: -2, S: 1, C: 0 }, before: 'Transisi', after: 'Transisi' },
      { label: 'tepi +2', graph: { D: 2, I: 2, S: 2, C: 2 }, before: 'Transisi', after: 'Super Syndrom' },
      { label: 'semua positif kecil', graph: { D: 1, I: 1, S: 1, C: 1 }, before: 'Transisi', after: 'Super Syndrom' },
      { label: 'semua positif di luar pita', graph: { D: 3, I: 4, S: 5, C: 6 }, before: 'Super Syndrom', after: 'Super Syndrom' },
      { label: 'tepi -2', graph: { D: -2, I: -2, S: -2, C: -2 }, before: 'Transisi', after: 'Undershift' },
      { label: 'semua negatif kecil', graph: { D: -1, I: -1, S: -1, C: -1 }, before: 'Transisi', after: 'Undershift' },
      { label: 'semua negatif di luar pita', graph: { D: -3, I: -4, S: -5, C: -6 }, before: 'Undershift', after: 'Undershift' },
      { label: 'satu dimensi di luar pita', graph: { D: 3, I: 0, S: 0, C: 0 }, before: null, after: null },
      { label: 'nol menutup Super Syndrom', graph: { D: 2, I: 2, S: 2, C: 0 }, before: 'Transisi', after: 'Transisi' },
    ];
    for (const sample of samples) {
      expect(checkDiscStatus(sample.graph), sample.label).toBe(sample.after);
    }
  });
});

describe('disc description blocks', () => {
  it('keeps three blocks for the screenshot codes and uses section 5 text', () => {
    const dictionary = bundledDiscReportDictionary();
    const cards = buildDiscGraphCards(screenshot, dictionary);
    const blocks = mergeDiscDescriptionBlocks(cards, dictionary);
    expect(blocks.map((block) => block.header)).toEqual([
      'Grafik I (Adaptif / Public Self / MOST) · KODE: I-D · PERSUADER / CONVINCER',
      'Grafik II (Alami / Private Self / LEAST) · KODE: I-C-D · LEADER / DECISIVE',
      'Grafik III (Gabungan / Perceived Self / CHANGE) · KODE: I MURNI · COMMUNICATOR',
    ]);
    expect(blocks[0].description).toBe(dictionary.patterns['I-D'].description);
    expect(blocks[0].jobs).toEqual(dictionary.patterns['I-D'].jobs);
    expect(blocks[0].characteristics).toEqual([]);
    expect(blocks[0].cautions).toEqual([]);
    expect(blocks[0].motivators).toBe('');
    expect(blocks[1].description).toBe(dictionary.patterns['I-C-D'].description);
    expect(blocks[1].jobs).toEqual(dictionary.patterns['I-C-D'].jobs);
    expect(blocks[1].characteristics).toEqual([]);
    expect(blocks[2].jobs).toEqual(dictionary.patterns.I.jobs);
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
        g2: { D: 2, I: -2, S: 1, C: 0 },
        g3: { D: -2, I: 2, S: -1, C: 1 },
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
    expect(DISC_PATTERN_CODES).toEqual([...SECTION5_CODES, 'I-D', 'I-C-D']);
    expect(Object.keys(dictionary.patterns)).toEqual([...SECTION5_CODES, 'I-D', 'I-C-D']);
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
    expect(sql).toContain('characteristics = EXCLUDED.characteristics');
    expect(sql).toContain('PERSUADER / CONVINCER');
    expect(sql).toContain('LEADER / DECISIVE');
    expect(sql).not.toContain('Mudah membangun hubungan');
    expect(sql).not.toContain('Karakteristik Utama');
    expect(sql).toContain("'I-D'");
    expect(sql).toContain("'I-C-D'");
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
    expect(merged.patterns['I-D'].characteristics ?? null).toBeNull();
    expect(merged.patterns['I-D'].jobs).toEqual(fallback.patterns['I-D'].jobs);
  });
});

function splitHeading(text: string, heading: string): [string, string] {
  const index = text.indexOf(heading);
  if (index < 0) return [text.trim(), ''];
  return [text.slice(0, index).trim(), text.slice(index + heading.length).trim()];
}

function bulletLines(block: string): string[] {
  return block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim());
}

function parseSupplement(markdown: string) {
  return markdown
    .split(/\n(?=\d+\. )/)
    .filter((chunk) => /^\d+\. /.test(chunk.trim()))
    .map((chunk) => {
      const head = chunk.match(/^(\d+)\. ([A-Z](?:-[A-Z])*) — ([^\n]+)\n+([\s\S]+)$/);
      if (!head) throw new Error(`Supplement block did not parse: ${chunk.slice(0, 48)}`);
      const [, , code, title, rest] = head;
      const [description, afterIntro] = splitHeading(rest, 'Karakteristik Utama');
      const [characteristicsBlock, afterCharacteristics] = splitHeading(afterIntro, 'Hal yang Perlu Diperhatikan');
      const [cautionsBlock, motivatorsBlock] = splitHeading(afterCharacteristics, 'Faktor yang Memotivasi');
      return {
        code,
        name: title.trim().toUpperCase(),
        description,
        jobs: [] as string[],
        characteristics: bulletLines(characteristicsBlock).map((line) => {
          const splitAt = line.indexOf(': ');
          return { label: line.slice(0, splitAt), text: line.slice(splitAt + 2) };
        }),
        cautions: bulletLines(cautionsBlock),
        motivators: motivatorsBlock.trim() || null,
      };
    });
}

describe('disc I-D and I-C-D supplement', () => {
  const markdown = readFileSync(path.join(process.cwd(), 'refs/kamus-tambahan-ID-ICD.md'), 'utf8');
  const parsed = parseSupplement(markdown);
  const dictionary = bundledDiscReportDictionary();

  it('keeps one paragraph whose sentences come from the client text, plus Abadi profession lists', () => {
    expect(parsed.map((row) => row.code)).toEqual(['I-D', 'I-C-D']);
    const professions = readFileSync(path.join(process.cwd(), 'refs/kamus-profesi-ID-ICD.md'), 'utf8');
    const sourceWords = new Set(
      markdown
        .toLowerCase()
        .replace(/[^a-zà-ÿ0-9-]+/gi, ' ')
        .split(/\s+/)
        .filter((word) => word.length >= 4)
    );
    const labels = parsed.flatMap((row) => row.characteristics.map((point) => point.label));

    expect(dictionary.patterns['I-D'].jobs).toEqual([
      'Manajer Toko Retail',
      'Manajer Gedung Pertunjukan',
      'Petugas Bantuan Hukum',
      'Public Relations Representative',
      'Pengacara',
      'Manajer Sales & Service',
    ]);
    expect(dictionary.patterns['I-C-D'].jobs).toEqual([
      'Manajer teknik',
      'Manajer keuangan',
      'Konsultan',
      'Project Engineer',
      'Sales Engineer',
      'Trainer atau dosen',
    ]);
    expect(dictionary.patterns['I-D'].jobs).not.toEqual(dictionary.patterns.I.jobs);
    expect(dictionary.patterns['I-C-D'].jobs).not.toEqual(dictionary.patterns['I-C'].jobs);
    for (const job of [...dictionary.patterns['I-D'].jobs, ...dictionary.patterns['I-C-D'].jobs]) {
      expect(professions).toContain(job);
      expect(job).not.toMatch(/\([A-Z]+\)/);
    }

    for (const row of parsed) {
      const pattern = dictionary.patterns[row.code];
      expect(pattern.name).toBe(row.name);
      expect(pattern.characteristics ?? null).toBeNull();
      expect(pattern.cautions ?? null).toBeNull();
      expect(pattern.motivators ?? null).toBeNull();
      const sentences = pattern.description.split(/(?<=[.!?])\s+/).filter(Boolean);
      expect(sentences.length).toBeGreaterThanOrEqual(4);
      expect(sentences.length).toBeLessThanOrEqual(6);
      for (const sentence of sentences) {
        const words = sentence
          .toLowerCase()
          .replace(/[^a-zà-ÿ0-9-]+/gi, ' ')
          .split(/\s+/)
          .filter((word) => word.length >= 4);
        expect(words.length).toBeGreaterThan(0);
        for (const word of words) expect(sourceWords.has(word)).toBe(true);
      }
      for (const label of row.characteristics.map((point) => point.label)) {
        expect(pattern.description).not.toContain(label);
      }
      for (const point of row.characteristics) expect(pattern.description.toLowerCase()).toContain(point.text.slice(0, 24).toLowerCase());
      for (const caution of row.cautions) {
        expect(pattern.description.toLowerCase()).toContain(caution.replace(/\.$/, '').toLowerCase());
      }
      if (row.motivators) {
        expect(pattern.description.toLowerCase()).toContain(row.motivators.replace(/\.$/, '').toLowerCase());
      }
    }
    expect(labels.length).toBeGreaterThan(0);
    expect(dictionary.patterns['I-D'].name).toBe('PERSUADER / CONVINCER');
    expect(dictionary.patterns['I-C-D'].name).toBe('LEADER / DECISIVE');
  });
});
