import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getClientData } from '../actions';
import { TransactionsView } from '@/components/client/TransactionsView';

export const metadata = {
  title: 'Riwayat Transaksi & Tagihan Invoice - PsikoTest.id Enterprise',
  robots: 'noindex, nofollow',
};

export default async function ClientTransactionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/clients/login');
  }

  const customerId = session?.user && (session.user as any).id ? Number((session.user as any).id) : 2;
  const initialData = await getClientData(customerId);

  return <TransactionsView initialData={initialData} />;
}
