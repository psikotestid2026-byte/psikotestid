import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  calculateWptScore,
  checkWptAnswer,
  normalizeWptAnswer,
  WPT_RS_TO_IQ,
  WPT_ANSWER_KEYS,
} from '@/lib/scoring/wpt';

/**
 * Option lists copied from scripts/seed_wpt_questions.js (the question bank
 * seed). Item order is the bank order_number.
 */
function loadWptOptionsFromSeed(): string[][] {
  const src = readFileSync(resolve(process.cwd(), 'scripts/seed_wpt_questions.js'), 'utf8');
  const start = src.indexOf('const wptQuestions = [');
  const end = src.indexOf('\n];', start);
  const body = src.slice(start, end);
  const blocks = [...body.matchAll(/options:\s*\[([\s\S]*?)\]/g)];
  return blocks.map((block) => [...block[1].matchAll(/"([^"\\]*)"/g)].map((match) => match[1]));
}

/** The bank option(s) that must score 1. Every other seeded option must score 0. */
const CORRECT_OPTIONS: Record<number, string[]> = {
  1: ['Desember'],
  2: ['Membebaskan'],
  3: ['Mobil'],
  4: ['Tidak'],
  5: ['Berpartisipasi'],
  6: ['Jarang', 'Luar Biasa'],
  7: ['Bentuk 3'],
  8: ['1/8'],
  9: ['Memiliki arti yang sama'],
  10: ['Bau wangi', 'Hidung'],
  11: ['Musim Semi'],
  12: ['6.000 kaki'],
  13: ['Benar'],
  14: ['Dekat'],
  15: ['20 rupiah'],
  16: ['2'],
  17: ['A'],
  18: ['13 tahun'],
  19: ['Memiliki tata bahasa dan arti berbeda'],
  20: ['Benar'],
  21: ['20 barel'],
  22: ['Salah'],
  23: ['1 dan 3'],
  24: ['2 detik'],
  25: ['Memiliki arti berbeda'],
  26: ['Benar'],
  27: ['3.33 sen'],
  28: ['Memiliki arti berbeda'],
  29: ['6 ikan'],
  30: ['216 m³'],
  31: ['1/100000'],
  32: ['Ya'],
  33: ['Memiliki arti berbeda'],
  34: ['20 rok'],
  35: ['0.25 detik'],
  36: ['24 permainan'],
  37: ['82'],
  38: ['Dua segitiga siku-siku sama kaki'],
  39: ['Karyawan/alat baru sering bekerja sangat efisien'],
  40: ['3'],
  41: ['1 dan 3'],
  42: ['Dua trapesium siku-siku'],
  43: ['0.33'],
  44: ['Kejujuran adalah nilai moral yang tidak perlu disesali'],
  45: ['Rp 1.250'],
  46: ['Kubus'],
  47: ['Salah (Sesat Pikir)'],
  48: ['Rp 300.000'],
  49: ['Potongan 1, 2, 4, 5'],
  50: ['50 menit'],
};

describe('WPT scoring', () => {
  it('normalizes case, whitespace, quotes, slashes, and superscripts', () => {
    expect(normalizeWptAnswer('  Desember ')).toBe('desember');
    expect(normalizeWptAnswer('  Bentuk   3 ')).toBe('bentuk 3');
    expect(normalizeWptAnswer('1 / 8')).toBe('1/8');
    expect(normalizeWptAnswer('1,  3')).toBe('1,3');
    expect(normalizeWptAnswer('216 m³')).toBe('216 m3');
    expect(normalizeWptAnswer('\u201CDesember\u201D')).toBe('"desember"');
    expect(normalizeWptAnswer('RP  1.250')).toBe('rp 1.250');
    expect(normalizeWptAnswer('2.0')).toBe('2');
  });

  it('checks known correct answers', () => {
    expect(checkWptAnswer(1, 'Desember')).toBe(true);
    expect(checkWptAnswer(1, 'Januari')).toBe(false);
    expect(checkWptAnswer(8, '1/8')).toBe(true);
  });

  it('scores perfect 0-based key answers to max IQ (matches AssessmentClient)', () => {
    const answers: Record<string, string> = {};
    for (let q = 1; q <= 50; q++) {
      const key = WPT_ANSWER_KEYS[q];
      answers[String(q - 1)] = Array.isArray(key) ? key[0] : key;
    }
    const result = calculateWptScore(answers);
    expect(result.raw_score).toBe(50);
    expect(result.iq).toBe(WPT_RS_TO_IQ[50]);
  });

  it('scores empty answers as raw_score 0', () => {
    const result = calculateWptScore({});
    expect(result.raw_score).toBe(0);
    expect(result.iq).toBe(WPT_RS_TO_IQ[0]);
  });

  it('scores each seeded option: the correct option is 1 and every other option is 0', () => {
    const options = loadWptOptionsFromSeed();
    expect(options).toHaveLength(50);

    for (let index = 0; index < options.length; index++) {
      const qNum = index + 1;
      const expected = CORRECT_OPTIONS[qNum];
      const bank = options[index];
      expect(bank.length, `item ${qNum} has options`).toBeGreaterThan(1);

      for (const option of expected) {
        expect(bank, `item ${qNum} bank contains ${option}`).toContain(option);
        expect(checkWptAnswer(qNum, option), `item ${qNum} accepts ${option}`).toBe(true);
      }

      for (const option of bank) {
        const shouldPass = expected.includes(option);
        expect(checkWptAnswer(qNum, option), `item ${qNum} option ${JSON.stringify(option)}`).toBe(shouldPass);
      }
    }
  });

  it('rejects the substring false positives on items 4, 8, 17, 23, 27, and 31', () => {
    expect(checkWptAnswer(4, 'Tidak')).toBe(true);
    expect(checkWptAnswer(4, 'Ya')).toBe(false);
    expect(checkWptAnswer(4, 'Tidak Tahu')).toBe(false);
    expect(checkWptAnswer(4, 'jawablah yang tidak perlu')).toBe(false);
    expect(checkWptAnswer(4, 'jawablah jika tidak perlu')).toBe(false);

    expect(checkWptAnswer(8, '1/8')).toBe(true);
    expect(checkWptAnswer(8, '0.125')).toBe(true);
    expect(checkWptAnswer(8, '0,125')).toBe(true);
    expect(checkWptAnswer(8, '0')).toBe(false);
    expect(checkWptAnswer(8, '1/6')).toBe(false);
    expect(checkWptAnswer(8, '1/16')).toBe(false);
    expect(checkWptAnswer(8, '1/2')).toBe(false);

    expect(checkWptAnswer(17, 'A')).toBe(true);
    expect(checkWptAnswer(17, 'S')).toBe(false);
    expect(checkWptAnswer(17, 'P')).toBe(false);
    expect(checkWptAnswer(17, 'D')).toBe(false);
    expect(checkWptAnswer(17, 'M')).toBe(false);

    expect(checkWptAnswer(23, '1 dan 3')).toBe(true);
    expect(checkWptAnswer(23, '1,3')).toBe(true);
    expect(checkWptAnswer(23, '1 & 3')).toBe(true);
    expect(checkWptAnswer(23, '1 dan 2')).toBe(false);
    expect(checkWptAnswer(23, '2 dan 3')).toBe(false);
    expect(checkWptAnswer(23, '3 dan 4')).toBe(false);

    expect(checkWptAnswer(27, '3.33 sen')).toBe(true);
    expect(checkWptAnswer(27, '3,33 sen')).toBe(true);
    expect(checkWptAnswer(27, '3.33')).toBe(true);
    expect(checkWptAnswer(27, '3,33')).toBe(true);
    expect(checkWptAnswer(27, '3 sen')).toBe(false);
    expect(checkWptAnswer(27, '3')).toBe(false);
    expect(checkWptAnswer(27, '1/30')).toBe(false);
    expect(checkWptAnswer(27, '10 sen')).toBe(false);

    expect(checkWptAnswer(31, '1/100000')).toBe(true);
    expect(checkWptAnswer(31, '1/100.000')).toBe(true);
    expect(checkWptAnswer(31, '1/10000')).toBe(false);
    expect(checkWptAnswer(31, '1/9')).toBe(false);
    expect(checkWptAnswer(31, '1/20000')).toBe(false);
    expect(checkWptAnswer(31, '1/50000')).toBe(false);
  });

  it('does not treat a shorter or longer string as the same answer', () => {
    expect(checkWptAnswer(22, 'Salah')).toBe(true);
    expect(checkWptAnswer(22, 'Salah (Sesat Pikir)')).toBe(false);
    expect(checkWptAnswer(47, 'Salah (Sesat Pikir)')).toBe(true);
    expect(checkWptAnswer(47, 'Salah')).toBe(false);
    expect(checkWptAnswer(50, '50 menit')).toBe(true);
    expect(checkWptAnswer(50, '50')).toBe(true);
    expect(checkWptAnswer(50, '500')).toBe(false);
    expect(checkWptAnswer(50, '30 menit')).toBe(false);
    expect(checkWptAnswer(6, 'Jarang')).toBe(true);
    expect(checkWptAnswer(6, 'Luar Biasa')).toBe(true);
    expect(checkWptAnswer(6, 'Selalu')).toBe(false);
    expect(checkWptAnswer(10, 'Bau wangi')).toBe(true);
    expect(checkWptAnswer(10, 'Hidung')).toBe(true);
    expect(checkWptAnswer(10, 'Bau tak sedap')).toBe(false);
  });
});
