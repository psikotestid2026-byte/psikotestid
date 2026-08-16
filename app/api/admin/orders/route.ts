import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';

// GET: Fetch all orders for Superadmin Panel using RAW SQL
export async function GET() {
  try {
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
        c.company_name,
        c.email as customer_email,
        c.contact_name,
        pm.name as payment_method_name,
        pm.code as payment_method_code
      FROM test_orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
      ORDER BY o.id DESC
    `;

    return NextResponse.json({ success: true, data: orders });
  } catch (err) {
    console.error('Fetch Admin Orders Error:', err);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data transaksi orders.' }, { status: 500 });
  }
}

// PUT: Confirm & Set Order Status to PAID with wallet crediting via RAW SQL
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ success: false, error: 'ID order harus diisi.' }, { status: 400 });
    }

    // Fetch order details using RAW SQL
    const orderRows = await sql`
      SELECT 
        o.id,
        o.invoice_code,
        o.customer_id,
        o.order_type,
        o.subtotal,
        o.total_amount,
        o.status,
        c.company_name,
        c.balance
      FROM test_orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ${order_id}
      LIMIT 1
    `;

    if (orderRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Transaksi order tidak ditemukan.' }, { status: 404 });
    }

    const order = orderRows[0];

    if (order.status === 'PAID') {
      return NextResponse.json(
        { success: false, error: 'Transaksi ini sudah berstatus LUNAS (PAID).' },
        { status: 400 }
      );
    }

    const customerId = order.customer_id;
    const totalAmount = Number(order.total_amount);
    const subtotalAmount = Number(order.subtotal);
    const currentBalance = Number(order.balance || 0);

    // 1. Update test_orders status to PAID using RAW SQL
    await sql`
      UPDATE test_orders
      SET status = 'PAID', paid_at = NOW()
      WHERE id = ${order_id}
    `;

    // 2. Handle TOPUP_BALANCE order type: Credit customer wallet balance
    if (order.order_type === 'TOPUP_BALANCE') {
      const creditAmount = subtotalAmount > 0 ? subtotalAmount : totalAmount;
      const balanceBefore = currentBalance;
      const balanceAfter = currentBalance + creditAmount;

      // Update customer balance via RAW SQL
      await sql`
        UPDATE customers
        SET balance = ${balanceAfter}, updated_at = NOW()
        WHERE id = ${customerId}
      `;

      // Insert ledger entry into wallet_transactions via RAW SQL
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
          ${order_id},
          'TOPUP',
          ${creditAmount},
          ${balanceBefore},
          ${balanceAfter},
          ${`Top-up saldo wallet via Transfer Bank BCA (Invoice ${order.invoice_code})`}
        )
      `;
    }

    // 3. Handle DIRECT_QUOTA order type: Credit test quota to customer
    if (order.order_type === 'DIRECT_QUOTA') {
      const items = await sql`
        SELECT test_id, quantity FROM test_order_items WHERE order_id = ${order_id}
      `;

      for (const item of items) {
        if (item.test_id && item.quantity) {
          // Upsert quota
          await sql`
            INSERT INTO customer_test_quotas (customer_id, test_id, quota)
            VALUES (${customerId}, ${item.test_id}, ${item.quantity})
            ON CONFLICT (customer_id, test_id)
            DO UPDATE SET quota = customer_test_quotas.quota + EXCLUDED.quota
          `;

          // Ledger transaction
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
              ${item.test_id},
              ${order.invoice_code},
              ${item.quantity},
              'CREDIT',
              ${`Deposit kuota tes via Pembayaran BCA (Invoice ${order.invoice_code})`}
            )
          `;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Transaksi Invoice ${order.invoice_code} untuk ${order.company_name} berhasil dikonfirmasi LUNAS! Saldo wallet telah ditambahkan.`,
    });
  } catch (err) {
    console.error('Set Paid Error:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server saat mengonfirmasi pembayaran.' },
      { status: 500 }
    );
  }
}
