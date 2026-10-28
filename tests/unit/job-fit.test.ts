import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  FALLBACK_LEVEL_PROFILE,
  computeJobFit,
  resolveJobLevel,
  scoreBigFive,
  scoreDisc,
  scoreMsdt,
  scorePapi,
  scoreWpt,
  statusFromComposite,
  type JabatanMapping,
  type LevelProfile,
} from '@/lib/jobFit';

// Mirrors the seed in db/migrations/0017_dt_peduli_assessment.sql
const MAPPINGS: JabatanMapping[] = [
  ...['STAF', 'KONTRAK', 'SAHABAT'].map((k) => ({ jabatan_keyword: k, level_code: 'STAF', priority: 10 })),
  ...['EXECUTIVE DIRECTOR', 'PROGRAM DIRECTOR', 'DIREKTUR'].map((k) => ({ jabatan_keyword: k, level_code: 'DIREKTUR', priority: 20 })),
  ...['CHIEF', 'HEAD OF', 'GM ', 'DEPUTY'].map((k) => ({ jabatan_keyword: k, level_code: 'HOD', priority: 30 })),
  ...['SUPERVISOR', 'SPV', 'ASISTEN MANAJER', 'ASISTEN MANAGER'].map((k) => ({ jabatan_keyword: k, level_code: 'SUPERVISOR', priority: 40 })),
  ...['PROJECT MANAJER', 'PROJECT MANAGER', 'MANAJER', 'MANAGER', 'KABAG', 'KEPALA', 'PJS KEPALA'].map((k) => ({
    jabatan_keyword: k,
    level_code: 'MANAJER',
    priority: 50,
  })),
].map((m) => ({ ...m, match_mode: 'PREFIX' as const }));

describe('resolveJobLevel', () => {
  const cases: Array<[string, string]> = [
    ['STAF PROJECT MANAGER AREA BPKH (AREA SUMATERA & JABODETABEK)', 'STAF'],
    ['PROJECT MANAJER BPKH', 'MANAJER'],
    ['KONTRAK LEMBAGA', 'STAF'],
    ['ASISTEN MANAJER MARKOM & IT', 'SUPERVISOR'],
    ['SPV SEKRETARIAT PROGRAM', 'SUPERVISOR'],
    ['SUPERVISOR CUSTOMER CARE  OFFICER - PIC FRONT OFFICE', 'SUPERVISOR'],
    ['MANAJER DT READY', 'MANAJER'],
    ['MANAGER PENGAWASAN & AUDIT', 'MANAJER'],
    ['KABAG KEUANGAN', 'MANAJER'],
    ['PJS KEPALA KANTOR', 'MANAJER'],
    ['HEAD OF DESIGN, PLANNING AND CONTROL PROGRAM & Pjs. STAF COST DAN BUDGETING', 'HOD'],
    ['GM CORPORATE SECRETARY', 'HOD'],
    ['DEPUTY OPERATION DIRECTOR', 'HOD'],
    ['CHIEF GROWTH & GOVERNANCE OFFICER', 'HOD'],
    ['EXECUTIVE DIRECTOR', 'DIREKTUR'],
    ['DIREKTUR LPM', 'DIREKTUR'],
    ['PROGRAM DIRECTOR PEMBERDAYAAN, BPKH, PALESTINA & DUNIA ISLAM', 'DIREKTUR'],
    ['SAHABAT UNGGUL (PIC KAMPUNG HAJI BPKH DI DONGGALA)', 'STAF'],
    ['  staf   keuangan ', 'STAF'],
    ['', 'STAF'],
  ];

  it.each(cases)('maps "%s" to %s', (position, expected) => {
    expect(resolveJobLevel(position, MAPPINGS)).toBe(expected);
  });

  it('resolves every seeded employee position without falling to an unexpected level', () => {
    const employees = JSON.parse(
      readFileSync(resolve(process.cwd(), 'db/seeds/dt_peduli_employees.json'), 'utf8')
    ) as Array<{ position: string }>;
    const levels = new Set(employees.map((e) => resolveJobLevel(e.position, MAPPINGS)));
    for (const level of levels) expect(['STAF', 'SUPERVISOR', 'MANAJER', 'HOD', 'DIREKTUR']).toContain(level);
    // A non-STAF position must never be classified as STAF by accident.
    for (const e of employees) {
      const level = resolveJobLevel(e.position, MAPPINGS);
      if (/^(HEAD OF|DEPUTY|GM |CHIEF|EXECUTIVE DIRECTOR|PROGRAM DIRECTOR|DIREKTUR)/i.test(e.position.trim())) {
        expect(level).not.toBe('STAF');
      }
    }
  });
});

const profile: LevelProfile = { ...FALLBACK_LEVEL_PROFILE };

const papiScores = (overrides: Record<string, number>) => ({
  scores: Object.fromEntries('NGALPITVXSBORDCZEKFW'.split('').map((a) => [a, overrides[a] ?? 4.5])),
});

