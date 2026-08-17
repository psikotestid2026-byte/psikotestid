'use server';

import { sql } from '@/lib/neon';
import crypto from 'crypto';

export async function getClientData(customerId: number) {
  const [customerInfo, quotas, campaigns, participants, tests, transactions, orders] = await Promise.all([
    sql`SELECT * FROM customers WHERE id = ${customerId}`,
    sql`SELECT * FROM customer_test_quotas WHERE customer_id = ${customerId}`,
    sql`
      SELECT c.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', mt.id,
                   'code', mt.code,
                   'name', mt.name
                 )
               ) FILTER (WHERE mt.id IS NOT NULL), '[]'
             ) as selected_tests
      FROM campaigns c
      LEFT JOIN campaign_tests ct ON ct.campaign_id = c.id
      LEFT JOIN master_tests mt ON ct.test_id = mt.id
      WHERE c.customer_id = ${customerId}
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `,
    sql`
      SELECT p.*, c.title as campaign_title,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', tr.id,
                   'test_id', tr.test_id,
                   'scoring_data', tr.scoring_data,
                   'raw_answers', tr.raw_answers,
                   'created_at', tr.created_at
                 )
               ) FILTER (WHERE tr.id IS NOT NULL), '[]'
             ) as test_results
      FROM participants p 
      JOIN campaigns c ON p.campaign_id = c.id 
      LEFT JOIN test_results tr ON tr.participant_id = p.id
      WHERE c.customer_id = ${customerId} 
      GROUP BY p.id, c.title
      ORDER BY p.created_at DESC
    `,
    sql`SELECT * FROM master_tests WHERE is_active = TRUE ORDER BY name`,
    sql`SELECT * FROM quota_transactions WHERE customer_id = ${customerId} ORDER BY created_at DESC LIMIT 50`,
    sql`SELECT * FROM test_orders WHERE customer_id = ${customerId} ORDER BY created_at DESC LIMIT 50`
  ]);

  return { 
    customer: customerInfo[0] || null, 
    quotas, 
    campaigns, 
    participants, 
    tests,
    transactions,
    orders
  };
}

export async function updateCustomerBranding(customerId: number, data: { company_name: string; logo_url: string; brand_color: string }) {
  await sql`
    UPDATE customers 
    SET company_name = ${data.company_name}, logo_url = ${data.logo_url}, brand_color = ${data.brand_color}
    WHERE id = ${customerId}
  `;
}

export async function createCampaign(customerId: number, title: string, testIds: number[]) {
  if (!title || title.trim().length === 0) {
    throw new Error('Nama Campaign harus diisi.');
  }

  const accessToken = 'cmp_' + crypto.randomBytes(8).toString('hex');

  // Insert campaign via RAW SQL
  const result = await sql`
    INSERT INTO campaigns (customer_id, title, access_token, is_active) 
    VALUES (${customerId}, ${title}, ${accessToken}, TRUE) 
    RETURNING id
  `;

  const campaignId = result[0].id;

  // Insert selected tests into campaign_tests
  if (testIds && testIds.length > 0) {
    for (const testId of testIds) {
      await sql`
        INSERT INTO campaign_tests (campaign_id, test_id)
        VALUES (${campaignId}, ${testId})
        ON CONFLICT DO NOTHING
      `;
    }
  } else {
    // Default link first test if none selected
    const firstTest = await sql`SELECT id FROM master_tests WHERE is_active = TRUE LIMIT 1`;
    if (firstTest[0]) {
      await sql`
        INSERT INTO campaign_tests (campaign_id, test_id) 
        VALUES (${campaignId}, ${firstTest[0].id})
        ON CONFLICT DO NOTHING
      `;
    }
  }

  return { campaignId, accessToken };
}

export async function closeCampaign(campaignId: number) {
  await sql`UPDATE campaigns SET is_active = FALSE WHERE id = ${campaignId}`;
}

export async function addCandidateToCampaign(campaignId: number, data: { full_name: string; email: string; phone_number?: string }) {
  if (!data.full_name || !data.email) {
    throw new Error('Nama lengkap dan Email kandidat wajib diisi.');
  }

  const accessToken = 'cand_' + crypto.randomBytes(8).toString('hex');

  const result = await sql`
    INSERT INTO participants (
      campaign_id,
      access_token,
      full_name,
      email,
      phone_number,
      status
    ) VALUES (
      ${campaignId},
      ${accessToken},
      ${data.full_name},
      ${data.email},
      ${data.phone_number || null},
      'RUNNING'
    )
    RETURNING id, access_token
  `;

  return result[0];
}

export async function bulkImportCandidates(
  campaignId: number,
  candidates: Array<{ full_name: string; email: string; phone_number?: string }>
) {
  if (!candidates || candidates.length === 0) {
    throw new Error('Daftar kandidat kosong.');
  }

  let count = 0;
  for (const c of candidates) {
    if (c.full_name && c.email) {
      const accessToken = 'cand_' + crypto.randomBytes(8).toString('hex');
      await sql`
        INSERT INTO participants (
          campaign_id,
          access_token,
          full_name,
          email,
          phone_number,
          status
        ) VALUES (
          ${campaignId},
          ${accessToken},
          ${c.full_name},
          ${c.email},
          ${c.phone_number || null},
          'RUNNING'
        )
      `;
      count++;
    }
  }

  return { importedCount: count };
}

export async function createOrder(customerId: number, testId: number, quantity: number) {
  const test = await sql`SELECT price FROM master_tests WHERE id = ${testId}`;
  if (!test[0]) throw new Error('Test not found');
  
  const price = test[0].price;
  const subtotal = price * quantity;
  const invoiceCode = 'INV-' + Date.now();

  const orderResult = await sql`
    INSERT INTO test_orders (invoice_code, customer_id, subtotal, total_amount)
    VALUES (${invoiceCode}, ${customerId}, ${subtotal}, ${subtotal})
    RETURNING id
  `;

  await sql`
    INSERT INTO test_order_items (order_id, test_id, quantity, price_per_item, subtotal)
    VALUES (${orderResult[0].id}, ${testId}, ${quantity}, ${price}, ${subtotal})
  `;
}
