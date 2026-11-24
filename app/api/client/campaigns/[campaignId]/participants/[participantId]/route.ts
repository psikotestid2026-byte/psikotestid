import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { requireCampaignAccess } from '@/lib/authGuards';
import { loadRequiredTestsContext } from '@/lib/bundleCompletion';
import { resolveParticipantLevelCode } from '@/lib/requiredTests';

export const runtime = 'nodejs';

function clean(value: unknown, max: number): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ campaignId: string; participantId: string }> }
) {
  try {
    const { campaignId: rawCid, participantId: rawPid } = await params;
    const campaignId = Number(rawCid);
    const participantId = Number(rawPid);

    if (!participantId) {
      return NextResponse.json({ success: false, error: 'ID Peserta tidak valid.' }, { status: 400 });
    }

    const auth = await requireCampaignAccess(campaignId);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    const fullName = clean(body?.full_name, 255);
    const position = clean(body?.position, 255);
    const unitWork = clean(body?.unit_work, 255);
    const employeeId = clean(body?.employee_id, 50);
    const email = clean(body?.email, 255).toLowerCase();
    const phone = clean(body?.phone_number, 50);
    const jobLevelCodeInput = clean(body?.job_level_code, 50).toUpperCase();

    if (!fullName) {
      return NextResponse.json({ success: false, error: 'Nama lengkap kandidat wajib diisi.' }, { status: 400 });
    }

    const ctx = await loadRequiredTestsContext();
    const resolvedLevel = jobLevelCodeInput || resolveParticipantLevelCode({ position }, ctx.mappings) || 'STAF';

    const updated = await sql`
      UPDATE participants
      SET
        full_name = ${fullName},
        position = ${position || null},
        unit_work = ${unitWork || null},
        employee_id = ${employeeId || null},
        email = COALESCE(NULLIF(${email}, ''), email),
        phone_number = ${phone || null},
        job_level_code = ${resolvedLevel}
      WHERE id = ${participantId} AND campaign_id = ${campaignId}
      RETURNING id, full_name, username, position, unit_work, job_level_code, email, phone_number
    `;

    if (updated.length === 0) {
      return NextResponse.json({ success: false, error: 'Peserta tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, participant: updated[0] });
  } catch (err: any) {
    console.error('PUT participant error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Gagal mengubah data peserta.' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ campaignId: string; participantId: string }> }
) {
  try {
    const { campaignId: rawCid, participantId: rawPid } = await params;
    const campaignId = Number(rawCid);
    const participantId = Number(rawPid);

    if (!participantId) {
      return NextResponse.json({ success: false, error: 'ID Peserta tidak valid.' }, { status: 400 });
    }

    const auth = await requireCampaignAccess(campaignId);
    if (!auth.ok) return auth.response;

    // Check participant exists in campaign
    const existing = await sql`
      SELECT id, full_name FROM participants WHERE id = ${participantId} AND campaign_id = ${campaignId} LIMIT 1
    `;
    if (existing.length === 0) {
      return NextResponse.json({ success: false, error: 'Peserta tidak ditemukan.' }, { status: 404 });
    }

    // Atomic cascade delete
    await sql.transaction([
      sql`DELETE FROM test_results WHERE participant_id = ${participantId}`,
      sql`DELETE FROM participant_result_archives WHERE participant_id = ${participantId}`,
      sql`DELETE FROM quota_transactions WHERE participant_id = ${participantId}`,
      sql`DELETE FROM participants WHERE id = ${participantId} AND campaign_id = ${campaignId}`,
    ]);

    return NextResponse.json({ success: true, message: `Peserta ${existing[0].full_name} berhasil dihapus.` });
  } catch (err: any) {
    console.error('DELETE participant error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Gagal menghapus peserta.' }, { status: 500 });
  }
}

