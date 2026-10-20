import { describe, it, expect } from 'vitest';
import { getResultSummary, msaiMainProfile, numberedSectionTitle, readWptReportFigures } from '@/lib/reportSummary';
import { calculateEnneagramScore } from '@/lib/scoring/enneagram';
import { calculatePapiScore } from '@/lib/scoring/papi';
import { calculateDiscScore } from '@/lib/scoring/disc';

describe('getResultSummary (combined report summary table)', () => {
  it('enneagram never shows undefined and shows a Tipe label', () => {
    const a: Record<string, string> = {};
    for (let i = 0; i < 180; i++) a[i] = String(i % 4);
    const s = getResultSummary('enneagram', calculateEnneagramScore(a));
    expect(s).not.toContain('undefined');
    expect(s).toMatch(/Tipe/);
  });

  it('papi without dominantType shows its label only', () => {
    const s = getResultSummary('papi', calculatePapiScore({}));
    expect(s).not.toContain('undefined');
    expect(s).toBe('Profil Seimbang');
    expect(getResultSummary('papi', { dominantLabel: 'N - Kebutuhan' })).toBe('N - Kebutuhan');
  });

  it('keeps disc label with type and other fallbacks', () => {
    const disc = calculateDiscScore({});
    expect(getResultSummary('disc', disc)).toBe(`${disc.dominantLabel} (${disc.dominantType})`);
    expect(getResultSummary('wpt', { score: '110' })).toBe('Skor Kognitif: 110');
    expect(getResultSummary('tech_js', { total_answers: 3 })).toBe('3 Terjawab');
    expect(getResultSummary('x', null)).toBe('Selesai');
  });

  it('bigfive summary lists dimension categories and never undefined', () => {
    const summary = getResultSummary('bigfive', {
      dimensions: {
        E: { category: 'Tinggi' },
        A: { category: 'Sedang' },
        C: { category: 'Tinggi' },
        N: { category: 'Rendah' },
        O: { category: 'Sedang' },
      },
    });
    expect(summary).toBe('E Tinggi · A Sedang · C Tinggi · N Rendah · O Sedang');
    expect(summary).not.toContain('undefined');
    expect(getResultSummary('BIGFIVE', {})).toBe('Selesai');
  });

  it('mbti, riasec, and msai summaries show the result instead of the answer count', () => {
    expect(getResultSummary('mbti', { type: 'ESTP', total_answers: 70 })).toBe('ESTP');
    expect(getResultSummary('MBTI', { type: 'estp', total_answers: 70 })).toBe('ESTP');
    expect(getResultSummary('riasec', { interestCode: 'CEA', total_answers: 48 })).toBe('CEA');
    expect(getResultSummary('riasec', { ranking: ['C', 'E', 'A', 'R', 'I', 'S'], total_answers: 48 })).toBe('CEA');
    expect(
      getResultSummary('msai', {
        total_answers: 87,
        quadrantScores: { Adhocracy: 3, Market: 4.5, Hierarchy: 2, Clan: 3.2 },
      })
    ).toBe('Market');
    expect(getResultSummary('msai', { total_answers: 4, quadrantScores: { Clan: null } })).toBe('4 Terjawab');
  });

  it('msai main profile uses the highest quadrant and keeps ties', () => {
    expect(msaiMainProfile({ Adhocracy: 4, Market: 4, Hierarchy: 2, Clan: 1 })).toBe('Adhocracy / Market');
    expect(msaiMainProfile(null)).toBeNull();
  });

  it('wpt report separates raw score from IQ', () => {
    expect(readWptReportFigures({ score: '120', raw_score: 24, label: 'Superior' })).toEqual({
      rawScore: 24,
      iq: 120,
      label: 'Superior',
    });
    expect(readWptReportFigures({ score: '120' })).toEqual({
      rawScore: null,
      iq: 120,
      label: 'Superior',
    });
    expect(readWptReportFigures({ iq: 110, raw_score: 18 }).label).toBe('Rata-rata Atas');
  });

  it('numbers every combined-report section, including Big Five', () => {
    expect(numberedSectionTitle(3, 'LAPORAN BIG FIVE INVENTORY (BFI)')).toBe(
      '3. LAPORAN BIG FIVE INVENTORY (BFI)'
    );
    expect(numberedSectionTitle(undefined, 'LAPORAN BIG FIVE INVENTORY (BFI)')).toBe(
      'LAPORAN BIG FIVE INVENTORY (BFI)'
    );
  });
});
