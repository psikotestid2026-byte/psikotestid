// @ts-nocheck
import { config } from 'dotenv';
config({ path: '.env.local' });

import pg from 'pg';
const { Client } = pg;

async function main() {
  const pool = new Client({ connectionString: process.env.DATABASE_URL! });
  await pool.connect();



  const seedQuery = `
-- ==========================================
-- SEEDING DATA
-- ==========================================

-- 1. CUSTOMERS (Tidak ada kolom balance)
INSERT INTO customers (id, email, company_name, phone_number, logo_url, brand_color, role) VALUES
(1, 'admin@psikotest.id', 'PsikoTest.id HQ', '6281234567890', 'https://images.pexels.com/photos/1337380/pexels-photo-1337380.jpeg', '#16a34a', 'SUPERADMIN'),
(2, 'hrd@telkomsel.co.id', 'PT Telekomunikasi Selular', '628111111111', 'https://images.pexels.com/photos/269077/pexels-photo-269077.jpeg', '#e11d48', 'CUSTOMER'),
(3, 'rekrutmen@gojek.com', 'PT GoTo Gojek Tokopedia', '628122222222', 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg', '#059669', 'CUSTOMER')
ON CONFLICT DO NOTHING;

-- 2. MASTER TESTS
INSERT INTO master_tests (id, code, name, description, duration_sec, price, instructions, is_active) VALUES
(1, 'wpt', 'Wonderlic Personnel Test', 'Tes kognitif dan logika penyelesaian masalah', 720, 35000.00, 'Selesaikan sebanyak mungkin pertanyaan dengan tepat dalam waktu 12 menit.', TRUE),
(2, 'disc', 'DISC Personality', 'Asesmen 4 kuadran kepribadian dominan', 600, 25000.00, 'Pilih satu pernyataan yang PALING dan KURANG menggambarkan diri Anda di lingkungan kerja.', TRUE),
(3, 'tech_js', 'Javascript Developer Assessment', 'Tes teknikal pemrograman Javascript menengah-lanjut', 1800, 50000.00, 'Jawablah pertanyaan teoritis dan berikan penjelasan konseptual singkat.', TRUE)
ON CONFLICT DO NOTHING;

-- 3. QUESTION BANKS (Berbagai jenis tipe soal)
INSERT INTO question_banks (test_id, question_type, question_data, order_number) VALUES
(1, 'multiple_choice', '{"text": "Bulan lalu pada awal tahun ini adalah:", "options": ["Januari", "Maret", "Juli", "Desember", "Oktober"]}', 1),
(1, 'multiple_choice', '{"text": "MENANGKAP adalah lawan kata dari:", "options": ["Meletakkan", "Membebaskan", "Beresiko", "Berusaha", "Turun tingkat", "Melepaskan"]}', 2),
(1, 'true_false', '{"text": "Apakah kata KLIEN dan PELANGGAN memiliki arti yang persis sama dalam konteks hukum tata negara?"}', 3),
(1, 'short_answer', '{"text": "Sebuah pesawat terbang 300 kaki dalam 0.5 detik. Pada kecepatan yang sama berapa kaki ia terbang dalam 10 detik?"}', 4),
(3, 'essay', '{"text": "Jelaskan perbedaan mendasar antara eksekusi Synchronous dan Asynchronous di ekosistem Node.js, sertakan contoh sederhana penggunaan Promises!"}', 1),
(2, 'multiple_choice', '{"text": "Pilih satu pernyataan yang PALING menggambarkan Anda:", "options": ["Mudah bergaul, ramah", "Sangat teliti dan akurat", "Tegas dan suka memimpin", "Tenang, stabil, sabar"]}', 1)
ON CONFLICT DO NOTHING;

-- 4. SCORING CONFIGS & NORMS
INSERT INTO scoring_configs (test_id, formula_type, config_data) VALUES
(1, 'matching_key', '{"key": {"1": "4", "2": "2", "3": "false", "4": "6000"}}'),
(2, 'disc_matrix', '{"matrix_p": {"1": ["I","C","D","S"]}, "matrix_k": {"1": ["C","I","S","D"]}}')
ON CONFLICT DO NOTHING;

INSERT INTO test_norms (test_id, raw_score, norm_score, label, description) VALUES
(2, 'DI', 'Dominance-Influence', 'Result Oriented', 'Kandidat memiliki pengaruh dan ketegasan tinggi. Sangat cocok sebagai inovator atau pemimpin proyek yang dinamis.'),
(2, 'SC', 'Steadiness-Compliance', 'Detail Oriented', 'Kandidat sangat stabil, teliti, dan menyukai keteraturan. Andal dalam menangani infrastruktur sistem berskala besar.'),
(1, '20', '100', 'Average', 'Kapasitas intelektual dan kognitif umum berada pada tingkat rata-rata populasi.'),
(1, '35', '120', 'Superior', 'Kapasitas analitis sangat baik, mampu memecahkan arsitektur permasalahan yang rumit dengan cepat.')
ON CONFLICT DO NOTHING;

-- 5. CAMPAIGNS & PARTICIPANTS
INSERT INTO campaigns (id, customer_id, title, is_active) VALUES
(1, 2, 'Seleksi Manajer IT Telkomsel', TRUE),
(2, 3, 'Rekrutmen Driver Acquisition Gojek', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO campaign_tests (campaign_id, test_id) VALUES
(1, 1), (1, 2), (1, 3), 
(2, 2)                 
ON CONFLICT DO NOTHING;

INSERT INTO participants (id, campaign_id, full_name, email, status) VALUES
(1, 1, 'Budi Santoso', 'budi.santoso@email.com', 'COMPLETED'),
(2, 1, 'Siti Rahma', 'siti.rahma@email.com', 'RUNNING'),
(3, 2, 'Ahmad Reza', 'ahmad.reza@email.com', 'COMPLETED')
ON CONFLICT DO NOTHING;

INSERT INTO test_results (participant_id, test_id, raw_answers, scoring_data) VALUES
(1, 1, '{"1": "4", "2": "2", "3": "false", "4": "6000"}', '{"raw": 4, "score": 120, "label": "Superior", "description": "Kapasitas analitis sangat baik."}')
ON CONFLICT DO NOTHING;

-- 6. PAYMENT METHODS & INSTRUCTIONS
INSERT INTO payment_methods (id, code, name, type, provider, admin_fee_flat, is_active, sort_order) VALUES
(1, 'BCA_VA', 'BCA Virtual Account', 'va', 'Xendit', 4000.00, TRUE, 1),
(2, 'MANDIRI_VA', 'Mandiri Virtual Account', 'va', 'Xendit', 4000.00, TRUE, 2),
(3, 'QRIS', 'QRIS (All Payment)', 'qr_code', 'Xendit', 0.00, TRUE, 3),
(4, 'MANUAL_BCA', 'BCA Transfer Manual', 'bank_transfer', 'Manual', 0.00, TRUE, 4)
ON CONFLICT DO NOTHING;

INSERT INTO payment_instructions (payment_method_id, title, content, sort_order) VALUES
(1, 'Pembayaran via m-BCA', '<ol><li>Buka aplikasi m-BCA</li><li>Pilih m-Transfer > BCA Virtual Account</li><li>Masukkan nomor VA</li><li>Konfirmasi nominal Pembayaran</li></ol>', 1),
(3, 'Pembayaran via QRIS', '<ol><li>Buka aplikasi e-Wallet (GoPay, OVO, Dana) atau m-Banking</li><li>Pilih menu Scan QRIS</li><li>Arahkan kamera ke QR Code di layar</li></ol>', 1),
(4, 'Transfer Manual', '<ol><li>Transfer ke Rekening BCA: 123456789 a.n PT PsikoTest Solusi</li><li>Pastikan nominal transfer sama persis</li><li>Unggah bukti transfer di dashboard Admin</li></ol>', 1)
ON CONFLICT DO NOTHING;

-- 7. INITIAL CUSTOMER TEST QUOTAS 
INSERT INTO customer_test_quotas (customer_id, test_id, quota) VALUES
(2, 1, 150), 
(2, 2, 200), 
(2, 3, 100), 
(3, 2, 45)
ON CONFLICT DO NOTHING;

-- 8. TEST ORDERS & ITEMS 
INSERT INTO test_orders (id, invoice_code, customer_id, payment_method_id, subtotal, fee_amount, total_amount, status, paid_at) VALUES
(1, 'ORD-20260613-001', 3, 1, 1125000.00, 4000.00, 1129000.00, 'PAID', '2026-06-13T09:00:00Z'),
(2, 'ORD-20260613-002', 3, 4, 2500000.00, 0.00, 2500000.00, 'PENDING', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO test_order_items (order_id, test_id, quantity, price_per_item, subtotal) VALUES
(1, 2, 45, 25000.00, 1125000.00), 
(2, 3, 50, 50000.00, 2500000.00)
ON CONFLICT DO NOTHING;

-- 9. QUOTA TRANSACTIONS 
INSERT INTO quota_transactions (customer_id, test_id, reference_id, quantity, type, description) VALUES
(3, 2, 'ORD-20260613-001', 45, 'CREDIT', 'Pembelian kuota DISC via BCA Virtual Account'),
(2, 1, 'PART-1', -1, 'DEBIT', 'Penggunaan kuota WPT: Budi Santoso (Seleksi Manajer IT Telkomsel)')
ON CONFLICT DO NOTHING;

-- 10. NOTIFICATION TEMPLATES 
INSERT INTO notification_templates (id, event_trigger, channel, message_content) VALUES
(1, 'ORDER_PAID', 'WHATSAPP', 'Halo HRD {company_name}, pembayaran pesanan kuota sebesar Rp {amount} dengan Invoice {invoice_code} BERHASIL. Kuota tes Anda telah berhasil didepositkan.'),
(2, 'ORDER_PENDING', 'WHATSAPP', 'Halo HRD {company_name}, pesanan kuota Anda sebesar Rp {total_amount} menunggu pembayaran. Silakan selesaikan pembayaran lewat {payment_method}.'),
(3, 'ASSESSMENT_INVITE', 'EMAIL', 'Yth. {participant_name}, Anda diundang oleh {company_name} untuk mengikuti tes asesmen. Silakan klik link berikut: {assessment_link}')
ON CONFLICT DO NOTHING;

-- SEQUENCE RESETS
SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));
SELECT setval('master_tests_id_seq', (SELECT MAX(id) FROM master_tests));
SELECT setval('question_banks_id_seq', (SELECT MAX(id) FROM question_banks));
SELECT setval('scoring_configs_id_seq', (SELECT MAX(id) FROM scoring_configs));
SELECT setval('test_norms_id_seq', (SELECT MAX(id) FROM test_norms));
SELECT setval('campaigns_id_seq', (SELECT MAX(id) FROM campaigns));
SELECT setval('participants_id_seq', (SELECT MAX(id) FROM participants));
SELECT setval('test_results_id_seq', (SELECT MAX(id) FROM test_results));
SELECT setval('payment_methods_id_seq', (SELECT MAX(id) FROM payment_methods));
SELECT setval('payment_instructions_id_seq', (SELECT MAX(id) FROM payment_instructions));
SELECT setval('test_orders_id_seq', (SELECT MAX(id) FROM test_orders));
SELECT setval('test_order_items_id_seq', (SELECT MAX(id) FROM test_order_items));
SELECT setval('customer_test_quotas_id_seq', (SELECT MAX(id) FROM customer_test_quotas));
SELECT setval('quota_transactions_id_seq', (SELECT MAX(id) FROM quota_transactions));
SELECT setval('payment_logs_id_seq', (SELECT MAX(id) FROM payment_logs));
SELECT setval('notification_templates_id_seq', (SELECT MAX(id) FROM notification_templates));
SELECT setval('notification_logs_id_seq', (SELECT MAX(id) FROM notification_logs));
  `;

  console.log('Seeding data...');
  try {
    await pool.query(seedQuery);
    console.log('Seeding completed successfully');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

main();
