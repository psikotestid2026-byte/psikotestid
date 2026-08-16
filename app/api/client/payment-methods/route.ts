import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/neon';

// GET: Fetch active payment methods & transfer instructions dynamically from DB (Unique Rows)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch DISTINCT active payment methods to prevent row duplication
    const paymentMethods = await sql`
      SELECT DISTINCT ON (pm.id)
        pm.id,
        pm.code,
        pm.name,
        pm.type,
        pm.provider,
        pm.admin_fee_flat,
        pm.is_active,
        pm.sort_order,
        pi.title as instruction_title,
        pi.content as instruction_content
      FROM payment_methods pm
      LEFT JOIN payment_instructions pi ON pi.payment_method_id = pm.id
      WHERE pm.is_active = true
      ORDER BY pm.id, pm.sort_order ASC
    `;

    return NextResponse.json({
      success: true,
      data: paymentMethods,
    });
  } catch (err) {
    console.error('Fetch Payment Methods Error:', err);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil metode pembayaran dinamis.' },
      { status: 500 }
    );
  }
}
