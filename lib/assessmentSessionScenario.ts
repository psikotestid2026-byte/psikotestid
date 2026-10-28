import { authorizeAssessmentSubmit, buildParticipantSubmitBody, decideTabSession, progressStorageKey } from './assessmentSession';
import { mintAssessmentToken, verifyAssessmentToken } from './assessmentToken';

export interface ScenarioCheck {
  name: string;
  ok: boolean;
  detail: string;
}

/**
 * Two participants, one browser.
 * Tab A is mid-test as Abdul. Tab B logs in as Abar and overwrites the NextAuth cookie.
 * Abdul's tab must keep Abdul's id, and no submit may land on Abar.
 */
export function runTwoParticipantIsolationScenario(secret = 'test-secret-assessment-session'): ScenarioCheck[] {
  const now = Date.now();
  const tokenA = mintAssessmentToken(
    { pid: 101, cid: 15, email: 'abdul@example.com', name: 'Abdul' },
    secret,
    now
  );
  const tokenB = mintAssessmentToken(
    { pid: 202, cid: 15, email: 'abar@example.com', name: 'Abar' },
    secret,
    now
  );
  const checks: ScenarioCheck[] = [];

  const push = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail });

  const tabA = decideTabSession({ storedToken: null, incomingToken: tokenA, campaignId: 15, now });
  push(
    'tab A binds Abdul on first load',
    tabA.action === 'adopt' && tabA.participantId === 101 && tabA.cookieMismatch === false,
    tabA.action
  );

  const tabB = decideTabSession({ storedToken: null, incomingToken: tokenB, campaignId: 15, now });
  push(
    'tab B binds Abar on its own first load',
    tabB.action === 'adopt' && tabB.participantId === 202,
    tabB.action
  );

  const afterCookieSwap = decideTabSession({
    storedToken: tokenA,
    incomingToken: tokenB,
    campaignId: 15,
    now,
  });
  push(
    'tab A ignores Abar after the shared cookie changes',
    afterCookieSwap.action === 'keep' &&
      afterCookieSwap.participantId === 101 &&
      afterCookieSwap.cookieMismatch === true &&
      afterCookieSwap.token === tokenA,
    `${afterCookieSwap.action} pid=${'participantId' in afterCookieSwap ? afterCookieSwap.participantId : '-'}`
  );

  const verifiedA = verifyAssessmentToken(tokenA, secret, now);
  const writeToB = authorizeAssessmentSubmit({
    verifiedToken: verifiedA,
    presentedToken: true,
    cookieEmail: 'abar@example.com',
    isAdmin: false,
    participantId: 202,
    participantEmail: 'abar@example.com',
    campaignId: 15,
  });
  push(
    'Abdul token cannot submit as Abar',
    writeToB.ok === false && writeToB.status === 403,
    writeToB.ok ? 'allowed' : writeToB.code
  );

  const writeAsA = authorizeAssessmentSubmit({
    verifiedToken: verifiedA,
    presentedToken: true,
    cookieEmail: 'abar@example.com',
    isAdmin: false,
    participantId: 101,
    participantEmail: 'abdul@example.com',
    campaignId: 15,
  });
  push(
    'Abdul tab can still submit Abdul while the cookie is Abar',
    writeAsA.ok === true && writeAsA.via === 'token',
    writeAsA.ok ? writeAsA.via : writeAsA.code
  );

  const timerWithoutToken = authorizeAssessmentSubmit({
    verifiedToken: null,
    presentedToken: false,
    cookieEmail: 'abar@example.com',
    isAdmin: false,
    participantId: 101,
    participantEmail: 'abdul@example.com',
    campaignId: 15,
  });
  push(
    'WPT auto-submit without a tab token cannot use the other cookie',
    timerWithoutToken.ok === false,
    timerWithoutToken.ok ? 'allowed' : timerWithoutToken.code
  );

  const timerBody = buildParticipantSubmitBody({
    halted: false,
    boundParticipantId: 101,
    token: tokenA,
    testId: 7,
    answers: { 0: 'A' },
  });
  push(
    'auto-submit body stays on the bound participant',
    timerBody.ok === true && timerBody.body.participant_id === 101 && timerBody.body.assessment_token === tokenA,
    timerBody.ok ? String(timerBody.body.participant_id) : timerBody.reason
  );

  const haltedTimer = buildParticipantSubmitBody({
    halted: true,
    boundParticipantId: 101,
    token: tokenA,
    action: 'mark_completed',
  });
  push('halted tab does not mark anyone completed', haltedTimer.ok === false, haltedTimer.ok ? 'sent' : haltedTimer.reason);

  const keyA = progressStorageKey(15, 101, 0);
  const keyB = progressStorageKey(15, 202, 0);
  push('local progress keys differ by participant id', keyA !== keyB && keyA.includes('_p101_') && keyB.includes('_p202_'), `${keyA} vs ${keyB}`);

  const expiredA = mintAssessmentToken(
    { pid: 101, cid: 15, email: 'abdul@example.com', name: 'Abdul' },
    secret,
    now - (25 * 60 * 60 * 1000)
  );
  const stopped = decideTabSession({ storedToken: expiredA, incomingToken: tokenB, campaignId: 15, now });
  push(
    'expired Abdul tab stops instead of adopting Abar',
    stopped.action === 'stop' && stopped.boundName === 'Abdul',
    stopped.action === 'stop' ? stopped.boundName : stopped.action
  );

  const sameTabRelogin = decideTabSession({ storedToken: null, incomingToken: tokenB, campaignId: 15, now });
  push(
    'after this tab clears its binding, a new login is adopted',
    sameTabRelogin.action === 'adopt' && sameTabRelogin.participantId === 202,
    sameTabRelogin.action
  );

  return checks;
}
