import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { put } from '@vercel/blob';
import { sql } from '@/lib/neon';
import { sendTelegramNotification } from '@/lib/telegram';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const orderIdStr = formData.get('order_id') as string | null;

    if (!file || !orderIdStr) {
      return NextResponse.json(
        { success: false, error: 'File gambar bukti transfer dan ID Order harus disertakan.' },
        { status: 400 }
      );
    }

    const orderId = parseInt(orderIdStr, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ success: false, error: 'ID Order tidak valid.' }, { status: 400 });
    }

    // Verify order belongs to current customer using RAW SQL
    const orderRows = await sql`
      SELECT 
        o.id,
        o.invoice_code,
        o.total_amount,
        c.company_name,
        c.email
      FROM test_orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ${orderId} AND c.email = ${session.user.email}
      LIMIT 1
    `;

    if (orderRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Order tidak ditemukan atau akses ditolak.' }, { status: 404 });
    }

    const order = orderRows[0];

    // Upload to Vercel Blob
    const ext = file.name.split('.').pop() || 'jpg';
    const blobFilename = `payment-proofs/${order.invoice_code}_${Date.now()}.${ext}`;

    const blob = await put(blobFilename, file, {
      access: 'public',
      contentType: file.type,
    });

    // Update proof_url in test_orders table using RAW SQL
    await sql`
      UPDATE test_orders
      SET proof_url = ${blob.url}
      WHERE id = ${orderId}
    `;

    // Trigger Telegram Notification with Photo Attachment
    const telegramMsg = `
<b>📸 BUKTI TRANSFER UNGGAH BARU! 📸</b>

• <b>Invoice:</b> <code>${order.invoice_code}</code>
• <b>Klien HR:</b> ${order.company_name} (${order.email})
• <b>Nominal Presisi:</b> <b>Rp ${Number(order.total_amount).toLocaleString('id-ID')}</b>
• <b>Bukti Foto:</b> <a href="${blob.url}">Lihat Gambar Bukti</a>

👉 <i>Silakan cek mutasi BCA & konfirmasi LUNAS di Superadmin Panel (/panel/orders)!</i>
    `.trim();

    sendTelegramNotification({
      message: telegramMsg,
      imageUrl: blob.url,
    }).catch((err) => console.error('Telegram Proof Alert Error:', err));

    return NextResponse.json({
      success: true,
      message: 'Bukti transfer berhasil diunggah dan notifikasi telah dikirimkan ke Superadmin!',
      proof_url: blob.url,
    });
  } catch (err) {
    console.error('Upload Payment Proof Error:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server saat mengunggah bukti transfer.' },
      { status: 500 }
    );
  }
}
