import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getClientData } from '../actions';
import { SettingsTab } from '@/components/client/SettingsTab';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const customerId = session?.user && (session.user as any).id ? Number((session.user as any).id) : 2;
  const initialData = await getClientData(customerId);

  return <SettingsTab data={initialData} />;
}
