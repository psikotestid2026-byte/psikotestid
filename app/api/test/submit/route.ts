import { NextResponse, after } from 'next/server';
import { sql } from '@/lib/neon';
import { requireSession } from '@/lib/authGuards';
import { authorizeAssessmentSubmit } from '@/lib/assessmentSession';
import { getAssessmentSecret, verifyAssessmentToken } from '@/lib/assessmentToken';
import { runScoringWithFallback } from '@/lib/participantScoring';
import { getBundleCompletion, loadRequiredTestsContext } from '@/lib/bundleCompletion';
import { getRequiredTestsForParticipant } from '@/lib/requiredTests';

export const runtime = 'nodejs';
export const maxDuration = 30;

// master_tests.code by id rarely changes; cache it per instance to save a query per submit.
const testCodeCache = new Map<number, { code: string; expires: number }>();
const TEST_CODE_TTL_MS = 5 * 60_000;

async function getTestCode(testId: number): Promise<string | null> {
  const cached = testCodeCache.get(testId);
  if (cached && cached.expires > Date.now()) return cached.code;
  const rows = await sql`SELECT code FROM master_tests WHERE id = ${testId}`;
  const code = rows[0]?.code ? String(rows[0].code).toLowerCase() : null;
  if (code) testCodeCache.set(testId, { code, expires: Date.now() + TEST_CODE_TTL_MS });
  return code;
}

