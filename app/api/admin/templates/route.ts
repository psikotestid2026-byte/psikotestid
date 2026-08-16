import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';

// GET: Fetch all notification & email templates using RAW SQL
export async function GET() {
  try {
    const templates = await sql`
      SELECT id, event_trigger, channel, message_content, is_active
      FROM notification_templates
      ORDER BY id ASC
    `;
    return NextResponse.json({ success: true, data: templates });
  } catch (err) {
    console.error('Fetch notification templates error:', err);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil template notifikasi.' },
      { status: 500 }
    );
  }
}

// POST: Add new notification template using RAW SQL
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event_trigger, channel, message_content, is_active } = body;

    if (!event_trigger || !channel || !message_content) {
      return NextResponse.json(
        { success: false, error: 'Lengkapi semua field template yang wajib.' },
        { status: 400 }
      );
    }

    const cleanTrigger = event_trigger.trim().toUpperCase();
    const cleanChannel = channel.trim().toUpperCase();
    const active = is_active !== false;

    const result = await sql`
      INSERT INTO notification_templates (event_trigger, channel, message_content, is_active)
      VALUES (${cleanTrigger}, ${cleanChannel}, ${message_content}, ${active})
      RETURNING id, event_trigger, channel, message_content, is_active
    `;

    return NextResponse.json({
      success: true,
      message: 'Template berhasil ditambahkan!',
      data: result[0],
    });
  } catch (err: any) {
    console.error('Create notification template error:', err);
    if (err.message && err.message.includes('unique')) {
      return NextResponse.json(
        { success: false, error: 'Event trigger ini sudah ada di database.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan template notifikasi.' },
      { status: 500 }
    );
  }
}

// PUT: Update notification template using RAW SQL
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, event_trigger, channel, message_content, is_active } = body;

    if (!id || !event_trigger || !channel || !message_content) {
      return NextResponse.json(
        { success: false, error: 'ID dan konten template harus diisi.' },
        { status: 400 }
      );
    }

    const active = is_active !== false;

    const updated = await sql`
      UPDATE notification_templates
      SET 
        event_trigger = ${event_trigger.trim().toUpperCase()},
        channel = ${channel.trim().toUpperCase()},
        message_content = ${message_content},
        is_active = ${active}
      WHERE id = ${id}
      RETURNING id, event_trigger, channel, message_content, is_active
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Template tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Template berhasil diperbarui!',
      data: updated[0],
    });
  } catch (err) {
    console.error('Update notification template error:', err);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui template notifikasi.' },
      { status: 500 }
    );
  }
}
