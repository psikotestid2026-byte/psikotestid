import { sql } from '@/lib/neon';
import AssessmentClient from './AssessmentClient';

export default async function AssessmentPage({ params }: { params: { campaignId: string } }) {
  // Fetch campaign and test info based on campaignId
  const campaignData = await sql`SELECT * FROM campaigns WHERE id = ${params.campaignId}`;
  const campaign = campaignData[0] || null;

  let customer = null;
  let tests: any[] = [];

  if (campaign) {
    const customerData = await sql`SELECT * FROM customers WHERE id = ${campaign.customer_id}`;
    customer = customerData[0] || null;

    const testRelData = await sql`SELECT test_id FROM campaign_tests WHERE campaign_id = ${campaign.id}`;
    if (testRelData.length > 0) {
      const testIds = testRelData.map(r => r.test_id);
      tests = await sql`SELECT * FROM master_tests WHERE id = ANY(${testIds}) ORDER BY id ASC`;
    }
  }

  const initialData = { campaign, customer, tests };

  return <AssessmentClient initialData={initialData} />;
}
