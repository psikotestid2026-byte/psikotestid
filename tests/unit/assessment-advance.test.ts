import { describe, expect, it } from 'vitest';
import {
  acquireSubmitLock,
  planConfirmNext,
  planQuestionAdvance,
  releaseSubmitLock,
  routeToMissingTest,
  type SubmitLock,
} from '@/lib/assessmentAdvance';

const tests = [
  { code: 'wpt' },
  { code: 'disc' },
  { code: 'bigfive' },
  { code: 'papi' },
  { code: 'msdt' },
];

describe('assessment submit lock', () => {
  it('lets the first submit through and ignores the rest until release', () => {
    const lock: SubmitLock = { held: false };
    expect(acquireSubmitLock(lock)).toBe(true);
    expect(acquireSubmitLock(lock)).toBe(false);
    expect(acquireSubmitLock(lock)).toBe(false);
    releaseSubmitLock(lock);
    expect(acquireSubmitLock(lock)).toBe(true);
  });

  it('submits the last question only once and steps earlier questions one at a time', () => {
    expect(planQuestionAdvance({ locked: false, stepping: false, currentQ: 0, totalQuestions: 3 })).toEqual({
      type: 'next-question',
    });
    expect(planQuestionAdvance({ locked: false, stepping: true, currentQ: 0, totalQuestions: 3 })).toEqual({
      type: 'ignore',
    });
    expect(planQuestionAdvance({ locked: false, stepping: false, currentQ: 2, totalQuestions: 3 })).toEqual({
      type: 'submit',
    });
    expect(planQuestionAdvance({ locked: true, stepping: false, currentQ: 2, totalQuestions: 3 })).toEqual({
      type: 'ignore',
    });
  });

  it('ignores extra clicks on the between-test continue button', () => {
    expect(planConfirmNext(false)).toBe('advance');
    expect(planConfirmNext(true)).toBe('ignore');
  });

  it('sends the participant back to the first test the server says is missing', () => {
    expect(routeToMissingTest(tests, ['PAPI', 'msdt'])).toEqual({ index: 3, code: 'papi' });
    expect(routeToMissingTest(tests, ['not-a-test'])).toBeNull();
    expect(routeToMissingTest(tests, [])).toBeNull();
    expect(routeToMissingTest(tests, 'PAPI')).toBeNull();
  });
});
