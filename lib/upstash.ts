import { Redis } from '@upstash/redis';

// Validate environment variables
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  throw new Error('Upstash Redis credentials are not defined in .env.local');
}

// Initialize Upstash Redis client
export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});
