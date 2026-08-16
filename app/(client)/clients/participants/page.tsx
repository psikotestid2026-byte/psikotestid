import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getClientData } from '../actions';
import { ParticipantsTab } from '@/components/client/ParticipantsTab';

export default async function ParticipantsPage() {
  const session = await getServerSession(authOptions);
  const customerId = session?.user && (session.user as any).id ? Number((session.user as any).id) : 2;
  const initialData = await getClientData(customerId);

  return <ParticipantsTab data={initialData} />;
}
