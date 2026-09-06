import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/neon';
import { PaymentInstructionView } from '@/components/client/PaymentInstructionView';

export const metadata = {
  title: 'Instruksi Pembayaran - PsikoTest.id Enterprise',
  robots: 'noindex, nofollow',
};

export default async function ClientPaymentPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/clients/login');
  }

  const resolvedParams = await params;
  const orderIdentifier = resolvedParams.id;
  const isNumeric = /^\d+$/.test(orderIdentifier);

  let orderRows;
  if (isNumeric) {
    orderRows = await sql`
      SELECT 
        o.id,
        o.invoice_code,
        o.order_type,
        o.subtotal,
        o.fee_amount,
        o.total_amount,
        o.payment_url,
        o.payment_token,
        o.status,
        o.proof_url,
        o.created_at,
        o.paid_at,
        pm.name as payment_method_name,
        pm.code as payment_method_code,
        pm.provider as payment_provider,
        pm.type as payment_type,
        pm.logo_url as payment_method_logo,
        (
          SELECT json_agg(json_build_object('title', pi.title, 'content', pi.content) ORDER BY pi.sort_order ASC)
          FROM payment_instructions pi
          WHERE pi.payment_method_id = pm.id
        ) as instructions
      FROM test_orders o
      JOIN customers c ON o.customer_id = c.id
      LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
      WHERE o.id = ${parseInt(orderIdentifier, 10)} AND c.email = ${session.user.email}
      LIMIT 1
    `;
  } else {
    orderRows = await sql`
      SELECT 
        o.id,
        o.invoice_code,
        o.order_type,
        o.subtotal,
        o.fee_amount,
        o.total_amount,
        o.payment_url,
        o.payment_token,
        o.status,
        o.proof_url,
        o.created_at,
        o.paid_at,
        pm.name as payment_method_name,
        pm.code as payment_method_code,
        pm.provider as payment_provider,
        pm.type as payment_type,
        pm.logo_url as payment_method_logo,
        (
          SELECT json_agg(json_build_object('title', pi.title, 'content', pi.content) ORDER BY pi.sort_order ASC)
          FROM payment_instructions pi
          WHERE pi.payment_method_id = pm.id
        ) as instructions
      FROM test_orders o
      JOIN customers c ON o.customer_id = c.id
      LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
      WHERE o.invoice_code = ${orderIdentifier} AND c.email = ${session.user.email}
      LIMIT 1
    `;
  }

  if (orderRows.length === 0) {
    notFound();
  }

  const order = orderRows[0];
  const isManual = order.payment_provider?.toLowerCase() === 'manual';

  const enrichedOrder = {
    ...order,
    payment_method: order.payment_method_name || 'Pembayaran Tagihan',
    bank_details: isManual
      ? {
          bank_name: order.payment_method_name || 'Bank Central Asia (BCA)',
          account_number: '1234567890',
          account_name: 'PT PsikoTest Solusi Indonesia',
        }
      : null,
  };

  return <PaymentInstructionView orderId={order.id.toString()} initialOrder={enrichedOrder} />;
}
