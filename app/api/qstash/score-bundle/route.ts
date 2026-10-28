import { NextResponse } from 'next/server';
import { verifyQstashRequest } from '@/lib/qstashFallback';
import { scoreParticipant } from '@/lib/participantScoring';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** Fallback scoring job delivered by QStash (signature verified). */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    if (!(await verifyQstashRequest(req, rawBody))) {
      return NextResponse.json({ success: false, error: 'Signature tidak valid.' }, { status: 401 });
    }

    const participantId = Number(JSON.parse(rawBody || '{}')?.participant_id);
    if (!Number.isInteger(participantId) || participantId <= 0) {
      return NextResponse.json({ success: false, error: 'participant_id tidak valid.' }, { status: 400 });
    }

    const outcome = await scoreParticipant(participantId);
    if (!outcome.ok) {
      // Non-2xx makes QStash retry according to the publish settings.
      return NextResponse.json({ success: false, error: outcome.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, status: outcome.status, composite: outcome.composite });
  } catch (err) {
    console.error('POST /api/qstash/score-bundle error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
