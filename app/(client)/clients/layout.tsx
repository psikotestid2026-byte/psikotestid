import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getClientData } from './actions';
import { ClientShell } from '@/components/client/ClientShell';

export default async function ClientsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const customerId = session?.user && (session.user as any).id ? Number((session.user as any).id) : 2;
  const initialData = await getClientData(customerId);

  return <ClientShell initialData={initialData}>{children}</ClientShell>;
}
