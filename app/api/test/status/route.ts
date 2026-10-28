import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { requireSession } from '@/lib/authGuards';
import { getAssessmentSecret, verifyAssessmentToken } from '@/lib/assessmentToken';
import { getBundleCompletion } from '@/lib/bundleCompletion';

export const runtime = 'nodejs';

/** Lightweight status for the "result is being processed" screen (polled by SWR). */
export async function GET(req: Request) {
  try {
    const participantId = Number(new URL(req.url).searchParams.get('participant_id'));
    if (!Number.isInteger(participantId) || participantId <= 0) {
      return NextResponse.json({ success: false, error: 'Peserta tidak valid.' }, { status: 400 });
    }

    const tokenHeader = req.headers.get('x-assessment-token') || '';
    let tokenEmail: string | null = null;
    if (tokenHeader) {
      try {
        const payload = verifyAssessmentToken(tokenHeader, getAssessmentSecret());
        if (!payload || payload.pid !== participantId) {
          return NextResponse.json(
            { success: false, error: 'Sesi tidak sesuai dengan peserta.', code: 'SESSION_MISMATCH' },
            { status: 403 }
          );
        }
        tokenEmail = payload.email;
      } catch {
        return NextResponse.json({ success: false, error: 'Sesi asesmen tidak valid.' }, { status: 401 });
      }
    }

    const auth = tokenEmail ? null : await requireSession();
    if (!tokenEmail && auth && !auth.ok) return auth.response;
    const email = tokenEmail || (auth && auth.ok ? auth.email : '');
    if (!email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await sql`
      SELECT p.status, p.scoring_status
      FROM participants p
      WHERE p.id = ${participantId} AND LOWER(p.email) = ${email}
      LIMIT 1
    `;
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Peserta tidak ditemukan.' }, { status: 404 });
    }

    const completion = await getBundleCompletion(participantId);
    return NextResponse.json(
      {
        success: true,
        ...rows[0],
        tests_done: completion.completed,
        tests_required: completion.required,
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (err) {
    console.error('GET /api/test/status error:', err);
    return NextResponse.json({ success: false, error: 'Gagal memuat status.' }, { status: 500 });
  }
}
