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

export interface QuotaCampaign {
  campaign_mode?: string | null;
  tests: Array<{ test_id?: number | null; id?: number | null; code?: string | null }>;
}

function campaignTestId(test: { test_id?: number | null; id?: number | null }): number {
  return Number(test.test_id ?? test.id);
}

/**
 * MSDT test id to leave out of quota for this participant, or null when MSDT is charged.
 * Only a MANDATORY_BUNDLE whose level drops MSDT (requires_msdt = false) returns an id.
 * Callers load `ctx` with loadRequiredTestsContext().
 */
export function msdtTestIdToSkip(
  campaign: QuotaCampaign,
  participantLike: RequiredTestParticipant,
  ctx: RequiredTestsContext
): number | null {
  if (String(campaign.campaign_mode || '').toUpperCase() !== 'MANDATORY_BUNDLE') return null;
  const tests = campaign.tests.map((test) => ({
    id: campaignTestId(test),
    code: test.code ?? null,
  }));
  const msdt = tests.find((test) => String(test.code || '').toLowerCase() === 'msdt');
  if (!msdt || !Number.isFinite(msdt.id)) return null;
  const required = getRequiredTestsForParticipant(participantLike, tests, ctx);
  const kept = required.some((test) => Number(test.id) === msdt.id);
  return kept ? null : msdt.id;
}

export interface QuotaSlice {
  testId: number;
  code: string;
  amount: number;
}

/** Units to reserve per campaign test. MSDT is the count of participants who still need it. */
export function quotaReservePlan(
  campaign: QuotaCampaign,
  participants: RequiredTestParticipant[],
  ctx: RequiredTestsContext
): QuotaSlice[] {
  return campaign.tests
    .map((test) => {
      const testId = campaignTestId(test);
      const code = String(test.code || '').toLowerCase();
      if (code !== 'msdt') return { testId, code, amount: participants.length };
      const amount = participants.filter((person) => msdtTestIdToSkip(campaign, person, ctx) == null).length;
      return { testId, code, amount };
    })
    .filter((slice) => slice.amount > 0);
}

/**
 * Reserved units vs rows actually inserted. Refund is reserved - used, per test,
 * so a mixed STAF/leader shortfall returns MSDT only for leaders who were not inserted.
 */
export function quotaAfterInsert(
  campaign: QuotaCampaign,
  reservedParticipants: RequiredTestParticipant[],
  insertedParticipants: RequiredTestParticipant[],
  ctx: RequiredTestsContext
): Array<QuotaSlice & { reserved: number; used: number; refund: number }> {
  const reserved = quotaReservePlan(campaign, reservedParticipants, ctx);
  const usedById = new Map(
    quotaReservePlan(campaign, insertedParticipants, ctx).map((slice) => [slice.testId, slice.amount])
  );
  return reserved.map((slice) => {
    const used = usedById.get(slice.testId) ?? 0;
    return { ...slice, reserved: slice.amount, used, refund: slice.amount - used };
  });
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
