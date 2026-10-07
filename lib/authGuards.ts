import { getServerSession, Session } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/neon';
import { NextResponse } from 'next/server';

export type AuthFailure = { ok: false; response: NextResponse };
export type SessionOk = { ok: true; session: Session; email: string };

export async function requireSession(): Promise<SessionOk | AuthFailure> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!session || !email) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { ok: true, session, email };
}

export async function requireAdmin() {
  const base = await requireSession();
  if (!base.ok) return base;

  const admins = await sql`
    SELECT id, role, status FROM admins
    WHERE LOWER(email) = ${base.email}
    LIMIT 1
  `;

  const admin = admins[0];
  if (
    !admin ||
    (admin.role !== 'SUPERADMIN' && admin.role !== 'ADMIN') ||
    (admin.status && String(admin.status).toUpperCase() === 'INACTIVE')
  ) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, error: 'Akses admin ditolak.' }, { status: 403 }),
    };
  }

  return { ...base, admin };
}

export async function requireCustomer() {
  const base = await requireSession();
  if (!base.ok) return base;

  const customers = await sql`
    SELECT id, email, role, status, company_name, balance
    FROM customers
    WHERE LOWER(email) = ${base.email}
    LIMIT 1
  `;

  if (customers.length === 0) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, error: 'Akun pelanggan tidak ditemukan.' }, { status: 404 }),
    };
  }

  return { ...base, customer: customers[0] };
}

/** Admin, owning customer, or the participant themself may access a participant's data. */
export async function requireParticipantAccess(participantId: number) {
  const base = await requireSession();
  if (!base.ok) return base;

  const rows = await sql`
    SELECT
      p.id AS participant_id,
      LOWER(p.email) AS participant_email,
      c.customer_id,
      cust.email AS customer_email
    FROM participants p
    JOIN campaigns c ON p.campaign_id = c.id
    JOIN customers cust ON c.customer_id = cust.id
    WHERE p.id = ${participantId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, error: 'Participant not found' }, { status: 404 }),
    };
  }

  const row = rows[0];

  const admins = await sql`
    SELECT id, role FROM admins WHERE LOWER(email) = ${base.email} LIMIT 1
  `;
  const isAdmin =
    admins.length > 0 &&
    (admins[0].role === 'SUPERADMIN' || admins[0].role === 'ADMIN');

  const isOwnerCustomer = String(row.customer_email || '').toLowerCase() === base.email;
  const isParticipant = String(row.participant_email || '') === base.email;

  if (!isAdmin && !isOwnerCustomer && !isParticipant) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { ...base, participant: row, isAdmin, isOwnerCustomer, isParticipant };
}

export { validateImageUpload, safeImageExtension } from '@/lib/uploadValidation';
export { getOtpSecret } from '@/lib/otpSecret';

/** For Server Actions: throw if caller is not an admin. */
export async function assertAdmin() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    throw new Error('Unauthorized: admin access required');
  }
  return auth;
}

/** For Server Actions: throw if caller is not a customer; returns customer row. */
export async function assertCustomer() {
  const auth = await requireCustomer();
  if (!auth.ok) {
    throw new Error('Unauthorized: customer access required');
  }
  return auth;
}
