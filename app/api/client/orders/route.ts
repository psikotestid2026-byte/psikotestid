import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/neon';
import { sendDynamicTelegramNotification } from '@/lib/telegram';

// GET: Fetch current HR client's orders & wallet transactions
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await sql`
      SELECT id, balance FROM customers WHERE email = ${session.user.email} LIMIT 1
    `;

    if (customer.length === 0) {
      return NextResponse.json({ success: false, error: 'Klien HR tidak ditemukan' }, { status: 404 });
    }

    const customerId = customer[0].id;

    // Fetch orders with payment method details using RAW SQL
    const orders = await sql`
      SELECT 
        o.id,
        o.invoice_code,
        o.order_type,
        o.subtotal,
        o.fee_amount,
        o.total_amount,
        o.status,
        o.proof_url,
        o.created_at,
        o.paid_at,
        pm.name as payment_method_name,
        pm.code as payment_method_code
      FROM test_orders o
      LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
      WHERE o.customer_id = ${customerId}
      ORDER BY o.id DESC
    `;

    // Fetch wallet transaction ledger using RAW SQL
    const walletHistory = await sql`
      SELECT id, type, amount, balance_before, balance_after, description, created_at
      FROM wallet_transactions
      WHERE customer_id = ${customerId}
      ORDER BY id DESC
    `;

    return NextResponse.json({
      success: true,
      data: {
        balance: Number(customer[0].balance),
        orders,
        walletHistory,
      },
    });
  } catch (err) {
    console.error('Fetch Client Orders Error:', err);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data pesanan.' }, { status: 500 });
  }
}

// POST: Create Top-Up Balance or Direct Quota Order using RAW SQL
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await sql`
      SELECT id, company_name, contact_name, phone_number FROM customers WHERE email = ${session.user.email} LIMIT 1
    `;

    if (customer.length === 0) {
      return NextResponse.json({ success: false, error: 'Klien HR tidak ditemukan' }, { status: 404 });
    }

    const customerId = customer[0].id;
    const companyName = customer[0].company_name || session.user.name || session.user.email;
    const contactName = customer[0].contact_name || 'HR Admin';
    const rawPhone = customer[0].phone_number || '';
    const cleanPhoneDigits = rawPhone.replace(/\D/g, '');
    const waNumber = cleanPhoneDigits.startsWith('0')
      ? '62' + cleanPhoneDigits.slice(1)
      : cleanPhoneDigits.startsWith('62')
      ? cleanPhoneDigits
      : cleanPhoneDigits
      ? '62' + cleanPhoneDigits
      : '';
    const whatsappLink = waNumber ? `https://wa.me/${waNumber}` : '#';

    const body = await req.json();
    const { amount, order_type, test_id, quantity } = body;

    const subtotal = Number(amount) || 0;
    if (subtotal < 50000 && order_type === 'TOPUP_BALANCE') {
      return NextResponse.json(
        { success: false, error: 'Minimal top-up saldo wallet adalah Rp 50.000.' },
        { status: 400 }
      );
    }

    // Get Payment Method ID for Manual BCA Transfer
    const bcaMethod = await sql`
      SELECT id FROM payment_methods WHERE code = 'MANUAL_BCA' LIMIT 1
    `;
    const paymentMethodId = bcaMethod.length > 0 ? bcaMethod[0].id : null;

    // Generate unique 3-digit payment code (e.g., 284)
    const uniqueCode = Math.floor(100 + Math.random() * 899);
    const totalAmount = subtotal + uniqueCode;

    // Generate unique invoice code
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const invoiceCode = `ORD-${dateStr}-${randomSeq}`;

    // Create Order using RAW SQL parameterization
    const newOrder = await sql`
      INSERT INTO test_orders (
        invoice_code,
        customer_id,
        order_type,
        payment_method_id,
        subtotal,
        fee_amount,
        total_amount,
        status
      ) VALUES (
        ${invoiceCode},
        ${customerId},
        ${order_type || 'TOPUP_BALANCE'},
        ${paymentMethodId},
        ${subtotal},
        ${uniqueCode},
        ${totalAmount},
        'PENDING'
      )
      RETURNING id, invoice_code, total_amount, subtotal, fee_amount, status, created_at
    `;

    const orderId = newOrder[0].id;

    // Insert order item
    if (order_type === 'TOPUP_BALANCE') {
      await sql`
        INSERT INTO test_order_items (order_id, test_id, bundle_id, quantity, price_per_item, subtotal)
        VALUES (${orderId}, NULL, NULL, 1, ${subtotal}, ${subtotal})
      `;
    } else if (test_id && quantity) {
      await sql`
        INSERT INTO test_order_items (order_id, test_id, bundle_id, quantity, price_per_item, subtotal)
        VALUES (${orderId}, ${test_id}, NULL, ${quantity}, ${subtotal / quantity}, ${subtotal})
      `;
    }

    // Trigger Dynamic Telegram Notification for New Order
    sendDynamicTelegramNotification('TELEGRAM_NEW_ORDER', {
      invoice_code: invoiceCode,
      company_name: companyName,
      customer_email: session.user.email,
      contact_name: contactName,
      phone_number: rawPhone || '-',
      whatsapp_link: whatsappLink,
      order_type: order_type === 'TOPUP_BALANCE' ? 'Top-Up Saldo Wallet' : 'Beli Kuota Tes',
      subtotal: subtotal.toLocaleString('id-ID'),
      unique_code: uniqueCode.toString(),
      total_amount: totalAmount.toLocaleString('id-ID'),
      payment_method: 'Transfer Bank BCA (Manual)',
      bank_info: 'BCA 1234567890 a.n PT PsikoTest Solusi Indonesia',
    }).catch((err) => console.error('Telegram Checkout Alert Error:', err));

    return NextResponse.json({
      success: true,
      message: 'Invoice tagihan berhasil dibuat!',
      data: {
        id: orderId,
        invoice_code: invoiceCode,
        subtotal,
        unique_code: uniqueCode,
        total_amount: totalAmount,
        status: 'PENDING',
        created_at: newOrder[0].created_at,
        payment_method: 'Transfer Bank BCA (Manual)',
        bank_details: {
          bank_name: 'Bank Central Asia (BCA)',
          account_number: '1234567890',
          account_name: 'PT PsikoTest Solusi Indonesia',
        },
      },
    });
  } catch (err) {
    console.error('Create Order Error:', err);
    return NextResponse.json({ success: false, error: 'Gagal membuat pesanan tagihan.' }, { status: 500 });
  }
}
