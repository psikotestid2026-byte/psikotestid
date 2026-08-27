import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/neon';
import AssessmentClient from './AssessmentClient';

export default async function AssessmentPage({ params }: { params: Promise<{ campaignId: string }> | { campaignId: string } }) {
  const resolvedParams = await params;
  const campaignId = resolvedParams.campaignId;
  const session = await getServerSession(authOptions);

  // Fetch campaign and test info based on campaignId
  const campaignData = await sql`SELECT * FROM campaigns WHERE id = ${campaignId}`;
  const campaign = campaignData[0] || null;

  let customer = null;
  let tests: any[] = [];
  let existingParticipant = null;
  let sessionUser = null;

  if (session?.user?.email) {
    sessionUser = {
      name: session.user.name || '',
      email: session.user.email || '',
    };

    const pRows = await sql`
      SELECT id, full_name, email, status FROM participants
      WHERE campaign_id = ${campaignId} AND LOWER(email) = ${session.user.email.toLowerCase()}
      LIMIT 1
    `;
    if (pRows.length > 0) {
      existingParticipant = pRows[0];
    }
  }

  if (campaign) {
    const customerData = await sql`SELECT * FROM customers WHERE id = ${campaign.customer_id}`;
    customer = customerData[0] || null;

    const testRelData = await sql`SELECT test_id FROM campaign_tests WHERE campaign_id = ${campaign.id}`;
    if (testRelData.length > 0) {
      const testIds = testRelData.map(r => r.test_id);
      const rawTests = await sql`SELECT * FROM master_tests WHERE id = ANY(${testIds}) ORDER BY id ASC`;

      // Fetch questions for each test
      tests = await Promise.all(
        rawTests.map(async (test: any) => {
          const questions = await sql`
            SELECT id, test_id, question_type, question_data, order_number 
            FROM question_banks 
            WHERE test_id = ${test.id} 
            ORDER BY order_number ASC
          `;
          return { ...test, questions };
        })
      );
    }
  }

  const initialData = { campaign, customer, tests, sessionUser, existingParticipant };

  return <AssessmentClient initialData={initialData} />;
}

