import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { resolveCustomerByEmail } from '@/lib/customerResolver';
import { getClientData } from './actions';
import { ClientShell } from '@/components/client/ClientShell';

export default async function ClientsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return <>{children}</>;
  }

  // Check if session user email is registered as HR Customer
  const resolved = await resolveCustomerByEmail(session.user.email);
  const customerRows = resolved ? [resolved] : [];

  if (customerRows.length === 0 || customerRows[0].status !== 'ACTIVE') {
    return <>{children}</>;
  }

  const customerId = Number(customerRows[0].id);
  const initialData = await getClientData(customerId);

  return <ClientShell initialData={initialData}>{children}</ClientShell>;
}
