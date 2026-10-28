/**
 * Seeds the DT Peduli client: company, mandatory-bundle campaign, test quotas
 * (admin override, no purchase flow) and all employees with username/password.
 *
 * SAFETY: additive and idempotent. No DROP / DELETE / TRUNCATE. Safe to re-run.
 *   - customers / participants use ON CONFLICT DO NOTHING
 *   - quota + wallet grants are guarded by marker rows, so they are applied once
 *
 * Usage: npx tsx scripts/seed-dt-peduli.ts
 * Optional: DT_PEDULI_HR_EMAILS=a@x.org,b@x.org (extra HR Google accounts)
 * Optional: DT_PEDULI_HR_EMAIL=hr@example.org (Google account HR logs in with)
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { Client } from 'pg';
import { resolveJobLevel, type JabatanMapping } from '../lib/jobFit';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const HR_EMAIL = (process.env.DT_PEDULI_HR_EMAIL || 'hr@dtpeduli.org').trim().toLowerCase();
const COMPANY_NAME = 'DT Peduli';
const CAMPAIGN_TITLE = 'Asesmen Karyawan DT Peduli 2026';
const SPARE_SLOTS = 20;
const BUNDLE = ['wpt', 'disc', 'bigfive', 'papi', 'msdt'] as const;
const SEED_MARKER = 'DTP-SEED-2026';

interface SeedEmployee {
  name: string;
  position: string;
  unit_work: string;
  source: string;
  gender: string | null;
  education: string | null;
  employment_status: string | null;
  employee_id: string;
  username: string;
  password: string;
  email: string;
}

async function main() {
  const employees: SeedEmployee[] = JSON.parse(
    readFileSync(resolve(process.cwd(), 'db/seeds/dt_peduli_employees.json'), 'utf8')
  );
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    // Hash outside the transaction (CPU bound) - only for usernames that do not exist yet.
    const existing = await client.query(
      'SELECT username FROM participants WHERE username = ANY($1::text[])',
      [employees.map((e) => e.username)]
    );
    const existingUsernames = new Set(existing.rows.map((r: any) => r.username));
    const toInsert = employees.filter((e) => !existingUsernames.has(e.username));
    const hashes = new Map<string, string>();
    for (let i = 0; i < toInsert.length; i += 25) {
      const chunk = toInsert.slice(i, i + 25);
      const hashed = await Promise.all(chunk.map((e) => bcrypt.hash(e.password, 10)));
      chunk.forEach((e, idx) => hashes.set(e.username, hashed[idx]));
    }

    await client.query('BEGIN');

    // 1. Customer
    await client.query(
      `INSERT INTO customers (email, company_name, contact_name, role, status)
       VALUES ($1, $2, 'HR DT Peduli', 'CUSTOMER', 'ACTIVE')
       ON CONFLICT (email) DO NOTHING`,
      [HR_EMAIL, COMPANY_NAME]
    );
    const customer: any = (await client.query('SELECT id FROM customers WHERE email = $1', [HR_EMAIL])).rows[0];
    const customerId = Number(customer.id);

    // Additional HR logins (Google accounts). Idempotent; never removes anyone.
    const hrEmails = Array.from(
      new Set([HR_EMAIL, ...(process.env.DT_PEDULI_HR_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)])
    );
    for (const email of hrEmails) {
      await client.query(
        `INSERT INTO customer_members (customer_id, email, full_name, status)
         VALUES ($1, $2, $3, 'ACTIVE') ON CONFLICT DO NOTHING`,
        [customerId, email, 'HR DT Peduli']
      );
    }

    // 2. Campaign (mandatory bundle, HR pre-registered)
    let campaign: any = (
      await client.query('SELECT id FROM campaigns WHERE customer_id = $1 AND title = $2 LIMIT 1', [
        customerId,
        CAMPAIGN_TITLE,
      ])
    ).rows[0];
    if (!campaign) {
      campaign = (
        await client.query(
          `INSERT INTO campaigns (customer_id, title, description, access_token, registration_type, campaign_mode, is_active)
           VALUES ($1, $2, $3, $4, 'PRE_REGISTERED', 'MANDATORY_BUNDLE', TRUE)
           RETURNING id`,
          [
            customerId,
            CAMPAIGN_TITLE,
            'Asesmen wajib 5 tes (WPT, DISC, Big Five, PAPI, MSDT) untuk seluruh karyawan DT Peduli.',
            'cmp_' + crypto.randomBytes(8).toString('hex'),
          ]
        )
      ).rows[0];
    }
    const campaignId = Number(campaign.id);

    // 3. Bundle tests in fixed order
    const tests: any[] = (
      await client.query('SELECT id, code, price FROM master_tests WHERE code = ANY($1::text[])', [[...BUNDLE]])
    ).rows;
    if (tests.length !== BUNDLE.length) throw new Error('Master tests for the 5-test bundle are missing.');
    const testByCode = new Map<string, any>(tests.map((t) => [t.code as string, t]));

    for (let i = 0; i < BUNDLE.length; i++) {
      const testId = Number(testByCode.get(BUNDLE[i])!.id);
      await client.query(
        `INSERT INTO campaign_tests (campaign_id, test_id, order_number) VALUES ($1, $2, $3)
         ON CONFLICT (campaign_id, test_id) DO NOTHING`,
        [campaignId, testId, i + 1]
      );
      await client.query(
        `UPDATE campaign_tests SET order_number = $3
         WHERE campaign_id = $1 AND test_id = $2 AND COALESCE(order_number, 0) = 0`,
        [campaignId, testId, i + 1]
      );
    }

    // 4. Participants (batched, idempotent on username)
    const mappings = (
      await client.query(
        `SELECT jabatan_keyword, match_mode, level_code, priority FROM jabatan_mappings WHERE is_active`
      )
    ).rows as JabatanMapping[];

    let inserted = 0;
    for (let i = 0; i < toInsert.length; i += 100) {
      const chunk = toInsert.slice(i, i + 100);
      const result = await client.query(
        `INSERT INTO participants
           (campaign_id, access_token, full_name, email, registration_source, status,
            username, password_hash, default_password, employee_id, position, unit_work,
            education, employment_status, gender, job_level_code, scoring_status)
         SELECT $1, t.access_token, t.full_name, t.email, 'HR_INVITE', 'RUNNING',
                t.username, t.password_hash, t.default_password, t.employee_id, t.position, t.unit_work,
                NULLIF(t.education, ''), NULLIF(t.employment_status, ''), NULLIF(t.gender, ''),
                t.job_level_code, 'PENDING'
         FROM unnest($2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::text[],
                     $9::text[], $10::text[], $11::text[], $12::text[], $13::text[], $14::text[], $15::text[])
              AS t(access_token, full_name, email, username, password_hash, default_password, employee_id,
                   position, unit_work, education, employment_status, gender, job_level_code, _unused)
         ON CONFLICT (username) DO NOTHING`,
        [
          campaignId,
          chunk.map(() => 'cand_' + crypto.randomBytes(8).toString('hex')),
          chunk.map((e) => e.name),
          chunk.map((e) => e.email),
          chunk.map((e) => e.username),
          chunk.map((e) => hashes.get(e.username)!),
          chunk.map((e) => e.password),
          chunk.map((e) => e.employee_id),
          chunk.map((e) => e.position),
          chunk.map((e) => e.unit_work),
          chunk.map((e) => e.education || ''),
          chunk.map((e) => e.employment_status || ''),
          chunk.map((e) => (e.gender === 'L' ? 'Laki-laki' : e.gender === 'P' ? 'Perempuan' : '')),
          chunk.map((e) => resolveJobLevel(e.position, mappings)),
          chunk.map(() => ''),
        ]
      );
      inserted += result.rowCount || 0;
    }

    // 5. Quota grant (admin override) - applied once, guarded by marker rows.
    const grantPerTest = employees.length + SPARE_SLOTS;
    let walletCredit = 0;

    for (const code of BUNDLE) {
      const test = testByCode.get(code)!;
      const testId = Number(test.id);
      const grantRef = `${SEED_MARKER}:GRANT:${code}`;

      const granted = await client.query(
        'SELECT 1 FROM quota_transactions WHERE customer_id = $1 AND reference_id = $2 LIMIT 1',
        [customerId, grantRef]
      );
      if (granted.rowCount === 0) {
        await client.query(
          `INSERT INTO customer_test_quotas (customer_id, test_id, quota) VALUES ($1, $2, $3)
           ON CONFLICT (customer_id, test_id) DO UPDATE
             SET quota = customer_test_quotas.quota + EXCLUDED.quota, updated_at = NOW()`,
          [customerId, testId, grantPerTest]
        );
        await client.query(
          `INSERT INTO quota_transactions (customer_id, test_id, reference_id, quantity, type, description)
           VALUES ($1, $2, $3, $4, 'CREDIT', $5)`,
          [
            customerId,
            testId,
            grantRef,
            grantPerTest,
            `Kuota awal ${code.toUpperCase()} DT Peduli (${employees.length} karyawan + ${SPARE_SLOTS} cadangan) - Admin Override`,
          ]
        );
        walletCredit += Number(test.price) * grantPerTest;
      }
    }

    // Seeded participants consume one slot per test each (set-based, once per inserted batch).
    if (inserted > 0) {
      for (const code of BUNDLE) {
        const testId = Number(testByCode.get(code)!.id);
        await client.query(
          `UPDATE customer_test_quotas SET quota = quota - $3, updated_at = NOW()
           WHERE customer_id = $1 AND test_id = $2`,
          [customerId, testId, inserted]
        );
        await client.query(
          `INSERT INTO quota_transactions (customer_id, test_id, reference_id, quantity, type, description)
           VALUES ($1, $2, $3, $4, 'USAGE', $5)`,
          [
            customerId,
            testId,
            `${SEED_MARKER}:USAGE:${code}:${Date.now()}`,
            -inserted,
            `Penggunaan kuota ${code.toUpperCase()} untuk ${inserted} karyawan DT Peduli (Import Admin)`,
          ]
        );
      }
    }

    // Wallet ledger: credit and the matching quota purchase net to zero (no free spendable balance).
    if (walletCredit > 0) {
      const balance = Number(
        (await client.query('SELECT balance FROM customers WHERE id = $1 FOR UPDATE', [customerId])).rows[0].balance
      );
      await client.query(
        `INSERT INTO wallet_transactions (customer_id, type, amount, balance_before, balance_after, description)
         VALUES ($1, 'TOPUP', $2, $3, $4, $5)`,
        [customerId, walletCredit, balance, balance + walletCredit, `Saldo kuota awal DT Peduli - Admin Override [${SEED_MARKER}]`]
      );
      await client.query(
        `INSERT INTO wallet_transactions (customer_id, type, amount, balance_before, balance_after, description)
         VALUES ($1, 'PURCHASE_QUOTA', $2, $3, $4, $5)`,
        [customerId, -walletCredit, balance + walletCredit, balance, `Alokasi kuota 5 tes DT Peduli - Admin Override [${SEED_MARKER}]`]
      );
    }

    await client.query('COMMIT');

    const quotas = await client.query(
      `SELECT mt.code, ctq.quota FROM customer_test_quotas ctq JOIN master_tests mt ON mt.id = ctq.test_id
       WHERE ctq.customer_id = $1 ORDER BY mt.id`,
      [customerId]
    );
    console.log(
      JSON.stringify(
        { customerId, campaignId, employees: employees.length, insertedNow: inserted, quotas: quotas.rows },
        null,
        2
      )
    );
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
