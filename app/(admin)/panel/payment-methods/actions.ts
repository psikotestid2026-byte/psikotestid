'use server';

import { sql } from '@/lib/neon';

// Fetch payment methods & instructions for admin
export async function getAdminPaymentMethods() {
  const paymentMethods = await sql`
    SELECT 
      pm.id,
      pm.code,
      pm.name,
      pm.type,
      pm.provider,
      pm.admin_fee_flat,
      pm.is_active,
      pm.sort_order,
      pi.id as instruction_id,
      pi.title as instruction_title,
      pi.content as instruction_content,
      pi.sort_order as instruction_sort_order
    FROM payment_methods pm
    LEFT JOIN payment_instructions pi ON pi.payment_method_id = pm.id
    ORDER BY pm.sort_order ASC, pm.id ASC, pi.sort_order ASC
  `;

  return paymentMethods;
}

// Create or update payment method
export async function savePaymentMethod(data: {
  id?: number;
  code: string;
  name: string;
  type: string;
  provider: string;
  admin_fee_flat: number;
  is_active: boolean;
  sort_order: number;
  instruction_title?: string;
  instruction_content?: string;
}) {
  if (data.id) {
    // Update payment method
    await sql`
      UPDATE payment_methods
      SET 
        code = ${data.code},
        name = ${data.name},
        type = ${data.type},
        provider = ${data.provider},
        admin_fee_flat = ${data.admin_fee_flat},
        is_active = ${data.is_active},
        sort_order = ${data.sort_order},
        updated_at = NOW()
      WHERE id = ${data.id}
    `;

    // Update or insert instruction if title is provided
    if (data.instruction_title) {
      const existingInst = await sql`SELECT id FROM payment_instructions WHERE payment_method_id = ${data.id} LIMIT 1`;
      if (existingInst.length > 0) {
        await sql`
          UPDATE payment_instructions
          SET title = ${data.instruction_title}, content = ${data.instruction_content || ''}
          WHERE id = ${existingInst[0].id}
        `;
      } else {
        await sql`
          INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
          VALUES (${data.id}, ${data.instruction_title}, ${data.instruction_content || ''}, 1)
        `;
      }
    }
  } else {
    // Insert new payment method
    const inserted = await sql`
      INSERT INTO payment_methods (code, name, type, provider, admin_fee_flat, is_active, sort_order)
      VALUES (${data.code}, ${data.name}, ${data.type}, ${data.provider}, ${data.admin_fee_flat}, ${data.is_active}, ${data.sort_order})
      RETURNING id
    `;
    const newId = inserted[0]?.id;

    if (newId && data.instruction_title) {
      await sql`
        INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
        VALUES (${newId}, ${data.instruction_title}, ${data.instruction_content || ''}, 1)
      `;
    }
  }
}

// Toggle active status
export async function togglePaymentMethodStatus(id: number, isActive: boolean) {
  await sql`
    UPDATE payment_methods
    SET is_active = ${isActive}, updated_at = NOW()
    WHERE id = ${id}
  `;
}

// Delete payment method
export async function deletePaymentMethod(id: number) {
  await sql`DELETE FROM payment_methods WHERE id = ${id}`;
}
