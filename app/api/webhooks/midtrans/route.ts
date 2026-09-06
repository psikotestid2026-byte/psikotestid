import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { verifyMidtransSignature } from '@/lib/midtrans';
import { sendOrderPaidEmailToHr } from '@/lib/email';
import { sendDynamicTelegramNotification } from '@/lib/telegram';

/**
 * Webhook Callback Handler for Midtrans
 * Supported Events: settlement, capture, expire, cancel, deny
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      order_id: invoiceCode,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signatureKey,
      transaction_status: transactionStatus,
      fraud_status: fraudStatus,
      payment_type: paymentType,
    } = body;

    if (!invoiceCode || !statusCode || !grossAmount || !signatureKey) {
      return NextResponse.json({ success: false, error: 'Parameter webhook tidak lengkap.' }, { status: 400 });
    }

    // Verify SHA512 Signature Hash
    const isValidSignature = verifyMidtransSignature(invoiceCode, statusCode, grossAmount, signatureKey);
    if (!isValidSignature) {
      console.error(`Midtrans Webhook Invalid Signature for Order ${invoiceCode}`);
      return NextResponse.json({ success: false, error: 'Signature webhook Midtrans tidak valid.' }, { status: 403 });
    }

    // Fetch order from test_orders using RAW SQL
    const orderRows = await sql`
      SELECT 
        o.id,
        o.invoice_code,
        o.customer_id,
        o.order_type,
        o.subtotal,
        o.fee_amount,
        o.total_amount,
        o.status,
        c.company_name,
        c.contact_name,
        c.email as customer_email,
        c.phone_number,
        c.balance
      FROM test_orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.invoice_code = ${invoiceCode}
      LIMIT 1
    `;

    if (orderRows.length === 0) {
      console.warn(`Midtrans Webhook: Order ${invoiceCode} tidak ditemukan.`);
      return NextResponse.json({ success: false, error: 'Order tidak ditemukan.' }, { status: 404 });
    }

    const order = orderRows[0];
    const orderId = order.id;
    const customerId = order.customer_id;
    const currentBalance = Number(order.balance || 0);
    const subtotalAmount = Number(order.subtotal);
    const totalAmount = Number(order.total_amount);

    // Determine payment success
    const isPaid =
      transactionStatus === 'settlement' ||
      (transactionStatus === 'capture' && fraudStatus === 'accept');

    if (isPaid) {
      // Idempotency: Jika sudah PAID, tidak perlu memproses kredit saldo/kuota berulang kali
      if (order.status === 'PAID') {
        return NextResponse.json({ success: true, message: 'Order sudah berstatus PAID sebelumnya.' });
      }

      // 1. Update status order to PAID
      await sql`
        UPDATE test_orders
        SET status = 'PAID', paid_at = NOW()
        WHERE id = ${orderId}
      `;

      // 2. Process order impact based on order_type
      if (order.order_type === 'TOPUP_BALANCE') {
        const creditAmount = subtotalAmount > 0 ? subtotalAmount : totalAmount;
        const balanceBefore = currentBalance;
        const balanceAfter = currentBalance + creditAmount;

        await sql`
          UPDATE customers
          SET balance = ${balanceAfter}, updated_at = NOW()
          WHERE id = ${customerId}
        `;

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
            'TOPUP',
            ${creditAmount},
            ${balanceBefore},
            ${balanceAfter},
            ${`Top-up saldo wallet via Midtrans (${paymentType || 'Online'}) [Invoice ${order.invoice_code}]`}
          )
        `;
      } else if (order.order_type === 'DIRECT_QUOTA') {
        const items = await sql`
          SELECT test_id, quantity FROM test_order_items WHERE order_id = ${orderId}
        `;

        for (const item of items) {
          if (item.test_id && item.quantity) {
            await sql`
              INSERT INTO customer_test_quotas (customer_id, test_id, quota)
              VALUES (${customerId}, ${item.test_id}, ${item.quantity})
              ON CONFLICT (customer_id, test_id)
              DO UPDATE SET quota = customer_test_quotas.quota + EXCLUDED.quota
            `;

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
                ${`Deposit kuota tes via Midtrans (${paymentType || 'Online'}) [Invoice ${order.invoice_code}]`}
              )
            `;
          }
        }
      }

      // 3. Send PAID Confirmation Email to HR Client (Semua kanal wajib kirim email)
      sendOrderPaidEmailToHr(orderId).catch((err) =>
        console.error('Midtrans Webhook: Send Order Paid Email Error:', err)
      );

      // 4. Send Telegram Notification
      sendDynamicTelegramNotification('ORDER_PAID', {
        invoice_code: order.invoice_code,
        company_name: order.company_name,
        total_amount: totalAmount.toLocaleString('id-ID'),
        payment_method: `Midtrans (${paymentType || 'Gateway'})`,
        paid_at: new Date().toLocaleString('id-ID'),
      }).catch((err) => console.error('Telegram Paid Notification Error:', err));

      return NextResponse.json({ success: true, message: 'Transaksi Midtrans berhasil diselesaikan dan kuota/saldo dikreditkan.' });
    } else if (transactionStatus === 'expire' || transactionStatus === 'cancel' || transactionStatus === 'deny') {
      await sql`
        UPDATE test_orders
        SET status = 'EXPIRED'
        WHERE id = ${orderId} AND status = 'PENDING'
      `;
      return NextResponse.json({ success: true, message: `Status order diubah menjadi ${transactionStatus}.` });
    }

    return NextResponse.json({ success: true, message: `Notifikasi ${transactionStatus} diterima.` });
  } catch (err: any) {
    console.error('Midtrans Webhook Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
