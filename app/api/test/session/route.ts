import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { getAssessmentSecret, verifyAssessmentToken } from '@/lib/assessmentToken';

export const runtime = 'nodejs';

/** Loads the participant bound to this tab's token, ignoring the shared login cookie. */
export async function GET(req: Request) {
  try {
    const token = req.headers.get('x-assessment-token') || '';
    let payload = null;
    try {
      payload = verifyAssessmentToken(token, getAssessmentSecret());
    } catch {
      payload = null;
    }
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Sesi asesmen tidak valid. Silakan login ulang.' },
        { status: 401 }
      );
    }

    const rows = await sql`
      SELECT id, full_name, email, status, phone_number, nik, reset_count, campaign_id
      FROM participants
      WHERE id = ${payload.pid} AND campaign_id = ${payload.cid}
      LIMIT 1
    `;
    const participant = rows[0];
    if (!participant || String(participant.email || '').toLowerCase() !== payload.email) {
      return NextResponse.json({ success: false, error: 'Peserta tidak ditemukan.' }, { status: 404 });
    }

    const doneRows = await sql`
      SELECT test_id FROM test_results WHERE participant_id = ${payload.pid}
    `;

    return NextResponse.json(
      {
        success: true,
        participant: {
          id: Number(participant.id),
          full_name: participant.full_name,
          email: participant.email,
          status: participant.status,
          phone_number: participant.phone_number,
          nik: participant.nik,
          reset_count: Number(participant.reset_count || 0),
          campaign_id: Number(participant.campaign_id),
        },
        completedTestIds: doneRows.map((row) => Number(row.test_id)),
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (err) {
    console.error('GET /api/test/session error:', err);
    return NextResponse.json({ success: false, error: 'Gagal memuat sesi asesmen.' }, { status: 500 });
  }
}
