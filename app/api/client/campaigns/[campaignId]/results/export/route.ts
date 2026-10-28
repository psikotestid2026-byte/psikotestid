import { NextResponse } from 'next/server';
import { requireCampaignAccess } from '@/lib/authGuards';
import {
  buildResultsWorkbook,
  parseResultsQuery,
  queryCampaignResults,
  XLSX_CONTENT_TYPE,
} from '@/lib/campaignResults';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** Exports every row matching the active search/filter/sort (not only the visible page). */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId: rawId } = await params;
    const auth = await requireCampaignAccess(Number(rawId));
    if (!auth.ok) return auth.response;

    const query = parseResultsQuery(new URL(req.url).searchParams);
    const { rows, total_tests: totalTests } = await queryCampaignResults(Number(auth.campaign.id), query, false);
    const buffer = buildResultsWorkbook(rows, Number(totalTests) || 0);
    const safeTitle = String(auth.campaign.title).replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 60);

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': XLSX_CONTENT_TYPE,
        'Content-Disposition': `attachment; filename="Rekap_Hasil_${safeTitle}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('GET results/export error:', err);
    return NextResponse.json({ success: false, error: 'Gagal membuat file Excel.' }, { status: 500 });
  }
}
