/**
 * Per-tab assessment binding. Pure helpers (no Node crypto) so the test UI can
 * import them. The server verifies the HMAC in lib/assessmentToken.ts.
 */

export const TAB_SESSION_PREFIX = 'psikotest_tab_c';
export const ASSESSMENT_TOKEN_TTL_SEC = 24 * 60 * 60;

export interface DecodedAssessmentToken {
  v: number;
  pid: number;
  cid: number;
  email: string;
  name: string;
  exp: number;
}

export type TabDecision =
  | {
      action: 'adopt' | 'keep';
      token: string;
      participantId: number;
      name: string;
      email: string;
      cookieMismatch: boolean;
    }
  | { action: 'stop'; boundName: string; activeName: string }
  | { action: 'anonymous' };

export type SubmitAuthResult =
  | { ok: true; via: 'token' | 'session' | 'admin' }
  | { ok: false; status: 401 | 403; error: string; code: 'SESSION_MISMATCH' | 'UNAUTHORIZED' };

function fromBase64Url(segment: string): string | null {
  try {
    const pad = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = pad + '='.repeat((4 - (pad.length % 4)) % 4);
    if (typeof atob === 'function') {
      const binary = atob(padded);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    }
    return null;
  } catch {
    return null;
  }
}

/** Decode the payload without checking the signature. Expired tokens still decode. */
export function decodeAssessmentToken(token: string | null | undefined): DecodedAssessmentToken | null {
  if (!token || typeof token !== 'string') return null;
  const segment = token.split('.')[0];
  if (!segment) return null;
  const json = fromBase64Url(segment);
  if (!json) return null;
  try {
    const payload = JSON.parse(json);
    const pid = Number(payload?.pid);
    const cid = Number(payload?.cid);
    const exp = Number(payload?.exp);
    const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const name = typeof payload?.name === 'string' ? payload.name : '';
    if (payload?.v !== 1 || !Number.isInteger(pid) || pid <= 0) return null;
    if (!Number.isInteger(cid) || cid <= 0 || !email || !Number.isFinite(exp)) return null;
    return { v: 1, pid, cid, email, name, exp };
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: DecodedAssessmentToken, now = Date.now()): boolean {
  return payload.exp * 1000 <= now;
}

export function tabSessionStorageKey(campaignId: number): string {
  return `${TAB_SESSION_PREFIX}${campaignId}`;
}

/** Progress is scoped by participant id, never by the shared browser session. */
export function progressStorageKey(campaignId: number, participantId: number, resetCount: number): string {
  return `psikotest_progress_c${campaignId}_p${participantId}_r${Number(resetCount) || 0}`;
}

/** Previous key (email + reset). Read only for the bound participant, never written. */
export function legacyProgressStorageKey(campaignId: number, email: string, resetCount: number): string {
  return `psikotest_progress_c${campaignId}_${email}_r${Number(resetCount) || 0}`;
}

export function clearTabAssessmentBindings(): void {
  if (typeof sessionStorage === 'undefined') return;
  const keys: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith(TAB_SESSION_PREFIX)) keys.push(key);
  }
  for (const key of keys) sessionStorage.removeItem(key);
}

/**
 * Decide what this tab is allowed to show and submit.
 * A stored token always wins over a newer login in another tab.
 * An explicit visit to the login page clears the stored token first,
 * so a sequential login in THIS tab can adopt the new participant.
 */
export function decideTabSession(input: {
  storedToken: string | null;
  incomingToken: string | null;
  campaignId: number;
  now?: number;
}): TabDecision {
  const now = input.now ?? Date.now();
  const campaignId = Number(input.campaignId);
  const stored = decodeAssessmentToken(input.storedToken);
  const incoming = decodeAssessmentToken(input.incomingToken);
  const storedHere = stored && stored.cid === campaignId ? stored : null;
  const incomingHere = incoming && incoming.cid === campaignId && !isTokenExpired(incoming, now) ? incoming : null;

  if (storedHere && !isTokenExpired(storedHere, now)) {
    const samePerson = !!incomingHere && incomingHere.pid === storedHere.pid;
    const token = samePerson && input.incomingToken ? input.incomingToken : (input.storedToken as string);
    return {
      action: 'keep',
      token,
      participantId: storedHere.pid,
      name: storedHere.name,
      email: storedHere.email,
      cookieMismatch: !samePerson,
    };
  }

  if (storedHere && isTokenExpired(storedHere, now)) {
    if (incomingHere && incomingHere.pid === storedHere.pid && input.incomingToken) {
      return {
        action: 'adopt',
        token: input.incomingToken,
        participantId: incomingHere.pid,
        name: incomingHere.name,
        email: incomingHere.email,
        cookieMismatch: false,
      };
    }
    return {
      action: 'stop',
      boundName: storedHere.name || 'peserta ini',
      activeName: incomingHere?.name || 'akun lain',
    };
  }

  if (incomingHere && input.incomingToken) {
    return {
      action: 'adopt',
      token: input.incomingToken,
      participantId: incomingHere.pid,
      name: incomingHere.name,
      email: incomingHere.email,
      cookieMismatch: false,
    };
  }

  return { action: 'anonymous' };
}

/**
 * Server-side submit authorization.
 * A presented assessment token is authoritative and is never replaced by the
 * browser cookie (the cookie is shared by every tab).
 */
export function authorizeAssessmentSubmit(input: {
  verifiedToken: DecodedAssessmentToken | null;
  presentedToken: boolean;
  cookieEmail: string | null;
  isAdmin: boolean;
  participantId: number;
  participantEmail: string;
  campaignId: number;
}): SubmitAuthResult {
  const participantEmail = input.participantEmail.trim().toLowerCase();
  const cookieEmail = input.cookieEmail?.trim().toLowerCase() || null;

  if (input.presentedToken) {
    const token = input.verifiedToken;
    if (
      !token ||
      token.pid !== input.participantId ||
      token.cid !== input.campaignId ||
      token.email !== participantEmail
    ) {
      return {
        ok: false,
        status: 403,
        code: 'SESSION_MISMATCH',
        error: 'Sesi tidak sesuai dengan peserta. Jawaban tidak disimpan.',
      };
    }
    return { ok: true, via: 'token' };
  }

  if (input.isAdmin) return { ok: true, via: 'admin' };
  if (cookieEmail && cookieEmail === participantEmail) return { ok: true, via: 'session' };
  if (!cookieEmail) {
    return { ok: false, status: 401, code: 'UNAUTHORIZED', error: 'Unauthorized' };
  }
  return {
    ok: false,
    status: 403,
    code: 'SESSION_MISMATCH',
    error: 'Forbidden',
  };
}

/** Body of a submit/auto-submit. Refuses to run when the tab is halted or unbound. */
export function buildParticipantSubmitBody(input: {
  halted: boolean;
  boundParticipantId: number | null;
  token: string | null;
  testId?: number;
  answers?: unknown;
  action?: 'mark_completed';
}): { ok: true; body: Record<string, unknown> } | { ok: false; reason: 'halted' | 'unbound' } {
  if (input.halted) return { ok: false, reason: 'halted' };
  if (!input.boundParticipantId || !input.token) return { ok: false, reason: 'unbound' };
  const body: Record<string, unknown> = {
    participant_id: input.boundParticipantId,
    assessment_token: input.token,
  };
  if (input.action) body.action = input.action;
  if (input.testId != null) body.test_id = input.testId;
  if (input.answers !== undefined) body.answers = input.answers;
  return { ok: true, body };
}
