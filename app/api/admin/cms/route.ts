import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';

// GET: Fetch all landing page CMS contents using RAW SQL
export async function GET() {
  try {
    const contents = await sql`
      SELECT id, section_key, title, subtitle, content, is_active, updated_at
      FROM landing_page_contents
      ORDER BY id ASC
    `;
    return NextResponse.json({ success: true, data: contents });
  } catch (err) {
    console.error('Fetch CMS contents error:', err);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil konten landing page.' },
      { status: 500 }
    );
  }
}

// PUT: Update landing page CMS content section using RAW SQL
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { section_key, title, subtitle, content, is_active } = body;

    if (!section_key || !title || !content) {
      return NextResponse.json(
        { success: false, error: 'Section key, title, dan content harus diisi.' },
        { status: 400 }
      );
    }

    const active = is_active !== false;
    const contentObj = typeof content === 'string' ? JSON.parse(content) : content;

    const updated = await sql`
      UPDATE landing_page_contents
      SET 
        title = ${title},
        subtitle = ${subtitle || null},
        content = ${JSON.stringify(contentObj)}::jsonb,
        is_active = ${active},
        updated_at = NOW()
      WHERE section_key = ${section_key}
      RETURNING id, section_key, title, subtitle, content, is_active, updated_at
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Section CMS tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Konten Landing Page berhasil diperbarui!',
      data: updated[0],
    });
  } catch (err) {
    console.error('Update CMS content error:', err);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui konten CMS.' },
      { status: 500 }
    );
  }
}
