import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/authGuards', () => ({
  requireAdmin: async () => ({ ok: true, email: 'test-admin@example.com' }),
}));

import { POST as createLevel, PUT as updateLevel } from '@/app/api/admin/job-fit/profiles/route';
import { PATCH as patchMapping, POST as postMapping } from '@/app/api/admin/job-fit/mappings/route';
import { GET as resolveGet } from '@/app/api/admin/job-fit/resolve/route';
import { validateDimensionProfiles, validateProfileNumbers } from '@/lib/jobFitValidation';

const json = (body: unknown, method = 'POST') =>
  new Request('http://x/api', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

const goodNumbers = {
  weights: { wpt: 0.2, disc: 0.2, bigfive: 0.2, papi: 0.2, msdt: 0.2 },
  min_scores: { wpt: 50, disc: 50, bigfive: 50, papi: 50, msdt: 50 },
  threshold_recommended: 75,
  threshold_considered: 55,
};

describe('validation helpers', () => {
  it('rejects bad weights and thresholds', () => {
    expect(validateProfileNumbers({ ...goodNumbers, weights: { ...goodNumbers.weights, wpt: 0.5 } }).ok).toBe(false);
    expect(validateProfileNumbers({ ...goodNumbers, threshold_considered: 80 }).ok).toBe(false);
    expect(validateProfileNumbers(goodNumbers).ok).toBe(true);
  });

  it('validates dimension profiles', () => {
    expect(validateDimensionProfiles({ disc: { ideal: ['D', 'X'] } })).toMatch(/DISC/);
    expect(validateDimensionProfiles({ wpt: { floor: 100, ceil: 90 } })).toMatch(/WPT/);
    expect(validateDimensionProfiles({ msdt: { E: 120 } })).toMatch(/MSDT/);
    expect(validateDimensionProfiles({ disc: { ideal: ['D', 'I'] }, bigfive: { N: -0.2 } })).toBeNull();
  });
});

describe('admin job-fit endpoints (live DB, non-mutating paths)', () => {
  it('refuses invalid or duplicate level codes', async () => {
    expect((await createLevel(json({ level_code: 'a b', level_name: 'x' }))).status).toBe(400);
    expect((await createLevel(json({ level_code: 'STAF', level_name: 'Duplikat' }))).status).toBe(409);
  });

  it('rejects invalid profile updates before touching the DB', async () => {
    const res = await updateLevel(json({ level_code: 'STAF', ...goodNumbers, weights: { ...goodNumbers.weights, wpt: 0.9 }, dimension_profiles: {} }, 'PUT'));
    expect(res.status).toBe(400);
    const res2 = await updateLevel(json({ level_code: 'NOPE', ...goodNumbers, dimension_profiles: {} }, 'PUT'));
    expect(res2.status).toBe(404);
  });

  it('rejects unknown levels on mappings', async () => {
    expect((await postMapping(json({ jabatan_keyword: 'X', match_mode: 'PREFIX', level_code: 'NOPE' }))).status).toBe(400);
    expect((await patchMapping(json({ id: 0 }, 'PATCH'))).status).toBe(400);
  });

  it('resolves a jabatan preview', async () => {
    const res = await resolveGet(new Request('http://x/api?position=' + encodeURIComponent('HEAD OF DESIGN')));
    const body = await res.json();
    expect(body.level_code).toBe('HOD');
    expect(body.matched.jabatan_keyword).toBe('HEAD OF');
  });
});
