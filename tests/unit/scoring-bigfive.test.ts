import { describe, it, expect } from 'vitest';
import { calculateBigFiveScore } from '@/lib/scoring/bigfive';

describe('Big Five scoring', () => {
  it('returns all five dimensions for empty answers', () => {
    const result = calculateBigFiveScore({});
    expect(result.dimensions).toHaveProperty('E');
    expect(result.dimensions).toHaveProperty('A');
    expect(result.dimensions).toHaveProperty('C');
    expect(result.dimensions).toHaveProperty('N');
    expect(result.dimensions).toHaveProperty('O');
    expect(result.dimensions.E.raw).toBe(0);
  });

  it('scores numeric Likert values', () => {
    const result = calculateBigFiveScore({ '0': '5' });
    expect(result.dimensions.E.raw).toBe(5);
  });

  it('applies reverse scoring for item 2 (Agreeableness, reversed)', () => {
    const result = calculateBigFiveScore({ '1': '5' });
    expect(result.dimensions.A.raw).toBe(1);
  });
});
