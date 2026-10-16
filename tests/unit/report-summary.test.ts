import { describe, it, expect } from 'vitest';
import { getResultSummary } from '@/lib/reportSummary';
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
});
