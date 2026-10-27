import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PAPI_ASPECT_DETAILS, type PapiAspect } from '@/lib/scoring/papi';
import { PAPI_HIGH_EMPTY, PAPI_LOW_EMPTY, papiSectionModel, papiZone } from '@/lib/reportTemplateV3';

const ORDER: PapiAspect[] = ['N', 'G', 'A', 'L', 'P', 'I', 'T', 'V', 'X', 'S', 'B', 'O', 'R', 'D', 'C', 'Z', 'E', 'K', 'F', 'W'];

function parseSection5(markdown: string) {
  const section = markdown.split('## 5.')[1]?.split('## 6.')[0] || '';
  return section
    .split('\n')
    .filter((line) => line.startsWith('| **'))
    .map((line) => {
      const cells = line.split('|').slice(1, -1).map((cell) => cell.trim().replace(/\*\*/g, ''));
      return {
        code: cells[0] as PapiAspect,
        name: cells[1],
        desc: cells[2],
        high: cells[3],
        low: cells[4],
      };
    });
}

describe('PAPI kamus section 5', () => {
  const markdown = readFileSync(path.join(process.cwd(), 'refs/kamus-papi.md'), 'utf8');
  const rows = parseSection5(markdown);

  it('copies every aspect name, description, and High/Low narrative verbatim', () => {
    expect(rows.map((row) => row.code)).toEqual(ORDER);
    expect(Object.keys(PAPI_ASPECT_DETAILS)).toEqual(ORDER);
    for (const row of rows) {
      expect(PAPI_ASPECT_DETAILS[row.code]).toEqual({
        name: row.name,
        desc: row.desc,
        high: row.high,
        low: row.low,
      });
      expect(markdown).toContain(row.high);
      expect(markdown).toContain(row.low);
      expect(markdown).toContain(row.desc);
    }
    expect(markdown).toContain('skor **≥ 6**');
    expect(markdown).toContain('skor **4–5**');
    expect(markdown).toContain('skor **≤ 3**');
  });

  it('narrates only High and Low, with official names and the kamus sort', () => {
    const scores = {
      N: 9, G: 8, A: 7, L: 7, P: 6, I: 6, T: 6,
      V: 5, X: 5, S: 4, B: 4, O: 5, R: 4,
      D: 3, C: 2, Z: 1, E: 3, K: 2, F: 0, W: 3,
    };
    expect(Object.values(scores).reduce((sum, score) => sum + score, 0)).toBe(90);
    const model = papiSectionModel({ scores, totalScore: 90 });
    expect(model.high.map((item) => `${item.code}:${item.score}`)).toEqual([
      'N:9', 'G:8', 'A:7', 'L:7', 'P:6', 'I:6', 'T:6',
    ]);
    expect(model.low.map((item) => `${item.code}:${item.score}`)).toEqual([
      'F:0', 'Z:1', 'C:2', 'K:2', 'D:3', 'E:3', 'W:3',
    ]);
    for (const item of model.high) {
      expect(item.name).toBe(PAPI_ASPECT_DETAILS[item.code].name);
      expect(item.narrative).toBe(PAPI_ASPECT_DETAILS[item.code].high);
      expect(papiZone(item.score)).toBe('High');
      const lowered = item.narrative.charAt(0).toLowerCase() + item.narrative.slice(1);
      expect(model.highParagraph).toContain(`(${item.code}, skor ${item.scoreText}), ${lowered}`);
    }
    for (const item of model.low) {
      expect(item.narrative).toBe(PAPI_ASPECT_DETAILS[item.code].low);
      expect(papiZone(item.score)).toBe('Low');
      const lowered = item.narrative.charAt(0).toLowerCase() + item.narrative.slice(1);
      expect(model.lowParagraph).toContain(`(${item.code}, skor ${item.scoreText}), ${lowered}`);
    }
    expect(model.highParagraph).toBe(
      'Pada aspek Need to Finish a Task (N, skor 9), sangat berkomitmen dan berorientasi pada penyelesaian tugas secara tuntas. Pada aspek Hard Intense Worker (G, skor 8), memiliki etos kerja yang kuat, gigih, dan pekerja keras. Selain itu, pada aspek Need for Achievement (A, skor 7), memiliki motivasi berprestasi tinggi dan ingin selalu menghasilkan karya terbaik. Pada aspek Leadership Role (L, skor 7), cenderung dominan, mengambil inisiatif, dan percaya diri memimpin kelompok. Di sisi lain, pada aspek Need to Control Others (P, skor 6), suka memegang kendali, mengarahkan, dan mengontrol pekerjaan orang lain. Pada aspek Ease in Decision Making (I, skor 6), sangat tanggap, cepat, dan percaya diri dalam mengambil keputusan. Pada aspek Pace / Tempo (T, skor 6), bekerja dengan tempo dan dinamika yang cepat serta cekatan.'
    );
    expect(model.lowParagraph).toBe(
      'Pada aspek Need for Support & Dependence (F, skor 0), sangat mandiri dan tidak terlalu membutuhkan validasi dari otoritas. Pada aspek Need for Change (Z, skor 1), lebih menyukai rutinitas yang stabil dan cenderung menolak perubahan mendadak. Selain itu, pada aspek Organized Type (C, skor 2), spontan, kurang terstruktur, dan fleksibel dalam penataan. Pada aspek Need for Aggression (K, skor 2), pasif, menghindari konflik, dan cenderung mengalah demi kedamaian. Di sisi lain, pada aspek Detail Conscious (D, skor 3), lebih berfokus pada gambaran besar (big picture) dan cenderung abai detail. Pada aspek Emotional Restraint (E, skor 3), ekspresif, reaktif secara emosional, atau mudah terpancing stres. Pada aspek Need for Rules & Supervision (W, skor 3), lebih suka kebebasan dalam bertindak dan tidak menyukai birokrasi ketat.'
    );
    expect((model.highParagraph.match(/Pada aspek|pada aspek/g) || []).length).toBe(model.high.length);
    expect((model.lowParagraph.match(/Pada aspek|pada aspek/g) || []).length).toBe(model.low.length);
    for (const code of ['V', 'X', 'S', 'B', 'O', 'R'] as PapiAspect[]) {
      expect(papiZone(scores[code])).toBe('Middle');
      expect(model.high.some((item) => item.code === code)).toBe(false);
      expect(model.low.some((item) => item.code === code)).toBe(false);
    }
    expect(model.highEmpty).toBe(PAPI_HIGH_EMPTY);
    expect(model.lowEmpty).toBe(PAPI_LOW_EMPTY);
    const middleOnly = papiSectionModel({ scores: Object.fromEntries(ORDER.map((code) => [code, 5])) });
    expect(middleOnly.high).toEqual([]);
    expect(middleOnly.low).toEqual([]);
    expect(middleOnly.highParagraph).toBe(PAPI_HIGH_EMPTY);
    expect(middleOnly.lowParagraph).toBe(PAPI_LOW_EMPTY);
    expect(papiSectionModel({ scores: { N: 5 } }).high).toEqual([]);
    expect(papiSectionModel({ scores: { N: 5 } }).low.map((item) => item.code)).not.toContain('N');
  });
});
