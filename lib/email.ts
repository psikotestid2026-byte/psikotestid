import nodemailer from 'nodemailer';

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

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kode OTP Registrasi Corporate - PsikoTest.id</title>
      <style>
        body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
        .container { max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .logo span { color: #818cf8; }
        .content { padding: 32px 28px; }
        .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
        .text { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .otp-box { background-color: #f1f5f9; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4338ca; font-family: 'Courier New', Courier, monospace; }
        .expiry-info { font-size: 13px; color: #64748b; margin-top: 8px; font-weight: 500; }
        .warning-box { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 6px; font-size: 13px; color: #b45309; margin-top: 24px; }
        .footer { background-color: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">PsikoTest<span>.id</span> Enterprise</div>
        </div>
        <div class="content">
          <h1 class="title">Verifikasi Email Akun Corporate</h1>
          <p class="text">Terima kasih telah mendaftar di <strong>PsikoTest.id Enterprise</strong>. Silakan masukkan kode OTP di bawah ini untuk memverifikasi email perusahaan Anda:</p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="expiry-info">Kode ini berlaku selama <strong>5 menit</strong></div>
          </div>

          <p class="text">Setelah verifikasi berhasil, Anda dapat melanjutkan untuk melengkapi profil perusahaan dan dapat masuk kapan saja dengan praktis via <strong>Google SSO</strong>.</p>

          <div class="warning-box">
            <strong>Keamanan Akun:</strong> Jangan berikan kode OTP ini kepada siapa pun. Tim PsikoTest.id tidak pernah meminta kode OTP Anda.
          </div>
        </div>
        <div class="footer">
          &copy; 2026 PsikoTest.id Enterprise. Platform Asesmen Psikotes Online Terintegrasi.
        </div>
      </div>
    </body>
    </html>
  `;

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
