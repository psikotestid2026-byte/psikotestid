import { describe, it, expect } from 'vitest';
import {
  calculateWptScore,
  checkWptAnswer,
  normalizeWptAnswer,
  WPT_RS_TO_IQ,
  WPT_ANSWER_KEYS,
} from '@/lib/scoring/wpt';

describe('WPT scoring', () => {
  it('normalizes answers case-insensitively', () => {
    expect(normalizeWptAnswer('  Desember ')).toBe('desember');
  });

  it('checks known correct answers', () => {
    expect(checkWptAnswer(1, 'Desember')).toBe(true);
    expect(checkWptAnswer(1, 'Januari')).toBe(false);
    expect(checkWptAnswer(8, '1/8')).toBe(true);
  });

  it('scores perfect 0-based key answers to max IQ (matches AssessmentClient)', () => {
    const answers: Record<string, string> = {};
    for (let q = 1; q <= 50; q++) {
      const key = WPT_ANSWER_KEYS[q];
      // AssessmentClient stores answers by 0-based question index
      answers[String(q - 1)] = Array.isArray(key) ? key[0] : key;
    }
    const result = calculateWptScore(answers);
    expect(result.raw_score).toBe(50);
    expect(result.iq).toBe(WPT_RS_TO_IQ[50]);
  });

  it('scores empty answers as raw_score 0', () => {
    const result = calculateWptScore({});
    expect(result.raw_score).toBe(0);
    expect(result.iq).toBe(WPT_RS_TO_IQ[0]);
  });
});
