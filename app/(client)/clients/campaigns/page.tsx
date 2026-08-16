import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getClientData } from '../actions';
import { CampaignsTab } from '@/components/client/CampaignsTab';

export default async function CampaignsPage() {
  const session = await getServerSession(authOptions);
  const customerId = session?.user && (session.user as any).id ? Number((session.user as any).id) : 2;
  const initialData = await getClientData(customerId);

  return <CampaignsTab data={initialData} />;
}
