import nodemailer from 'nodemailer';
import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { sql } from '@/lib/neon';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', (err) => reject(err));
  });
}

export async function sendOtpEmail(to: string, otp: string): Promise<boolean> {
  const from = process.env.SMTP_FROM || `"RuangTes Enterprise" <${process.env.SMTP_USER}>`;

  let htmlContent = '';

  try {
    // Dynamically fetch OTP template from database via RAW SQL
    const dbTemplate = await sql`
      SELECT message_content FROM notification_templates
      WHERE event_trigger = 'OTP_VERIFICATION' AND is_active = true
      LIMIT 1
    `;

    if (dbTemplate.length > 0 && dbTemplate[0].message_content) {
      htmlContent = dbTemplate[0].message_content
        .replace(/{otp_code}/g, otp)
        .replace(/{expiry_minutes}/g, '5')
        .replace(/{company_name}/g, 'Perusahaan Anda');
    }
  } catch (err) {
    console.error('Failed to fetch OTP template from database, using fallback:', err);
  }

  // Fallback HTML if DB query fails or template is empty
  if (!htmlContent) {
    htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
          .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .content { padding: 32px 28px; }
          .otp-box { background: #f1f5f9; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4338ca; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h2>RuangTes Enterprise</h2></div>
          <div class="content">
            <h3>Verifikasi Email Akun Corporate</h3>
            <p>Kode OTP verifikasi email perusahaan Anda:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <p>Berlaku selama <strong>5 menit</strong></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `[${otp}] Kode OTP Verifikasi Registrasi Corporate RuangTes`,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
}

export async function sendParticipantCompletedEmailToHr(participantId: number): Promise<boolean> {
  try {
    // 1. Fetch participant, campaign, customer email, and test result data using RAW SQL
    const participantRows = await sql`
      SELECT 
        p.id as participant_id,
        p.full_name as participant_name,
        p.email as participant_email,
        p.completed_at,
        c.title as campaign_title,
        cust.company_name,
        cust.email as hr_email
      FROM participants p
      JOIN campaigns c ON p.campaign_id = c.id
      JOIN customers cust ON c.customer_id = cust.id
      WHERE p.id = ${participantId}
      LIMIT 1
    `;

    if (participantRows.length === 0) return false;

    const row = participantRows[0];
    const hrEmail = row.hr_email;
    if (!hrEmail) return false;

    // 2. Fetch test result for generating PDF attachment
    const resultRows = await sql`
      SELECT tr.*, p.full_name, p.email, c.title as campaign_title
      FROM test_results tr
      JOIN participants p ON tr.participant_id = p.id
      JOIN campaigns c ON p.campaign_id = c.id
      WHERE tr.participant_id = ${participantId}
      LIMIT 1
    `;

    let pdfBuffer: Buffer | null = null;
    if (resultRows.length > 0) {
      try {
        const resRow = resultRows[0];
        let scoring = resRow.scoring_data;
        if (!scoring && resRow.raw_answers) {
          const { calculateDiscScore } = await import('@/lib/scoring/disc');
          scoring = calculateDiscScore(resRow.raw_answers);
        }

        if (scoring) {
          const { DiscPdfDocument } = await import('@/app/api/reports/disc/[resultId]/pdf/route');
          const pdfStream = await renderToStream(React.createElement(DiscPdfDocument, { participant: resRow, scoring }) as any);
          pdfBuffer = await streamToBuffer(pdfStream);
        }
      } catch (pdfErr) {
        console.error('Failed to generate PDF attachment for HR notification:', pdfErr);
      }
    }

    // 3. Fetch template from database via RAW SQL
    const templateRows = await sql`
      SELECT message_content FROM notification_templates
      WHERE event_trigger = 'PARTICIPANT_COMPLETED_HR_NOTIF' AND is_active = true
      LIMIT 1
    `;

    const completionTimeStr = row.completed_at
      ? new Date(row.completed_at).toLocaleString('id-ID')
      : new Date().toLocaleString('id-ID');

    const appBaseUrl = process.env.NEXTAUTH_URL || 'https://psikotest.id';
    const dashboardUrl = `${appBaseUrl}/clients/participants/${participantId}`;

    let htmlContent = '';
    if (templateRows.length > 0 && templateRows[0].message_content) {
      htmlContent = templateRows[0].message_content
        .replace(/{participant_name}/g, row.participant_name)
        .replace(/{participant_email}/g, row.participant_email)
        .replace(/{campaign_title}/g, row.campaign_title)
        .replace(/{company_name}/g, row.company_name)
        .replace(/{completion_time}/g, completionTimeStr)
        .replace(/{dashboard_url}/g, dashboardUrl);
    } else {
      htmlContent = `
        <h2>Hasil Asesmen Peserta Selesai: ${row.participant_name}</h2>
        <p>Kandidat <strong>${row.participant_name}</strong> (${row.participant_email}) telah menyelesaikan tes psikotes pada sesi <strong>${row.campaign_title}</strong>.</p>
        <p>File PDF Laporan Hasil Psikotes terlampir dalam email ini.</p>
        <p><a href="${dashboardUrl}">Lihat Detail Hasil di Panel HR Client ➔</a></p>
      `;
    }

    const from = process.env.SMTP_FROM || `"RuangTes Enterprise" <${process.env.SMTP_USER}>`;
    const attachments = pdfBuffer
      ? [
          {
            filename: `Laporan_Hasil_Psikotes_${row.participant_name.replace(/\s+/g, '_')}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ]
      : [];

    await transporter.sendMail({
      from,
      to: hrEmail,
      subject: `[Hasil Asesmen] ${row.participant_name} telah menyelesaikan tes ${row.campaign_title}`,
      html: htmlContent,
      attachments,
    });

    console.log(`Successfully sent participant completed email with PDF attachment to HR (${hrEmail})`);
    return true;
  } catch (err) {
    console.error('Error sending participant completed email to HR:', err);
    return false;
  }
}

/**
 * Send Payment Instruction Email to HR Client for Virtual Account & Minimarket/Retail
 */
export async function sendPaymentInstructionEmail(
  orderId: number,
  paymentCodeOrVa: string,
  instructionsHtml: string
): Promise<boolean> {
  try {
    const orderRows = await sql`
      SELECT 
        o.id,
        o.invoice_code,
        o.total_amount,
        c.company_name,
        c.contact_name,
        c.email as customer_email,
        pm.name as payment_method_name,
        pm.type as payment_method_type,
        pm.logo_url as payment_method_logo
      FROM test_orders o
      JOIN customers c ON o.customer_id = c.id
      LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
      WHERE o.id = ${orderId}
      LIMIT 1
    `;

    if (orderRows.length === 0) {
      console.warn(`Order #${orderId} not found for instruction email.`);
      return false;
    }

    const order = orderRows[0];
    const customerEmail = order.customer_email;
    if (!customerEmail) return false;

    const paymentLabel = order.payment_method_type === 'retail_outlet' ? 'Kode Pembayaran Kasir' : 'Nomor Virtual Account';
    const totalFormatted = Number(order.total_amount).toLocaleString('id-ID');

    const paymentLogoHtml = order.payment_method_logo
      ? `<img src="${order.payment_method_logo}" alt="${order.payment_method_name}" style="max-height: 28px; max-width: 90px; object-fit: contain; vertical-align: middle; margin-right: 8px;" />`
      : '';

    // Fetch template from notification_templates
    const templateRows = await sql`
      SELECT message_content FROM notification_templates
      WHERE event_trigger = 'ORDER_INSTRUCTION_VA_RETAIL' AND is_active = true
      LIMIT 1
    `;

    let html = '';
    if (templateRows.length > 0 && templateRows[0].message_content) {
      html = templateRows[0].message_content
        .replace(/{invoice_code}/g, order.invoice_code)
        .replace(/{contact_name}/g, order.contact_name || 'HR Admin')
        .replace(/{company_name}/g, order.company_name || 'Perusahaan Klien')
        .replace(/{payment_method_name}/g, `${paymentLogoHtml}${order.payment_method_name || 'Virtual Account'}`)
        .replace(/{total_amount}/g, totalFormatted)
        .replace(/{payment_code_label}/g, paymentLabel)
        .replace(/{payment_code_or_va}/g, paymentCodeOrVa)
        .replace(/{instructions_html}/g, instructionsHtml || '<p>Selesaikan pembayaran melalui aplikasi bank atau gerai mitra terdekat.</p>');
    } else {
      html = `
        <h2>Instruksi Pembayaran: ${order.invoice_code}</h2>
        <p>Yth. <strong>${order.contact_name}</strong> (${order.company_name}),</p>
        <p>Metode Pembayaran: ${paymentLogoHtml}<strong>${order.payment_method_name}</strong></p>
        <p>${paymentLabel}: <strong style="font-size:20px;">${paymentCodeOrVa}</strong></p>
        <p>Total Tagihan: <strong>Rp ${totalFormatted}</strong></p>
        <div>${instructionsHtml}</div>
      `;
    }

    const from = process.env.SMTP_FROM || `"PsikoTest.id Enterprise" <${process.env.SMTP_USER}>`;

    await transporter.sendMail({
      from,
      to: customerEmail,
      subject: `[Instruksi Bayar] Tagihan ${order.invoice_code} - ${order.payment_method_name}`,
      html,
    });

    console.log(`Payment instruction email successfully sent to ${customerEmail} for order #${orderId}`);
    return true;
  } catch (err) {
    console.error('Failed to send payment instruction email:', err);
    return false;
  }
}

/**
 * Send Payment Completed (PAID) Confirmation Email to HR Client
 * Applies to ALL payment channels (Xendit, Midtrans, Manual Transfer)
 */
export async function sendOrderPaidEmailToHr(orderId: number): Promise<boolean> {
  try {
    const orderRows = await sql`
      SELECT 
        o.id,
        o.invoice_code,
        o.order_type,
        o.total_amount,
        o.paid_at,
        c.company_name,
        c.contact_name,
        c.email as customer_email,
        pm.name as payment_method_name,
        pm.logo_url as payment_method_logo
      FROM test_orders o
      JOIN customers c ON o.customer_id = c.id
      LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
      WHERE o.id = ${orderId}
      LIMIT 1
    `;

    if (orderRows.length === 0) {
      console.warn(`Order #${orderId} not found for paid confirmation email.`);
      return false;
    }

    const order = orderRows[0];
    const customerEmail = order.customer_email;
    if (!customerEmail) return false;

    const appBaseUrl = process.env.NEXTAUTH_URL || 'https://psikotest.id';
    const dashboardUrl = `${appBaseUrl}/clients/billing`;
    const totalFormatted = Number(order.total_amount).toLocaleString('id-ID');
    const paidAtFormatted = order.paid_at
      ? new Date(order.paid_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })
      : new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

    const orderImpactDesc = order.order_type === 'TOPUP_BALANCE'
      ? `Saldo wallet corporate perusahaan Anda sebesar <strong>Rp ${totalFormatted}</strong> telah berhasil ditambahkan dan siap digunakan untuk pembelian kuota asesmen.`
      : `Kuota instrumen tes psikotes yang Anda pesan telah berhasil dikreditkan ke akun perusahaan Anda dan siap dialokasikan ke kandidat.`;

    const paymentLogoHtml = order.payment_method_logo
      ? `<img src="${order.payment_method_logo}" alt="${order.payment_method_name}" style="max-height: 28px; max-width: 90px; object-fit: contain; vertical-align: middle; margin-right: 8px;" />`
      : '';

    // Fetch template from notification_templates
    const templateRows = await sql`
      SELECT message_content FROM notification_templates
      WHERE event_trigger = 'ORDER_PAID_CONFIRMATION' AND is_active = true
      LIMIT 1
    `;

    let html = '';
    if (templateRows.length > 0 && templateRows[0].message_content) {
      html = templateRows[0].message_content
        .replace(/{invoice_code}/g, order.invoice_code)
        .replace(/{contact_name}/g, order.contact_name || 'HR Admin')
        .replace(/{company_name}/g, order.company_name || 'Perusahaan Klien')
        .replace(/{payment_method_name}/g, `${paymentLogoHtml}${order.payment_method_name || 'Pembayaran Online'}`)
        .replace(/{total_amount}/g, totalFormatted)
        .replace(/{paid_at}/g, paidAtFormatted)
        .replace(/{order_impact_desc}/g, orderImpactDesc)
        .replace(/{dashboard_url}/g, dashboardUrl);
    } else {
      html = `
        <h2>Pembayaran Tagihan Lunas (PAID): ${order.invoice_code}</h2>
        <p>Halo <strong>${order.contact_name}</strong> (${order.company_name}),</p>
        <p>Pembayaran Anda sebesar <strong>Rp ${totalFormatted}</strong> via ${paymentLogoHtml}<strong>${order.payment_method_name}</strong> telah berhasil diverifikasi lunas.</p>
        <p>${orderImpactDesc}</p>
        <p><a href="${dashboardUrl}">Kunjungi Dashboard Billing Klien</a></p>
      `;
    }

    const from = process.env.SMTP_FROM || `"PsikoTest.id Enterprise" <${process.env.SMTP_USER}>`;

    await transporter.sendMail({
      from,
      to: customerEmail,
      subject: `[Lunas] Konfirmasi Pembayaran Tagihan ${order.invoice_code} Berhasil`,
      html,
    });

    console.log(`Order PAID confirmation email successfully sent to ${customerEmail} for order #${orderId}`);
    return true;
  } catch (err) {
    console.error('Failed to send order paid confirmation email:', err);
    return false;
  }
}

