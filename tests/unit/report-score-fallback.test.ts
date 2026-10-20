import { describe, expect, it } from 'vitest';
import { PAPI_ASPECT_DETAILS, calculatePapiScore } from '@/lib/scoring/papi';
import { MSDT_TYPE_DETAILS, calculateMsdtScore } from '@/lib/scoring/msdt';
import {
  hasCompleteMsdtScores,
  hasCompletePapiScores,
  hydrateReportScores,
  resolveMsdtScoring,
  resolvePapiScoring,
} from '@/lib/combinedReport';
import { hasilUtama, msdtSectionModel, papiSectionModel } from '@/lib/reportTemplateV3';

const LEGACY_META = {
  completed: true,
  total_answers: 90,
  submitted_at: '2026-09-01T00:00:00.000Z',
};

const PAPI_G_ANSWERS: Record<string, string> = {
  0: 'Saya seorang pekerja keras',
  10: 'Saya berusaha keras sekali',
  20: 'Saya selalu berusaha keras',
  30: 'Saya bekerja keras',
  40: 'Saya berusaha keras sekali',
  50: 'Saya selalu berusaha melakukan pekerjaan secara sempurna',
};

const MSDT_ANSWER =
  'Saya mengabaikan pelanggar-pelanggar peraturan bila saya merasa pasti bahwa tidak ada satu orangpun yang mengetahui tentang pelanggar-pelanggar tersebut.';

function fullPapiScores(value: number | string = 4): Record<string, number | string> {
  return Object.fromEntries(Object.keys(PAPI_ASPECT_DETAILS).map((code) => [code, value]));
}

function fullMsdtScores(value: number | string = 3): Record<string, number | string> {
  return Object.fromEntries(Object.keys(MSDT_TYPE_DETAILS).map((code) => [code, value]));
}

function storedPapi(scores: Record<string, number | string> = fullPapiScores()) {
  return { scores, dominantLabel: 'L - Leadership Role', ...LEGACY_META };
}

function storedMsdt(scores: Record<string, number | string> = fullMsdtScores()) {
  return {
    scores,
    dominantType: 'Ba',
    dominantLabel: 'Ba - Benevolent Autocrat',
    ...LEGACY_META,
  };
}

function boom(): never {
  throw new Error('scorer should not run');
}

describe('PAPI report score fallback', () => {
  it('keeps a complete stored score and does not rescore', () => {
    const stored = storedPapi();
    const resolved = resolvePapiScoring(stored, PAPI_G_ANSWERS, boom);
    expect(resolved).toBe(stored);
    expect(resolved?.scores.L).toBe(4);
    expect(hasCompletePapiScores(JSON.stringify(stored))).toBe(true);
  });

  it('keeps an all-zero stored profile instead of replacing it from answers', () => {
    const stored = storedPapi(fullPapiScores(0));
    const resolved = resolvePapiScoring(stored, PAPI_G_ANSWERS, boom);
    expect(resolved).toBe(stored);
    expect(resolved?.scores.G).toBe(0);
  });

  it('scores raw answers in memory when the stored payload has no aspect scores', () => {
    const legacy = { ...LEGACY_META };
    const resolved = resolvePapiScoring(legacy, PAPI_G_ANSWERS, calculatePapiScore);
    const expected = calculatePapiScore(PAPI_G_ANSWERS);

    expect(resolved).not.toBe(legacy);
    expect(legacy).toEqual(LEGACY_META);
    expect(resolved?.scores).toEqual(expected.scores);
    expect(resolved?.scores.G).toBe(6);
    expect(resolved?.dominantLabel).toBe(expected.dominantLabel);

    const fromStrings = resolvePapiScoring(
      JSON.stringify(legacy),
      JSON.stringify({ 0: PAPI_G_ANSWERS[0] }),
      calculatePapiScore
    );
    expect(fromStrings?.scores.G).toBe(1);

    const model = papiSectionModel(resolved);
    const workRole = model.groups.flatMap((group) => group.rows).find((row) => row.code === 'G');
    expect(workRole?.score).toBe(6);
    expect(model.narrative).toContain('Peran Pekerja Keras (G): Memiliki etos kerja yang kuat');
    expect(model.narrative).not.toContain('Menyukai gaya kerja yang santai');
    expect(papiSectionModel(legacy).narrative).toContain('Menyukai gaya kerja yang santai');
    expect(hasilUtama('papi', resolved)).toBe(expected.dominantLabel);
  });

  it('rescores when any aspect score is missing', () => {
    for (const code of Object.keys(PAPI_ASPECT_DETAILS)) {
      const scores = fullPapiScores();
      delete scores[code];
      let called = false;
      const resolved = resolvePapiScoring({ scores }, { 0: PAPI_G_ANSWERS[0] }, (answers) => {
        called = true;
        return calculatePapiScore(answers);
      });
      expect(called).toBe(true);
      expect(resolved?.scores.G).toBe(1);
    }
  });

  it('stays safe when raw answers are missing or the scorer fails', () => {
    const legacy = { ...LEGACY_META };
    expect(resolvePapiScoring(legacy, null, boom)).toBe(legacy);
    expect(resolvePapiScoring(legacy, undefined, boom)).toBe(legacy);
    expect(resolvePapiScoring(legacy, {}, boom)).toBe(legacy);
    expect(resolvePapiScoring(legacy, [], boom)).toBe(legacy);
    expect(resolvePapiScoring(legacy, 'not-json', boom)).toBe(legacy);
    expect(resolvePapiScoring(null, null, boom)).toBeNull();
    expect(resolvePapiScoring(legacy, PAPI_G_ANSWERS, boom)).toBe(legacy);
    expect(resolvePapiScoring(legacy, PAPI_G_ANSWERS, () => ({ scores: { N: 1 } }))).toBe(legacy);
    expect(papiSectionModel(resolvePapiScoring(legacy, null, boom))).toBeTruthy();
  });
});

