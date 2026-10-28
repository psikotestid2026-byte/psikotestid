import { describe, expect, it } from 'vitest';
import type { JabatanMapping } from '@/lib/jobFit';
import {
  msdtTestIdToSkip,
  quotaAfterInsert,
  quotaReservePlan,
  type RequiredTestsContext,
} from '@/lib/requiredTests';

const MAPPINGS: JabatanMapping[] = [
  { jabatan_keyword: 'STAF', match_mode: 'PREFIX', level_code: 'STAF', priority: 10 },
  { jabatan_keyword: 'MANAJER', match_mode: 'PREFIX', level_code: 'MANAJER', priority: 50 },
];

const CTX: RequiredTestsContext = {
  mappings: MAPPINGS,
  levels: [
    { level_code: 'STAF', requires_msdt: false },
    { level_code: 'MANAJER', requires_msdt: true },
    { level_code: 'SUPERVISOR', requires_msdt: true },
  ],
};

const BUNDLE = {
  campaign_mode: 'MANDATORY_BUNDLE',
  tests: [
    { test_id: 1, code: 'wpt' },
    { test_id: 2, code: 'disc' },
    { test_id: 3, code: 'papi' },
    { test_id: 4, code: 'bigfive' },
    { test_id: 9, code: 'msdt' },
  ],
};

const MIXED = [
  { position: 'STAF KEUANGAN' },
  { job_level_code: 'MANAJER', position: 'MANAJER OPERASI' },
  { position: 'STAF PROJECT' },
];

describe('MSDT quota for STAF', () => {
  it('skips MSDT only for a mandatory bundle whose level does not require it', () => {
    expect(msdtTestIdToSkip(BUNDLE, { job_level_code: 'STAF' }, CTX)).toBe(9);
    expect(msdtTestIdToSkip(BUNDLE, { position: 'STAF ADMIN' }, CTX)).toBe(9);
    expect(msdtTestIdToSkip(BUNDLE, { job_level_code: 'SUPERVISOR' }, CTX)).toBeNull();
    expect(msdtTestIdToSkip({ ...BUNDLE, campaign_mode: 'OPEN' }, { job_level_code: 'STAF' }, CTX)).toBeNull();
  });

  it('charges MSDT equal to the number of leaders in a mixed import', () => {
    const plan = quotaReservePlan(BUNDLE, MIXED, CTX);
    expect(plan.find((slice) => slice.code === 'msdt')?.amount).toBe(1);
    expect(plan.filter((slice) => slice.code !== 'msdt').every((slice) => slice.amount === 3)).toBe(true);
  });

  it('refunds the same per-test amounts that were not used by the inserted rows', () => {
    const onlyStafInserted = [{ job_level_code: 'STAF' }, { position: 'STAF PROJECT' }];
    const stafOnly = quotaAfterInsert(BUNDLE, MIXED, onlyStafInserted, CTX);
    expect(stafOnly.find((slice) => slice.code === 'msdt')).toMatchObject({ reserved: 1, used: 0, refund: 1 });
    expect(stafOnly.find((slice) => slice.code === 'wpt')).toMatchObject({ reserved: 3, used: 2, refund: 1 });

    const onlyLeader = quotaAfterInsert(BUNDLE, MIXED, [{ job_level_code: 'MANAJER' }], CTX);
    expect(onlyLeader.find((slice) => slice.code === 'msdt')).toMatchObject({ reserved: 1, used: 1, refund: 0 });
    expect(onlyLeader.find((slice) => slice.code === 'disc')).toMatchObject({ reserved: 3, used: 1, refund: 2 });

    const nothingInserted = quotaAfterInsert(BUNDLE, MIXED, [], CTX);
    expect(nothingInserted.every((slice) => slice.used === 0 && slice.refund === slice.reserved)).toBe(true);
  });

  it('does not reserve MSDT at all when every imported employee is STAF', () => {
    const plan = quotaReservePlan(BUNDLE, [{ job_level_code: 'STAF' }, { position: 'STAF LOGISTIK' }], CTX);
    expect(plan.some((slice) => slice.code === 'msdt')).toBe(false);
    expect(plan.every((slice) => slice.amount === 2)).toBe(true);
  });
});
