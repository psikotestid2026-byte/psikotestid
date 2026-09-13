import { sql } from '@/lib/neon';

const QUESTION_CACHE_TTL_SECONDS = 60 * 60; // 1 hour - question banks change rarely
const cacheKeyFor = (testId: number) => `questions:${testId}`;

// Redis is only usable when Upstash env vars are actually configured.
// lib/upstash.ts throws at import time if they're missing, so we guard here
// and lazy-import it, keeping the test-taking flow working even without Redis.
const isRedisConfigured = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

async function getRedisClient() {
  if (!isRedisConfigured) return null;
  try {
    const { redis } = await import('@/lib/upstash');
    return redis;
  } catch (err) {
    console.warn('Upstash Redis unavailable, falling back to direct DB queries:', err);
    return null;
  }
}

export interface QuestionBankRow {
  id: number;
  test_id: number;
  question_type: string;
  question_data: any;
  order_number: number;
}

/**
 * Cache-aside fetch of question_banks rows for a given test_id.
 * Reads from Redis when available; falls back to Postgres on cache miss
 * or when Redis is unreachable/misconfigured (never throws for that reason).
 */
export async function getQuestionsForTest(testId: number): Promise<QuestionBankRow[]> {
  const key = cacheKeyFor(testId);
  const redis = await getRedisClient();

  if (redis) {
    try {
      const cached = await redis.get<QuestionBankRow[]>(key);
      if (cached) {
        return cached;
      }
    } catch (err) {
      console.warn(`Redis GET failed for ${key}, falling back to Postgres:`, err);
    }
  }

  const questions = (await sql`
    SELECT id, test_id, question_type, question_data, order_number
    FROM question_banks
    WHERE test_id = ${testId}
    ORDER BY order_number ASC
  `) as unknown as QuestionBankRow[];

  if (redis) {
    try {
      await redis.set(key, questions, { ex: QUESTION_CACHE_TTL_SECONDS });
    } catch (err) {
      console.warn(`Redis SET failed for ${key}:`, err);
    }
  }

  return questions;
}

/**
 * Invalidate the cached questions for a test after an admin edits question_banks
 * (e.g. via saveQuestion) so changes show up immediately instead of waiting for TTL.
 */
export async function invalidateQuestionsCache(testId: number): Promise<void> {
  const redis = await getRedisClient();
  if (!redis) return;
  try {
    await redis.del(cacheKeyFor(testId));
  } catch (err) {
    console.warn(`Redis DEL failed for questions:${testId}:`, err);
  }
}
