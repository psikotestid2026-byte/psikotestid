import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { requireCampaignAccess } from '@/lib/authGuards';
import { sql } from '@/lib/neon';
import { CampaignStatsPdfDocument } from '@/components/reports/CampaignStatsPdf';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId: rawId } = await params;
    const campaignId = Number(rawId);
    const auth = await requireCampaignAccess(campaignId);
    if (!auth.ok) return auth.response;

    const [campaignRows, summaryRows, unitStats, jobLevelStats, avgScores, scoreDistribution] =
      await Promise.all([
        sql`
          SELECT c.id, c.title, cust.company_name
          FROM campaigns c
          JOIN customers cust ON c.customer_id = cust.id
          WHERE c.id = ${campaignId}
          LIMIT 1
        `,
        sql`
          SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE recommendation_status = 'DIREKOMENDASIKAN')::int AS direkomendasikan,
            COUNT(*) FILTER (WHERE recommendation_status = 'DIPERTIMBANGKAN')::int AS dipertimbangkan,
            COUNT(*) FILTER (WHERE recommendation_status = 'TIDAK_DIREKOMENDASIKAN')::int AS tidak_direkomendasikan,
            COUNT(*) FILTER (WHERE recommendation_status IS NULL)::int AS belum,
            COUNT(*) FILTER (WHERE scoring_status = 'DONE')::int AS done
          FROM participants WHERE campaign_id = ${campaignId}
        `,
        sql`
          SELECT
            COALESCE(NULLIF(TRIM(unit_work), ''), 'Tidak Ditentukan') AS unit,
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE recommendation_status = 'DIREKOMENDASIKAN')::int AS direkomendasikan,
            COUNT(*) FILTER (WHERE recommendation_status = 'DIPERTIMBANGKAN')::int AS dipertimbangkan,
            COUNT(*) FILTER (WHERE recommendation_status = 'TIDAK_DIREKOMENDASIKAN')::int AS tidak_direkomendasikan,
            COUNT(*) FILTER (WHERE recommendation_status IS NULL)::int AS belum
          FROM participants
          WHERE campaign_id = ${campaignId}
          GROUP BY 1
          ORDER BY total DESC
          LIMIT 15
        `,
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
        `,
      ]);

    if (!campaignRows.length) {
      return NextResponse.json({ error: 'Campaign tidak ditemukan' }, { status: 404 });
    }

    const campaign = campaignRows[0] as { id: number; title: string; company_name?: string };
    const pdfStream = await renderToStream(
      <CampaignStatsPdfDocument
        campaign={campaign}
        summary={summaryRows[0] || {}}
        unitStats={unitStats as any}
        jobLevelStats={jobLevelStats as any}
        avgScores={avgScores[0] || {}}
        scoreDistribution={scoreDistribution as any}
      />
    );

    const safeTitle = (campaign.title || `CMP-${campaignId}`)
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .slice(0, 50);

    return new Response(pdfStream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Statistik-Asesmen-${safeTitle}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('GET stats PDF error:', err);
    return NextResponse.json(
      { success: false, error: 'Gagal membuat file PDF statistik.' },
      { status: 500 }
    );
  }
}
