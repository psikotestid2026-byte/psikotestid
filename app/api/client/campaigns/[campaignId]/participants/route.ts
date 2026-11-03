import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/neon';
import { requireCampaignAccess } from '@/lib/authGuards';
import {
  buildDefaultPassword,
  generateUsernames,
} from '@/lib/usernameGenerator';
import { loadRequiredTestsContext } from '@/lib/bundleCompletion';
import { resolveParticipantLevelCode } from '@/lib/requiredTests';

export const runtime = 'nodejs';

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
    const fullName = clean(body?.full_name, 255);
    const position = clean(body?.position, 255);
    const unitWork = clean(body?.unit_work, 255);
    const employeeId = clean(body?.employee_id, 50);
    const emailInput = clean(body?.email, 255).toLowerCase();
    const phone = clean(body?.phone_number, 50);
    const jobLevelCodeInput = clean(body?.job_level_code, 50).toUpperCase();

    if (!fullName) {
      return NextResponse.json({ success: false, error: 'Nama lengkap kandidat wajib diisi.' }, { status: 400 });
    }

    const ctx = await loadRequiredTestsContext();
    const resolvedLevel = jobLevelCodeInput || resolveParticipantLevelCode({ position }, ctx.mappings) || 'STAF';

    // Generate username & default password
    const firstName = fullName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'peserta';
    const taken = await sql`SELECT username FROM participants WHERE username LIKE ${firstName + '%'}`;
    const [username] = generateUsernames([fullName], taken.map((t) => String(t.username)));
    const defaultPassword = buildDefaultPassword(fullName);
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const accessToken = 'cand_' + crypto.randomBytes(8).toString('hex');
    const finalEmail = emailInput || `${username}@peserta.dtpeduli.id`;

    const inserted = await sql`
      INSERT INTO participants (
        campaign_id,
        access_token,
        full_name,
        email,
        phone_number,
        username,
        default_password,
        password_hash,
        position,
        unit_work,
        employee_id,
        job_level_code,
        registration_source,
        status,
        scoring_status,
        reset_count
      ) VALUES (
        ${campaignId},
        ${accessToken},
        ${fullName},
        ${finalEmail},
        ${phone || null},
        ${username},
        ${defaultPassword},
        ${passwordHash},
        ${position || null},
        ${unitWork || null},
        ${employeeId || null},
        ${resolvedLevel},
        'HR_MANUAL',
        'RUNNING',
        'PENDING',
        0
      )
      RETURNING id, full_name, username, position, unit_work, job_level_code
    `;

    return NextResponse.json({ success: true, participant: inserted[0] });
  } catch (err: any) {
    console.error('POST participant manual error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Gagal menambahkan peserta.' }, { status: 500 });
  }
}

