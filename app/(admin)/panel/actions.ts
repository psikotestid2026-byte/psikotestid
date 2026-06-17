'use server';

import { sql } from '@/lib/neon';

export async function getSuperAdminData() {
  const [customers, tests, campaigns, topups, submissions, logs, admins] = await Promise.all([
    sql`SELECT id, company_name, email, created_at FROM customers ORDER BY created_at DESC`,
    sql`SELECT * FROM master_tests`,
    sql`SELECT id FROM campaigns`,
    sql`SELECT * FROM test_orders WHERE status = 'PENDING' ORDER BY created_at DESC`,
    sql`SELECT id FROM test_results`,
    sql`SELECT * FROM quota_transactions ORDER BY created_at DESC LIMIT 50`,
    sql`SELECT * FROM admins ORDER BY created_at DESC`
  ]);

  return { customers, tests, campaigns, topups, submissions, logs, admins };
}

export async function approveOrder(orderId: number) {
  // Simple transaction flow simulation with raw SQL
  await sql`UPDATE test_orders SET status = 'PAID', paid_at = NOW() WHERE id = ${orderId}`;
  
  // Get order items and credit quotas
  const items = await sql`SELECT test_id, quantity FROM test_order_items WHERE order_id = ${orderId}`;
  const order = await sql`SELECT customer_id FROM test_orders WHERE id = ${orderId}`;
  const customerId = order[0]?.customer_id;

  if (customerId && items.length > 0) {
    for (const item of items) {
      await sql`
        INSERT INTO customer_test_quotas (customer_id, test_id, quota)
        VALUES (${customerId}, ${item.test_id}, ${item.quantity})
        ON CONFLICT (customer_id, test_id) 
        DO UPDATE SET quota = customer_test_quotas.quota + ${item.quantity}
      `;
      await sql`
        INSERT INTO quota_transactions (customer_id, test_id, reference_id, quantity, type, description)
        VALUES (${customerId}, ${item.test_id}, ${'ORD-' + orderId}, ${item.quantity}, 'CREDIT', 'Manual Approval Topup')
      `;
    }
  }
}

export async function createAdmin(data: { name: string; email: string; role: string; status: string }) {
  await sql`
    INSERT INTO admins (name, email, role, status)
    VALUES (${data.name}, ${data.email}, ${data.role}, ${data.status})
  `;
}

export async function updateAdmin(id: number, data: { name: string; email: string; role: string; status: string }) {
  await sql`
    UPDATE admins 
    SET name = ${data.name}, email = ${data.email}, role = ${data.role}, status = ${data.status}
    WHERE id = ${id}
  `;
}

export async function deleteAdmin(id: number) {
  await sql`DELETE FROM admins WHERE id = ${id}`;
}
