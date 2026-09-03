'use server';

import { sql } from '@/lib/neon';

export async function submitBiodata(
  campaignId: number,
  fullName: string,
  email: string,
  phoneNumber?: string,
  nik?: string
) {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Fetch Campaign information
  const campaignRows = await sql`
    SELECT id, customer_id, registration_type, is_active, valid_until 
    FROM campaigns 
    WHERE id = ${campaignId} 
    LIMIT 1
  `;
  if (campaignRows.length === 0) {
    throw new Error('CAMPAIGN_NOT_FOUND');
  }

  const campaign = campaignRows[0];
  if (!campaign.is_active) {
    throw new Error('CAMPAIGN_INACTIVE');
  }

  if (campaign.valid_until && new Date(campaign.valid_until) < new Date()) {
    throw new Error('CAMPAIGN_EXPIRED');
  }

  // 2. Check if candidate with this email has already registered for this campaign
  const existingRows = await sql`
    SELECT id, status FROM participants
    WHERE campaign_id = ${campaignId} AND LOWER(email) = ${cleanEmail}
    LIMIT 1
  `;

  if (existingRows.length > 0) {
    const existing = existingRows[0];
    if (existing.status === 'COMPLETED') {
      return { success: false, error: 'ALREADY_COMPLETED' };
    }
    // Candidate already registered: update contact details if provided, return existing ID (No quota deduction)
    await sql`
      UPDATE participants 
      SET full_name = ${fullName}, 
          phone_number = COALESCE(${phoneNumber || null}, phone_number),
          nik = COALESCE(${nik || null}, nik),
          started_at = COALESCE(started_at, NOW())
      WHERE id = ${existing.id}
    `;
    return { success: true, participantId: existing.id };
  }

  // 3. Candidate is NOT yet registered
  const regType = campaign.registration_type || 'OPEN_LINK';

  // If campaign is PRE_REGISTERED and candidate is not registered upfront by HR, reject
  if (regType === 'PRE_REGISTERED') {
    return { success: false, error: 'NOT_PRE_REGISTERED' };
  }

  // 4. OPEN_LINK Campaign: Perform Atomic Quota Check & Reservation
  const customerId = campaign.customer_id;
  const assignedTests = await sql`
    SELECT ct.test_id, mt.name as test_name, mt.code as test_code
    FROM campaign_tests ct
    JOIN master_tests mt ON ct.test_id = mt.id
    WHERE ct.campaign_id = ${campaignId}
  `;

  if (assignedTests.length === 0) {
    return { success: false, error: 'NO_TESTS_ASSIGNED' };
  }

  // Track deducted test IDs for rollback in case of partial failure
  const deductedTestIds: number[] = [];

  for (const testItem of assignedTests) {
    // Atomic update: only decrements quota if quota >= 1
    const updateResult = await sql`
      UPDATE customer_test_quotas 
      SET quota = quota - 1, updated_at = NOW()
      WHERE customer_id = ${customerId} AND test_id = ${testItem.test_id} AND quota >= 1
      RETURNING quota
    `;

    if (updateResult.length === 0) {
      // Quota exhausted! Rollback any quota deducted in previous loop iterations
      for (const revertedTestId of deductedTestIds) {
        await sql`
          UPDATE customer_test_quotas
          SET quota = quota + 1, updated_at = NOW()
          WHERE customer_id = ${customerId} AND test_id = ${revertedTestId}
        `;
      }
      return { success: false, error: 'KUOTA_HABIS' };
    }

    deductedTestIds.push(testItem.test_id);

    // Record ledger transaction
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
        'USAGE',
        ${`Penggunaan 1 Kuota Tes ${testItem.test_code.toUpperCase()} (Self-Registration via Open Link)`}
      )
    `;
  }

  // 5. Insert new participant record with registration_source = 'OPEN_LINK'
  const result = await sql`
    INSERT INTO participants (campaign_id, full_name, email, phone_number, nik, registration_source, status, started_at)
    VALUES (${campaignId}, ${fullName}, ${cleanEmail}, ${phoneNumber || null}, ${nik || null}, 'OPEN_LINK', 'RUNNING', NOW())
    RETURNING id
  `;

  return { success: true, participantId: result[0].id };
}

export async function submitTestResult(participantId: number, testId: number, answers: any) {
  // Check if participant exists and get customer ID through campaign
  const participantData = await sql`
    SELECT c.customer_id 
    FROM participants p
    JOIN campaigns c ON p.campaign_id = c.id
    WHERE p.id = ${participantId}
  `;
  
  const customerId = participantData[0]?.customer_id;
  if (!customerId) throw new Error('Participant not found');

  // Note: Quota was already reserved at participant registration (via submitBiodata or addCandidateToCampaign).

  // Calculate scoring data if test is DISC or WPT
  const testInfo = await sql`SELECT code FROM master_tests WHERE id = ${testId}`;
  let scoringData = null;
  if (testInfo[0]) {
    const code = testInfo[0].code.toLowerCase();
    if (code === 'disc') {
      const { calculateDiscScore } = await import('@/lib/scoring/disc');
      scoringData = calculateDiscScore(answers);
    } else if (code === 'wpt') {
      const { calculateWptScore } = await import('@/lib/scoring/wpt');
      scoringData = calculateWptScore(answers);
    }
  }

  // Insert result (upsert in case of retry)
  const finalScoringData = scoringData || {
    completed: true,
    total_answers: Object.keys(answers || {}).length,
    completed_at: new Date().toISOString()
  };

  await sql`
    INSERT INTO test_results (participant_id, test_id, raw_answers, scoring_data)
    VALUES (${participantId}, ${testId}, ${answers}, ${JSON.stringify(finalScoringData)}::jsonb)
    ON CONFLICT (participant_id, test_id)
    DO UPDATE SET raw_answers = ${answers}, scoring_data = ${JSON.stringify(finalScoringData)}::jsonb
  `;
}

export async function markTestCompleted(participantId: number) {
  await sql`
    UPDATE participants 
    SET status = 'COMPLETED', completed_at = NOW() 
    WHERE id = ${participantId}
  `;

  // Trigger HR Email notification asynchronously with attached PDF report
  try {
    const { sendParticipantCompletedEmailToHr } = await import('@/lib/email');
    sendParticipantCompletedEmailToHr(participantId).catch((err) => {
      console.error('Async HR Completed Email Trigger Error:', err);
    });
  } catch (err) {
    console.error('Failed to load email helper in markTestCompleted:', err);
  }
}
