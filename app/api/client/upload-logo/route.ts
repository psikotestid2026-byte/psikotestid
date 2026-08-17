import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { put } from '@vercel/blob';
import { sql } from '@/lib/neon';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'File gambar logo perusahaan tidak ditemukan.' }, { status: 400 });
    }

    // Get customer ID from DB using RAW SQL
    const customerRows = await sql`
      SELECT id FROM customers WHERE LOWER(email) = ${session.user.email.toLowerCase()} LIMIT 1
    `;

    if (customerRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Akun pelanggan tidak ditemukan.' }, { status: 404 });
    }

    const customerId = customerRows[0].id;
    const ext = file.name.split('.').pop() || 'png';
    const blobFilename = `company-logos/logo_${customerId}_${Date.now()}.${ext}`;

    // Upload file directly to Vercel Blob Storage
    const blob = await put(blobFilename, file, {
      access: 'public',
      contentType: file.type,
    });

    return NextResponse.json({
      success: true,
      message: 'Logo perusahaan berhasil diunggah ke Vercel Blob Storage!',
      url: blob.url,
    });
  } catch (err: any) {
    console.error('Upload Logo Error:', err);
    return NextResponse.json(
      { success: false, error: 'Gagal mengunggah logo ke Vercel Blob: ' + (err.message || 'Terjadi kesalahan server.') },
      { status: 500 }
    );
  }
}
