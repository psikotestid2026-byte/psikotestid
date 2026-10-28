import { describe, expect, it } from 'vitest';
import { evaluateCompletion } from '@/lib/bundleCompletion';
import { FALLBACK_LEVEL_PROFILE, computeJobFit, type JabatanMapping } from '@/lib/jobFit';
import { buildJobMatchNarrative } from '@/lib/jobMatchNarrative';
import {
  getRequiredTestsForParticipant,
  omitUnrequiredMsdtFromReport,
  resolveParticipantLevelCode,
  type RequiredTestsContext,
} from '@/lib/requiredTests';

const MAPPINGS: JabatanMapping[] = [
  { jabatan_keyword: 'STAF', match_mode: 'PREFIX', level_code: 'STAF', priority: 10 },
  { jabatan_keyword: 'SUPERVISOR', match_mode: 'PREFIX', level_code: 'SUPERVISOR', priority: 40 },
  { jabatan_keyword: 'MANAJER', match_mode: 'PREFIX', level_code: 'MANAJER', priority: 50 },
];

const CONTEXT: RequiredTestsContext = {
  mappings: MAPPINGS,
  levels: [
    { level_code: 'STAF', requires_msdt: false },
    { level_code: 'SUPERVISOR', requires_msdt: true },
    { level_code: 'MANAJER', requires_msdt: true },
    { level_code: 'HOD', requires_msdt: true },
    { level_code: 'DIREKTUR', requires_msdt: true },
  ],
};

const CAMPAIGN = [
  { id: 1, code: 'wpt' },
  { id: 2, code: 'disc' },
  { id: 3, code: 'papi' },
  { id: 4, code: 'bigfive' },
  { id: 5, code: 'msdt' },
];

describe('getRequiredTestsForParticipant', () => {
  it('drops MSDT for stored STAF even when the title would be a manager', () => {
    const required = getRequiredTestsForParticipant(
      { job_level_code: 'STAF', position: 'MANAJER KEUANGAN' },
      CAMPAIGN,
      CONTEXT
    );
    expect(required.map((test) => test.code)).toEqual(['wpt', 'disc', 'papi', 'bigfive']);
    expect(resolveParticipantLevelCode({ job_level_code: 'STAF', position: 'MANAJER KEUANGAN' }, MAPPINGS)).toBe('STAF');
  });

  it('derives STAF from the job title when no level is stored', () => {
    const required = getRequiredTestsForParticipant({ position: 'STAF PROJECT MANAGER' }, CAMPAIGN, CONTEXT);
    expect(required.map((test) => test.code)).not.toContain('msdt');
  });

  it('keeps MSDT for supervisor and any other non-STAF level', () => {
    expect(getRequiredTestsForParticipant({ job_level_code: 'SUPERVISOR' }, CAMPAIGN, CONTEXT)).toHaveLength(5);
    expect(getRequiredTestsForParticipant({ position: 'MANAJER DT READY' }, CAMPAIGN, CONTEXT)).toHaveLength(5);
    expect(getRequiredTestsForParticipant({ job_level_code: 'HOD' }, CAMPAIGN, CONTEXT)).toHaveLength(5);
  });

  it('treats four finished non-MSDT results as complete for STAF and incomplete for supervisor', () => {
    const stafIds = getRequiredTestsForParticipant({ job_level_code: 'STAF' }, CAMPAIGN, CONTEXT).map((test) => test.id);
    const staf = evaluateCompletion(stafIds, [1, 2, 3, 4, 5]);
    expect(staf.required).toBe(4);
    expect(staf.completed).toBe(4);
    expect(staf.isComplete).toBe(true);
    expect(staf.missing_test_ids).toEqual([]);

    const leadIds = getRequiredTestsForParticipant({ job_level_code: 'DIREKTUR' }, CAMPAIGN, CONTEXT).map((test) => test.id);
    const lead = evaluateCompletion(leadIds, [1, 2, 3, 4]);
    expect(lead.isComplete).toBe(false);
    expect(lead.missing_test_ids).toEqual([5]);
  });
});

describe('computeJobFit without MSDT', () => {
  const staf = { ...FALLBACK_LEVEL_PROFILE, requires_msdt: false as const };
  const strong = {
    wpt: { iq: 100 },
    disc: { dominantLabel: 'S' },
    bigfive: { dimensions: { E: { percent: 70 }, A: { percent: 70 }, C: { percent: 70 }, N: { percent: 30 }, O: { percent: 70 } } },
    papi: { scores: Object.fromEntries('NGALPITVXSBORDCZEKFW'.split('').map((aspect) => [aspect, 6])) },
  };

  it('renormalizes the remaining weights to the same total and ignores an MSDT score', () => {
    const without = computeJobFit(strong, staf);
    const withBadMsdt = computeJobFit({ ...strong, msdt: { dominantType: 'Ds' } }, staf);
    expect(without.ok).toBe(true);
    expect(withBadMsdt.ok).toBe(true);
    if (!without.ok || !withBadMsdt.ok) return;
    expect(without.composite).toBe(withBadMsdt.composite);
    expect(without.breakdown.tests.msdt).toBeUndefined();
    expect(without.breakdown.below_min).not.toContain('msdt');
    const weightSum = Object.values(without.breakdown.tests).reduce((sum, row) => sum + (row?.weight || 0), 0);
    expect(weightSum).toBeCloseTo(1, 5);

    const supervisor = computeJobFit(strong, FALLBACK_LEVEL_PROFILE);
    expect(supervisor.ok).toBe(false);
    if (!supervisor.ok) expect(supervisor.missing).toContain('msdt');
  });
});

describe('STAF report omits MSDT', () => {
  it('removes the MSDT section and any missing-MSDT breakdown row', () => {
    const report = omitUnrequiredMsdtFromReport(
      {
        job_level_code: 'STAF',
        score_breakdown: {
          tests: { wpt: { score: 80 }, msdt: { score: 10 } },
          fit_details: { msdt: { type: 'Ds', fit: 20 } },
        },
      },
      [
        { test_code: 'wpt', scoring_data: {} },
        { test_code: 'msdt', scoring_data: { dominantType: 'Ds' } },
      ],
      CONTEXT
    );
    expect(report.results.map((row) => row.test_code)).toEqual(['wpt']);
    expect(report.participant.score_breakdown.tests.msdt).toBeUndefined();
    expect(report.participant.score_breakdown.fit_details.msdt).toBeUndefined();

    const narrative = buildJobMatchNarrative({
      fullName: 'Siti',
      position: 'Staf Keuangan',
      breakdown: report.participant.score_breakdown,
      status: 'DIPERTIMBANGKAN',
      systemStatus: 'DIPERTIMBANGKAN',
      overridden: false,
      composite: 70,
    });
    expect(narrative?.rows.map((row) => row.code)).not.toContain('msdt');
    expect(JSON.stringify(narrative)).not.toMatch(/MSDT/);
  });
});
