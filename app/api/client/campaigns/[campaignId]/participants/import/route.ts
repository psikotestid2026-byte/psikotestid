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
import { resolveJobLevel, type JabatanMapping } from '@/lib/jobFit';

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
    const [tests, mappings] = await Promise.all([
      sql`SELECT ct.test_id, mt.code FROM campaign_tests ct JOIN master_tests mt ON mt.id = ct.test_id WHERE ct.campaign_id = ${campaignId}`,
      sql`SELECT jabatan_keyword, match_mode, level_code, priority FROM jabatan_mappings WHERE is_active`,
    ]);
    if (tests.length === 0) {
      return NextResponse.json({ success: false, error: 'Campaign belum memiliki tes.' }, { status: 400 });
    }
    const testIds = tests.map((t) => Number(t.test_id));

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

    // Reserve quota atomically (one statement); compensate if any test was short.
    const needed = rows.length;
    const reserved = await sql`
      UPDATE customer_test_quotas
      SET quota = quota - ${needed}, updated_at = NOW()
      WHERE customer_id = ${customerId} AND test_id = ANY(${testIds}::int[]) AND quota >= ${needed}
      RETURNING test_id
    `;
    if (reserved.length !== testIds.length) {
      const reservedIds = reserved.map((r) => Number(r.test_id));
      if (reservedIds.length > 0) {
        await sql`
          UPDATE customer_test_quotas SET quota = quota + ${needed}, updated_at = NOW()
          WHERE customer_id = ${customerId} AND test_id = ANY(${reservedIds}::int[])
        `;
      }
      return NextResponse.json(
        {
          success: false,
          error: `Kuota tes tidak mencukupi untuk mengimpor ${needed} karyawan. Hubungi admin untuk menambah kuota.`,
        },
        { status: 402 }
      );
    }

    let insertedCount = 0;
    try {
      const hashes: string[] = [];
      for (const pw of passwords) hashes.push(await bcrypt.hash(pw, 10));

      const level = rows.map((r) => resolveJobLevel(r.position, mappings as unknown as JabatanMapping[]));
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
        RETURNING id
      `;
      insertedCount = inserted.length;
    } catch (err) {
      // Give the quota back before surfacing the error.
      await sql`
        UPDATE customer_test_quotas SET quota = quota + ${needed}, updated_at = NOW()
        WHERE customer_id = ${customerId} AND test_id = ANY(${testIds}::int[])
      `;
      throw err;
    }

    const shortfall = needed - insertedCount;
    if (shortfall > 0) {
      await sql`
        UPDATE customer_test_quotas SET quota = quota + ${shortfall}, updated_at = NOW()
        WHERE customer_id = ${customerId} AND test_id = ANY(${testIds}::int[])
      `;
    }

    if (insertedCount > 0) {
      await sql`
        INSERT INTO quota_transactions (customer_id, test_id, quantity, type, description)
        SELECT ${customerId}::int, t.test_id, ${-insertedCount}::int, 'USAGE',
               ${`Impor ${insertedCount} karyawan ke campaign "${auth.campaign.title}"`}::text
        FROM unnest(${testIds}::int[]) AS t(test_id)
      `;
    }

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
