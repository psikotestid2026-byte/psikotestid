import { sql } from '@/lib/neon';

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

/** Single source of truth: has this participant finished every test of the campaign? */
export async function getBundleCompletion(participantId: number): Promise<BundleCompletion> {
  const [required, done] = await Promise.all([
    sql`
      SELECT ct.test_id::int AS test_id
      FROM campaign_tests ct
      JOIN participants p ON p.campaign_id = ct.campaign_id
      WHERE p.id = ${participantId}
    `,
    sql`SELECT DISTINCT test_id::int AS test_id FROM test_results WHERE participant_id = ${participantId}`,
  ]);
  return evaluateCompletion(
    required.map((r: any) => Number(r.test_id)),
    done.map((r: any) => Number(r.test_id))
  );
}

export const INCOMPLETE_RESULT_MESSAGE =
  'Hasil belum tersedia karena peserta belum menyelesaikan seluruh tes.';
