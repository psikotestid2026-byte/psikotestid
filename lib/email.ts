import nodemailer from 'nodemailer';
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
