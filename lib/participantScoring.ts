import { getBundleCompletion, INCOMPLETE_RESULT_MESSAGE } from '@/lib/bundleCompletion';
import { sql } from '@/lib/neon';
import {
  BUNDLE_TEST_CODES,
  FALLBACK_LEVEL_PROFILE,
  computeJobFit,
  buildFitDetails,
  levelProfileFromRow,
  type JabatanMapping,
  type LevelProfile,
} from '@/lib/jobFit';
import { resolveParticipantLevelCode } from '@/lib/requiredTests';

/**
 * Composite scoring for the mandatory 5-test bundle.
 *
 * Primary path: runs in the background right after the participant submits the last test
 * (via `after()` in the submit route) so the HTTP response is never blocked.
 * Fallback path: QStash re-delivers `/api/qstash/score-bundle` if the primary path failed.
 */

const CONFIG_TTL_MS = 60_000;

interface ScoringConfig {
  profiles: Map<string, LevelProfile>;
  mappings: JabatanMapping[];
}

let configCache: { value: ScoringConfig; expires: number } | null = null;
let configInflight: Promise<ScoringConfig> | null = null;

async function fetchScoringConfig(): Promise<ScoringConfig> {
  const [profileRows, mappingRows] = await Promise.all([
    sql`SELECT * FROM jabatan_level_profiles WHERE is_active`,
    sql`SELECT jabatan_keyword, match_mode, level_code, priority FROM jabatan_mappings WHERE is_active`,
  ]);
  const profiles = new Map<string, LevelProfile>();
  for (const row of profileRows) {
    const profile = levelProfileFromRow(row);
    profiles.set(profile.level_code, profile);
  }
  return { profiles, mappings: mappingRows as unknown as JabatanMapping[] };
}

/** Profiles/mappings change rarely: cached per instance and shared by concurrent requests. */
export async function loadScoringConfig(forceFresh = false): Promise<ScoringConfig> {
  if (!forceFresh && configCache && configCache.expires > Date.now()) return configCache.value;
  if (!forceFresh && configInflight) return configInflight;

  configInflight = fetchScoringConfig()
    .then((value) => {
      configCache = { value, expires: Date.now() + CONFIG_TTL_MS };
      return value;
    })
    .finally(() => {
      configInflight = null;
    });
  return configInflight;
}

export function invalidateScoringConfigCache() {
  configCache = null;
}

async function recomputeFromRaw(code: string, raw: unknown): Promise<unknown | null> {
  if (!raw || typeof raw !== 'object') return null;
  const answers = raw as Record<string, any>;
  switch (code) {
    case 'wpt':
      return (await import('@/lib/scoring/wpt')).calculateWptScore(answers);
    case 'disc':
      return (await import('@/lib/scoring/disc')).calculateDiscScore(answers);
    case 'bigfive':
      return (await import('@/lib/scoring/bigfive')).calculateBigFiveScore(answers as Record<string, string>);
    case 'papi':
      return (await import('@/lib/scoring/papi')).calculatePapiScore(answers);
    case 'msdt':
      return (await import('@/lib/scoring/msdt')).calculateMsdtScore(answers);
    default:
      return null;
  }
}

export type ScoreOutcome =
  | { ok: true; status: string; composite: number; level_code: string }
  | { ok: false; error: string; incomplete?: boolean };

