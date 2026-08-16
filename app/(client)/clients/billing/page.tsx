import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getClientData } from '../actions';
import { BillingTab } from '@/components/client/BillingTab';

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ topup?: string }> | { topup?: string };
}) {
  const session = await getServerSession(authOptions);
  const customerId = session?.user && (session.user as any).id ? Number((session.user as any).id) : 2;
  const initialData = await getClientData(customerId);

  const resolvedParams = await searchParams;
  const openTopUpOnMount = resolvedParams?.topup === 'true';

  return <BillingTab data={initialData} openTopUpOnMount={openTopUpOnMount} />;
}
