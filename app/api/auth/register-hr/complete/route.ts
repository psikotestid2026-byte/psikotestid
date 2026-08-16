import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/neon';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      verified_token,
      company_name,
      contact_name,
      phone_number,
      password,
      brand_color,
      bot_honeypot,
    } = body;

    // Bot protection
    if (bot_honeypot && bot_honeypot.trim() !== '') {
      return NextResponse.json({
        success: true,
        message: 'Pendaftaran Akun Corporate Berhasil!',
      });
    }

    if (!email || !verified_token || !company_name || !contact_name || !phone_number) {
      return NextResponse.json(
        { success: false, error: 'Silakan lengkapi semua data pendaftaran yang diperlukan.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const parts = verified_token.split('.');

    if (parts.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'Token verifikasi email tidak valid.' },
        { status: 400 }
      );
    }

    const [expiryStr, expectedSignature] = parts;
    const secret = process.env.OTP_SECRET || 'psikotest_stateless_secret_fallback_key';

    const computedSignature = createHmac('sha256', secret)
      .update(`VERIFIED:${cleanEmail}:${expiryStr}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature);
    const computedBuf = Buffer.from(computedSignature);

    if (expectedBuf.length !== computedBuf.length || !timingSafeEqual(expectedBuf, computedBuf)) {
      return NextResponse.json(
        { success: false, error: 'Status verifikasi email tidak valid. Silakan verifikasi OTP kembali.' },
        { status: 400 }
      );
    }

    // Check if email already registered in customers table using RAW SQL
    const existing = await sql`
      SELECT id FROM customers WHERE LOWER(email) = ${cleanEmail} LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Email ini sudah terdaftar. Silakan login langsung menggunakan Google SSO.' },
        { status: 400 }
      );
    }

    // Hash password if provided, or default secure hash
    const rawPass = password && password.trim().length >= 6 ? password.trim() : Math.random().toString(36).slice(-10);
    const passwordHash = await bcrypt.hash(rawPass, 10);

    const safeBrandColor = brand_color && /^#[0-9A-F]{6}$/i.test(brand_color) ? brand_color : '#2563eb';

    // Insert customer using RAW SQL (Zero ORM)
    await sql`
      INSERT INTO customers (
        email,
        password_hash,
        company_name,
        contact_name,
        phone_number,
        balance,
        brand_color,
        role,
        status
      ) VALUES (
        ${cleanEmail},
        ${passwordHash},
        ${company_name.trim()},
        ${contact_name.trim()},
        ${phone_number.trim()},
        0.00,
        ${safeBrandColor},
        'CUSTOMER',
        'ACTIVE'
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran Akun Corporate Berhasil! Akun Anda telah aktif dan siap digunakan.',
    });
  } catch (err) {
    console.error('Complete HR Registration Error:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server saat mendaftarkan akun.' },
      { status: 500 }
    );
  }
}
