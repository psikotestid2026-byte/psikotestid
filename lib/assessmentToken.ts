import { createHmac, timingSafeEqual } from 'crypto';
import {
  ASSESSMENT_TOKEN_TTL_SEC,
  type DecodedAssessmentToken,
  decodeAssessmentToken,
  isTokenExpired,
} from './assessmentSession';

export function getAssessmentSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.ASSESSMENT_TOKEN_SECRET || '';
  if (secret.length < 16) {
    throw new Error('NEXTAUTH_SECRET is required to sign assessment sessions');
  }
  return secret;
}

export function mintAssessmentToken(
  input: { pid: number; cid: number; email: string; name: string },
  secret: string,
  now = Date.now()
): string {
  const payload: DecodedAssessmentToken = {
    v: 1,
    pid: Number(input.pid),
    cid: Number(input.cid),
    email: input.email.trim().toLowerCase(),
    name: input.name,
    exp: Math.floor(now / 1000) + ASSESSMENT_TOKEN_TTL_SEC,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyAssessmentToken(
  token: string | null | undefined,
  secret: string,
  now = Date.now()
): DecodedAssessmentToken | null {
  if (!token || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const expected = createHmac('sha256', secret).update(parts[0]).digest('base64url');
  const given = Buffer.from(parts[1]);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return null;
  const payload = decodeAssessmentToken(token);
  if (!payload || isTokenExpired(payload, now)) return null;
  return payload;
}
