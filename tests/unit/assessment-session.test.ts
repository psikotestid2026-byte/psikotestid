import { describe, expect, it } from 'vitest';
import {
  authorizeAssessmentSubmit,
  buildParticipantSubmitBody,
  clearTabAssessmentBindings,
  decideTabSession,
  legacyProgressStorageKey,
  progressStorageKey,
} from '@/lib/assessmentSession';
import { mintAssessmentToken, verifyAssessmentToken } from '@/lib/assessmentToken';
import { runTwoParticipantIsolationScenario } from '@/lib/assessmentSessionScenario';

const SECRET = 'unit-test-assessment-secret';

describe('assessment session isolation', () => {
  it('rejects a tampered token', () => {
    const token = mintAssessmentToken(
      { pid: 5, cid: 15, email: 'a@example.com', name: 'A' },
      SECRET
    );
    const [body] = token.split('.');
    expect(verifyAssessmentToken(`${body}.not-the-signature`, SECRET)).toBeNull();
    expect(verifyAssessmentToken(token, 'another-secret-value-here')).toBeNull();
  });

  it('progress keys include the participant id and reset count', () => {
    expect(progressStorageKey(15, 101, 2)).toBe('psikotest_progress_c15_p101_r2');
    expect(progressStorageKey(15, 101, 2)).not.toBe(legacyProgressStorageKey(15, 'abdul@x.com', 2));
    expect(progressStorageKey(15, 101, 0)).not.toBe(progressStorageKey(15, 202, 0));
  });

  it('does not fall back to the cookie when a token is presented for someone else', () => {
    const token = mintAssessmentToken(
      { pid: 101, cid: 15, email: 'abdul@example.com', name: 'Abdul' },
      SECRET
    );
    const result = authorizeAssessmentSubmit({
      verifiedToken: verifyAssessmentToken(token, SECRET),
      presentedToken: true,
      cookieEmail: 'abar@example.com',
      isAdmin: false,
      participantId: 202,
      participantEmail: 'abar@example.com',
      campaignId: 15,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('SESSION_MISMATCH');
  });

  it('refuses a halted auto-submit', () => {
    expect(
      buildParticipantSubmitBody({
        halted: true,
        boundParticipantId: 202,
        token: 'token',
        action: 'mark_completed',
      }).ok
    ).toBe(false);
  });

  it('stops an expired tab instead of adopting the new login', () => {
    const now = Date.now();
    const expired = mintAssessmentToken(
      { pid: 101, cid: 15, email: 'abdul@example.com', name: 'Abdul' },
      SECRET,
      now - 26 * 60 * 60 * 1000
    );
    const incoming = mintAssessmentToken(
      { pid: 202, cid: 15, email: 'abar@example.com', name: 'Abar' },
      SECRET,
      now
    );
    const decision = decideTabSession({
      storedToken: expired,
      incomingToken: incoming,
      campaignId: 15,
      now,
    });
    expect(decision.action).toBe('stop');
    if (decision.action === 'stop') expect(decision.boundName).toBe('Abdul');
  });

  it('proves two participants in one browser cannot cross-write', () => {
    const checks = runTwoParticipantIsolationScenario(SECRET);
    const failed = checks.filter((check) => !check.ok);
    expect(failed).toEqual([]);
  });
});

describe('clearTabAssessmentBindings', () => {
  it('removes only assessment tab keys', () => {
    const memory = new Map<string, string>();
    const storage = {
      get length() {
        return memory.size;
      },
      key(index: number) {
        return Array.from(memory.keys())[index] ?? null;
      },
      getItem(key: string) {
        return memory.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        memory.set(key, value);
      },
      removeItem(key: string) {
        memory.delete(key);
      },
      clear() {
        memory.clear();
      },
    } as Storage;
    viStubSessionStorage(storage);
    sessionStorage.setItem('psikotest_tab_c15', 'token-a');
    sessionStorage.setItem('psikotest_progress_keep', '1');
    clearTabAssessmentBindings();
    expect(sessionStorage.getItem('psikotest_tab_c15')).toBeNull();
    expect(sessionStorage.getItem('psikotest_progress_keep')).toBe('1');
    viStubSessionStorage(undefined);
  });
});

function viStubSessionStorage(storage: Storage | undefined) {
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: storage,
  });
}
