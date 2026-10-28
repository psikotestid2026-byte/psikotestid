import { NextResponse } from 'next/server';
import { requireCampaignAccess } from '@/lib/authGuards';
import { parseResultsQuery, queryCampaignResults } from '@/lib/campaignResults';

export const runtime = 'nodejs';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId: rawId } = await params;
    const auth = await requireCampaignAccess(Number(rawId));
    if (!auth.ok) return auth.response;

    const query = parseResultsQuery(new URL(req.url).searchParams);
    const data = await queryCampaignResults(Number(auth.campaign.id), query, true);

    return NextResponse.json(
      { success: true, ...data, page: query.page, limit: query.limit },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (err) {
    console.error('GET results error:', err);
    return NextResponse.json({ success: false, error: 'Gagal memuat data hasil.' }, { status: 500 });
  }
}
