import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/authGuards', () => ({ requireAdmin: async () => ({ ok: true, email: 'a@example.com' }) }));
import { GET } from '@/app/api/admin/norms/route';
import { sql } from '@/lib/neon';

describe('GET /api/admin/norms', () => {
  it('rejects a missing test id', async () => {
    expect((await GET(new Request('http://x/api/admin/norms'))).status).toBe(400);
  });

  it('paginates and searches', async () => {
    const tests = await sql`SELECT test_id FROM test_norms GROUP BY test_id ORDER BY COUNT(*) DESC LIMIT 1`;
    if (tests.length === 0) return;
    const id = tests[0].test_id;
    const res = await GET(new Request(`http://x/api/admin/norms?test_id=${id}&page=1&limit=10`));
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.norms.length).toBeLessThanOrEqual(10);
    expect(body.total).toBeGreaterThanOrEqual(body.norms.length);

    const none = await (await GET(new Request(`http://x/api/admin/norms?test_id=${id}&q=zzzz_no_match_zzzz`))).json();
    expect(none.total).toBe(0);
  });
});
