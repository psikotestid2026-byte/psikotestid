import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { requireCampaignAccess } from '@/lib/authGuards';

export const runtime = 'nodejs';

const MAX_BATCH = 400;

/**
 * Resets assessment results so a participant can retake the real assessment.
 * Body: { participant_ids: number[] } or { all: true }, plus optional reason.
 * Old results are archived first; quota is NOT consumed again; login credentials are kept.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId: rawId } = await params;
    const auth = await requireCampaignAccess(Number(rawId));
    if (!auth.ok) return auth.response;
    const campaignId = Number(auth.campaign.id);

    const body = await req.json().catch(() => null);
    const reason = String(body?.reason ?? 'Reset hasil trial').trim().slice(0, 500);

    let ids: number[];
    if (body?.all === true) {
      const rows = await sql`
        SELECT p.id FROM participants p
        WHERE p.campaign_id = ${campaignId}
          AND (p.status = 'COMPLETED' OR p.scoring_status <> 'PENDING'
               OR EXISTS (SELECT 1 FROM test_results tr WHERE tr.participant_id = p.id))
        ORDER BY p.id LIMIT ${MAX_BATCH}
      `;
      ids = rows.map((r: any) => Number(r.id));
    } else if (Array.isArray(body?.participant_ids)) {
      ids = Array.from(new Set((body.participant_ids as unknown[]).map(Number))).filter((n) => Number.isInteger(n) && n > 0);
      if (ids.length === 0 || ids.length > MAX_BATCH) {
        return NextResponse.json({ success: false, error: `Pilih 1 sampai ${MAX_BATCH} peserta.` }, { status: 400 });
      }
    } else {
      return NextResponse.json({ success: false, error: 'Peserta wajib dipilih.' }, { status: 400 });
    }

    if (ids.length === 0) {
      return NextResponse.json({ success: true, reset: 0 });
    }

    // Archive, delete results and reset state in one atomic transaction.
    const results = await sql.transaction([
      sql`
        INSERT INTO participant_result_archives (participant_id, campaign_id, reset_by, reason, snapshot)
        SELECT p.id, p.campaign_id, ${auth.email}, ${reason},
          jsonb_build_object(
            'status', p.status,
            'scoring_status', p.scoring_status,
            'recommendation_status', p.recommendation_status,
            'system_recommendation_status', p.system_recommendation_status,
            'recommendation_score', p.recommendation_score,
            'score_breakdown', p.score_breakdown,
            'assessor_override', p.assessor_override,
            'assessor_notes', p.assessor_notes,
            'completed_at', p.completed_at,
            'results', COALESCE((
              SELECT jsonb_agg(jsonb_build_object(
                'test_id', tr.test_id, 'raw_answers', tr.raw_answers,
                'scoring_data', tr.scoring_data, 'created_at', tr.created_at))
              FROM test_results tr WHERE tr.participant_id = p.id), '[]'::jsonb)
          )
        FROM participants p
        WHERE p.campaign_id = ${campaignId} AND p.id = ANY(${ids}::bigint[])
      `,
      sql`
        DELETE FROM test_results
        WHERE participant_id IN (SELECT id FROM participants WHERE campaign_id = ${campaignId} AND id = ANY(${ids}::bigint[]))
      `,
      sql`
        UPDATE participants SET
          status = 'RUNNING', completed_at = NULL,
          scoring_status = 'PENDING', scoring_error = NULL, scored_at = NULL,
          recommendation_status = NULL, system_recommendation_status = NULL,
          recommendation_score = NULL, score_breakdown = NULL,
          assessor_override = FALSE, assessor_notes = NULL, assessor_email = NULL, assessor_updated_at = NULL,
          reset_count = reset_count + 1
        WHERE campaign_id = ${campaignId} AND id = ANY(${ids}::bigint[])
        RETURNING id
      `,
    ]);

    const updated = results[2] as unknown[];
    return NextResponse.json({ success: true, reset: updated.length });
  } catch (err) {
    console.error('POST participants/reset error:', err);
    return NextResponse.json({ success: false, error: 'Gagal mereset hasil asesmen.' }, { status: 500 });
  }
}
