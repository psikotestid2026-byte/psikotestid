/**
 * Applies an additive SQL migration/seed file inside one transaction.
 * Refuses to run files that contain DROP / DELETE / TRUNCATE statements.
 *
 * Usage: npx tsx scripts/apply-safe-sql.ts db/migrations/0017_dt_peduli_assessment.sql
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const FORBIDDEN = /\b(DROP|DELETE|TRUNCATE)\b/i;

export function stripSqlComments(sqlText: string): string {
  return sqlText.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

export function assertSafeSql(sqlText: string): void {
  const stripped = stripSqlComments(sqlText);
  const match = stripped.match(FORBIDDEN);
  if (match) {
    throw new Error(`Unsafe SQL refused: found forbidden keyword "${match[1].toUpperCase()}".`);
  }
}

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: tsx scripts/apply-safe-sql.ts <file.sql>');

  const sqlText = readFileSync(resolve(process.cwd(), file), 'utf8');
  assertSafeSql(sqlText);

  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(sqlText);
    await client.query('COMMIT');
    console.log(`Applied ${file}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
}

if (process.argv[1] && /apply-safe-sql\.ts$/.test(process.argv[1])) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
