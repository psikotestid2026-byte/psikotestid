'use server';

import { sql } from '@/lib/neon';

export async function getClientData(customerId: number) {
  const [customerInfo, quotas, campaigns, participants, tests, transactions, orders] = await Promise.all([
    sql`SELECT * FROM customers WHERE id = ${customerId}`,
    sql`SELECT * FROM customer_test_quotas WHERE customer_id = ${customerId}`,
    sql`SELECT * FROM campaigns WHERE customer_id = ${customerId} ORDER BY created_at DESC`,
    sql`
      SELECT p.*, c.title as campaign_title 
      FROM participants p 
      JOIN campaigns c ON p.campaign_id = c.id 
      WHERE c.customer_id = ${customerId} 
      ORDER BY p.created_at DESC
    `,
    sql`SELECT * FROM master_tests WHERE is_active = TRUE ORDER BY name`,
    sql`SELECT * FROM quota_transactions WHERE customer_id = ${customerId} ORDER BY created_at DESC LIMIT 50`,
    sql`SELECT * FROM test_orders WHERE customer_id = ${customerId} ORDER BY created_at DESC LIMIT 50`
  ]);

  return { 
    customer: customerInfo[0] || null, 
    quotas, 
    campaigns, 
    participants, 
    tests,
    transactions,
    orders
  };
}
