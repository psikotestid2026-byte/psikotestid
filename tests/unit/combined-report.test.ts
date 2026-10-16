import { describe, it, expect } from 'vitest';
import {
  INCLUDED_DETAIL_CODES,
  SKIPPED_DETAIL_CODES,
  BULK_PDF_BATCH_SIZE,
  assertCampaignOwnership,
  bulkReportUrl,
  bulkZipFileName,
  clampBulkLimit,
  dedupeFileNames,
  groupResultsByParticipant,
  parseOffsetParam,
  parseOptionalPositiveInt,
  participantPdfFileName,
  partitionReportResults,
  planBulkBatches,
  resolveBigFiveScoring,
  resolveBulkBatchSize,
  resolveBulkCustomer,
  shouldRenderDetail,
} from '@/lib/combinedReport';

describe('combined participant report helpers', () => {
  it('renders every scored instrument and skips ist and tech_js', () => {
    for (const code of INCLUDED_DETAIL_CODES) {
      expect(shouldRenderDetail(code)).toBe(true);
      expect(shouldRenderDetail(code.toUpperCase())).toBe(true);
    }
    for (const code of SKIPPED_DETAIL_CODES) {
      expect(shouldRenderDetail(code)).toBe(false);
      expect(shouldRenderDetail(code.toUpperCase())).toBe(false);
    }
    expect(shouldRenderDetail('custom_hr')).toBe(true);
    expect(shouldRenderDetail('')).toBe(false);
    expect(shouldRenderDetail(null)).toBe(false);
  });

  it('keeps detail order and parks skipped tests on the cover only', () => {
    const rows = [
      { test_code: 'mbti' },
      { test_code: 'IST' },
      { test_code: 'bigfive' },
      { test_code: 'tech_js' },
      { test_code: 'disc' },
    ];
    const { detail, skipped } = partitionReportResults(rows);
    expect(detail.map((row) => row.test_code)).toEqual(['mbti', 'bigfive', 'disc']);
    expect(skipped.map((row) => row.test_code)).toEqual(['IST', 'tech_js']);
  });

  it('resolves Big Five scoring from stored data or raw answers', () => {
    const stored = resolveBigFiveScoring(
      JSON.stringify({ dimensions: { E: { percent: 10 } } }),
      null,
      () => {
        throw new Error('should not calculate');
      }
    );
    expect(stored?.dimensions).toBeTruthy();

    const calculated = resolveBigFiveScoring(null, { '0': '5' }, (answers) => ({
      dimensions: { E: { raw: answers['0'] } },
    }));
    expect(calculated?.dimensions.E.raw).toBe('5');

    expect(resolveBigFiveScoring(null, null, () => ({ dimensions: {} }))).toBeNull();
    expect(
      resolveBigFiveScoring({ dimensions: null }, 'not-json', () => {
        throw new Error('bad answers');
      })
    ).toBeNull();
  });

  it('plans batches that stay inside one function invocation', () => {
    expect(planBulkBatches(0)).toEqual([]);
    expect(planBulkBatches(1, 10)).toEqual([{ offset: 0, limit: 1 }]);
    const batches = planBulkBatches(250, BULK_PDF_BATCH_SIZE);
    expect(batches).toHaveLength(25);
    expect(batches[0]).toEqual({ offset: 0, limit: 10 });
    expect(batches[24]).toEqual({ offset: 240, limit: 10 });
    expect(batches.reduce((sum, batch) => sum + batch.limit, 0)).toBe(250);
    expect(clampBulkLimit(500, 10)).toBe(10);
    expect(clampBulkLimit(4, 10)).toBe(4);
    expect(clampBulkLimit(null, 10)).toBe(10);
  });

  it('resolves batch size from env with a hard cap', () => {
    expect(resolveBulkBatchSize(undefined)).toBe(BULK_PDF_BATCH_SIZE);
    expect(resolveBulkBatchSize('8')).toBe(8);
    expect(resolveBulkBatchSize('0')).toBe(BULK_PDF_BATCH_SIZE);
    expect(resolveBulkBatchSize('100')).toBe(25);
    expect(resolveBulkBatchSize('abc')).toBe(BULK_PDF_BATCH_SIZE);
  });

  it('blocks cross-tenant company and campaign access', () => {
    expect(resolveBulkCustomer({ role: 'admin' }, null)).toEqual({
      ok: false,
      status: 400,
      error: 'Pilih satu perusahaan untuk mengunduh laporan.',
    });
    expect(resolveBulkCustomer({ role: 'admin' }, 9)).toEqual({ ok: true, customerId: 9 });
    expect(resolveBulkCustomer({ role: 'client', customerId: 4 }, null)).toEqual({ ok: true, customerId: 4 });
    expect(resolveBulkCustomer({ role: 'client', customerId: 4 }, 4)).toEqual({ ok: true, customerId: 4 });
    expect(resolveBulkCustomer({ role: 'client', customerId: 4 }, 9)).toMatchObject({ ok: false, status: 403 });

    expect(assertCampaignOwnership(4, 4)).toEqual({ ok: true });
    expect(assertCampaignOwnership(4, 9)).toMatchObject({ ok: false, status: 403 });
    expect(assertCampaignOwnership(4, null)).toMatchObject({ ok: false, status: 404 });
  });

  it('builds stable file names and query strings', () => {
    expect(participantPdfFileName('Budi/Santoso', 15)).toBe('Laporan-Psikotes-BudiSantoso-15.pdf');
    expect(participantPdfFileName('  ', 2)).toBe('Laporan-Psikotes-Kandidat-2.pdf');
    expect(bulkZipFileName('PT Maju', 'Batch A', '2026-10-16')).toBe(
      'Laporan-Peserta-PT_Maju-Batch_A-2026-10-16.zip'
    );
    expect(bulkReportUrl({ customerId: 3, campaignId: 8, offset: 10, limit: 10, format: 'manifest' })).toBe(
      '/api/reports/bulk/pdf?customerId=3&campaignId=8&offset=10&limit=10&format=manifest'
    );
    expect(parseOptionalPositiveInt('12')).toEqual({ ok: true, value: 12 });
    expect(parseOptionalPositiveInt('1.5').ok).toBe(false);
    expect(parseOptionalPositiveInt('')).toEqual({ ok: true, value: null });
    expect(parseOffsetParam(null)).toEqual({ ok: true, value: 0 });
    expect(parseOffsetParam('-1').ok).toBe(false);
  });

  it('groups results by participant and dedupes zip names', () => {
    const grouped = groupResultsByParticipant([
      { participant_id: 1, test_code: 'disc' },
      { participant_id: '1', test_code: 'mbti' },
      { participant_id: 2, test_code: 'papi' },
    ]);
    expect(grouped.get('1')?.map((row) => row.test_code)).toEqual(['disc', 'mbti']);
    expect(grouped.get('2')).toHaveLength(1);

    const names = dedupeFileNames([
      { name: 'a.pdf' },
      { name: 'a.pdf' },
      { name: 'b.pdf' },
    ]).map((file) => file.name);
    expect(names).toEqual(['a.pdf', 'a-2.pdf', 'b.pdf']);
  });
});
