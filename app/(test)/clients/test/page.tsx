import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/neon';

export default async function TestIndexPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.email) {
    const participant = await sql`
      SELECT campaign_id FROM participants 
      WHERE email = ${session.user.email} 
      ORDER BY id DESC LIMIT 1
    `;
    if (participant[0]?.campaign_id) {
      redirect(`/clients/test/${participant[0].campaign_id}`);
    }
  }

  // Fallback to first active campaign
  const activeCampaign = await sql`
    SELECT id FROM campaigns WHERE is_active = TRUE ORDER BY id ASC LIMIT 1
  `;
  const campaignId = activeCampaign[0]?.id || 1;
  redirect(`/clients/test/${campaignId}`);
}
