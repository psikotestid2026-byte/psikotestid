import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/neon';

// GET: Fetch detailed order instructions by invoice code or order ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan' }, { status: 404 });
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

    return NextResponse.json({
      success: true,
      data: enrichedOrder,
    });
  } catch (err) {
    console.error('Fetch Order Detail Error:', err);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data pesanan' }, { status: 500 });
  }
}
