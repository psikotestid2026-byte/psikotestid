import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { requireSession } from '@/lib/authGuards';

export const runtime = 'nodejs';

/** Lightweight status for the "result is being processed" screen (polled by SWR). */
export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    const participantId = Number(new URL(req.url).searchParams.get('participant_id'));
    if (!Number.isInteger(participantId) || participantId <= 0) {
      return NextResponse.json({ success: false, error: 'Peserta tidak valid.' }, { status: 400 });
    }

    const rows = await sql`
      SELECT p.status, p.scoring_status,
             (SELECT COUNT(*)::int FROM test_results tr WHERE tr.participant_id = p.id) AS tests_done
      FROM participants p
      WHERE p.id = ${participantId} AND LOWER(p.email) = ${auth.email}
      LIMIT 1
    `;
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Peserta tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, ...rows[0] },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (err) {
    console.error('GET /api/test/status error:', err);
    return NextResponse.json({ success: false, error: 'Gagal memuat status.' }, { status: 500 });
  }
}
