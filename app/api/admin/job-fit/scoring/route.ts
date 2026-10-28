import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { requireAdmin } from '@/lib/authGuards';
import { invalidateScoringConfigCache, scoreParticipant } from '@/lib/participantScoring';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_BATCH = 400;
const CONCURRENCY = 10;

/**
 * Re-runs scoring. Body: { participant_id } or { campaign_id, scope: 'FAILED' | 'ALL' }.
 * Only COMPLETED participants are rescored; assessor overrides are preserved.
 */
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    let ids: number[] = [];

    if (body?.participant_id != null) {
      const id = Number(body.participant_id);
      if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ success: false, error: 'ID peserta tidak valid.' }, { status: 400 });
      }
      ids = [id];
    } else if (body?.campaign_id != null) {
      const campaignId = Number(body.campaign_id);
      if (!Number.isInteger(campaignId) || campaignId <= 0) {
        return NextResponse.json({ success: false, error: 'ID kampanye tidak valid.' }, { status: 400 });
      }
      const onlyFailed = body.scope !== 'ALL';
      const rows = await sql`
        SELECT id FROM participants
        WHERE campaign_id = ${campaignId} AND status = 'COMPLETED'
          AND (${!onlyFailed} OR scoring_status IN ('FAILED', 'PROCESSING', 'PENDING'))
        ORDER BY id
        LIMIT ${MAX_BATCH}
      `;
      ids = rows.map((r: any) => Number(r.id));
    } else {
      return NextResponse.json({ success: false, error: 'Peserta atau kampanye wajib diisi.' }, { status: 400 });
    }

    invalidateScoringConfigCache();
    let ok = 0;
    const errors: Array<{ participant_id: number; error: string }> = [];

    for (let i = 0; i < ids.length; i += CONCURRENCY) {
      const chunk = ids.slice(i, i + CONCURRENCY);
      await Promise.all(
        chunk.map(async (id) => {
          try {
            const outcome = await scoreParticipant(id);
            if (outcome.ok) ok += 1;
            else errors.push({ participant_id: id, error: outcome.error });
          } catch (e: any) {
            errors.push({ participant_id: id, error: e?.message || 'Gagal menghitung skor.' });
          }
        })
      );
    }

    return NextResponse.json({ success: true, processed: ids.length, succeeded: ok, failed: errors.length, errors: errors.slice(0, 20) });
  } catch (err) {
    console.error('POST admin/job-fit/scoring error:', err);
    return NextResponse.json({ success: false, error: 'Gagal menjalankan ulang penilaian.' }, { status: 500 });
  }
}