describe('instrument normalisation', () => {
  it('scores WPT by IQ within the floor/ceil range', () => {
    expect(scoreWpt({ iq: 60 }, profile)).toBe(0);
    expect(scoreWpt({ iq: 90 }, profile)).toBe(50);
    expect(scoreWpt({ iq: 120 }, profile)).toBe(100);
    expect(scoreWpt({ iq: 146 }, profile)).toBe(100);
    expect(scoreWpt({ score: '105' }, profile)).toBe(75);
    expect(scoreWpt(null, profile)).toBeNull();
  });

  it('rewards the ideal DISC dominant letter and handles two-letter codes', () => {
    expect(scoreDisc({ dominantLabel: 'S' }, profile)).toBe(100);
    expect(scoreDisc({ dominantLabel: 'D' }, profile)).toBe(50);
    const sc = scoreDisc({ dominantLabel: 'SC' }, profile)!;
    expect(sc).toBeGreaterThan(90);
    expect(sc).toBeLessThan(100);
    expect(scoreDisc({}, profile)).toBeNull();
  });

  it('inverts negatively weighted Big Five dimensions', () => {
    const calm = { dimensions: { E: { percent: 60 }, A: { percent: 80 }, C: { percent: 90 }, N: { percent: 30 }, O: { percent: 60 } } };
    const anxious = { dimensions: { ...calm.dimensions, N: { percent: 90 } } };
    expect(scoreBigFive(calm, profile)!).toBeGreaterThan(scoreBigFive(anxious, profile)!);
    expect(scoreBigFive({}, profile)).toBeNull();
  });

  it('scores PAPI against high and low aspects', () => {
    const good = papiScores({ N: 9, G: 9, C: 9, D: 9, W: 9, Z: 0, K: 0 });
    const poor = papiScores({ N: 0, G: 0, C: 0, D: 0, W: 0, Z: 9, K: 9 });
    expect(scorePapi(good, profile)).toBe(100);
    expect(scorePapi(poor, profile)).toBe(0);
  });

  it('looks up MSDT style fit', () => {
    expect(scoreMsdt({ dominantType: 'E' }, profile)).toBe(95);
    expect(scoreMsdt({ dominantType: 'Ds' }, profile)).toBe(20);
    expect(scoreMsdt({ dominantType: 'XX' }, profile)).toBeNull();
  });
});

describe('computeJobFit', () => {
  const strong = {
    wpt: { iq: 120 },
    disc: { dominantLabel: 'S' },
    bigfive: { dimensions: { E: { percent: 80 }, A: { percent: 90 }, C: { percent: 95 }, N: { percent: 25 }, O: { percent: 80 } } },
    papi: papiScores({ N: 9, G: 9, C: 9, D: 9, W: 9, Z: 0, K: 0 }),
    msdt: { dominantType: 'E' },
  };

  it('recommends a strong all-round profile', () => {
    const res = computeJobFit(strong, profile);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.status).toBe('DIREKOMENDASIKAN');
      expect(res.composite).toBeGreaterThan(90);
      expect(res.breakdown.below_min).toEqual([]);
    }
  });

  it('downgrades to DIPERTIMBANGKAN when one instrument is under its minimum', () => {
    const res = computeJobFit({ ...strong, wpt: { iq: 62 } }, { ...profile, min_scores: { ...profile.min_scores, wpt: 50 } });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.breakdown.below_min).toEqual(['wpt']);
      expect(res.breakdown.gated).toBe(true);
      expect(res.status).toBe('DIPERTIMBANGKAN');
    }
  });

  it('rejects a weak profile', () => {
    const weak = {
      wpt: { iq: 60 },
      disc: { dominantLabel: 'D' },
      bigfive: { dimensions: { E: { percent: 20 }, A: { percent: 20 }, C: { percent: 20 }, N: { percent: 100 }, O: { percent: 20 } } },
      papi: papiScores({ N: 0, G: 0, C: 0, D: 0, W: 0, Z: 9, K: 9 }),
      msdt: { dominantType: 'Ds' },
    };
    const res = computeJobFit(weak, profile);
    expect(res.ok && res.status).toBe('TIDAK_DIREKOMENDASIKAN');
  });

  it('reports which instruments are missing', () => {
    const res = computeJobFit({ wpt: { iq: 100 } }, profile);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.missing).toEqual(['disc', 'bigfive', 'papi', 'msdt']);
  });

  it('maps composite to status using the level thresholds', () => {
    expect(statusFromComposite(72, profile)).toBe('DIREKOMENDASIKAN');
    expect(statusFromComposite(71.99, profile)).toBe('DIPERTIMBANGKAN');
    expect(statusFromComposite(54.99, profile)).toBe('TIDAK_DIREKOMENDASIKAN');
  });
});
