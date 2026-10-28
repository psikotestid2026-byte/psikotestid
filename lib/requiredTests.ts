import { resolveJobLevel, type JabatanMapping } from '@/lib/jobFit';

export interface RequiredTestParticipant {
  job_level_code?: string | null;
  position?: string | null;
}

export interface LevelMsdtRule {
  level_code: string;
  requires_msdt: boolean;
}

export interface RequiredTestsContext {
  mappings: JabatanMapping[];
  levels: LevelMsdtRule[];
}

/** Stored job_level_code wins. Otherwise the same title derivation scoring uses. */
export function resolveParticipantLevelCode(
  participant: RequiredTestParticipant,
  mappings: JabatanMapping[]
): string {
  const stored = String(participant.job_level_code || '').trim().toUpperCase();
  if (stored) return stored;
  return resolveJobLevel(participant.position, mappings);
}

export function levelRequiresMsdt(levelCode: string, levels: LevelMsdtRule[]): boolean {
  const row = levels.find((level) => level.level_code.toUpperCase() === levelCode.toUpperCase());
  if (!row) return true;
  return row.requires_msdt !== false;
}

/**
 * Campaign tests this participant must finish.
 * MSDT is removed only when their resolved level has requires_msdt = false.
 */
export function getRequiredTestsForParticipant<T extends { code?: string | null }>(
  participant: RequiredTestParticipant,
  campaignTests: T[],
  context: RequiredTestsContext
): T[] {
  const levelCode = resolveParticipantLevelCode(participant, context.mappings);
  if (levelRequiresMsdt(levelCode, context.levels)) return campaignTests;
  return campaignTests.filter((test) => String(test.code || '').toLowerCase() !== 'msdt');
}

/** Drops an existing MSDT result from a report payload when the level does not require it. */
export function omitUnrequiredMsdtFromReport<T extends { test_code?: string | null; code?: string | null }>(
  participant: RequiredTestParticipant & { score_breakdown?: any },
  results: T[],
  context: RequiredTestsContext
): { participant: RequiredTestParticipant & { score_breakdown?: any }; results: T[] } {
  const tagged = results.map((row) => ({ ...row, code: row.code || row.test_code }));
  const required = getRequiredTestsForParticipant(participant, tagged, context);
  const allowed = new Set(required.map((row) => String(row.code || '').toLowerCase()));
  const visible = results.filter((row) => allowed.has(String(row.test_code || row.code || '').toLowerCase()));
  if (allowed.has('msdt')) return { participant, results: visible };

  const breakdown = participant.score_breakdown;
  if (!breakdown || typeof breakdown !== 'object') return { participant, results: visible };
  const tests = { ...(breakdown.tests || {}) };
  delete tests.msdt;
  const fitDetails = { ...(breakdown.fit_details || {}) };
  delete fitDetails.msdt;
  return {
    participant: {
      ...participant,
      score_breakdown: { ...breakdown, tests, fit_details: fitDetails },
    },
    results: visible,
  };
}
