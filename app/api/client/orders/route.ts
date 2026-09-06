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

    const body = await req.json();
    const { amount, order_type, test_id, quantity, payment_method_code, payment_method_id } = body;

    const subtotal = Number(amount) || 0;
    if (subtotal < 50000 && order_type === 'TOPUP_BALANCE') {
      return NextResponse.json(
        { success: false, error: 'Minimal top-up saldo wallet adalah Rp 50.000.' },
        { status: 400 }
      );
    }

    // Parallelize Customer Lookup & Payment Method Lookup via RAW SQL
    const paymentMethodQuery = payment_method_code
      ? sql`
          SELECT id, code, name, type, provider, admin_fee_flat, admin_fee_pct, logo_url
          FROM payment_methods
          WHERE code = ${payment_method_code} AND is_active = true
          LIMIT 1
        `
      : payment_method_id
      ? sql`
          SELECT id, code, name, type, provider, admin_fee_flat, admin_fee_pct, logo_url
          FROM payment_methods
          WHERE id = ${payment_method_id} AND is_active = true
          LIMIT 1
        `
      : sql`
          SELECT id, code, name, type, provider, admin_fee_flat, admin_fee_pct, logo_url
          FROM payment_methods
          WHERE code = 'MANUAL_BCA' AND is_active = true
          LIMIT 1
        `;

    const [customerRows, methodRows] = await Promise.all([
      sql`
        SELECT id, company_name, contact_name, phone_number 
        FROM customers 
        WHERE email = ${session.user.email} 
        LIMIT 1
      `,
      paymentMethodQuery,
    ]);

    if (customerRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Klien HR tidak ditemukan' }, { status: 404 });
    }

    let selectedMethodRows = methodRows;
    if (selectedMethodRows.length === 0) {
      // Fallback to active method
      selectedMethodRows = await sql`
        SELECT id, code, name, type, provider, admin_fee_flat, admin_fee_pct, logo_url
        FROM payment_methods
        WHERE is_active = true
        ORDER BY sort_order ASC, id ASC
        LIMIT 1
      `;
    }

    const customer = customerRows[0];
    const customerId = customer.id;
    const clientEmail = session.user.email;
    const companyName = customer.company_name || session.user.name || clientEmail;
    const contactName = customer.contact_name || 'HR Admin';
    const rawPhone = customer.phone_number || '';
    const cleanPhoneDigits = rawPhone.replace(/\D/g, '');
    const waNumber = cleanPhoneDigits.startsWith('0')
      ? '62' + cleanPhoneDigits.slice(1)
      : cleanPhoneDigits.startsWith('62')
      ? cleanPhoneDigits
      : cleanPhoneDigits
      ? '62' + cleanPhoneDigits
      : '';
    const whatsappLink = waNumber ? `https://wa.me/${waNumber}` : '#';

    const paymentMethod = selectedMethodRows[0];
    const isManual = paymentMethod.provider.toLowerCase() === 'manual';
    const isMidtrans = paymentMethod.provider.toLowerCase() === 'midtrans';
    const isXendit = paymentMethod.provider.toLowerCase() === 'xendit';

    // Calculate fee & total
    const feeFlat = Number(paymentMethod.admin_fee_flat || 0);
    const uniqueCode = isManual ? Math.floor(100 + Math.random() * 899) : 0;
    const feeAmount = isManual ? uniqueCode : feeFlat;
    const totalAmount = subtotal + feeAmount;

    // Generate unique invoice code
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const invoiceCode = `ORD-${dateStr}-${randomSeq}`;

    let paymentUrl: string | null = null;
    let paymentToken: string | null = null;
    let paymentCodeOrVa: string = '';

    // Provider Integration Handling
    if (isMidtrans) {
      const { createMidtransSnapTransaction } = await import('@/lib/midtrans');
      
      // Determine payment filter for Snap if specific method
      let enabledPayments: string[] | undefined = undefined;
      const codeUpper = paymentMethod.code.toUpperCase();
      if (codeUpper.includes('GOPAY') || codeUpper === 'MIDTRANS_QRIS_GOPAY') {
        enabledPayments = ['gopay', 'qris'];
      } else if (codeUpper.includes('BNI')) {
        enabledPayments = ['bni_va'];
      } else if (codeUpper.includes('MANDIRI')) {
        enabledPayments = ['echannel', 'mandiri_va'];
      } else if (codeUpper.includes('PERMATA')) {
        enabledPayments = ['permata_va'];
      } else if (codeUpper.includes('BCA')) {
        enabledPayments = ['bca_va'];
      } else if (codeUpper.includes('BRI')) {
        enabledPayments = ['bri_va'];
      } else if (codeUpper.includes('CREDITCARD')) {
        enabledPayments = ['credit_card'];
      } else if (codeUpper.includes('SHOPEEPAY')) {
        enabledPayments = ['shopeepay'];
      }

      const snapResult = await createMidtransSnapTransaction({
        orderId: invoiceCode,
        grossAmount: totalAmount,
        customerDetails: {
          first_name: companyName,
          email: session.user.email,
          phone: rawPhone || undefined,
        },
        items: [
          {
            id: order_type || 'TOPUP_BALANCE',
            price: totalAmount,
            quantity: 1,
            name: order_type === 'TOPUP_BALANCE' ? 'Top-Up Saldo Wallet' : 'Pembelian Kuota Tes',
          },
        ],
        enabledPayments,
      });

      paymentToken = snapResult.token;
      paymentUrl = snapResult.redirect_url;
    } else if (isXendit) {
      const codeUpper = paymentMethod.code.toUpperCase();
      const typeLower = paymentMethod.type.toLowerCase();

      if (typeLower === 'va') {
        // Core API Xendit: Virtual Account
        const { createXenditVirtualAccount } = await import('@/lib/xendit');
        const vaBankCode = codeUpper === 'CIMB' ? 'CIMB' : codeUpper; // BCA, MANDIRI, BNI, BRI, PERMATA, BSI, CIMB, BJB
        const vaRes = await createXenditVirtualAccount({
          externalId: invoiceCode,
          bankCode: vaBankCode,
          name: companyName,
          expectedAmount: totalAmount,
        });

        paymentToken = vaRes.account_number;
        paymentCodeOrVa = vaRes.account_number;
        paymentUrl = null; // Tidak perlu redirect keluar
      } else if (typeLower === 'qr_code') {
        // Core API Xendit: Dynamic QRIS
        const { createXenditQrCode } = await import('@/lib/xendit');
        const qrRes = await createXenditQrCode({
          externalId: invoiceCode,
          amount: totalAmount,
        });

        paymentToken = qrRes.qr_string;
        paymentCodeOrVa = 'Scan QRIS Dinamis di Layar';
        paymentUrl = null;
      } else if (typeLower === 'retail_outlet') {
        // Core API Xendit: Retail Outlet Kasir (Alfamart / Indomaret)
        const { createXenditRetailCode } = await import('@/lib/xendit');
        const outletName = codeUpper.includes('INDOMARET') ? 'INDOMARET' : 'ALFAMART';
        const retailRes = await createXenditRetailCode({
          externalId: invoiceCode,
          retailOutletName: outletName,
          name: companyName,
          expectedAmount: totalAmount,
        });

        paymentToken = retailRes.payment_code;
        paymentCodeOrVa = retailRes.payment_code;
        paymentUrl = null;
      } else {
        // E-Wallet fallback to Invoice
        const { createXenditInvoice } = await import('@/lib/xendit');
        const xenditResult = await createXenditInvoice({
          externalId: invoiceCode,
          amount: totalAmount,
          payerEmail: session.user.email,
          description: `Pembayaran ${order_type === 'TOPUP_BALANCE' ? 'Top-Up Saldo Corporate' : 'Kuota Tes'} (${invoiceCode})`,
          customerName: companyName,
          paymentMethods: [codeUpper],
        });

        paymentToken = xenditResult.id;
        paymentUrl = xenditResult.invoice_url;
        paymentCodeOrVa = `Invoice: ${invoiceCode}`;
      }
    }

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
        payment_url,
        payment_token,
        status
      ) VALUES (
        ${invoiceCode},
        ${customerId},
        ${order_type || 'TOPUP_BALANCE'},
        ${paymentMethod.id},
        ${subtotal},
        ${feeAmount},
        ${totalAmount},
        ${paymentUrl},
        ${paymentToken},
        'PENDING'
      )
      RETURNING id, invoice_code, total_amount, subtotal, fee_amount, status, created_at, payment_url, payment_token
    `;

    const orderId = newOrder[0].id;

    // Parallelize order item insertion & instructions query
    const insertItemPromise =
      order_type === 'TOPUP_BALANCE'
        ? sql`
            INSERT INTO test_order_items (order_id, test_id, bundle_id, quantity, price_per_item, subtotal)
            VALUES (${orderId}, NULL, NULL, 1, ${subtotal}, ${subtotal})
          `
        : test_id && quantity
        ? sql`
            INSERT INTO test_order_items (order_id, test_id, bundle_id, quantity, price_per_item, subtotal)
            VALUES (${orderId}, ${test_id}, NULL, ${quantity}, ${subtotal / quantity}, ${subtotal})
          `
        : Promise.resolve();

    const fetchInstructionsPromise = sql`
      SELECT title, content, sort_order
      FROM payment_instructions
      WHERE payment_method_id = ${paymentMethod.id}
      ORDER BY sort_order ASC
    `;

    const [, instructions] = await Promise.all([insertItemPromise, fetchInstructionsPromise]);

    // Check if VA or Retail: Send Email Instruction asynchronously (non-blocking)
    const isVaOrRetail = paymentMethod.type.toLowerCase() === 'va' || paymentMethod.type.toLowerCase() === 'retail_outlet';
    const finalPaymentCode = paymentCodeOrVa || paymentToken || (paymentUrl ? `Buka Link Tagihan: ${invoiceCode}` : `${invoiceCode}`);

    // Asynchronous background task execution so API responds instantly
    (async () => {
      try {
        if (isVaOrRetail) {
          let instructionsHtml = '';
          if (instructions.length > 0) {
            instructionsHtml = instructions
              .map(
                (ins) => `
                <div style="margin-bottom: 12px;">
                  <strong style="color: #1e293b; font-size: 13px;">${ins.title}</strong>
                  <div style="margin-top: 4px; color: #475569;">${ins.content}</div>
                </div>
              `
              )
              .join('');
          }
          const { sendPaymentInstructionEmail } = await import('@/lib/email');
          await sendPaymentInstructionEmail(orderId, finalPaymentCode, instructionsHtml);
        }
      } catch (emailErr) {
        console.error('Send Payment Instruction Email Error:', emailErr);
      }

      try {
        await sendDynamicTelegramNotification('TELEGRAM_NEW_ORDER', {
          invoice_code: invoiceCode,
          company_name: companyName,
          customer_email: clientEmail,
          contact_name: contactName,
          phone_number: rawPhone || '-',
          whatsapp_link: whatsappLink,
          order_type: order_type === 'TOPUP_BALANCE' ? 'Top-Up Saldo Wallet' : 'Beli Kuota Tes',
          subtotal: subtotal.toLocaleString('id-ID'),
          unique_code: feeAmount.toString(),
          total_amount: totalAmount.toLocaleString('id-ID'),
          payment_method: `${paymentMethod.name} (${paymentMethod.provider})`,
          bank_info: isManual ? 'BCA 1234567890 a.n PT PsikoTest Solusi Indonesia' : `Gateway Online (${paymentMethod.provider})`,
        });
      } catch (tgErr) {
        console.error('Telegram Checkout Alert Error:', tgErr);
      }
    })();

    return NextResponse.json({
      success: true,
      message: 'Invoice tagihan berhasil dibuat!',
      data: {
        id: orderId,
        invoice_code: invoiceCode,
        subtotal,
        fee_amount: feeAmount,
        unique_code: uniqueCode,
        total_amount: totalAmount,
        status: 'PENDING',
        created_at: newOrder[0].created_at,
        payment_method: paymentMethod.name,
        payment_method_code: paymentMethod.code,
        payment_method_logo: paymentMethod.logo_url,
        payment_provider: paymentMethod.provider,
        payment_type: paymentMethod.type,
        payment_url: paymentUrl,
        payment_token: paymentToken,
        instructions,
        bank_details: isManual
          ? {
              bank_name: paymentMethod.name,
              account_number: '1234567890',
              account_name: 'PT PsikoTest Solusi Indonesia',
            }
          : null,
      },
    });
  } catch (err: any) {
    console.error('Create Order Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Gagal membuat pesanan tagihan.' }, { status: 500 });
  }
}

