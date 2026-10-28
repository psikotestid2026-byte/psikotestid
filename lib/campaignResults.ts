import * as XLSX from 'xlsx';
import { sql } from '@/lib/neon';
import {
  BUNDLE_TEST_CODES,
  RECOMMENDATION_LABELS,
  RECOMMENDATION_STATUSES,
  isRecommendationStatus,
} from '@/lib/jobFit';

export const RESULT_PAGE_SIZES = [10, 25, 50, 100] as const;

const SORT_COLUMNS: Record<string, string> = {
  name: 'p.full_name',
  position: 'p.position',
  unit: 'p.unit_work',
  score: 'p.recommendation_score',
  status: 'p.recommendation_status',
  progress: 'tests_done',
  wpt: "(p.score_breakdown->'tests'->'wpt'->>'score')::numeric",
  disc: "(p.score_breakdown->'tests'->'disc'->>'score')::numeric",
  bigfive: "(p.score_breakdown->'tests'->'bigfive'->>'score')::numeric",
  papi: "(p.score_breakdown->'tests'->'papi'->>'score')::numeric",
  msdt: "(p.score_breakdown->'tests'->'msdt'->>'score')::numeric",
};

export interface ResultsQuery {
  page: number;
  limit: number;
  q: string;
  status: string; // ALL | PENDING | one of RECOMMENDATION_STATUSES
  unit: string;
  sort: string;
  dir: 'asc' | 'desc';
}

