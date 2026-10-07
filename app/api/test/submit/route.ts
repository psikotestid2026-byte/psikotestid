import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { requireSession } from '@/lib/authGuards';

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { action, participant_id, test_id, answers } = body;

    const participantId = Number(participant_id);
    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
    }

    // Authorize: participant themself, owning customer, or admin
    const accessRows = await sql`
      SELECT
        p.id,
        LOWER(p.email) AS participant_email,
        LOWER(cust.email) AS customer_email,
        p.status AS participant_status
      FROM participants p
      JOIN campaigns c ON p.campaign_id = c.id
      JOIN customers cust ON c.customer_id = cust.id
      WHERE p.id = ${participantId}
      LIMIT 1
    `;

    if (!accessRows.length) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    const access = accessRows[0];
    const admins = await sql`
      SELECT id, role FROM admins WHERE LOWER(email) = ${auth.email} LIMIT 1
    `;
    const isAdmin =
      admins.length > 0 &&
      (admins[0].role === 'SUPERADMIN' || admins[0].role === 'ADMIN');
    const isParticipant = access.participant_email === auth.email;
    const isOwnerCustomer = access.customer_email === auth.email;

    if (!isAdmin && !isParticipant && !isOwnerCustomer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only the participant (or admin) may submit answers / mark completed
    if (!isAdmin && !isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (action === 'mark_completed') {
      await sql`
        UPDATE participants 
        SET status = 'COMPLETED', completed_at = NOW() 
        WHERE id = ${participantId}
      `;

      try {
        const { sendParticipantCompletedEmailToHr } = await import('@/lib/email');
        sendParticipantCompletedEmailToHr(participantId).catch((err) => {
          console.error('Async HR Completed Email Trigger Error:', err);
        });
      } catch (err) {
        console.error('Failed to load email helper in API submit mark_completed:', err);
      }

      return NextResponse.json({ success: true, message: 'Participant marked as COMPLETED' });
    }

    const testId = Number(test_id);
    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }

    const participantData = await sql`
      SELECT c.customer_id 
      FROM participants p
      JOIN campaigns c ON p.campaign_id = c.id
      WHERE p.id = ${participantId}
    `;
    if (!participantData.length) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    const testInfo = await sql`SELECT code FROM master_tests WHERE id = ${testId}`;
    let scoringData: any = null;
    if (testInfo[0]) {
      const code = testInfo[0].code.toLowerCase();
      if (code === 'disc') {
        const { calculateDiscScore } = await import('@/lib/scoring/disc');
        scoringData = calculateDiscScore(answers || {});
      } else if (code === 'wpt') {
        const { calculateWptScore } = await import('@/lib/scoring/wpt');
        scoringData = calculateWptScore(answers || {});
      } else if (code === 'bigfive') {
        const { calculateBigFiveScore } = await import('@/lib/scoring/bigfive');
        scoringData = calculateBigFiveScore(answers || {});
      } else if (code === 'enneagram') {
        const { calculateEnneagramScore } = await import('@/lib/scoring/enneagram');
        scoringData = calculateEnneagramScore(answers || {});
      } else if (code === 'papi') {
        const { calculatePapiScore } = await import('@/lib/scoring/papi');
        scoringData = calculatePapiScore(answers || {});
      } else if (code === 'msdt') {
        const { calculateMsdtScore } = await import('@/lib/scoring/msdt');
        scoringData = calculateMsdtScore(answers || {});
      } else if (code === 'riasec') {
        const { calculateRiasecScore } = await import('@/lib/scoring/riasec');
        scoringData = calculateRiasecScore(answers || {});
      } else if (code === 'mbti') {
        const { calculateMbtiScore } = await import('@/lib/scoring/mbti');
        scoringData = calculateMbtiScore(answers || {});
      } else if (code === 'msai') {
        const { calculateMsaiScore } = await import('@/lib/scoring/msai');
        scoringData = calculateMsaiScore(answers || {});
      } else if (code === 'ist') {
        const { calculateIstScoreFromQuestions } = await import('@/lib/scoring/ist');
        const questions = await sql`
          SELECT order_number, question_data FROM question_banks WHERE test_id = ${testId}
        `;
        scoringData = calculateIstScoreFromQuestions(answers || {}, questions as any);
      }
    }

    const finalScoringData = scoringData || {
      completed: true,
      total_answers: Object.keys(answers || {}).length,
      submitted_at: new Date().toISOString()
    };

    await sql`
      INSERT INTO test_results (participant_id, test_id, raw_answers, scoring_data)
      VALUES (${participantId}, ${testId}, ${answers || {}}, ${JSON.stringify(finalScoringData)}::jsonb)
      ON CONFLICT (participant_id, test_id)
      DO UPDATE SET raw_answers = ${answers || {}}, scoring_data = ${JSON.stringify(finalScoringData)}::jsonb
    `;

    return NextResponse.json({
      success: true,
      message: 'Test result submitted successfully',
      scoring_data: finalScoringData,
    });
  } catch (err: any) {
    console.error('API /api/test/submit error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
