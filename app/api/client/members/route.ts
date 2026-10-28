import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { requireSession } from '@/lib/authGuards';
import { resolveCustomerByEmail } from '@/lib/customerResolver';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Company HR members. Admins may pass customer_id; HR users only see their own company. */
async function resolveScope(customerIdParam: string | null) {
  const base = await requireSession();
  if (!base.ok) return { error: base.response };

  const admins = await sql`SELECT role, status FROM admins WHERE LOWER(email) = ${base.email} LIMIT 1`;
  const isAdmin =
    admins.length > 0 &&
    (admins[0].role === 'SUPERADMIN' || admins[0].role === 'ADMIN') &&
    String(admins[0].status || 'ACTIVE').toUpperCase() !== 'INACTIVE';

  if (isAdmin && customerIdParam) {
    const id = Number(customerIdParam);
    if (!Number.isInteger(id) || id <= 0) {
      return { error: NextResponse.json({ success: false, error: 'ID perusahaan tidak valid.' }, { status: 400 }) };
    }
    return { customerId: id, email: base.email, isAdmin };
  }

  const customer = await resolveCustomerByEmail(base.email);
  if (!customer) {
    return { error: NextResponse.json({ success: false, error: 'Akun perusahaan tidak ditemukan.' }, { status: 404 }) };
  }
  return { customerId: Number(customer.id), email: base.email, isAdmin };
}

export async function GET(req: Request) {
  try {
    const scope = await resolveScope(new URL(req.url).searchParams.get('customer_id'));
    if ('error' in scope) return scope.error;
    const members = await sql`
      SELECT id::text AS id, email, full_name, status, created_at
      FROM customer_members WHERE customer_id = ${scope.customerId}
      ORDER BY id
    `;
    return NextResponse.json({ success: true, members, current_email: scope.email });
  } catch (err) {
    console.error('GET client/members error:', err);
    return NextResponse.json({ success: false, error: 'Gagal memuat akun HR.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const scope = await resolveScope(new URL(req.url).searchParams.get('customer_id'));
    if ('error' in scope) return scope.error;

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const fullName = typeof body?.full_name === 'string' ? body.full_name.trim().slice(0, 255) : null;
    if (!EMAIL_RE.test(email) || email.length > 255) {
      return NextResponse.json({ success: false, error: 'Format email tidak valid.' }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO customer_members (customer_id, email, full_name, status)
      VALUES (${scope.customerId}, ${email}, ${fullName}, 'ACTIVE')
      ON CONFLICT DO NOTHING
      RETURNING id
    `;
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Email ini sudah terdaftar pada sebuah perusahaan.' }, { status: 409 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST client/members error:', err);
    return NextResponse.json({ success: false, error: 'Gagal menambah akun HR.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const scope = await resolveScope(new URL(req.url).searchParams.get('customer_id'));
    if ('error' in scope) return scope.error;

    const body = await req.json().catch(() => null);
    const id = Number(body?.id);
    const status = body?.status;
    if (!Number.isInteger(id) || id <= 0 || (status !== 'ACTIVE' && status !== 'INACTIVE')) {
      return NextResponse.json({ success: false, error: 'Data tidak valid.' }, { status: 400 });
    }

    const targets = await sql`SELECT id, LOWER(email) AS email FROM customer_members WHERE id = ${id} AND customer_id = ${scope.customerId} LIMIT 1`;
    if (targets.length === 0) {
      return NextResponse.json({ success: false, error: 'Akun HR tidak ditemukan.' }, { status: 404 });
    }

    if (status === 'INACTIVE') {
      const active = await sql`SELECT COUNT(*)::int AS total FROM customer_members WHERE customer_id = ${scope.customerId} AND status = 'ACTIVE' AND id <> ${id}`;
      if (active[0].total === 0) {
        return NextResponse.json({ success: false, error: 'Minimal satu akun HR harus tetap aktif.' }, { status: 409 });
      }
      if (!scope.isAdmin && targets[0].email === scope.email) {
        return NextResponse.json({ success: false, error: 'Anda tidak dapat menonaktifkan akun sendiri.' }, { status: 409 });
      }
    }

    await sql`UPDATE customer_members SET status = ${status} WHERE id = ${id} AND customer_id = ${scope.customerId}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH client/members error:', err);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui akun HR.' }, { status: 500 });
  }
}
