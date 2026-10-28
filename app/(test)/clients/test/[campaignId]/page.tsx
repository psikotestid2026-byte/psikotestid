import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/neon';
import { getQuestionsForTest } from '@/lib/questionCache';
import { getAssessmentSecret, mintAssessmentToken } from '@/lib/assessmentToken';
import AssessmentClient from './AssessmentClient';

// Campaign, branding and test list are identical for every participant of a campaign.
// A short per-instance cache keeps hundreds of simultaneous starts off the database.
const CAMPAIGN_META_TTL_MS = 60_000;
const campaignMetaCache = new Map<string, { value: any; expires: number }>();

async function loadCampaignMeta(campaignId: string) {
  const cached = campaignMetaCache.get(campaignId);
  if (cached && cached.expires > Date.now()) return cached.value;

  const campaignRows = await sql`SELECT * FROM campaigns WHERE id = ${campaignId}`;
  const campaign = campaignRows[0] || null;

  let customer = null;
  let tests: any[] = [];

  if (campaign) {
    const [customerRows, rawTests] = await Promise.all([
      sql`SELECT id, company_name, logo_url, brand_color FROM customers WHERE id = ${campaign.customer_id}`,
      sql`
        SELECT mt.*
        FROM campaign_tests ct
        JOIN master_tests mt ON mt.id = ct.test_id
        WHERE ct.campaign_id = ${campaign.id}
        ORDER BY ct.order_number ASC NULLS LAST, mt.id ASC
      `,
    ]);
    customer = customerRows[0] || null;

    // Question banks come from Redis (cache-aside); load all tests in parallel.
    tests = await Promise.all(
      rawTests.map(async (test: any) => {
        const questions = await getQuestionsForTest(test.id);
        return { ...test, id: Number(test.id), questions };
      })
    );
  }

  const value = { campaign, customer, tests };
  campaignMetaCache.set(campaignId, { value, expires: Date.now() + CAMPAIGN_META_TTL_MS });
  return value;
}

export default async function AssessmentPage({ params }: { params: Promise<{ campaignId: string }> | { campaignId: string } }) {
  const resolvedParams = await params;
  const campaignId = resolvedParams.campaignId;

  // Session and campaign data do not depend on each other.
  const [session, meta] = await Promise.all([getServerSession(authOptions), loadCampaignMeta(campaignId)]);
  const { campaign, customer, tests } = meta;

  let existingParticipant = null;
  let sessionUser = null;
  let completedTestIds: number[] = [];
  let assessmentToken: string | null = null;

  if (session?.user?.email) {
    sessionUser = {
      name: session.user.name || '',
      email: session.user.email || '',
    };

    const pRows = await sql`
      SELECT id, full_name, email, status, phone_number, nik, reset_count FROM participants
      WHERE campaign_id = ${campaignId} AND LOWER(email) = ${session.user.email.toLowerCase()}
      LIMIT 1
    `;
    if (pRows.length > 0) {
      existingParticipant = pRows[0];
      // Server-side progress so a participant can resume on any device.
      const doneRows = await sql`SELECT test_id FROM test_results WHERE participant_id = ${existingParticipant.id}`;
      completedTestIds = doneRows.map((r) => Number(r.test_id));
      try {
        assessmentToken = mintAssessmentToken(
          {
            pid: Number(existingParticipant.id),
            cid: Number(campaign?.id || campaignId),
            email: String(existingParticipant.email || session.user.email || ''),
            name: String(existingParticipant.full_name || session.user.name || ''),
          },
          getAssessmentSecret()
        );
      } catch (err) {
        console.error('Failed to mint assessment token:', err);
      }
    }
  }

  const initialData = {
    campaign,
    customer,
    tests,
    sessionUser,
    existingParticipant,
    completedTestIds,
    assessmentToken,
  };

  return <AssessmentClient initialData={initialData} />;
}
