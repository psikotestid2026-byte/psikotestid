import { describe, expect, it } from 'vitest';
import { evaluateCompletion } from '@/lib/bundleCompletion';

describe('evaluateCompletion', () => {
  it('is complete only when every required test has a result', () => {
    expect(evaluateCompletion([1, 2, 3, 4, 5], [1, 2, 3, 4, 5]).isComplete).toBe(true);
    const partial = evaluateCompletion([1, 2, 3, 4, 5], [1, 2, 3, 4]);
    expect(partial.isComplete).toBe(false);
    expect(partial.completed).toBe(4);
    expect(partial.missing_test_ids).toEqual([5]);
  });

  it('ignores extra results and never treats an empty campaign as complete', () => {
    expect(evaluateCompletion([1, 2], [1, 2, 9]).isComplete).toBe(true);
    expect(evaluateCompletion([], [1]).isComplete).toBe(false);
  });
});
