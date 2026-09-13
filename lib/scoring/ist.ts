// IST (Intelligenz-Struktur-Test, Amthauer) scoring — PARTIAL, by design.
//
// The seeded question bank (137 items) covers 7 blocks: SE 1-20, WA 21-40, AN 41-60,
// GE 61-76 (verbal subtests), RA 77-96 (arithmetic), ZR 97-116 (number series), and a
// 117-137 block that is NOT a real IST-70 subtest (it's an open-ended "word starting
// with letter X" verbal-fluency prompt, not a scoreable multiple-choice item — item 117
// even has empty text). See refs/docs (this session's research) for the full trail.
//
// SE/WA/AN/GE (76 items) are content-graded verbal-reasoning items whose correctness
// depends on a psychometrically-normed answer key that is commercially licensed and not
// legitimately publicly available. We do NOT fabricate answers for them.
//
// RA (arithmetic word problems) and ZR (number series) ARE legitimately scoreable without
// any publisher key: each has one mathematically-derivable correct answer, independently
// computed and verified by hand from the item text, then written into question_banks as
// real numeric `options` + `correctIndex` (see db/fix_ist_ra_zr.mjs). This module only
// scores those 40 items. The result is reported as a "Kemampuan Numerik & Logika" partial
// score, NOT a full IST IQ-equivalent score — the report must not claim more than this
// data actually supports.
//
// Answers are keyed by question index (0-based, matches question_banks.order_number - 1),
// value = the exact option text the participant selected (same convention as other
// scoring modules in this app).

export const IST_RA_RANGE: [number, number] = [77, 96]; // order_number, inclusive
export const IST_ZR_RANGE: [number, number] = [97, 116]; // order_number, inclusive
export const IST_UNSCORED_RANGES: { label: string; range: [number, number] }[] = [
  { label: 'SE — Satzergänzung (pelengkapan kalimat)', range: [1, 20] },
  { label: 'WA — Wortauswahl (pemilihan kata)', range: [21, 40] },
  { label: 'AN — Analogien (analogi verbal)', range: [41, 60] },
  { label: 'GE — Gemeinsamkeiten (persamaan kata)', range: [61, 76] },
  { label: 'Blok 117-137 (bukan subtes IST baku, tidak diskor)', range: [117, 137] },
];

function norm(s: any): string {
  return String(s ?? '').trim().toLowerCase();
}

export interface IstScoreResult {
  raScore: number; // correct count, 0-20
  raTotal: number;
  zrScore: number; // correct count, 0-20
  zrTotal: number;
  numericLogicScore: number; // ra+zr combined, 0-40
  numericLogicTotal: number;
  numericLogicPercent: number;
  unscoredNote: string;
  completed: boolean;
  total_answers: number;
  submitted_at: string;
}

export interface IstQuestionRow {
  order_number: number;
  question_data: { text?: string; options?: string[]; correctIndex?: number };
}

/**
 * Real entry point: scores RA (77-96) and ZR (97-116) against the correctIndex stored in
 * question_banks.question_data (see db/fix_ist_ra_zr.mjs). SE/WA/AN/GE and 117-137 are
 * intentionally skipped — see module header.
 */
export function calculateIstScoreFromQuestions(
  answers: Record<string | number, any>,
  questions: IstQuestionRow[]
): IstScoreResult {
  const byOrder = new Map<number, IstQuestionRow>();
  for (const q of questions) byOrder.set(q.order_number, q);

  const scoreRange = (range: [number, number]) => {
    let correct = 0;
    const total = range[1] - range[0] + 1;
    for (let orderNumber = range[0]; orderNumber <= range[1]; orderNumber++) {
      const q = byOrder.get(orderNumber);
      if (!q || typeof q.question_data.correctIndex !== 'number' || !q.question_data.options) continue;
      const idx = orderNumber - 1;
      const raw = answers[idx] ?? answers[String(idx)];
      if (raw === undefined || raw === null || norm(raw) === '') continue;
      const correctText = q.question_data.options[q.question_data.correctIndex];
      if (norm(raw) === norm(correctText)) correct++;
    }
    return { correct, total };
  };

  const ra = scoreRange(IST_RA_RANGE);
  const zr = scoreRange(IST_ZR_RANGE);
  const numericLogicScore = ra.correct + zr.correct;
  const numericLogicTotal = ra.total + zr.total;

  return {
    raScore: ra.correct,
    raTotal: ra.total,
    zrScore: zr.correct,
    zrTotal: zr.total,
    numericLogicScore,
    numericLogicTotal,
    numericLogicPercent: numericLogicTotal > 0 ? Math.round((numericLogicScore / numericLogicTotal) * 100) : 0,
    unscoredNote:
      'Hanya subtes RA (aritmatika) dan ZR (deret angka) yang diskor pada laporan ini — ' +
      'jawaban benar dapat diverifikasi secara matematis tanpa kunci jawaban dari penerbit. ' +
      'Subtes SE, WA, AN, GE (verbal) tidak diskor karena instrumen ini berlisensi komersial ' +
      'dan kunci jawaban resminya tidak tersedia secara publik/legal untuk direproduksi di sini.',
    completed: true,
    total_answers: Object.keys(answers || {}).length,
    submitted_at: new Date().toISOString(),
  };
}
