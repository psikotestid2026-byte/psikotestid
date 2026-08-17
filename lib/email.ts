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
  const from = process.env.SMTP_FROM || `"PsikoTest.id Enterprise" <${process.env.SMTP_USER}>`;

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
          <div class="header"><h2>PsikoTest.id Enterprise</h2></div>
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
      subject: `[${otp}] Kode OTP Verifikasi Registrasi Corporate PsikoTest.id`,
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

    const from = process.env.SMTP_FROM || `"PsikoTest.id Enterprise" <${process.env.SMTP_USER}>`;
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
