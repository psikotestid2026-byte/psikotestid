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

export async function updateCustomerBranding(customerId: number, data: { company_name: string; logo_url: string; brand_color: string }) {
  await sql`
    UPDATE customers 
    SET company_name = ${data.company_name}, logo_url = ${data.logo_url}, brand_color = ${data.brand_color}
    WHERE id = ${customerId}
  `;
}

export async function createCampaign(customerId: number, title: string) {
  const result = await sql`
    INSERT INTO campaigns (customer_id, title) 
    VALUES (${customerId}, ${title}) 
    RETURNING id
  `;
  // By default, let's link the first active test to the new campaign for demo purposes
  const firstTest = await sql`SELECT id FROM master_tests WHERE is_active = TRUE LIMIT 1`;
  if (firstTest[0]) {
    await sql`
      INSERT INTO campaign_tests (campaign_id, test_id) 
      VALUES (${result[0].id}, ${firstTest[0].id})
    `;
  }
}

export async function closeCampaign(campaignId: number) {
  await sql`UPDATE campaigns SET is_active = FALSE WHERE id = ${campaignId}`;
}

export async function createOrder(customerId: number, testId: number, quantity: number) {
  const test = await sql`SELECT price FROM master_tests WHERE id = ${testId}`;
  if (!test[0]) throw new Error('Test not found');
  
  const price = test[0].price;
  const subtotal = price * quantity;
  const invoiceCode = 'INV-' + Date.now();

  const orderResult = await sql`
    INSERT INTO test_orders (invoice_code, customer_id, subtotal, total_amount)
    VALUES (${invoiceCode}, ${customerId}, ${subtotal}, ${subtotal})
    RETURNING id
  `;

  await sql`
    INSERT INTO test_order_items (order_id, test_id, quantity, price_per_item, subtotal)
    VALUES (${orderResult[0].id}, ${testId}, ${quantity}, ${price}, ${subtotal})
  `;
}