/** Computes and stores composite score + recommendation for one participant. Safe to call repeatedly. */
export async function scoreParticipant(participantId: number): Promise<ScoreOutcome> {
  const [participants, results, config] = await Promise.all([
    sql`SELECT id, position, job_level_code, status, assessor_override FROM participants WHERE id = ${participantId} LIMIT 1`,
    sql`
      SELECT LOWER(mt.code) AS code, tr.scoring_data, tr.raw_answers
      FROM test_results tr
      JOIN master_tests mt ON mt.id = tr.test_id
      WHERE tr.participant_id = ${participantId} AND LOWER(mt.code) = ANY(${[...BUNDLE_TEST_CODES]}::text[])
    `,
    loadScoringConfig(),
  ]);

  const participant = participants[0];
  if (!participant) return { ok: false, error: 'Peserta tidak ditemukan.' };

  // Hard rule: no result unless the participant finished every test of the bundle.
  const completion = await getBundleCompletion(participantId);
  if (participant.status !== 'COMPLETED' || !completion.isComplete) {
    await sql`
      UPDATE participants SET scoring_status = 'PENDING', scoring_error = NULL
      WHERE id = ${participantId} AND scoring_status IN ('PROCESSING', 'FAILED')
    `;
    return { ok: false, error: INCOMPLETE_RESULT_MESSAGE, incomplete: true };
  }

  const levelCode = resolveParticipantLevelCode(participant, config.mappings);
  const profile = config.profiles.get(levelCode) || config.profiles.get(FALLBACK_LEVEL_PROFILE.level_code) || FALLBACK_LEVEL_PROFILE;

  // Use stored scoring_data; recompute from raw answers only if it is missing/incomplete.
  const scoringByCode: Record<string, unknown> = {};
  await Promise.all(
    results.map(async (row) => {
      let scoring: unknown = row.scoring_data;
      const probe = computeJobFit({ [row.code]: scoring }, profile);
      const isMissingThisCode = !probe.ok && probe.missing.includes(row.code as any);
      if (!scoring || isMissingThisCode) {
        scoring = (await recomputeFromRaw(row.code, row.raw_answers)) ?? scoring;
      }
      scoringByCode[row.code] = scoring;
    })
  );

  const fit = computeJobFit(scoringByCode, profile);
  if (!fit.ok) {
    const error = `Skor belum lengkap untuk: ${fit.missing.map((c) => c.toUpperCase()).join(', ')}`;
    await sql`
      UPDATE participants SET scoring_status = 'FAILED', scoring_error = ${error} WHERE id = ${participantId}
    `;
    return { ok: false, error };
  }

  await sql`
    UPDATE participants
    SET scoring_status = 'DONE',
        scoring_error = NULL,
        scored_at = NOW(),
        job_level_code = ${profile.level_code},
        recommendation_score = ${fit.composite},
        system_recommendation_status = ${fit.status},
        recommendation_status = CASE WHEN assessor_override THEN recommendation_status ELSE ${fit.status} END,
        score_breakdown = ${JSON.stringify({ ...fit.breakdown, fit_details: buildFitDetails(scoringByCode, profile) })}::jsonb
    WHERE id = ${participantId}
  `;

  return { ok: true, status: fit.status, composite: fit.composite, level_code: profile.level_code };
}

/**
 * Background entry point. Never throws: on failure it records the error and hands the job to QStash.
 */
export async function runScoringWithFallback(participantId: number): Promise<void> {
  try {
    const outcome = await scoreParticipant(participantId);
    if (outcome.ok) return;
    if (outcome.incomplete) return;
    await handleScoringFailure(participantId, outcome.error);
  } catch (err: any) {
    console.error(`Scoring failed for participant ${participantId}:`, err);
    await handleScoringFailure(participantId, err?.message || 'Unknown error');
  }
}

async function handleScoringFailure(participantId: number, message: string): Promise<void> {
  try {
    await sql`
      UPDATE participants
      SET scoring_status = 'FAILED', scoring_error = ${message.slice(0, 500)}
      WHERE id = ${participantId} AND scoring_status <> 'DONE'
    `;
  } catch (dbErr) {
    console.error('Failed to record scoring failure:', dbErr);
  }
  try {
    const { enqueueScoringFallback } = await import('@/lib/qstashFallback');
    await enqueueScoringFallback(participantId);
  } catch (queueErr) {
    console.error('Failed to enqueue QStash scoring fallback:', queueErr);
  }
}
