import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, otp_token, bot_honeypot } = body;

    // Bot protection
    if (bot_honeypot && bot_honeypot.trim() !== '') {
      return NextResponse.json({
        success: true,
        message: 'Email berhasil diverifikasi!',
        verified_token: 'bot_trapped_token',
      });
    }

    if (!email || !otp || !otp_token) {
      return NextResponse.json(
        { success: false, error: 'Parameter verifikasi tidak lengkap.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    const parts = otp_token.split('.');
    if (parts.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'Token OTP tidak valid.' },
        { status: 400 }
      );
    }

    const [expiryStr, expectedSignature] = parts;
    const expiry = parseInt(expiryStr, 10);

    if (isNaN(expiry) || Date.now() > expiry) {
      return NextResponse.json(
        { success: false, error: 'Kode OTP telah kadaluwarsa (berlaku 5 menit). Silakan minta kode baru.' },
        { status: 400 }
      );
    }

    const secret = process.env.OTP_SECRET || 'psikotest_stateless_secret_fallback_key';
    const computedSignature = createHmac('sha256', secret)
      .update(`${cleanEmail}:${cleanOtp}:${expiryStr}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature);
    const computedBuf = Buffer.from(computedSignature);

    if (expectedBuf.length !== computedBuf.length || !timingSafeEqual(expectedBuf, computedBuf)) {
      return NextResponse.json(
        { success: false, error: 'Kode OTP yang Anda masukkan salah.' },
        { status: 400 }
      );
    }

    // Generate signed proof of email verification
    const verifiedSignature = createHmac('sha256', secret)
      .update(`VERIFIED:${cleanEmail}:${expiryStr}`)
      .digest('hex');

    const verifiedToken = `${expiryStr}.${verifiedSignature}`;

    return NextResponse.json({
      success: true,
      message: 'Email perusahaan Anda berhasil diverifikasi!',
      verified_token: verifiedToken,
    });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server saat verifikasi OTP.' },
      { status: 500 }
    );
  }
}
