import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, participant_id, test_id, answers } = body;

    const participantId = Number(participant_id);
    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
    }

    if (action === 'mark_completed') {
      await sql`
        UPDATE participants 
        SET status = 'COMPLETED', completed_at = NOW() 
        WHERE id = ${participantId}
      `;

      // Asynchronously trigger HR Email notification
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

    // Default action: Submit individual test result
    const testId = Number(test_id);
    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }

    // Check participant existence
    const participantData = await sql`
      SELECT c.customer_id 
      FROM participants p
      JOIN campaigns c ON p.campaign_id = c.id
      WHERE p.id = ${participantId}
    `;
    if (!participantData.length) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Calculate scoring data if test is DISC or WPT
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
        // IST only scores the RA/ZR subtests (see lib/scoring/ist.ts header) — needs the
        // stored correctIndex per question, unlike the other tests which match answer text.
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
