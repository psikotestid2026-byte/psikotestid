'use server';

import { sql } from '@/lib/neon';

export async function submitBiodata(campaignId: number, fullName: string, email: string) {
  const result = await sql`
    INSERT INTO participants (campaign_id, full_name, email, status)
    VALUES (${campaignId}, ${fullName}, ${email}, 'RUNNING')
    RETURNING id
  `;
  return result[0].id;
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

  // Verify and decrement quota
  const quota = await sql`
    SELECT quota FROM customer_test_quotas 
    WHERE customer_id = ${customerId} AND test_id = ${testId}
  `;
  
  if (!quota[0] || quota[0].quota <= 0) {
    throw new Error('Kuota tes tidak mencukupi');
  }

  // Deduct quota
  await sql`
    UPDATE customer_test_quotas 
    SET quota = quota - 1, updated_at = NOW()
    WHERE customer_id = ${customerId} AND test_id = ${testId}
  `;

  // Insert result (upsert in case of retry)
  await sql`
    INSERT INTO test_results (participant_id, test_id, raw_answers)
    VALUES (${participantId}, ${testId}, ${answers})
    ON CONFLICT (participant_id, test_id)
    DO UPDATE SET raw_answers = ${answers}
  `;
}

export async function markTestCompleted(participantId: number) {
  await sql`UPDATE participants SET status = 'COMPLETED' WHERE id = ${participantId}`;
}
