import { NextResponse } from 'next/server';
import { requireCampaignAccess } from '@/lib/authGuards';
import { buildCredentialsWorkbook, queryCredentialRows, XLSX_CONTENT_TYPE } from '@/lib/campaignResults';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId: rawId } = await params;
    const auth = await requireCampaignAccess(Number(rawId));
    if (!auth.ok) return auth.response;

    const { rows, totalTests } = await queryCredentialRows(Number(auth.campaign.id));
    const buffer = buildCredentialsWorkbook(rows, totalTests);
    const safeTitle = String(auth.campaign.title).replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 60);

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': XLSX_CONTENT_TYPE,
        'Content-Disposition': `attachment; filename="Data_Login_${safeTitle}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('GET participants/credentials error:', err);
    return NextResponse.json({ success: false, error: 'Gagal membuat file Excel.' }, { status: 500 });
  }
}
