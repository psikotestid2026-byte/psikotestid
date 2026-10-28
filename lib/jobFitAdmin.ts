import { sql } from '@/lib/neon';

export async function loadJobFitAdminData() {
  const [profiles, mappings, statusCounts, failed, campaigns] = await Promise.all([
    sql`SELECT * FROM jabatan_level_profiles ORDER BY sort_order, id`,
    sql`SELECT * FROM jabatan_mappings ORDER BY priority, jabatan_keyword`,
    sql`
      SELECT p.campaign_id::text AS campaign_id, p.scoring_status, COUNT(*)::int AS total
      FROM participants p
      JOIN campaigns c ON c.id = p.campaign_id
      WHERE c.campaign_mode = 'MANDATORY_BUNDLE'
      GROUP BY p.campaign_id, p.scoring_status
    `,
    sql`
      SELECT p.id::text AS id, p.campaign_id::text AS campaign_id, p.full_name, p.position, p.scoring_status, p.scoring_error
      FROM participants p
      JOIN campaigns c ON c.id = p.campaign_id
      WHERE c.campaign_mode = 'MANDATORY_BUNDLE' AND p.scoring_status = 'FAILED'
      ORDER BY p.id DESC
      LIMIT 200
    `,
    sql`
      SELECT c.id::text AS id, c.title, cu.company_name
      FROM campaigns c JOIN customers cu ON cu.id = c.customer_id
      WHERE c.campaign_mode = 'MANDATORY_BUNDLE'
      ORDER BY c.id DESC
    `,
  ]);

  return {
    profiles: profiles.map((p: any) => ({ ...p, id: String(p.id) })),
    mappings: mappings.map((m: any) => ({ ...m, id: String(m.id) })),
    statusCounts,
    failed,
    campaigns,
  };
}

export type JobFitAdminData = Awaited<ReturnType<typeof loadJobFitAdminData>>;
