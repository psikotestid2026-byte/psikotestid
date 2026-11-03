import { NextResponse } from 'next/server';
import { requireCampaignAccess } from '@/lib/authGuards';
import { sql } from '@/lib/neon';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId: rawId } = await params;
    const campaignId = Number(rawId);
    const auth = await requireCampaignAccess(campaignId);
    if (!auth.ok) return auth.response;

    const [summaryRows, unitStats, jobLevelStats, avgScores, scoreDistribution] = await Promise.all([
      // 1. Overall Summary
      sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE recommendation_status = 'DIREKOMENDASIKAN')::int AS direkomendasikan,
          COUNT(*) FILTER (WHERE recommendation_status = 'DIPERTIMBANGKAN')::int AS dipertimbangkan,
          COUNT(*) FILTER (WHERE recommendation_status = 'TIDAK_DIREKOMENDASIKAN')::int AS tidak_direkomendasikan,
          COUNT(*) FILTER (WHERE recommendation_status IS NULL)::int AS belum,
          COUNT(*) FILTER (WHERE scoring_status = 'PROCESSING')::int AS processing,
          COUNT(*) FILTER (WHERE scoring_status = 'DONE')::int AS done
        FROM participants WHERE campaign_id = ${campaignId}
      `,

      // 2. Unit Kerja Breakdown (Top 12 unit terbanyak)
      sql`
        SELECT
          COALESCE(NULLIF(TRIM(unit_work), ''), 'Tidak Ditentukan') AS unit,
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE recommendation_status = 'DIREKOMENDASIKAN')::int AS direkomendasikan,
          COUNT(*) FILTER (WHERE recommendation_status = 'DIPERTIMBANGKAN')::int AS dipertimbangkan,
          COUNT(*) FILTER (WHERE recommendation_status = 'TIDAK_DIREKOMENDASIKAN')::int AS tidak_direkomendasikan,
          COUNT(*) FILTER (WHERE recommendation_status IS NULL)::int AS belum,
          json_agg(
            json_build_object(
              'id', id,
              'name', full_name,
              'position', position,
              'status', recommendation_status,
              'score', recommendation_score,
              'scoring_status', scoring_status
            ) ORDER BY full_name
          ) as participants
        FROM participants
        WHERE campaign_id = ${campaignId}
        GROUP BY 1
        ORDER BY total DESC
        LIMIT 12
      `,

      // 3. Level Jabatan Breakdown
      sql`
        SELECT
          COALESCE(NULLIF(TRIM(job_level_code), ''), 'LAINNYA') AS level,
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE recommendation_status = 'DIREKOMENDASIKAN')::int AS direkomendasikan,
          COUNT(*) FILTER (WHERE recommendation_status = 'DIPERTIMBANGKAN')::int AS dipertimbangkan,
          COUNT(*) FILTER (WHERE recommendation_status = 'TIDAK_DIREKOMENDASIKAN')::int AS tidak_direkomendasikan,
          COUNT(*) FILTER (WHERE recommendation_status IS NULL)::int AS belum
        FROM participants
        WHERE campaign_id = ${campaignId}
        GROUP BY 1
        ORDER BY total DESC
      `,

      // 4. Average Scores per Test Tool
      sql`
        SELECT
          ROUND(AVG((score_breakdown->'tests'->'wpt'->>'score')::numeric), 1) as avg_wpt,
          ROUND(AVG((score_breakdown->'tests'->'disc'->>'score')::numeric), 1) as avg_disc,
          ROUND(AVG((score_breakdown->'tests'->'bigfive'->>'score')::numeric), 1) as avg_bigfive,
          ROUND(AVG((score_breakdown->'tests'->'papi'->>'score')::numeric), 1) as avg_papi,
          ROUND(AVG((score_breakdown->'tests'->'msdt'->>'score')::numeric), 1) as avg_msdt,
          ROUND(AVG(recommendation_score::numeric), 1) as avg_overall
        FROM participants
        WHERE campaign_id = ${campaignId} AND scoring_status = 'DONE'
      `,

      // 5. Score Distribution (Range per 10 poin)
      sql`
        SELECT
          bucket,
          COUNT(*)::int as count
        FROM (
          SELECT
            CASE
              WHEN recommendation_score::numeric < 40 THEN '< 40'
              WHEN recommendation_score::numeric < 50 THEN '40 - 49'
              WHEN recommendation_score::numeric < 60 THEN '50 - 59'
              WHEN recommendation_score::numeric < 70 THEN '60 - 69'
              WHEN recommendation_score::numeric < 80 THEN '70 - 79'
              WHEN recommendation_score::numeric < 90 THEN '80 - 89'
              ELSE '90 - 100'
            END AS bucket,
            CASE
              WHEN recommendation_score::numeric < 40 THEN 1
              WHEN recommendation_score::numeric < 50 THEN 2
              WHEN recommendation_score::numeric < 60 THEN 3
              WHEN recommendation_score::numeric < 70 THEN 4
              WHEN recommendation_score::numeric < 80 THEN 5
              WHEN recommendation_score::numeric < 90 THEN 6
              ELSE 7
            END AS sort_order
          FROM participants
          WHERE campaign_id = ${campaignId} AND scoring_status = 'DONE' AND recommendation_score IS NOT NULL
        ) sub
        GROUP BY bucket, sort_order
        ORDER BY sort_order ASC
      `
    ]);

    return NextResponse.json(
      {
        success: true,
        summary: summaryRows[0] || {},
        unitStats,
        jobLevelStats,
        avgScores: avgScores[0] || {},
        scoreDistribution,
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (err: any) {
    console.error('GET campaign stats error:', err);
    return NextResponse.json({ success: false, error: 'Gagal memuat statistik asesmen.' }, { status: 500 });
  }
}

