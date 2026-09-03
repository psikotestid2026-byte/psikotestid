import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/neon';
import { getClientData } from './actions';
import { ClientShell } from '@/components/client/ClientShell';

export default async function ClientsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return <>{children}</>;
  }

  // Check if session user email is registered as HR Customer
  const customerRows = await sql`
    SELECT id, status FROM customers 
    WHERE LOWER(email) = ${session.user.email.toLowerCase()} 
    LIMIT 1
  `;

  if (customerRows.length === 0 || customerRows[0].status !== 'ACTIVE') {
    return <>{children}</>;
  }

  const customerId = customerRows[0].id;
  const initialData = await getClientData(customerId);

  return <ClientShell initialData={initialData}>{children}</ClientShell>;
}
