import { neon } from '@neondatabase/serverless';

// The user's env has DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in .env.local');
}

export const sql = neon(process.env.DATABASE_URL);
