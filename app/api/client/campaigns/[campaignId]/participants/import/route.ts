import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/neon';
import { requireCampaignAccess } from '@/lib/authGuards';
import {
  buildDefaultPassword,
  generateUsernames,
  syntheticParticipantEmail,
} from '@/lib/usernameGenerator';
import { loadRequiredTestsContext } from '@/lib/bundleCompletion';
import { quotaAfterInsert, quotaReservePlan, resolveParticipantLevelCode } from '@/lib/requiredTests';

export const runtime = 'nodejs';
export const maxDuration = 300;

const MAX_ROWS = 500;

interface ImportRow {
  full_name: string;
  position?: string;
  unit_work?: string;
  employee_id?: string;
}

function clean(value: unknown, max: number): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId: rawId } = await params;
    const campaignId = Number(rawId);
    const auth = await requireCampaignAccess(campaignId);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    const incoming: ImportRow[] = Array.isArray(body?.rows) ? body.rows : [];

    const rows = incoming
      .map((r) => ({
        full_name: clean(r.full_name, 255),
        position: clean(r.position, 255),
        unit_work: clean(r.unit_work, 255),
        employee_id: clean(r.employee_id, 50),
      }))
      .filter((r) => r.full_name.length > 0);

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada baris karyawan yang valid.' }, { status: 400 });
    }
    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        { success: false, error: `Maksimal ${MAX_ROWS} karyawan per impor. Pecah file Anda menjadi beberapa bagian.` },
        { status: 400 }
      );
    }

    const customerId = Number(auth.campaign.customer_id);
    const [tests, ctx] = await Promise.all([
      sql`SELECT ct.test_id, mt.code FROM campaign_tests ct JOIN master_tests mt ON mt.id = ct.test_id WHERE ct.campaign_id = ${campaignId}`,
      loadRequiredTestsContext(),
    ]);
    if (tests.length === 0) {
      return NextResponse.json({ success: false, error: 'Campaign belum memiliki tes.' }, { status: 400 });
    }
    const quotaCampaign = {
      campaign_mode: auth.campaign.campaign_mode,
      tests: tests.map((test) => ({ test_id: Number(test.test_id), code: String(test.code || '') })),
    };
    const people = rows.map((row) => ({
      position: row.position,
      job_level_code: resolveParticipantLevelCode({ position: row.position }, ctx.mappings),
    }));
    const reservePlan = quotaReservePlan(quotaCampaign, people, ctx);

    // Existing usernames that could clash with generated ones.
    const firstNames = Array.from(
      new Set(rows.map((r) => r.full_name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean))
    );
    const likePatterns = firstNames.map((f) => `${f}%`);
    const taken = await sql`SELECT username FROM participants WHERE username LIKE ANY(${likePatterns}::text[])`;
    const usernames = generateUsernames(
      rows.map((r) => r.full_name),
      taken.map((t) => String(t.username))
    );
    const passwords = rows.map((r) => buildDefaultPassword(r.full_name));

    // Reserve each test by the number of employees who will actually take it.
    // MSDT is only the leaders; STAF in a mandatory bundle is not charged.
    const reserved: typeof reservePlan = [];
    for (const slice of reservePlan) {
      const updated = await sql`
        UPDATE customer_test_quotas
        SET quota = quota - ${slice.amount}, updated_at = NOW()
        WHERE customer_id = ${customerId} AND test_id = ${slice.testId} AND quota >= ${slice.amount}
        RETURNING test_id
      `;
      if (updated.length === 0) {
        for (const done of reserved) {
          await sql`
            UPDATE customer_test_quotas SET quota = quota + ${done.amount}, updated_at = NOW()
            WHERE customer_id = ${customerId} AND test_id = ${done.testId}
          `;
        }
        return NextResponse.json(
          {
            success: false,
            error: `Kuota tes tidak mencukupi untuk mengimpor ${rows.length} karyawan. Hubungi admin untuk menambah kuota.`,
          },
          { status: 402 }
        );
      }
      reserved.push(slice);
    }

    let insertedCount = 0;
    let insertedPeople: { job_level_code: string }[] = [];
    try {
      const hashes: string[] = [];
      for (const pw of passwords) hashes.push(await bcrypt.hash(pw, 10));

      const level = people.map((person) => person.job_level_code || '');
      const inserted = await sql`
        INSERT INTO participants
          (campaign_id, access_token, full_name, email, registration_source, status, username,
           password_hash, default_password, employee_id, position, unit_work, job_level_code, scoring_status)
        SELECT ${campaignId}::int, t.access_token, t.full_name, t.email, 'HR_INVITE', 'RUNNING', t.username,
               t.password_hash, t.default_password, NULLIF(t.employee_id, ''), NULLIF(t.position, ''),
               NULLIF(t.unit_work, ''), t.job_level_code, 'PENDING'
        FROM unnest(
          ${rows.map(() => 'cand_' + crypto.randomBytes(8).toString('hex'))}::text[],
          ${rows.map((r) => r.full_name)}::text[],
          ${usernames.map(syntheticParticipantEmail)}::text[],
          ${usernames}::text[],
          ${hashes}::text[],
          ${passwords}::text[],
          ${rows.map((r) => r.employee_id)}::text[],
          ${rows.map((r) => r.position)}::text[],
          ${rows.map((r) => r.unit_work)}::text[],
          ${level}::text[]
        ) AS t(access_token, full_name, email, username, password_hash, default_password, employee_id,
               position, unit_work, job_level_code)
        ON CONFLICT (username) DO NOTHING
        RETURNING id, job_level_code
      `;
      insertedCount = inserted.length;
      insertedPeople = inserted.map((row) => ({ job_level_code: String(row.job_level_code || '') }));
    } catch (err) {
      for (const slice of reserved) {
        await sql`
          UPDATE customer_test_quotas SET quota = quota + ${slice.amount}, updated_at = NOW()
          WHERE customer_id = ${customerId} AND test_id = ${slice.testId}
        `;
      }
      throw err;
    }

    const settled = quotaAfterInsert(quotaCampaign, people, insertedPeople, ctx);
    for (const slice of settled) {
      if (slice.refund > 0) {
        await sql`
          UPDATE customer_test_quotas SET quota = quota + ${slice.refund}, updated_at = NOW()
          WHERE customer_id = ${customerId} AND test_id = ${slice.testId}
        `;
      }
    }
    const used = settled.filter((slice) => slice.used > 0);
    if (used.length > 0) {
      await sql`
        INSERT INTO quota_transactions (customer_id, test_id, quantity, type, description)
        SELECT ${customerId}::int, t.test_id, t.quantity, 'USAGE',
               ${`Impor karyawan ke campaign "${auth.campaign.title}"`}::text
        FROM unnest(${used.map((slice) => slice.testId)}::int[], ${used.map((slice) => -slice.used)}::int[])
          AS t(test_id, quantity)
      `;
    }

    const shortfall = rows.length - insertedCount;

    return NextResponse.json({
      success: true,
      imported: insertedCount,
      skipped: shortfall,
      message: `${insertedCount} karyawan berhasil diimpor.`,
    });
  } catch (err: any) {
    console.error('POST participants/import error:', err);
    return NextResponse.json(
      { success: false, error: 'Gagal mengimpor karyawan. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
