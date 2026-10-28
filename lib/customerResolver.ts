import { sql } from '@/lib/neon';

export interface ResolvedCustomer {
  id: string;
  email: string;
  role: string;
  status: string;
  company_name: string | null;
  balance: string | null;
}

/**
 * Resolves the company (customer) for a logged-in HR email.
 * Active members of customer_members win; the legacy customers.email owner is the fallback.
 */
export async function resolveCustomerByEmail(rawEmail: string | null | undefined): Promise<ResolvedCustomer | null> {
  const email = rawEmail?.trim().toLowerCase();
  if (!email) return null;

  const viaMember = await sql`
    SELECT c.id, c.email, c.role, c.status, c.company_name, c.balance
    FROM customer_members m
    JOIN customers c ON c.id = m.customer_id
    WHERE LOWER(m.email) = ${email} AND m.status = 'ACTIVE'
    LIMIT 1
  `;
  if (viaMember.length > 0) return viaMember[0] as ResolvedCustomer;

  // A deactivated member must not regain access through the owner fallback.
  const inactive = await sql`SELECT 1 FROM customer_members WHERE LOWER(email) = ${email} AND status = 'INACTIVE' LIMIT 1`;
  if (inactive.length > 0) return null;

  const legacy = await sql`
    SELECT id, email, role, status, company_name, balance
    FROM customers WHERE LOWER(email) = ${email} LIMIT 1
  `;
  return (legacy[0] as ResolvedCustomer) ?? null;
}

export function isSameCompanyMember(memberEmails: string[], email: string): boolean {
  const target = email.toLowerCase();
  return memberEmails.some((e) => e.toLowerCase() === target);
}
