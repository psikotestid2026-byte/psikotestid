'use server';

import { sql } from '@/lib/neon';
import crypto from 'crypto';

export async function getClientData(customerId: number) {
  const [customerInfo, quotas, campaigns, participants, tests, transactions, orders] = await Promise.all([
    sql`SELECT * FROM customers WHERE id = ${customerId}`,
    sql`
      SELECT ctq.*, mt.code as test_code, mt.name as test_name 
      FROM customer_test_quotas ctq
      JOIN master_tests mt ON ctq.test_id = mt.id
      WHERE ctq.customer_id = ${customerId}
    `,
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

export async function getCampaignDetails(campaignId: number) {
  const [campaignRows, selectedTests, candidates, customerRows] = await Promise.all([
    sql`SELECT * FROM campaigns WHERE id = ${campaignId} LIMIT 1`,
    sql`
      SELECT mt.* FROM campaign_tests ct
      JOIN master_tests mt ON ct.test_id = mt.id
      WHERE ct.campaign_id = ${campaignId}
    `,
    sql`SELECT * FROM participants WHERE campaign_id = ${campaignId} ORDER BY created_at DESC`,
    sql`
      SELECT cust.* FROM campaigns c
      JOIN customers cust ON c.customer_id = cust.id
      WHERE c.id = ${campaignId}
      LIMIT 1
    `
  ]);

  if (campaignRows.length === 0) return null;

  return {
    campaign: campaignRows[0],
    customer: customerRows[0] || null,
    selected_tests: selectedTests,
    participants: candidates,
  };
}

export async function getParticipantFullDetails(participantId: number) {
  const targetParticipant = await sql`
    SELECT p.*, c.title as campaign_title, c.customer_id, cust.company_name
    FROM participants p
    JOIN campaigns c ON p.campaign_id = c.id
    JOIN customers cust ON c.customer_id = cust.id
    WHERE p.id = ${participantId}
    LIMIT 1
  `;

  if (targetParticipant.length === 0) return null;

  const candidate = targetParticipant[0];
  const candidateEmail = candidate.email ? candidate.email.trim().toLowerCase() : '';

  // Fetch test results for current participant
  const currentTestResults = await sql`
    SELECT tr.*, mt.code as test_code, mt.name as test_name
    FROM test_results tr
    JOIN master_tests mt ON tr.test_id = mt.id
    WHERE tr.participant_id = ${participantId}
  `;

  // Fetch cumulative history for all campaigns attended by this candidate email
  const cumulativeHistory = await sql`
    SELECT p.id as participant_id, p.created_at, p.status, c.id as campaign_id, c.title as campaign_title,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', tr.id,
                 'test_id', tr.test_id,
                 'test_code', mt.code,
                 'test_name', mt.name,
                 'scoring_data', tr.scoring_data,
                 'created_at', tr.created_at
               )
             ) FILTER (WHERE tr.id IS NOT NULL), '[]'
           ) as test_results
    FROM participants p
    JOIN campaigns c ON p.campaign_id = c.id
    LEFT JOIN test_results tr ON tr.participant_id = p.id
    LEFT JOIN master_tests mt ON tr.test_id = mt.id
    WHERE LOWER(p.email) = ${candidateEmail} AND c.customer_id = ${candidate.customer_id}
    GROUP BY p.id, p.created_at, p.status, c.id, c.title
    ORDER BY p.created_at DESC
  `;

  return {
    participant: candidate,
    current_test_results: currentTestResults,
    cumulative_history: cumulativeHistory,
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

  const result = await sql`
    INSERT INTO campaigns (customer_id, title, access_token, is_active) 
    VALUES (${customerId}, ${title}, ${accessToken}, TRUE) 
    RETURNING id
  `;

  const campaignId = result[0].id;

  if (testIds && testIds.length > 0) {
    for (const testId of testIds) {
      await sql`
        INSERT INTO campaign_tests (campaign_id, test_id)
        VALUES (${campaignId}, ${testId})
        ON CONFLICT DO NOTHING
      `;
    }
  } else {
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

  // 1. Fetch customer_id and assigned test_ids for this campaign
  const campaignRows = await sql`SELECT customer_id FROM campaigns WHERE id = ${campaignId} LIMIT 1`;
  if (campaignRows.length === 0) throw new Error('Campaign tidak ditemukan.');
  const customerId = campaignRows[0].customer_id;

  const assignedTests = await sql`
    SELECT ct.test_id, mt.name as test_name, mt.code as test_code
    FROM campaign_tests ct
    JOIN master_tests mt ON ct.test_id = mt.id
    WHERE ct.campaign_id = ${campaignId}
  `;

  // 2. Validate test quota sufficiency for all assigned tests
  for (const testItem of assignedTests) {
    const quotaRows = await sql`
      SELECT quota FROM customer_test_quotas 
      WHERE customer_id = ${customerId} AND test_id = ${testItem.test_id} 
      LIMIT 1
    `;

    const currentQuota = quotaRows.length > 0 ? Number(quotaRows[0].quota) : 0;

    if (currentQuota <= 0) {
      throw new Error(
        `Kuota tes ${testItem.test_name} (${testItem.test_code.toUpperCase()}) Anda telah habis (Sisa 0). Silakan beli kuota tambahan di menu Beli Kuota.`
      );
    }
  }

  // 3. Deduct 1 test quota per assigned test & record transaction ledger
  for (const testItem of assignedTests) {
    await sql`
      UPDATE customer_test_quotas 
      SET quota = quota - 1 
      WHERE customer_id = ${customerId} AND test_id = ${testItem.test_id}
    `;

    await sql`
      INSERT INTO quota_transactions (
        customer_id,
        test_id,
        quantity,
        type,
        description
      ) VALUES (
        ${customerId},
        ${testItem.test_id},
        -1,
        'DEBIT',
        ${`Penggunaan kuota ${testItem.test_code.toUpperCase()} untuk kandidat ${data.full_name}`}
      )
    `;
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
      ${data.email.trim().toLowerCase()},
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

  const campaignRows = await sql`SELECT customer_id FROM campaigns WHERE id = ${campaignId} LIMIT 1`;
  if (campaignRows.length === 0) throw new Error('Campaign tidak ditemukan.');
  const customerId = campaignRows[0].customer_id;

  const assignedTests = await sql`
    SELECT ct.test_id, mt.name as test_name, mt.code as test_code
    FROM campaign_tests ct
    JOIN master_tests mt ON ct.test_id = mt.id
    WHERE ct.campaign_id = ${campaignId}
  `;

  const totalRequiredCount = candidates.length;

  // Validate sufficient quotas for all candidates
  for (const testItem of assignedTests) {
    const quotaRows = await sql`
      SELECT quota FROM customer_test_quotas 
      WHERE customer_id = ${customerId} AND test_id = ${testItem.test_id} 
      LIMIT 1
    `;

    const currentQuota = quotaRows.length > 0 ? Number(quotaRows[0].quota) : 0;

    if (currentQuota < totalRequiredCount) {
      throw new Error(
        `Kuota tes ${testItem.test_name} (${testItem.test_code.toUpperCase()}) tidak mencukupi untuk mengimpor ${totalRequiredCount} kandidat (Sisa kuota: ${currentQuota}). Silakan beli kuota tambahan.`
      );
    }
  }

  let count = 0;
  for (const c of candidates) {
    if (c.full_name && c.email) {
      // Deduct quota per candidate
      for (const testItem of assignedTests) {
        await sql`
          UPDATE customer_test_quotas 
          SET quota = quota - 1 
          WHERE customer_id = ${customerId} AND test_id = ${testItem.test_id}
        `;

        await sql`
          INSERT INTO quota_transactions (
            customer_id,
            test_id,
            quantity,
            type,
            description
          ) VALUES (
            ${customerId},
            ${testItem.test_id},
            -1,
            'DEBIT',
            ${`Import massal kuota ${testItem.test_code.toUpperCase()} untuk kandidat ${c.full_name}`}
          )
        `;
      }

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
          ${c.email.trim().toLowerCase()},
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
