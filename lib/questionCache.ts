import { sql } from '@/lib/neon';

const QUESTION_CACHE_TTL_SECONDS = 60 * 60; // 1 hour - question banks change rarely
const cacheKeyFor = (testId: number) => `questions:${testId}`;

// In-memory L1 cache to avoid redundant network roundtrips within the same Node process (instant 0ms)
const l1Cache = new Map<number, { data: QuestionBankRow[]; expiresAt: number }>();
const L1_TTL_MS = 60_000; // 60 seconds

// Redis is usable when either RUANGTES_KV_* or standard KV_* env vars are set
const isRedisConfigured = Boolean(
  (process.env.RUANGTES_KV_REST_API_URL && process.env.RUANGTES_KV_REST_API_TOKEN) ||
  (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
  (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
);

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
 * Cache-aside fetch of question_banks rows for a given test_id:
 * 1. L1 Memory Cache (0ms response)
 * 2. L2 Upstash Redis Cache (ultra-fast network cache)
 * 3. Postgres Neon DB query (fallback / origin)
 */
export async function getQuestionsForTest(testId: number): Promise<QuestionBankRow[]> {
  const now = Date.now();

  // 1. Check L1 In-Memory Cache first
  const l1Entry = l1Cache.get(testId);
  if (l1Entry && l1Entry.expiresAt > now) {
    return l1Entry.data;
  }

  const key = cacheKeyFor(testId);
  const redis = await getRedisClient();

  // 2. Check Upstash Redis
  if (redis) {
    try {
      const cached = await redis.get<QuestionBankRow[]>(key);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        l1Cache.set(testId, { data: cached, expiresAt: now + L1_TTL_MS });
        return cached;
      }
    } catch (err) {
      console.warn(`Redis GET failed for ${key}, falling back to Postgres:`, err);
    }
  }

  // 3. Fallback to Postgres DB
  const questions = (await sql`
    SELECT id, test_id, question_type, question_data, order_number
    FROM question_banks
    WHERE test_id = ${testId}
    ORDER BY order_number ASC
  `) as unknown as QuestionBankRow[];

  // Populate L1 cache immediately
  l1Cache.set(testId, { data: questions, expiresAt: now + L1_TTL_MS });

  // Populate Upstash Redis in background (non-blocking for ultra-fast return)
  if (redis && questions.length > 0) {
    redis.set(key, questions, { ex: QUESTION_CACHE_TTL_SECONDS }).catch((err) => {
      console.warn(`Redis SET failed for ${key}:`, err);
    });
  }

  return questions;
}

/**
 * Invalidate the cached questions for a test after an admin edits question_banks
 */
export async function invalidateQuestionsCache(testId: number): Promise<void> {
  l1Cache.delete(testId);
  const redis = await getRedisClient();
  if (!redis) return;
  try {
    await redis.del(cacheKeyFor(testId));
  } catch (err) {
    console.warn(`Redis DEL failed for questions:${testId}:`, err);
  }
}
