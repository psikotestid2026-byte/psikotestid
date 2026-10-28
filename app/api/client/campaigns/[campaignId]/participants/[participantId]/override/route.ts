import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { requireCampaignAccess } from '@/lib/authGuards';
import { isRecommendationStatus } from '@/lib/jobFit';
import { getBundleCompletion, INCOMPLETE_RESULT_MESSAGE } from '@/lib/bundleCompletion';

export const runtime = 'nodejs';

/**
 * Optional assessor override.
 *  - body.status = valid status  -> override with notes
 *  - body.status = null          -> revert to the system recommendation
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ campaignId: string; participantId: string }> }
) {
  try {
    const { campaignId: rawCampaign, participantId: rawParticipant } = await params;
    const auth = await requireCampaignAccess(Number(rawCampaign));
    if (!auth.ok) return auth.response;

    const participantId = Number(rawParticipant);
    if (!Number.isInteger(participantId) || participantId <= 0) {
      return NextResponse.json({ success: false, error: 'Peserta tidak valid.' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const status = body?.status ?? null;
    const notes = String(body?.notes ?? '').trim().slice(0, 2000);

    if (status !== null && !isRecommendationStatus(status)) {
      return NextResponse.json({ success: false, error: 'Status rekomendasi tidak valid.' }, { status: 400 });
    }
    if (status !== null && notes.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Catatan asesor wajib diisi (minimal 5 karakter) saat mengubah status.' },
        { status: 400 }
      );
    }

    const campaignId = Number(auth.campaign.id);

    const state = await sql`
      SELECT scoring_status FROM participants WHERE id = ${participantId} AND campaign_id = ${campaignId} LIMIT 1
    `;
    if (state.length === 0) {
      return NextResponse.json({ success: false, error: 'Peserta tidak ditemukan.' }, { status: 404 });
    }
    const completion = await getBundleCompletion(participantId);
    if (state[0].scoring_status !== 'DONE' || !completion.isComplete) {
      return NextResponse.json({ success: false, error: INCOMPLETE_RESULT_MESSAGE }, { status: 409 });
    }
    const rows =
      status === null
        ? await sql`
            UPDATE participants
            SET assessor_override = FALSE,
                recommendation_status = system_recommendation_status,
                assessor_notes = NULL,
                assessor_email = ${auth.email},
                assessor_updated_at = NOW()
            WHERE id = ${participantId} AND campaign_id = ${campaignId}
            RETURNING id, recommendation_status, assessor_override
          `
        : await sql`
            UPDATE participants
            SET assessor_override = TRUE,
                recommendation_status = ${status},
                assessor_notes = ${notes},
                assessor_email = ${auth.email},
                assessor_updated_at = NOW()
            WHERE id = ${participantId} AND campaign_id = ${campaignId}
            RETURNING id, recommendation_status, assessor_override
          `;

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Peserta tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, participant: rows[0] });
  } catch (err) {
    console.error('POST participants override error:', err);
    return NextResponse.json({ success: false, error: 'Gagal menyimpan keputusan asesor.' }, { status: 500 });
  }
}
