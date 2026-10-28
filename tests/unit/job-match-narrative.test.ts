import { describe, expect, it } from 'vitest';
import { buildJobMatchNarrative, verdictForScore } from '@/lib/jobMatchNarrative';
import { FALLBACK_LEVEL_PROFILE, buildFitDetails } from '@/lib/jobFit';

const breakdown = (over: Partial<any> = {}) => ({
  level_name: 'Manajer / Kepala',
  tests: {
    wpt: { score: 80, weight: 0.2, min_score: 50, below_min: false },
    disc: { score: 88, weight: 0.2, min_score: 50, below_min: false },
    bigfive: { score: 70, weight: 0.2, min_score: 50, below_min: false },
    papi: { score: 40, weight: 0.2, min_score: 50, below_min: true },
    msdt: { score: 95, weight: 0.2, min_score: 50, below_min: false },
  },
  thresholds: { recommended: 75, considered: 58 },
  gated: false,
  ...over,
});

const base = {
  fullName: 'AZIZ',
  position: 'MANAJER DT READY',
  status: 'DIPERTIMBANGKAN' as const,
  systemStatus: 'DIPERTIMBANGKAN' as const,
  overridden: false,
  composite: 74.2,
};

describe('verdictForScore', () => {
  it('maps score bands', () => {
    expect(verdictForScore(80)).toBe('Sangat sesuai');
    expect(verdictForScore(60)).toBe('Sesuai');
    expect(verdictForScore(45)).toBe('Cukup sesuai');
    expect(verdictForScore(10)).toBe('Perlu pengembangan');
  });
});

describe('buildJobMatchNarrative', () => {
  it('returns null without a breakdown', () => {
    expect(buildJobMatchNarrative({ ...base, breakdown: null })).toBeNull();
  });

  it('lists strengths from the top scores and development from below-min tests', () => {
    const n = buildJobMatchNarrative({ ...base, breakdown: breakdown() })!;
    expect(n.rows).toHaveLength(5);
    expect(n.strengths[0]).toContain('MSDT');
    expect(n.development[0]).toContain('PAPI');
    expect(n.development[0]).toContain('batas minimum');
    expect(n.conclusion).toContain('kecocokan sebagian');
  });

  it('explains the gate and assessor override', () => {
    const n = buildJobMatchNarrative({
      ...base,
      breakdown: breakdown({ gated: true }),
      status: 'DIREKOMENDASIKAN',
      systemStatus: 'DIPERTIMBANGKAN',
      overridden: true,
    })!;
    expect(n.statusReason).toContain('di bawah batas minimum');
    expect(n.statusReason).toContain('ditetapkan oleh asesor');
  });

  it('describes ideal vs actual using stored fit details', () => {
    const details = buildFitDetails(
      {
        wpt: { iq: 110 },
        disc: { dominantLabel: 'S' },
        bigfive: { dimensions: { E: { percent: 60 }, A: { percent: 80 }, C: { percent: 90 }, N: { percent: 30 }, O: { percent: 60 } } },
        papi: { scores: { N: 8, G: 7, C: 6, D: 5, W: 4, Z: 2, K: 3 } },
        msdt: { dominantType: 'E' },
      },
      FALLBACK_LEVEL_PROFILE
    );
    const n = buildJobMatchNarrative({ ...base, breakdown: breakdown({ fit_details: details }) })!;
    const disc = n.rows.find((r) => r.code === 'disc')!;
    expect(disc.actual).toBe('S');
    expect(disc.ideal.length).toBeGreaterThan(0);
    expect(n.rows.find((r) => r.code === 'msdt')!.actual).toContain('Executive');
    expect(n.rows.find((r) => r.code === 'wpt')!.actual).toContain('110');
  });

  it('keeps wording neutral and always includes the caveat', () => {
    const n = buildJobMatchNarrative({ ...base, status: 'TIDAK_DIREKOMENDASIKAN', systemStatus: 'TIDAK_DIREKOMENDASIKAN', breakdown: breakdown() })!;
    expect(n.conclusion).toContain('bukan nilai pribadi');
    expect(n.caveat).toContain('kecenderungan');
  });
});
