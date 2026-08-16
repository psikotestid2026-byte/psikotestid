import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { sql } from '@/lib/neon';
import { sendOtpEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, bot_honeypot } = body;

    // Bot / Robot Protection (Invisible Honeypot)
    if (bot_honeypot && bot_honeypot.trim() !== '') {
      // Fake success to confuse automated spam bots without executing any logic
      return NextResponse.json({
        success: true,
        message: 'Kode OTP telah dikirim ke email Anda.',
        otp_token: 'bot_trapped_payload',
      });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Email perusahaan tidak valid.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists in customers table using RAW SQL
    const existing = await sql`
      SELECT id FROM customers WHERE LOWER(email) = ${cleanEmail} LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email ini sudah terdaftar sebagai HR Client. Silakan login langsung menggunakan Google SSO.',
        },
        { status: 400 }
      );
    }

    // Generate random 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

    const secret = process.env.OTP_SECRET || 'psikotest_stateless_secret_fallback_key';
    const signature = createHmac('sha256', secret)
      .update(`${cleanEmail}:${otp}:${expiry}`)
      .digest('hex');

    const otpToken = `${expiry}.${signature}`;

    // Send Email via Gmail SMTP
    const sent = await sendOtpEmail(cleanEmail, otp);
    if (!sent) {
      return NextResponse.json(
        { success: false, error: 'Gagal mengirim email OTP. Silakan periksa server SMTP atau coba beberapa saat lagi.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Kode OTP 6-digit telah dikirim ke email Anda. Berlaku selama 5 menit.',
      otp_token: otpToken,
    });
  } catch (err) {
    console.error('Send OTP Error:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server saat mengirim OTP.' },
      { status: 500 }
    );
  }
}
