import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PAPI_ASPECT_DETAILS, type PapiAspect } from '@/lib/scoring/papi';
import { papiSectionModel, papiZone } from '@/lib/reportTemplateV3';

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
  const draft = readFileSync(path.join(process.cwd(), 'refs/papi-sedang-draft.md'), 'utf8');

  it('copies every aspect name, description, and High/Low narrative verbatim', () => {
    expect(rows.map((row) => row.code)).toEqual(ORDER);
    expect(Object.keys(PAPI_ASPECT_DETAILS)).toEqual(ORDER);
    for (const row of rows) {
      const { middle, ...kamus } = PAPI_ASPECT_DETAILS[row.code];
      expect(kamus).toEqual({
        name: row.name,
        desc: row.desc,
        high: row.high,
        low: row.low,
      });
      expect(draft).toContain(`| ${row.code} | ${row.name} | ${row.high} | ${row.low} | ${middle} |`);
      expect(middle).not.toMatch(/[—–]/);
      expect(middle.endsWith('.')).toBe(true);
      expect(markdown).toContain(row.high);
      expect(markdown).toContain(row.low);
      expect(markdown).toContain(row.desc);
    }
    expect(markdown).toContain('skor **≥ 6**');
    expect(markdown).toContain('skor **4–5**');
    expect(markdown).toContain('skor **≤ 3**');
  });

  it('narrates High, Sedang, and Low as three paragraphs, with official names and the kamus sort', () => {
    const scores = {
      N: 9, G: 8, A: 7, L: 7, P: 6, I: 6, T: 6,
      V: 5, X: 5, S: 4, B: 4, O: 5, R: 4,
      D: 3, C: 2, Z: 1, E: 3, K: 2, F: 0, W: 3,
    };
    expect(Object.values(scores).reduce((sum, score) => sum + score, 0)).toBe(90);
    const model = papiSectionModel({ scores, totalScore: 90 }, 'Selasmawati');
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
      expect(model.highParagraph).toContain(lowered);
      expect(model.highParagraph).not.toContain(item.name);
    }
    for (const item of model.low) {
      expect(item.narrative).toBe(PAPI_ASPECT_DETAILS[item.code].low);
      expect(papiZone(item.score)).toBe('Low');
      const lowered = item.narrative.charAt(0).toLowerCase() + item.narrative.slice(1);
      expect(model.lowParagraph).toContain(lowered);
      expect(model.lowParagraph).not.toContain(item.name);
    }
    expect(model.highParagraph).toBe(
      'Selasmawati sangat berkomitmen dan berorientasi pada penyelesaian tugas secara tuntas. Ia memiliki etos kerja yang kuat, gigih, dan pekerja keras. Selain itu, ia memiliki motivasi berprestasi tinggi dan ingin selalu menghasilkan karya terbaik. Ia juga cenderung dominan, mengambil inisiatif, dan percaya diri memimpin kelompok. Di samping itu, ia suka memegang kendali, mengarahkan, dan mengontrol pekerjaan orang lain. Ia sangat tanggap, cepat, dan percaya diri dalam mengambil keputusan. Lebih lanjut, ia bekerja dengan tempo dan dinamika yang cepat serta cekatan.'
    );
    expect(model.middle.map((item) => `${item.code}:${item.score}`)).toEqual(['V:5', 'X:5', 'O:5', 'S:4', 'B:4', 'R:4']);
    for (const item of model.middle) expect(item.narrative).toBe(PAPI_ASPECT_DETAILS[item.code].middle);
    expect(model.middleParagraph).toBe(
      'Sementara itu, ia memiliki energi fisik yang cukup untuk aktivitas dinamis, namun perlu mengatur stamina agar tidak cepat lelah secara fisik. Ia menghargai apresiasi dan pujian, tetapi tetap rendah hati dan tidak terlalu membutuhkan sorotan publik. Selain itu, ia membutuhkan hubungan interpersonal yang cukup hangat dan akrab, sambil tetap mandiri dalam relasi. Ia juga cukup ramah dan terbuka dalam bergaul, namun tetap selektif dalam bersosialisasi. Di samping itu, ia dapat terlibat aktif dalam kelompok, tetapi tetap mandiri dan tidak terlalu tergantung pada kelompok. Ia cukup suka menganalisis konsep dan teori, namun tetap praktis dan berfokus pada eksekusi nyata.'
    );
    expect(model.lowParagraph).toBe(
      'Di sisi lain, ia sangat mandiri dan tidak terlalu membutuhkan validasi dari otoritas. Ia lebih menyukai rutinitas yang stabil dan cenderung menolak perubahan mendadak. Selain itu, ia bersifat spontan, kurang terstruktur, dan fleksibel dalam penataan. Ia juga bersifat pasif, menghindari konflik, dan cenderung mengalah demi kedamaian. Di samping itu, ia lebih berfokus pada gambaran besar (big picture) dan cenderung abai detail. Ia bersifat ekspresif, reaktif secara emosional, atau mudah terpancing stres. Lebih lanjut, ia lebih suka kebebasan dalam bertindak dan tidak menyukai birokrasi ketat.'
    );
    for (const text of [model.highParagraph, model.middleParagraph, model.lowParagraph]) {
      expect(text).not.toMatch(/\bskor\b|Pada aspek|\d|—/);
      for (const code of ORDER) expect(text).not.toContain(PAPI_ASPECT_DETAILS[code].name);
    }
    expect(`${model.middleParagraph} ${model.lowParagraph}`).not.toContain('Selasmawati');
    expect((model.highParagraph.match(/Selain itu, ia/g) || []).length).toBe(1);
    expect((model.lowParagraph.match(/Selain itu, ia/g) || []).length).toBe(1);
    expect(model.highParagraph.startsWith('Selasmawati ')).toBe(true);
    expect(model.middleParagraph.startsWith('Sementara itu, ia ')).toBe(true);
    expect(model.lowParagraph.startsWith('Di sisi lain, ia ')).toBe(true);
    expect(model.highParagraph).not.toMatch(/\bskor\b|Pada aspek/);
    expect(model.lowParagraph).not.toMatch(/\bskor\b|Pada aspek/);

    const middleScores = Object.fromEntries(ORDER.map((code) => [code, 5])) as Record<PapiAspect, number>;
    expect(papiSectionModel({ scores: { ...middleScores, K: 9 } }, 'Selasmawati').highParagraph).toBe(
      'Selasmawati bersifat asertif, kompetitif, dan berani bersikap konfrontatif demi keyakinannya.'
    );
    expect(papiSectionModel({ scores: { ...middleScores, W: 9 } }, 'Selasmawati').highParagraph).toBe(
      'Selasmawati bersifat taat aturan, patuh, dan merasa aman dengan instruksi yang jelas.'
    );
    expect(papiSectionModel({ scores: { ...middleScores, X: 0 } }, 'Selasmawati').lowParagraph).toBe(
      'Di sisi lain, ia bersifat rendah hati dan tidak terlalu membutuhkan perhatian atau panggung.'
    );
    expect(papiSectionModel({ scores: { ...middleScores, B: 1 } }, 'Selasmawati').lowParagraph).toBe(
      'Di sisi lain, ia bersifat individualis dan mandiri, tidak terlalu tergantung pada kelompok.'
    );
    expect(papiSectionModel({ scores: { ...middleScores, X: 0 } }, 'Selasmawati').highParagraph).toBe('');
    expect(papiSectionModel({ scores: { ...middleScores, N: 9 } }, 'Selasmawati').lowParagraph).toBe('');
    for (const code of ['V', 'X', 'S', 'B', 'O', 'R'] as PapiAspect[]) {
      expect(papiZone(scores[code])).toBe('Middle');
      expect(model.high.some((item) => item.code === code)).toBe(false);
      expect(model.low.some((item) => item.code === code)).toBe(false);
      expect(model.middle.some((item) => item.code === code)).toBe(true);
    }
    const middleOnly = papiSectionModel({ scores: Object.fromEntries(ORDER.map((code) => [code, 5])) });
    expect(middleOnly.high).toEqual([]);
    expect(middleOnly.low).toEqual([]);
    expect(middleOnly.highParagraph).toBe('');
    expect(middleOnly.lowParagraph).toBe('');
    expect(middleOnly.middle).toHaveLength(20);
    expect(middleOnly.middleParagraph.startsWith('Kandidat cukup berkomitmen menyelesaikan tugas secara tuntas')).toBe(true);
    const sedangThenLow = papiSectionModel({ scores: { ...middleScores, X: 0 } }, 'Selasmawati');
    expect(sedangThenLow.middleParagraph.startsWith('Selasmawati cukup berkomitmen')).toBe(true);
    expect(papiSectionModel({ scores: { N: 5 } }).high).toEqual([]);
    expect(papiSectionModel({ scores: { N: 5 } }).low.map((item) => item.code)).not.toContain('N');
  });
});
