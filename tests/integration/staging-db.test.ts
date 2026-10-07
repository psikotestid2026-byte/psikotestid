import { describe, it, expect, beforeAll } from 'vitest';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const STAGING_HOST = 'ep-green-truth-aomw1wuf-pooler.c-2.ap-southeast-1.aws.neon.tech';
const PROD_HOST = 'ep-snowy-tooth-ao80add2-pooler';

describe('Staging DB connectivity (read-only)', () => {
  let sql: ReturnType<typeof neon>;

  beforeAll(() => {
    const url = process.env.DATABASE_URL || '';
    expect(url).toContain(STAGING_HOST);
    expect(url).not.toContain(PROD_HOST);
    sql = neon(url);
  });

  it('connects and can SELECT 1', async () => {
    const rows = (await sql`SELECT 1 AS ok`) as Array<{ ok: number }>;
    expect(rows[0].ok).toBe(1);
  });

  it('has core tables present', async () => {
    const rows = (await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'customers', 'admins', 'campaigns', 'participants',
          'master_tests', 'test_results', 'test_orders', 'question_banks'
        )
      ORDER BY table_name
    `) as Array<{ table_name: string }>;
    const names = rows.map((r) => r.table_name);
    expect(names).toContain('customers');
    expect(names).toContain('admins');
    expect(names).toContain('campaigns');
    expect(names).toContain('participants');
    expect(names).toContain('master_tests');
  });

  it('lists active master tests without mutating', async () => {
    const rows = await sql`
      SELECT id, code, name, is_active FROM master_tests ORDER BY id ASC LIMIT 20
    `;
    expect(Array.isArray(rows)).toBe(true);
  });
});