async function calculateScoring(code: string, testId: number, answers: any): Promise<any> {
  const input = answers || {};
  switch (code) {
    case 'disc':
      return (await import('@/lib/scoring/disc')).calculateDiscScore(input);
    case 'wpt':
      return (await import('@/lib/scoring/wpt')).calculateWptScore(input);
    case 'bigfive':
      return (await import('@/lib/scoring/bigfive')).calculateBigFiveScore(input);
    case 'enneagram':
      return (await import('@/lib/scoring/enneagram')).calculateEnneagramScore(input);
    case 'papi':
      return (await import('@/lib/scoring/papi')).calculatePapiScore(input);
    case 'msdt':
      return (await import('@/lib/scoring/msdt')).calculateMsdtScore(input);
    case 'riasec':
      return (await import('@/lib/scoring/riasec')).calculateRiasecScore(input);
    case 'mbti':
      return (await import('@/lib/scoring/mbti')).calculateMbtiScore(input);
    case 'msai':
      return (await import('@/lib/scoring/msai')).calculateMsaiScore(input);
    case 'ist': {
      const { calculateIstScoreFromQuestions } = await import('@/lib/scoring/ist');
      const questions = await sql`
        SELECT order_number, question_data FROM question_banks WHERE test_id = ${testId}
      `;
      return calculateIstScoreFromQuestions(input, questions as any);
    }
    default:
      return null;
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    const body = await req.json();
    const { action, participant_id, test_id, answers, assessment_token } = body;
    const presentedToken = typeof assessment_token === 'string' && assessment_token.length > 0;

    const participantId = Number(participant_id);
    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
    }

    const testId = Number(test_id);
    if (action !== 'mark_completed' && !testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }

    // Participant row + (for answer submits) the test code are independent: fetch in parallel.
    const [accessRows, testCode] = await Promise.all([
      sql`
        SELECT
          p.id,
          p.status AS participant_status,
          p.campaign_id,
          p.position,
          p.job_level_code,
          LOWER(p.email) AS participant_email,
          LOWER(cust.email) AS customer_email,
          c.campaign_mode
        FROM participants p
        JOIN campaigns c ON p.campaign_id = c.id
        JOIN customers cust ON c.customer_id = cust.id
        WHERE p.id = ${participantId}
        LIMIT 1
      `,
      action === 'mark_completed' ? Promise.resolve(null) : getTestCode(testId),
    ]);

    if (!accessRows.length) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    const access = accessRows[0];
    let verifiedToken = null;
    if (presentedToken) {
      try {
        verifiedToken = verifyAssessmentToken(assessment_token, getAssessmentSecret());
      } catch {
        verifiedToken = null;
      }
    }

    let isAdmin = false;
    const cookieEmail = auth.ok ? auth.email : '';
    if (!presentedToken && cookieEmail && cookieEmail !== String(access.participant_email || '')) {
      const admins = await sql`
        SELECT id, role FROM admins WHERE LOWER(email) = ${cookieEmail} LIMIT 1
      `;
      isAdmin = admins.length > 0 && (admins[0].role === 'SUPERADMIN' || admins[0].role === 'ADMIN');
    }

    // The tab token wins over the shared browser cookie. A mismatched token is
    // rejected even when the cookie belongs to the participant id in the body.
    const allowed = authorizeAssessmentSubmit({
      verifiedToken,
      presentedToken,
      cookieEmail: auth.ok ? auth.email : null,
      isAdmin,
      participantId,
      participantEmail: String(access.participant_email || ''),
      campaignId: Number(access.campaign_id),
    });
    if (!allowed.ok) {
      return NextResponse.json(
        { error: allowed.error === 'Forbidden' ? 'Forbidden' : allowed.error, code: allowed.code },
        { status: allowed.status }
      );
    }

    const isBundle = access.campaign_mode === 'MANDATORY_BUNDLE';

    if (action === 'mark_completed') {
      if (isBundle) {
        const completion = await getBundleCompletion(participantId);
        if (!completion.isComplete) {
          const missingRows = completion.missing_test_ids.length
            ? await sql`
                SELECT code FROM master_tests
                WHERE id = ANY(${completion.missing_test_ids}::int[])
              `
            : [];
          const missingCodes = missingRows.map((row: any) => String(row.code));
          return NextResponse.json(
            {
              error: `Selesaikan semua tes terlebih dahulu. Belum selesai: ${missingCodes
                .map((code) => code.toUpperCase())
                .join(', ')}.`,
              missing_tests: missingCodes,
            },
            { status: 409 }
          );
        }
      }

      // Idempotent: a repeated call never restarts scoring that already finished.
      const updated = await sql`
        UPDATE participants
        SET status = 'COMPLETED',
            completed_at = COALESCE(completed_at, NOW()),
            scoring_status = CASE WHEN scoring_status = 'DONE' THEN 'DONE' ELSE 'PROCESSING' END
        WHERE id = ${participantId}
        RETURNING scoring_status
      `;

      const needsScoring = isBundle && updated[0]?.scoring_status === 'PROCESSING';

      // Respond now; scoring + HR email continue in the background (parallel across participants).
      after(async () => {
        if (needsScoring) await runScoringWithFallback(participantId);
        // Bundle campaigns (hundreds of employees) are reviewed in the results table instead of
        // one email + PDF per participant.
        if (isBundle) return;
        try {
          const { sendParticipantCompletedEmailToHr } = await import('@/lib/email');
          await sendParticipantCompletedEmailToHr(participantId);
        } catch (err) {
          console.error('Async HR Completed Email Trigger Error:', err);
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Participant marked as COMPLETED',
        scoring_status: needsScoring ? 'PROCESSING' : updated[0]?.scoring_status || null,
      });
    }

    if (isBundle && access.participant_status === 'COMPLETED' && !isAdmin) {
      return NextResponse.json({ error: 'Sesi asesmen sudah selesai dan tidak dapat diubah.' }, { status: 409 });
    }

    if (isBundle) {
      const member = await sql`
        SELECT LOWER(mt.code) AS code
        FROM campaign_tests ct
        JOIN master_tests mt ON mt.id = ct.test_id
        JOIN participants p ON p.campaign_id = ct.campaign_id
        WHERE p.id = ${participantId} AND ct.test_id = ${testId}
        LIMIT 1
      `;
      if (member.length === 0) {
        return NextResponse.json({ error: 'Tes ini bukan bagian dari asesmen Anda.' }, { status: 400 });
      }
      if (String(member[0].code) === 'msdt') {
        const context = await loadRequiredTestsContext();
        const required = getRequiredTestsForParticipant(access, [{ code: 'msdt' }], context);
        if (required.length === 0) {
          return NextResponse.json({
            success: true,
            skipped: true,
            message: 'Tes ini tidak diperlukan untuk level jabatan Anda.',
          });
        }
      }
    }

    const scoringData = testCode ? await calculateScoring(testCode, testId, answers) : null;
    const finalScoringData = scoringData || {
      completed: true,
      total_answers: Object.keys(answers || {}).length,
      submitted_at: new Date().toISOString(),
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
    return NextResponse.json({ error: 'Terjadi kesalahan pada server. Silakan coba lagi.' }, { status: 500 });
  }
}
