'use server';

import { sql } from '@/lib/neon';

export async function getSuperAdminData() {
  const [customers, tests, campaigns, topups, submissions, logs, admins, quotas] = await Promise.all([
    sql`SELECT id, company_name, email, created_at FROM customers ORDER BY created_at DESC`,
    sql`SELECT * FROM master_tests`,
    sql`SELECT id FROM campaigns`,
    sql`SELECT * FROM test_orders WHERE status = 'PENDING' ORDER BY created_at DESC`,
    sql`SELECT id FROM test_results`,
    sql`SELECT * FROM quota_transactions ORDER BY created_at DESC LIMIT 50`,
    sql`SELECT * FROM admins ORDER BY created_at DESC`,
    sql`SELECT * FROM customer_test_quotas`
  ]);

  return { customers, tests, campaigns, topups, submissions, logs, admins, quotas };
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

export async function adjustQuotaManual(customerId: number, testId: number, diff: number) {
  const type = diff >= 0 ? 'CREDIT' : 'DEBIT';
  await sql`
    INSERT INTO customer_test_quotas (customer_id, test_id, quota)
    VALUES (${customerId}, ${testId}, ${diff})
    ON CONFLICT (customer_id, test_id) 
    DO UPDATE SET quota = customer_test_quotas.quota + ${diff}
  `;
  await sql`
    INSERT INTO quota_transactions (customer_id, test_id, reference_id, quantity, type, description)
    VALUES (${customerId}, ${testId}, 'MANUAL', ${Math.abs(diff)}, ${type}, 'Manual Adjustment by Superadmin')
  `;
}

export async function updateTestParams(id: number, data: { price: number; duration_sec: number; is_active: boolean; instructions: string }) {
  await sql`
    UPDATE master_tests
    SET price = ${data.price}, duration_sec = ${data.duration_sec}, is_active = ${data.is_active}, instructions = ${data.instructions}
    WHERE id = ${id}
  `;
}

export async function getTestQuestions(testId: number) {
  const questions = await sql`
    SELECT * FROM question_banks WHERE test_id = ${testId} ORDER BY order_number ASC
  `;
  return questions;
}

export async function saveQuestion(id: number | null, testId: number, orderNumber: number, questionData: string, type: string) {
  const parsedData = JSON.parse(questionData);
  if (id) {
    await sql`
      UPDATE question_banks
      SET order_number = ${orderNumber}, question_data = ${parsedData}, question_type = ${type}
      WHERE id = ${id} AND test_id = ${testId}
    `;
  } else {
    await sql`
      INSERT INTO question_banks (test_id, order_number, question_data, question_type)
      VALUES (${testId}, ${orderNumber}, ${parsedData}, ${type})
    `;
  }
}

export async function getTestConfigAndNorms(testId: number) {
  const [config, norms] = await Promise.all([
    sql`SELECT * FROM scoring_configs WHERE test_id = ${testId} LIMIT 1`,
    sql`SELECT * FROM test_norms WHERE test_id = ${testId} ORDER BY id ASC`
  ]);
  return { config: config[0] || null, norms };
}

export async function saveScoringConfig(testId: number, formulaType: string) {
  await sql`
    INSERT INTO scoring_configs (test_id, formula_type, config_data)
    VALUES (${testId}, ${formulaType}, '{}'::jsonb)
    ON CONFLICT (test_id) 
    DO UPDATE SET formula_type = ${formulaType}
  `;
}

export async function saveNorm(id: number | null, testId: number, rawScore: string, normScore: string, label: string, description: string) {
  if (id) {
    await sql`
      UPDATE test_norms 
      SET raw_score = ${rawScore}, norm_score = ${normScore}, label = ${label}, description = ${description}
      WHERE id = ${id} AND test_id = ${testId}
    `;
  } else {
    await sql`
      INSERT INTO test_norms (test_id, raw_score, norm_score, label, description)
      VALUES (${testId}, ${rawScore}, ${normScore}, ${label}, ${description})
    `;
  }
}

export async function batchInsertNorms(testId: number, norms: any[]) {
  // Simple clear and insert for bulk import
  await sql`DELETE FROM test_norms WHERE test_id = ${testId}`;
  
  for (const n of norms) {
    await sql`
      INSERT INTO test_norms (test_id, raw_score, norm_score, label, description)
      VALUES (${testId}, ${n.raw_score}, ${n.norm_score}, ${n.label || ''}, ${n.description || ''})
    `;
  }
}
