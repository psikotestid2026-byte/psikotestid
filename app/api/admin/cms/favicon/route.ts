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

    // Verify admin role using RAW SQL
    const adminRows = await sql`
      SELECT id, role FROM admins WHERE LOWER(email) = ${session.user.email.toLowerCase()} LIMIT 1
    `;

    if (adminRows.length === 0 || (adminRows[0].role !== 'SUPERADMIN' && adminRows[0].role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Akses Superadmin ditolak.' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'File gambar favicon tidak ditemukan.' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'ico';
    const blobFilename = `site-branding/favicon_${Date.now()}.${ext}`;

    // Upload favicon to Vercel Blob Storage
    const blob = await put(blobFilename, file, {
      access: 'public',
      contentType: file.type,
    });

    // Save or update site_favicon key in landing_page_contents DB table using RAW SQL
    await sql`
      INSERT INTO landing_page_contents (
        section_key,
        title,
        subtitle,
        content,
        is_active
      ) VALUES (
        'site_favicon',
        'Favicon Website Official',
        'Konfigurasi URL icon tab browser website official',
        ${JSON.stringify({ favicon_url: blob.url })},
        TRUE
      )
      ON CONFLICT (section_key) DO UPDATE
      SET content = EXCLUDED.content,
          updated_at = NOW()
    `;

    return NextResponse.json({
      success: true,
      message: 'Favicon official website berhasil diunggah ke Vercel Blob Storage dan disimpan!',
      favicon_url: blob.url,
    });
  } catch (err: any) {
    console.error('Upload Favicon Error:', err);
    return NextResponse.json(
      { success: false, error: 'Gagal mengunggah favicon: ' + (err.message || 'Terjadi kesalahan server.') },
      { status: 500 }
    );
  }
}
