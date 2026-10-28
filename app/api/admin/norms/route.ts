import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { requireAdmin } from '@/lib/authGuards';

export const runtime = 'nodejs';

const ALLOWED_LIMITS = [10, 25, 50, 100];

/** Paginated norms for one test with optional search. */
export async function GET(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const url = new URL(req.url);
    const testId = Number(url.searchParams.get('test_id'));
    if (!Number.isInteger(testId) || testId <= 0) {
      return NextResponse.json({ success: false, error: 'Alat tes tidak valid.' }, { status: 400 });
    }
    const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const rawLimit = Number(url.searchParams.get('limit')) || 25;
    const limit = ALLOWED_LIMITS.includes(rawLimit) ? rawLimit : 25;
    const pattern = `%${q.replace(/[%_\\]/g, '\\$&')}%`;

    const [config, rows, totalRows] = await Promise.all([
      sql`SELECT * FROM scoring_configs WHERE test_id = ${testId} LIMIT 1`,
      sql`
        SELECT id::text AS id, raw_score, norm_score, label, description
        FROM test_norms
        WHERE test_id = ${testId}
          AND (${q} = '' OR raw_score ILIKE ${pattern} OR norm_score ILIKE ${pattern}
               OR COALESCE(label, '') ILIKE ${pattern} OR COALESCE(description, '') ILIKE ${pattern})
        ORDER BY id ASC
        LIMIT ${limit} OFFSET ${(page - 1) * limit}
      `,
      sql`
        SELECT COUNT(*)::int AS total FROM test_norms
        WHERE test_id = ${testId}
          AND (${q} = '' OR raw_score ILIKE ${pattern} OR norm_score ILIKE ${pattern}
               OR COALESCE(label, '') ILIKE ${pattern} OR COALESCE(description, '') ILIKE ${pattern})
      `,
    ]);

    return NextResponse.json(
      { success: true, config: config[0] || null, norms: rows, total: totalRows[0]?.total ?? 0, page, limit },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('GET admin/norms error:', err);
    return NextResponse.json({ success: false, error: 'Gagal memuat norma.' }, { status: 500 });
  }
}
