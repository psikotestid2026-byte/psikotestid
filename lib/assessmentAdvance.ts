/**
 * One in-flight submit or stage change at a time.
 * Rapid clicks and the WPT timer share the same lock.
 */

export interface SubmitLock {
  held: boolean;
}

export function acquireSubmitLock(lock: SubmitLock): boolean {
  if (lock.held) return false;
  lock.held = true;
  return true;
}

export function releaseSubmitLock(lock: SubmitLock): void {
  lock.held = false;
}

export type QuestionAdvance =
  | { type: 'ignore' }
  | { type: 'next-question' }
  | { type: 'submit' };

/** Last question submits once. Earlier questions move forward one step, and never while a submit is in flight. */
export function planQuestionAdvance(input: {
  locked: boolean;
  stepping: boolean;
  currentQ: number;
  totalQuestions: number;
}): QuestionAdvance {
  if (input.locked || input.stepping) return { type: 'ignore' };
  const total = Math.max(1, input.totalQuestions);
  const current = Math.min(Math.max(0, input.currentQ), total - 1);
  if (current < total - 1) return { type: 'next-question' };
  return { type: 'submit' };
}

/** The between-test "Lanjut" button may move the index only once. */
export function planConfirmNext(locked: boolean): 'advance' | 'ignore' {
  return locked ? 'ignore' : 'advance';
}

/**
 * What to do when the on-screen timer reaches 0:00.
 * The decision is made from rendered state, not from inside a setState updater,
 * so a deferred updater cannot swallow the WPT auto-submit.
 * alreadyFired / locked keep it to a single submit.
 */
export function planTimeExpiry(input: {
  stage: string;
  timeLeft: number;
  testCode: string | null | undefined;
  alreadyFired: boolean;
  locked: boolean;
  halted: boolean;
}): 'submit-wpt' | 'warn' | 'none' {
  if (input.halted || input.alreadyFired || input.locked) return 'none';
  if (input.stage !== 'questions' || input.timeLeft !== 0) return 'none';
  if (String(input.testCode || '').trim().toLowerCase() === 'wpt') return 'submit-wpt';
  return 'warn';
}

export interface MissingTestRoute {
  index: number;
  code: string;
}

/** First campaign test named by the server's missing_tests list, in campaign order. */
export function routeToMissingTest(
  tests: { code?: string | null }[],
  missingTests: unknown
): MissingTestRoute | null {
  if (!Array.isArray(missingTests) || missingTests.length === 0) return null;
  const wanted = missingTests.map((code) => String(code || '').trim().toLowerCase()).filter(Boolean);
  if (wanted.length === 0) return null;
  for (const code of wanted) {
    const index = tests.findIndex((test) => String(test?.code || '').trim().toLowerCase() === code);
    if (index >= 0) return { index, code };
  }
  return null;
}
