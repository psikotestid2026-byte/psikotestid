import bcrypt from 'bcryptjs';
import { sql } from '@/lib/neon';

export interface ParticipantAuthUser {
  id: string;
  name: string;
  email: string;
  role: 'PARTICIPANT';
}

const MAX_FAILED_ATTEMPTS = 10;
const LOCK_WINDOW_SECONDS = 15 * 60;

// A valid bcrypt hash used to keep response time similar for unknown usernames.
const DUMMY_HASH = '$2b$10$XNIbUolRdxY52kna/MX2CO8GWMTGKBTdn3VCd7fgLnLbqm0nLtnFy';

export function normalizeUsername(raw: string | null | undefined): string {
  return String(raw || '')
    .trim()
    .toLowerCase();
}

async function getRedis() {
  try {
    const { redis, redisUrl, redisToken } = await import('@/lib/upstash');
    if (!redisUrl || !redisToken) return null;
    return redis;
  } catch {
    return null;
  }
}

async function isLockedOut(username: string): Promise<boolean> {
  const redis = await getRedis();
  if (!redis) return false;
  try {
    const failures = Number((await redis.get(`login:fail:${username}`)) || 0);
    return failures >= MAX_FAILED_ATTEMPTS;
  } catch {
    return false;
  }
}

async function recordFailure(username: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  try {
    const key = `login:fail:${username}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, LOCK_WINDOW_SECONDS);
  } catch {
    // Rate limiting is best effort and must never block login.
  }
}

async function clearFailures(username: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  try {
    await redis.del(`login:fail:${username}`);
  } catch {
    // ignore
  }
}

/** Validates username/password for a participant. Returns null for any failure. */
export async function authenticateParticipant(
  rawUsername: string | null | undefined,
  password: string | null | undefined
): Promise<ParticipantAuthUser | null> {
  const username = normalizeUsername(rawUsername);
  const pass = String(password || '');
  if (!username || !pass || username.length > 100 || pass.length > 200) return null;

  if (await isLockedOut(username)) return null;

  const rows = await sql`
    SELECT p.id, p.full_name, p.email, p.password_hash, p.status, c.is_active
    FROM participants p
    JOIN campaigns c ON c.id = p.campaign_id
    WHERE p.username = ${username}
    LIMIT 1
  `;

  const row = rows[0];
  const valid = await bcrypt.compare(pass, row?.password_hash || DUMMY_HASH);
  if (!row || !row.password_hash || !valid) {
    await recordFailure(username);
    return null;
  }

  await clearFailures(username);
  return {
    id: String(row.id),
    name: String(row.full_name),
    email: String(row.email).toLowerCase(),
    role: 'PARTICIPANT',
  };
}
