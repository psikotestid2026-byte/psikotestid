import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/neon';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, title, test_ids, registration_type, campaign_id } = body;

    // Fetch customer ID
    const customerRows = await sql`
      SELECT id FROM customers WHERE LOWER(email) = ${session.user.email.toLowerCase()} LIMIT 1
    `;
    if (customerRows.length === 0) {
      return NextResponse.json({ error: 'Customer account not found' }, { status: 404 });
    }
    const customerId = customerRows[0].id;

    if (action === 'close') {
      if (!campaign_id) {
        return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
      }
      await sql`
        UPDATE campaigns 
        SET is_active = FALSE, updated_at = NOW()
        WHERE id = ${campaign_id} AND customer_id = ${customerId}
      `;
      return NextResponse.json({ success: true, message: 'Campaign closed' });
    }

    // Default action: Create Campaign
    if (!title || String(title).trim().length === 0) {
      return NextResponse.json({ error: 'Nama Campaign Sesi Tes wajib diisi.' }, { status: 400 });
    }

    const testIds: number[] = Array.isArray(test_ids) ? test_ids : [];
    if (testIds.length === 0) {
      return NextResponse.json({ error: 'Pilih minimal 1 alat tes untuk campaign ini.' }, { status: 400 });
    }

    // Verify quota for selected tests
    const testQuotas = await sql`
      SELECT test_id, quota 
      FROM customer_test_quotas 
      WHERE customer_id = ${customerId} AND test_id = ANY(${testIds})
    `;

    const quotaMap = new Map<number, number>();
    testQuotas.forEach(q => quotaMap.set(Number(q.test_id), Number(q.quota)));

    for (const tid of testIds) {
      const q = quotaMap.get(Number(tid)) || 0;
      if (q <= 0) {
        const tInfo = await sql`SELECT name FROM master_tests WHERE id = ${tid} LIMIT 1`;
        const testName = tInfo[0]?.name || 'Terpilih';
        return NextResponse.json({
          error: `Kuota tes ${testName} Anda habis (0 Kuota). Beli kuota terlebih dahulu sebelum membuat campaign.`
        }, { status: 400 });
      }
    }

    const accessToken = 'cmp_' + crypto.randomBytes(8).toString('hex');
    const regType = ['OPEN_LINK', 'PRE_REGISTERED'].includes(registration_type) ? registration_type : 'OPEN_LINK';

    const insertResult = await sql`
      INSERT INTO campaigns (customer_id, title, access_token, registration_type, is_active)
      VALUES (${customerId}, ${String(title).trim()}, ${accessToken}, ${regType}, TRUE)
      RETURNING id
    `;

    const newCampaignId = insertResult[0].id;

    for (const testId of testIds) {
      await sql`
        INSERT INTO campaign_tests (campaign_id, test_id)
        VALUES (${newCampaignId}, ${testId})
        ON CONFLICT DO NOTHING
      `;
    }

    return NextResponse.json({
      success: true,
      campaign_id: newCampaignId,
      access_token: accessToken,
    });
  } catch (err: any) {
    console.error('API /api/client/campaigns error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
