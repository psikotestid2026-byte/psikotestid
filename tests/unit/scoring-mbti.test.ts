import { describe, it, expect } from 'vitest';
import { calculateMbtiScore } from '@/lib/scoring/mbti';

describe('MBTI scoring', () => {
  it('returns a 4-letter type and marks empty as invalid', () => {
    const result = calculateMbtiScore({});
    expect(result.type).toMatch(/^[EISNTFJP]{4}$/);
    expect(result.unanswered).toBe(70);
    expect(result.validityStatus).toBe('Tidak Valid');
  });
});
