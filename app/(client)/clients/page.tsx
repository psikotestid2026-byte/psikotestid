import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getClientData } from './actions';
import ClientDashboard from './ClientDashboard';

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user as any).role !== 'CUSTOMER') {
    redirect('/clients/login');
  }

  const customerId = Number((session.user as any).id);
  const initialData = await getClientData(customerId);

  return (
    <ClientDashboard initialData={initialData} />
  );
}
