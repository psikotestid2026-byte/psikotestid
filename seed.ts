import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('Seeding Master Tests...');
  await sql`
    INSERT INTO master_tests (code, name, price, duration_sec, is_active, instructions)
    VALUES 
      ('DISC', 'DISC Personality Test', 20000, 600, true, 'Pilih satu pernyataan yang paling menggambarkan diri Anda (Paling) dan satu yang paling tidak menggambarkan diri Anda (Kurang).'),
      ('WPT', 'Wonderlic Personnel Test', 30000, 720, true, 'Jawablah pertanyaan berikut dengan cepat dan tepat.'),
      ('PAPI', 'PAPI Kostick', 40000, 900, true, 'Pilih satu dari dua pernyataan yang paling sesuai dengan diri Anda.')
    ON CONFLICT (code) DO UPDATE SET price = EXCLUDED.price;
  `;

  console.log('Seeding Question Banks (DISC & WPT)...');
  const tests = await sql`SELECT id, code FROM master_tests`;
  const testMap = tests.reduce((acc, t) => ({ ...acc, [t.code]: t.id }), {} as any);

  if (testMap['DISC']) {
    await sql`
      INSERT INTO question_banks (test_id, order_number, question_type, question_data)
      VALUES 
        (${testMap['DISC']}, 1, 'disc', '{"items": ["Mudah bergaul, ramah", "Mempercayai orang lain", "Petualang, pengambil resiko", "Penuh toleransi"]}'::jsonb),
        (${testMap['DISC']}, 2, 'disc', '{"items": ["Yang penting hasil", "Kerjakan dengan benar", "Buat menyenangkan", "Kerjakan bersama"]}'::jsonb)
      ON CONFLICT DO NOTHING;
    `;
    await sql`
      INSERT INTO scoring_configs (test_id, formula_type, config_data)
      VALUES (${testMap['DISC']}, 'disc_matrix', '{}'::jsonb)
      ON CONFLICT DO NOTHING;
    `;
  }

  if (testMap['WPT']) {
    await sql`
      INSERT INTO question_banks (test_id, order_number, question_type, question_data)
      VALUES 
        (${testMap['WPT']}, 1, 'multiple', '{"text": "Bulan lalu pada awal tahun ini adalah:", "options": ["Januari", "Maret", "Juli", "Desember"]}'::jsonb)
      ON CONFLICT DO NOTHING;
    `;
    await sql`
      INSERT INTO scoring_configs (test_id, formula_type, config_data)
      VALUES (${testMap['WPT']}, 'matching_key', '{"1": "3"}'::jsonb)
      ON CONFLICT DO NOTHING;
    `;
  }

  console.log('Seeding completed!');
}

main().catch(console.error);
