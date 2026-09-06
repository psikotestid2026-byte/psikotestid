'use server';

import { sql } from '@/lib/neon';

// Fetch list of participants for Superadmin Panel
export async function getAdminParticipants() {
  const participantsList = await sql`
    SELECT 
      p.id,
      p.full_name,
      p.email,
      p.phone_number as phone,
      p.gender,
      p.date_of_birth as birth_date,
      p.status,
      p.created_at,
      c.company_name,
      c.email as company_email,
      camp.title as campaign_title,
      COUNT(tr.id) as completed_tests_count
    FROM participants p
    LEFT JOIN campaigns camp ON p.campaign_id = camp.id
    LEFT JOIN customers c ON camp.customer_id = c.id
    LEFT JOIN test_results tr ON tr.participant_id = p.id
    GROUP BY p.id, c.company_name, c.email, camp.title
    ORDER BY p.id DESC
  `;

  return participantsList;
}
