import { Redis } from '@upstash/redis';

// Resolve Redis credentials with priority:
// 1. RUANGTES_KV_REST_API_* (custom / user provided active instance)
// 2. KV_REST_API_* (Vercel standard KV)
// 3. UPSTASH_REDIS_REST_* (Upstash standard)
export const redisUrl =
  process.env.RUANGTES_KV_REST_API_URL ||
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  '';

export const redisToken =
  process.env.RUANGTES_KV_REST_API_TOKEN ||
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  '';

// Validate environment variables
if (!redisUrl || !redisToken) {
  throw new Error('Upstash Redis credentials are not defined in .env.local');
}

// Initialize Upstash Redis client
export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});
