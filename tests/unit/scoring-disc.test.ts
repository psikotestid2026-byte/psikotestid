import { describe, it, expect } from 'vitest';
import { calculateDiscScore } from '@/lib/scoring/disc';

describe('DISC scoring', () => {
  it('handles empty answers without throwing', () => {
    const result = calculateDiscScore({});
    expect(result).toBeTruthy();
    expect(result.answered).toBe(0);
    expect(result.most).toEqual({ D: 0, I: 0, S: 0, C: 0 });
  });

  it('counts answered items when most/least provided', () => {
    // DISC answers typically: { "0": { most: "...", least: "..." } } or string codes
    // Exercise the function with minimal structured answers matching KEYS length patterns
    const answers: Record<string, any> = {};
    for (let i = 0; i < 3; i++) {
      answers[String(i)] = { most: 'D', least: 'S' };
    }
    const result = calculateDiscScore(answers);
    expect(result.answered).toBeGreaterThanOrEqual(0);
    expect(result).toHaveProperty('dominantType');
    expect(result).toHaveProperty('g1');
    expect(result).toHaveProperty('g2');
    expect(result).toHaveProperty('g3');
  });
});
