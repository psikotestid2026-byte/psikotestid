import { describe, expect, it } from 'vitest';
import { calculateMsdtScore } from '@/lib/scoring/msdt';

describe('calculateMsdtScore', () => {
  it('correctly scores all A answers', () => {
    // 64 'a' answers:
    // Every row has 8 A's, column has 0 B's.
    // Scores:
    // Ds: 8 + 0 + 1 = 9
    // Mi: 8 + 0 + 2 = 10
    // Au: 8 + 0 + 1 = 9
    // Co: 8 + 0 + 0 = 8
    // Bu: 8 + 0 + 3 = 11
    // Dv: 8 + 0 - 1 = 7
    // Ba: 8 + 0 + 0 = 8
    // E:  8 + 0 - 4 = 4
    // TO = Au + Co + Ba + E = 9 + 8 + 8 + 4 = 29 (< 30 => conv 0.0 => Rendah / L)
    // RO = Mi + Co + Dv + E = 10 + 8 + 7 + 4 = 29 (< 30 => conv 0.0 => Rendah / L)
    // Eo = Bu + Dv + Ba + E = 11 + 7 + 8 + 4 = 30 (30 => conv 0.6 => Rendah / L)
    // Result: LLL => Ds
    const answers = Object.fromEntries(Array.from({ length: 64 }, (_, i) => [i, 'a']));
    const res = calculateMsdtScore(answers);

    expect(res.isValid).toBe(true);
    expect(res.totalAnswered).toBe(64);
    expect(res.scores.Ds).toBe(9);
    expect(res.scores.Mi).toBe(10);
    expect(res.scores.Au).toBe(9);
    expect(res.scores.Co).toBe(8);
    expect(res.scores.Bu).toBe(11);
    expect(res.scores.Dv).toBe(7);
    expect(res.scores.Ba).toBe(8);
    expect(res.scores.E).toBe(4);
    expect(res.orientation.TO).toBe(29);
    expect(res.orientation.RO).toBe(29);
    expect(res.orientation.E).toBe(30);
    expect(res.dominantType).toBe('Ds');
  });

  it('correctly scores all B answers', () => {
    // 64 'b' answers:
    // Every row has 0 A's, column has 8 B's.
    // Scores:
    // Ds: 0 + 8 + 1 = 9
    // Mi: 0 + 8 + 2 = 10
    // Au: 0 + 8 + 1 = 9
    // Co: 0 + 8 + 0 = 8
    // Bu: 0 + 8 + 3 = 11
    // Dv: 0 + 8 - 1 = 7
    // Ba: 0 + 8 + 0 = 8
    // E:  0 + 8 - 4 = 4
    // Same dimension scores as all A!
    const answers = Object.fromEntries(Array.from({ length: 64 }, (_, i) => [i, 'b']));
    const res = calculateMsdtScore(answers);

    expect(res.isValid).toBe(true);
    expect(res.totalAnswered).toBe(64);
    expect(res.dominantType).toBe('Ds');
  });

  it('supports 0/1 numeric and string indices', () => {
    const answers = Object.fromEntries(Array.from({ length: 64 }, (_, i) => [i, i % 2 === 0 ? 0 : 1]));
    const res = calculateMsdtScore(answers);
    expect(res.isValid).toBe(true);
    expect(res.totalAnswered).toBe(64);
  });

  it('marks incomplete submissions as isValid: false', () => {
    const answers = { 0: 'a', 1: 'b' };
    const res = calculateMsdtScore(answers);
    expect(res.isValid).toBe(false);
    expect(res.totalAnswered).toBe(2);
  });
});