describe('MSDT report score fallback', () => {
  const answers = { 0: MSDT_ANSWER };

  it('keeps a complete stored score and does not rescore', () => {
    const stored = storedMsdt();
    const resolved = resolveMsdtScoring(JSON.stringify(stored), answers, boom);
    expect(resolved?.dominantType).toBe('Ba');
    expect(resolved?.scores).toEqual(stored.scores);
    expect(hasCompleteMsdtScores(stored)).toBe(true);
  });

  it('scores raw answers in memory when dominant type and dimension scores are absent', () => {
    const legacy = { ...LEGACY_META, total_answers: 1 };
    const resolved = resolveMsdtScoring(legacy, answers, calculateMsdtScore);
    const expected = calculateMsdtScore(answers);

    expect(resolved).not.toBe(legacy);
    expect('dominantType' in legacy).toBe(false);
    expect(resolved?.scores).toEqual(expected.scores);
    expect(resolved?.dominantType).toBe(expected.dominantType);
    expect(resolved?.dominantLabel).toBe(expected.dominantLabel);
    expect(msdtSectionModel(legacy).code).toBe('-');
    expect(msdtSectionModel(resolved).code).toBe(expected.dominantType);
    expect(msdtSectionModel(resolved).code).not.toBe('-');
    expect(hasilUtama('msdt', resolved)).toBe(expected.dominantLabel);
  });

  it('rescores when the dominant type or a dimension score is missing', () => {
    const scores = fullMsdtScores();
    let called = false;
    resolveMsdtScoring({ scores }, answers, () => {
      called = true;
      return calculateMsdtScore(answers);
    });
    expect(called).toBe(true);

    delete scores.E;
    called = false;
    const resolved = resolveMsdtScoring({ scores, dominantType: 'Ba' }, { '0': MSDT_ANSWER }, (raw) => {
      called = true;
      return calculateMsdtScore(raw);
    });
    expect(called).toBe(true);
    expect(resolved?.dominantType).toBe(calculateMsdtScore(answers).dominantType);
  });

  it('stays safe when raw answers are missing or the scorer fails', () => {
    const legacy = { ...LEGACY_META };
    expect(resolveMsdtScoring(legacy, null, boom)).toBe(legacy);
    expect(resolveMsdtScoring(legacy, undefined, boom)).toBe(legacy);
    expect(resolveMsdtScoring(legacy, {}, boom)).toBe(legacy);
    expect(resolveMsdtScoring(legacy, 'not-json', boom)).toBe(legacy);
    expect(resolveMsdtScoring(null, null, boom)).toBeNull();
    expect(resolveMsdtScoring(legacy, answers, boom)).toEqual(legacy);
    expect(resolveMsdtScoring(legacy, answers, () => ({ dominantType: 'Ds' }))).toBe(legacy);
    expect(msdtSectionModel(resolveMsdtScoring(legacy, null, boom)).code).toBe('-');
  });
});

describe('hydrateReportScores', () => {
  it('fills only incomplete PAPI and MSDT rows and leaves other rows untouched', () => {
    const disc = { id: 1, test_code: 'disc', scoring_data: { dominantLabel: 'SC' }, raw_answers: { 0: 'a' } };
    const papi = {
      id: 2,
      test_code: 'PAPI',
      scoring_data: { ...LEGACY_META },
      raw_answers: PAPI_G_ANSWERS,
    };
    const msdt = {
      id: 3,
      test_code: 'msdt',
      scoring_data: storedMsdt(),
      raw_answers: { 0: MSDT_ANSWER },
    };
    const legacyMsdt = {
      id: 4,
      test_code: 'MSDT',
      scoring_data: { completed: true, total_answers: 1, submitted_at: LEGACY_META.submitted_at },
      raw_answers: null,
    };
    const snapshot = JSON.parse(JSON.stringify([disc, papi, msdt, legacyMsdt]));

    let papiCalls = 0;
    let msdtCalls = 0;
    const hydrated = hydrateReportScores([disc, papi, msdt, legacyMsdt], {
      papi: (answers) => {
        papiCalls += 1;
        return calculatePapiScore(answers);
      },
      msdt: (answers) => {
        msdtCalls += 1;
        return calculateMsdtScore(answers);
      },
    });

    expect([disc, papi, msdt, legacyMsdt]).toEqual(snapshot);
    expect(hydrated[0]).toBe(disc);
    expect(hydrated[2]).toBe(msdt);
    expect(hydrated[3]).toBe(legacyMsdt);
    expect(papiCalls).toBe(1);
    expect(msdtCalls).toBe(0);
    expect(hydrated[1]).not.toBe(papi);
    const papiScoring = hydrated[1].scoring_data;
    expect(papiScoring && typeof papiScoring === 'object' && 'scores' in papiScoring).toBe(true);
    if (!papiScoring || typeof papiScoring !== 'object' || !('scores' in papiScoring)) {
      throw new Error('expected computed PAPI scores');
    }
    expect((papiScoring.scores as Record<string, number>).G).toBe(6);
    expect(hydrated[1].raw_answers).toBe(papi.raw_answers);
    expect(hasilUtama('papi', papiScoring)).toBe(calculatePapiScore(PAPI_G_ANSWERS).dominantLabel);
    expect(hydrateReportScores(null, { papi: boom, msdt: boom })).toEqual([]);
  });
});
