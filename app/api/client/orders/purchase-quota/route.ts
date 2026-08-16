import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/neon';

// POST: Purchase test quota using customer Saldo Wallet instantly
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const customerRows = await sql`
      SELECT id, company_name, balance FROM customers WHERE email = ${session.user.email} LIMIT 1
    `;

    if (customerRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Klien HR tidak ditemukan' }, { status: 404 });
    }

    const customer = customerRows[0];
    const customerId = customer.id;
    const currentBalance = Number(customer.balance || 0);

    const body = await req.json();
    const { test_id, quantity } = body;

    const qty = parseInt(quantity, 10);
    const testId = parseInt(test_id, 10);

    if (isNaN(testId) || isNaN(qty) || qty <= 0) {
      return NextResponse.json({ success: false, error: 'Jenis tes dan jumlah kuota tidak valid.' }, { status: 400 });
    }

    // Fetch test pricing details via RAW SQL
    const testRows = await sql`
      SELECT id, name, code, price FROM master_tests WHERE id = ${testId} LIMIT 1
    `;

    if (testRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Alat tes tidak ditemukan.' }, { status: 404 });
    }

    const test = testRows[0];
    const pricePerTest = Number(test.price);
    const totalCost = pricePerTest * qty;

    if (currentBalance < totalCost) {
      return NextResponse.json(
        {
          success: false,
          error: `Saldo wallet Anda (Rp ${currentBalance.toLocaleString('id-ID')}) tidak mencukupi untuk transaksi sebesar Rp ${totalCost.toLocaleString('id-ID')}. Silakan lakukan Top-Up Saldo terlebih dahulu.`,
        },
        { status: 400 }
      );
    }

    const newBalance = currentBalance - totalCost;

    // Generate unique invoice code
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const invoiceCode = `PURCHASE-${dateStr}-${randomSeq}`;

    // 1. Create Order with status PAID using RAW SQL
    const orderRows = await sql`
      INSERT INTO test_orders (
        invoice_code,
        customer_id,
        order_type,
        payment_method_id,
        subtotal,
        fee_amount,
        total_amount,
        status,
        paid_at
      ) VALUES (
        ${invoiceCode},
        ${customerId},
        'BALANCE_PURCHASE',
        NULL,
        ${totalCost},
        0,
        ${totalCost},
        'PAID',
        NOW()
      )
      RETURNING id
    `;

    const orderId = orderRows[0].id;

    // 2. Insert Order Item
    await sql`
      INSERT INTO test_order_items (order_id, test_id, bundle_id, quantity, price_per_item, subtotal)
      VALUES (${orderId}, ${testId}, NULL, ${qty}, ${pricePerTest}, ${totalCost})
    `;

    // 3. Deduct Customer Wallet Balance
    await sql`
      UPDATE customers
      SET balance = ${newBalance}, updated_at = NOW()
      WHERE id = ${customerId}
    `;

    // 4. Insert Wallet Transaction Ledger
    await sql`
      INSERT INTO wallet_transactions (
        customer_id,
        order_id,
        type,
        amount,
        balance_before,
        balance_after,
        description
      ) VALUES (
        ${customerId},
        ${orderId},
        'PURCHASE_QUOTA',
        ${-totalCost},
        ${currentBalance},
        ${newBalance},
        ${`Pembelian ${qty} kuota tes ${test.name} (${test.code}) menggunakan Saldo Wallet`}
      )
    `;

    // 5. Credit Customer Test Quota
    await sql`
      INSERT INTO customer_test_quotas (customer_id, test_id, quota)
      VALUES (${customerId}, ${testId}, ${qty})
      ON CONFLICT (customer_id, test_id)
      DO UPDATE SET quota = customer_test_quotas.quota + EXCLUDED.quota
    `;

    // 6. Insert Quota Transaction Ledger
    await sql`
      INSERT INTO quota_transactions (
        customer_id,
        test_id,
        reference_id,
        quantity,
        type,
        description
      ) VALUES (
        ${customerId},
        ${testId},
        ${invoiceCode},
        ${qty},
        'CREDIT',
        ${`Pembelian ${qty} kuota ${test.name} via Saldo Wallet`}
      )
    `;

    return NextResponse.json({
      success: true,
      message: `Berhasil membeli ${qty} kuota tes ${test.name} sebesar Rp ${totalCost.toLocaleString('id-ID')} menggunakan Saldo Wallet!`,
      data: {
        balance: newBalance,
        invoice_code: invoiceCode,
      },
    });
  } catch (err) {
    console.error('Purchase Quota Error:', err);
    return NextResponse.json({ success: false, error: 'Gagal memproses pembelian kuota tes.' }, { status: 500 });
  }
}
