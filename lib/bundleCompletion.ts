import { sql } from '@/lib/neon';
import { getRequiredTestsForParticipant, type RequiredTestsContext } from '@/lib/requiredTests';
import type { JabatanMapping } from '@/lib/jobFit';

export interface BundleCompletion {
  required: number;
  completed: number;
  missing_test_ids: number[];
  isComplete: boolean;
}

/** Pure check, shared by server routes and unit tests. */
export function evaluateCompletion(requiredTestIds: number[], completedTestIds: number[]): BundleCompletion {
  const required = Array.from(new Set(requiredTestIds));
  const done = new Set(completedTestIds);
  const missing = required.filter((id) => !done.has(id));
  return {
    required: required.length,
    completed: required.length - missing.length,
    missing_test_ids: missing,
    isComplete: required.length > 0 && missing.length === 0,
  };
}

export async function loadRequiredTestsContext(): Promise<RequiredTestsContext> {
  const [profileRows, mappingRows] = await Promise.all([
    sql`SELECT level_code, requires_msdt FROM jabatan_level_profiles WHERE is_active`,
    sql`SELECT jabatan_keyword, match_mode, level_code, priority FROM jabatan_mappings WHERE is_active`,
  ]);
  return {
    mappings: mappingRows as unknown as JabatanMapping[],
    levels: profileRows.map((row: any) => ({
      level_code: String(row.level_code),
      requires_msdt: row.requires_msdt !== false && row.requires_msdt !== 'f',
    })),
  };
}

/** Single source of truth: has this participant finished every test their level requires? */
export async function getBundleCompletion(participantId: number): Promise<BundleCompletion> {
  const [participants, tests, done, context] = await Promise.all([
    sql`SELECT job_level_code, position FROM participants WHERE id = ${participantId} LIMIT 1`,
    sql`
      SELECT ct.test_id::int AS id, LOWER(mt.code) AS code
      FROM campaign_tests ct
      JOIN master_tests mt ON mt.id = ct.test_id
      JOIN participants p ON p.campaign_id = ct.campaign_id
      WHERE p.id = ${participantId}
      ORDER BY ct.order_number NULLS LAST, mt.id
    `,
    sql`SELECT DISTINCT test_id::int AS test_id FROM test_results WHERE participant_id = ${participantId}`,
    loadRequiredTestsContext(),
  ]);
  const required = getRequiredTestsForParticipant(participants[0] || {}, tests as any[], context);
  return evaluateCompletion(
    required.map((row) => Number(row.id)),
    done.map((row: any) => Number(row.test_id))
  );
}

export const INCOMPLETE_RESULT_MESSAGE =
  'Hasil belum tersedia karena peserta belum menyelesaikan seluruh tes.';