export function parseResultsQuery(params: URLSearchParams): ResultsQuery {
  const limitRaw = Number(params.get('limit'));
  const limit = (RESULT_PAGE_SIZES as readonly number[]).includes(limitRaw) ? limitRaw : 10;
  const pageRaw = Math.trunc(Number(params.get('page')));
  const sort = params.get('sort') || 'name';
  return {
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
    limit,
    q: String(params.get('q') || '').trim().slice(0, 100),
    status: String(params.get('status') || 'ALL'),
    unit: String(params.get('unit') || '').trim().slice(0, 255),
    sort: sort in SORT_COLUMNS ? sort : 'name',
    dir: params.get('dir') === 'desc' ? 'desc' : 'asc',
  };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

function buildWhere(campaignId: number, query: ResultsQuery) {
  const conditions = ['p.campaign_id = $1'];
  const values: unknown[] = [campaignId];

  if (query.q) {
    values.push(`%${escapeLike(query.q)}%`);
    const i = values.length;
    conditions.push(
      `(p.full_name ILIKE $${i} OR p.position ILIKE $${i} OR p.unit_work ILIKE $${i} OR p.username ILIKE $${i} OR p.employee_id ILIKE $${i})`
    );
  }
  if (query.unit) {
    values.push(query.unit);
    conditions.push(`p.unit_work = $${values.length}`);
  }
  if (isRecommendationStatus(query.status)) {
    values.push(query.status);
    conditions.push(`p.recommendation_status = $${values.length}`);
  } else if (query.status === 'PENDING') {
    conditions.push('p.recommendation_status IS NULL');
  }
  return { where: conditions.join(' AND '), values };
}

export interface ResultRow {
  id: number;
  full_name: string;
  username: string | null;
  employee_id: string | null;
  position: string | null;
  unit_work: string | null;
  status: string;
  job_level_code: string | null;
  scoring_status: string | null;
  recommendation_status: string | null;
  system_recommendation_status: string | null;
  recommendation_score: string | null;
  assessor_override: boolean;
  assessor_notes: string | null;
  completed_at: string | null;
  tests: Record<string, { score: number }> | null;
  tests_done: number;
}

const SELECT_COLUMNS = `
  p.id, p.full_name, p.username, p.employee_id, p.position, p.unit_work, p.status,
  p.job_level_code, p.scoring_status,
  CASE WHEN p.scoring_status = 'DONE' THEN p.recommendation_status END AS recommendation_status,
  CASE WHEN p.scoring_status = 'DONE' THEN p.system_recommendation_status END AS system_recommendation_status,
  CASE WHEN p.scoring_status = 'DONE' THEN p.recommendation_score END AS recommendation_score,
  p.assessor_override, p.assessor_notes, p.completed_at,
  CASE WHEN p.scoring_status = 'DONE' THEN p.score_breakdown->'tests' END AS tests,
  (SELECT COUNT(DISTINCT tr.test_id)::int FROM test_results tr
     JOIN campaign_tests ct ON ct.test_id = tr.test_id AND ct.campaign_id = p.campaign_id
     WHERE tr.participant_id = p.id) AS tests_done`;

export async function queryCampaignResults(campaignId: number, query: ResultsQuery, paginate = true) {
  const { where, values } = buildWhere(campaignId, query);
  const orderBy = `${SORT_COLUMNS[query.sort]} ${query.dir === 'desc' ? 'DESC' : 'ASC'} NULLS LAST, p.id ASC`;

  const pageValues = [...values];
  let paging = '';
  if (paginate) {
    pageValues.push(query.limit, (query.page - 1) * query.limit);
    paging = `LIMIT $${pageValues.length - 1} OFFSET $${pageValues.length}`;
  }

  const [rows, totalRows, summaryRows, unitRows, testRows] = await Promise.all([
    sql.query(`SELECT ${SELECT_COLUMNS} FROM participants p WHERE ${where} ORDER BY ${orderBy} ${paging}`, pageValues),
    sql.query(`SELECT COUNT(*)::int AS total FROM participants p WHERE ${where}`, values),
    sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE recommendation_status = 'DIREKOMENDASIKAN')::int AS direkomendasikan,
        COUNT(*) FILTER (WHERE recommendation_status = 'DIPERTIMBANGKAN')::int AS dipertimbangkan,
        COUNT(*) FILTER (WHERE recommendation_status = 'TIDAK_DIREKOMENDASIKAN')::int AS tidak_direkomendasikan,
        COUNT(*) FILTER (WHERE recommendation_status IS NULL)::int AS belum,
        COUNT(*) FILTER (WHERE scoring_status = 'PROCESSING')::int AS processing,
        COUNT(*) FILTER (WHERE scoring_status = 'FAILED')::int AS failed
      FROM participants WHERE campaign_id = ${campaignId}
    `,
    sql`
      SELECT DISTINCT unit_work FROM participants
      WHERE campaign_id = ${campaignId} AND unit_work IS NOT NULL ORDER BY unit_work
    `,
    sql`SELECT COUNT(*)::int AS total FROM campaign_tests WHERE campaign_id = ${campaignId}`,
  ]);

  return {
    rows: rows as unknown as ResultRow[],
    total: Number((totalRows as any[])[0]?.total || 0),
    summary: summaryRows[0],
    units: unitRows.map((u) => String(u.unit_work)),
    total_tests: Number(testRows[0]?.total || BUNDLE_TEST_CODES.length),
  };
}

function formatDate(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' });
}

function toBuffer(rows: (string | number | null)[][], widths: number[], sheetName: string): Buffer {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = widths.map((wch) => ({ wch }));
  sheet['!freeze'] = { xSplit: 0, ySplit: 1 };
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

export function buildResultsWorkbook(rows: ResultRow[], totalTests: number): Buffer {
  const header = [
    'No',
    'Nama',
    'Jabatan',
    'Unit Kerja',
    'Skor WPT',
    'Skor DISC',
    'Skor Big Five',
    'Skor PAPI',
    'Skor MSDT',
    'Skor Gabungan',
    'Status Rekomendasi',
    'Catatan Asesor',
    'Tanggal Selesai',
  ];
  const body = rows.map((r, i) => {
    const t = r.tests || {};
    const status = isRecommendationStatus(r.recommendation_status)
      ? RECOMMENDATION_LABELS[r.recommendation_status]
      : r.tests_done < totalTests
        ? `Belum selesai (${r.tests_done}/${totalTests} tes)`
        : 'Belum diproses';
    return [
      i + 1,
      r.full_name,
      r.position || '',
      r.unit_work || '',
      t.wpt?.score ?? '',
      t.disc?.score ?? '',
      t.bigfive?.score ?? '',
      t.papi?.score ?? '',
      t.msdt?.score ?? '',
      r.recommendation_score != null ? Number(r.recommendation_score) : '',
      status,
      r.assessor_override ? r.assessor_notes || 'Override asesor' : r.assessor_notes || '',
      formatDate(r.completed_at),
    ];
  });
  return toBuffer([header, ...body], [6, 32, 40, 22, 11, 11, 13, 11, 11, 14, 24, 40, 20], 'Rekap Hasil');
}

export interface CredentialRow {
  full_name: string;
  username: string | null;
  default_password: string | null;
  position: string | null;
  unit_work: string | null;
  status: string;
  tests_done: number;
}

export async function queryCredentialRows(campaignId: number) {
  const rows = await sql`
    SELECT p.full_name, p.username, p.default_password, p.position, p.unit_work, p.status,
           (SELECT COUNT(*)::int FROM test_results tr WHERE tr.participant_id = p.id) AS tests_done
    FROM participants p
    WHERE p.campaign_id = ${campaignId} AND p.username IS NOT NULL
    ORDER BY p.full_name ASC, p.id ASC
  `;
  const totalTests = await sql`SELECT COUNT(*)::int AS total FROM campaign_tests WHERE campaign_id = ${campaignId}`;
  return { rows: rows as unknown as CredentialRow[], totalTests: Number(totalTests[0]?.total || 0) };
}

export function buildCredentialsWorkbook(rows: CredentialRow[], totalTests: number): Buffer {
  const header = [
    'No',
    'Nama Lengkap',
    'Username',
    'Password Awal',
    'Jabatan',
    'Unit Kerja',
    'Status Tes',
    `Progres (dari ${totalTests})`,
  ];
  const body = rows.map((r, i) => [
    i + 1,
    r.full_name,
    r.username || '',
    r.default_password || '(sudah diubah)',
    r.position || '',
    r.unit_work || '',
    r.status === 'COMPLETED' ? 'Selesai' : r.tests_done > 0 ? 'Sedang dikerjakan' : 'Belum mulai',
    `${r.tests_done}/${totalTests}`,
  ]);
  return toBuffer([header, ...body], [6, 32, 24, 18, 40, 22, 18, 16], 'Data Login Karyawan');
}

export const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export { RECOMMENDATION_STATUSES };
