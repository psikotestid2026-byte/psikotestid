// @ts-nocheck
import { config } from 'dotenv';
config({ path: '.env.local' });

import pg from 'pg';
const { Client } = pg;

async function main() {
  const pool = new Client({ connectionString: process.env.DATABASE_URL! });
  await pool.connect();

  console.log('Ensuring database schema tables, columns, and unique indexes exist...');

  const schemaDDL = `
-- ==========================================
-- DDL TABLE DEFINITIONS WITH CONSTRAINTS & INDEXES
-- ==========================================

CREATE TABLE IF NOT EXISTS admins (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'SUPERADMIN',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    auth_user_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    phone_number VARCHAR(50),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    address TEXT,
    logo_url VARCHAR(1024),
    brand_color VARCHAR(20) DEFAULT '#2563eb',
    role VARCHAR(50) DEFAULT 'CUSTOMER',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS master_tests (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'GENERAL',
    description TEXT,
    duration_sec INT NOT NULL DEFAULT 0,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE master_tests ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'GENERAL';
ALTER TABLE master_tests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS test_bundles (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    bundle_price NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_bundle_items (
    bundle_id INT NOT NULL REFERENCES test_bundles(id) ON DELETE CASCADE,
    test_id INT NOT NULL REFERENCES master_tests(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    PRIMARY KEY (bundle_id, test_id)
);

CREATE TABLE IF NOT EXISTS question_banks (
    id BIGSERIAL PRIMARY KEY,
    test_id INT NOT NULL REFERENCES master_tests(id) ON DELETE CASCADE,
    question_type VARCHAR(50) NOT NULL,
    question_data JSONB NOT NULL,
    order_number INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_question_banks_test_order ON question_banks(test_id, order_number);

CREATE TABLE IF NOT EXISTS scoring_configs (
    id BIGSERIAL PRIMARY KEY,
    test_id INT NOT NULL UNIQUE REFERENCES master_tests(id) ON DELETE CASCADE,
    formula_type VARCHAR(100) NOT NULL,
    config_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_norms (
    id BIGSERIAL PRIMARY KEY,
    test_id INT NOT NULL REFERENCES master_tests(id) ON DELETE CASCADE,
    raw_score VARCHAR(50) NOT NULL,
    norm_score VARCHAR(50) NOT NULL,
    label VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
    id BIGSERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    access_token VARCHAR(100) UNIQUE,
    valid_until TIMESTAMPTZ,
    max_participants INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS access_token VARCHAR(100);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS max_participants INT DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE UNIQUE INDEX IF NOT EXISTS unq_campaigns_access_token ON campaigns(access_token);
CREATE INDEX IF NOT EXISTS idx_campaigns_customer ON campaigns(customer_id);

CREATE TABLE IF NOT EXISTS campaign_tests (
    campaign_id INT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    test_id INT NOT NULL REFERENCES master_tests(id) ON DELETE CASCADE,
    PRIMARY KEY (campaign_id, test_id)
);

CREATE TABLE IF NOT EXISTS participants (
    id BIGSERIAL PRIMARY KEY,
    campaign_id INT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    access_token VARCHAR(100) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    masked_phone VARCHAR(50),
    phone_middle_digits VARCHAR(10),
    gender VARCHAR(20),
    date_of_birth TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'RUNNING',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS access_token VARCHAR(100);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS masked_phone VARCHAR(50);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS phone_middle_digits VARCHAR(10);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS date_of_birth TIMESTAMPTZ;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS unq_participants_access_token ON participants(access_token);
CREATE INDEX IF NOT EXISTS idx_participants_campaign ON participants(campaign_id);

CREATE TABLE IF NOT EXISTS test_results (
    id BIGSERIAL PRIMARY KEY,
    participant_id INT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    test_id INT NOT NULL REFERENCES master_tests(id) ON DELETE CASCADE,
    raw_answers JSONB NOT NULL,
    scoring_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unq_participant_test UNIQUE (participant_id, test_id)
);
CREATE INDEX IF NOT EXISTS idx_test_results_part_test ON test_results(participant_id, test_id);

CREATE TABLE IF NOT EXISTS payment_methods (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    logo_url VARCHAR(1024),
    type VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    admin_fee_flat NUMERIC(10, 2) DEFAULT 0.00,
    admin_fee_pct NUMERIC(5, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payment_instructions (
    id BIGSERIAL PRIMARY KEY,
    payment_method_id INT NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_orders (
    id BIGSERIAL PRIMARY KEY,
    invoice_code VARCHAR(100) NOT NULL UNIQUE,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_type VARCHAR(50) NOT NULL DEFAULT 'DIRECT_QUOTA',
    payment_method_id INT REFERENCES payment_methods(id) ON DELETE SET NULL,
    subtotal NUMERIC(15, 2) NOT NULL,
    fee_amount NUMERIC(15, 2) DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL,
    payment_url VARCHAR(1024),
    payment_token VARCHAR(255),
    proof_url VARCHAR(1024),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);
ALTER TABLE test_orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(50) NOT NULL DEFAULT 'DIRECT_QUOTA';
ALTER TABLE test_orders ADD COLUMN IF NOT EXISTS notes TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS unq_test_orders_invoice ON test_orders(invoice_code);
CREATE INDEX IF NOT EXISTS idx_test_orders_invoice ON test_orders(invoice_code);
CREATE INDEX IF NOT EXISTS idx_test_orders_customer ON test_orders(customer_id);

CREATE TABLE IF NOT EXISTS test_order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES test_orders(id) ON DELETE CASCADE,
    test_id INT REFERENCES master_tests(id) ON DELETE CASCADE,
    bundle_id INT REFERENCES test_bundles(id) ON DELETE CASCADE,
    quantity INT NOT NULL,
    price_per_item NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE test_order_items ADD COLUMN IF NOT EXISTS bundle_id INT REFERENCES test_bundles(id) ON DELETE CASCADE;
ALTER TABLE test_order_items ALTER COLUMN test_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_test_order_items_order ON test_order_items(order_id);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id BIGSERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_id INT REFERENCES test_orders(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    balance_before NUMERIC(15, 2) NOT NULL,
    balance_after NUMERIC(15, 2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_customer ON wallet_transactions(customer_id);

CREATE TABLE IF NOT EXISTS customer_test_quotas (
    id BIGSERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    test_id INT NOT NULL REFERENCES master_tests(id) ON DELETE CASCADE,
    quota INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unq_customer_test UNIQUE (customer_id, test_id)
);
CREATE INDEX IF NOT EXISTS idx_customer_test_quotas_customer_test ON customer_test_quotas(customer_id, test_id);

CREATE TABLE IF NOT EXISTS quota_transactions (
    id BIGSERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    test_id INT NOT NULL REFERENCES master_tests(id) ON DELETE CASCADE,
    participant_id INT REFERENCES participants(id) ON DELETE SET NULL,
    reference_id VARCHAR(100),
    quantity INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE quota_transactions ADD COLUMN IF NOT EXISTS participant_id INT REFERENCES participants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_quota_transactions_customer_test ON quota_transactions(customer_id, test_id);

CREATE TABLE IF NOT EXISTS payment_logs (
    id BIGSERIAL PRIMARY KEY,
    invoice_code VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255),
    type VARCHAR(50),
    request_payload TEXT,
    response_payload TEXT,
    http_status INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_logs_invoice ON payment_logs(invoice_code);

CREATE TABLE IF NOT EXISTS landing_page_contents (
    id BIGSERIAL PRIMARY KEY,
    section_key VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    content JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_templates (
    id BIGSERIAL PRIMARY KEY,
    event_trigger VARCHAR(50) NOT NULL UNIQUE,
    channel VARCHAR(20) NOT NULL,
    message_content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS notification_logs (
    id BIGSERIAL PRIMARY KEY,
    template_id INT REFERENCES notification_templates(id) ON DELETE SET NULL,
    reference_code VARCHAR(100),
    recipient VARCHAR(150) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    request_payload TEXT,
    response_payload TEXT,
    status VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notification_logs_ref ON notification_logs(reference_code);
  `;

  await pool.query(schemaDDL);
  console.log('Schema DDL verified successfully');

  console.log('Seeding initial data...');

  const seedQuery = `
-- ==========================================
-- 1. ADMINS & SUPERADMIN SEED
-- ==========================================
INSERT INTO admins (email, password_hash, name, role, status) VALUES
('admin@psikotest.id', '$2a$10$wE8M14P7pE/2bM9gZf0O1.n8uW2hM/R4m2eH2kH2kH2kH2kH2kH2', 'Super Admin PsikoTest', 'SUPERADMIN', 'ACTIVE')
ON CONFLICT (email) DO UPDATE SET 
    password_hash = COALESCE(EXCLUDED.password_hash, admins.password_hash),
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- ==========================================
-- 2. HR CLIENT CUSTOMERS SEED
-- ==========================================
INSERT INTO customers (email, password_hash, company_name, contact_name, phone_number, balance, address, logo_url, brand_color, role, status) VALUES
('admin@psikotest.id', '$2a$10$wE8M14P7pE/2bM9gZf0O1.n8uW2hM/R4m2eH2kH2kH2kH2kH2kH2', 'PsikoTest.id HQ', 'Tim Utama PsikoTest', '6281234567890', 10000000.00, 'Jl. Jend. Sudirman No. 45, Jakarta Selatan', 'https://images.pexels.com/photos/1337380/pexels-photo-1337380.jpeg', '#16a34a', 'SUPERADMIN', 'ACTIVE'),
('hrd@telkomsel.co.id', '$2a$10$wE8M14P7pE/2bM9gZf0O1.n8uW2hM/R4m2eH2kH2kH2kH2kH2kH2', 'PT Telekomunikasi Selular', 'Budi Santoso (HR Director)', '628111111111', 5000000.00, 'Telkomsel Smart Office, Jl. Gatot Subroto Kav. 52, Jakarta', 'https://images.pexels.com/photos/269077/pexels-photo-269077.jpeg', '#e11d48', 'CUSTOMER', 'ACTIVE'),
('rekrutmen@gojek.com', '$2a$10$wE8M14P7pE/2bM9gZf0O1.n8uW2hM/R4m2eH2kH2kH2kH2kH2kH2', 'PT GoTo Gojek Tokopedia', 'Siti Rahma (Talent Acquisition)', '628122222222', 2500000.00, 'Pasar Daya Blok B, Jl. Iskandarsyah II No. 2, Jakarta', 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg', '#059669', 'CUSTOMER', 'ACTIVE'),
('recruitment@bca.co.id', '$2a$10$wE8M14P7pE/2bM9gZf0O1.n8uW2hM/R4m2eH2kH2kH2kH2kH2kH2', 'PT Bank Central Asia Tbk', 'Bambang Wijaya (Head of HR)', '628133333333', 10000000.00, 'Menara BCA, Grand Indonesia, Jl. M.H. Thamrin No. 1, Jakarta', 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg', '#0056b3', 'CUSTOMER', 'ACTIVE')
ON CONFLICT (email) DO UPDATE SET 
    company_name = EXCLUDED.company_name,
    password_hash = COALESCE(EXCLUDED.password_hash, customers.password_hash),
    balance = EXCLUDED.balance,
    brand_color = EXCLUDED.brand_color;

-- ==========================================
-- 3. LANDING PAGE CMS CONTENTS SEED
-- ==========================================
INSERT INTO landing_page_contents (section_key, title, subtitle, content, is_active) VALUES
('hero', 'Platform Asesmen Psikotes Online Terintegrasi & Automated untuk Enterprise', 'Kelola rekrutmen karyawan, tes kecerdasan, dan asesmen kepribadian secara efisien dengan sistem pemeriksaan otomatis dan laporan PDF terverifikasi real-time.', '{
    "cta_primary_text": "Daftar Akun Corporate",
    "cta_primary_url": "/clients/login?mode=register",
    "cta_secondary_text": "Lihat Katalog Alat Tes",
    "cta_secondary_url": "#pricing",
    "trust_metrics": [
        {"label": "Asesmen Terproses", "value": "150.000+"},
        {"label": "Perusahaan B2B Client", "value": "350+"},
        {"label": "Akurasi Scoring", "value": "99.8%"}
    ]
}', TRUE),
('features', 'Fitur Unggulan Platform PsikoTest.id Enterprise', 'Solusi komprehensif yang dirancang khusus untuk memenuhi kebutuhan divisi Human Capital dan Lembaga Psikologi.', '{
    "items": [
        {"icon": "ShieldCheck", "title": "White-Label Branding", "description": "Tampilkan logo dan warna khas perusahaan Anda pada portal tes kandidat agar terlihat profesional."},
        {"icon": "Zap", "title": "Automated Scoring Engine", "description": "Hasil tes terhitung otomatis secara instan berkat engine scoring serverless berkecepatan tinggi."},
        {"icon": "FileText", "title": "Laporan Hasil PDF Otomatis", "description": "Unduh laporan grafik kepribadian dan rekomendasi psikologis kandidat dalam format PDF berkualitas tinggi."},
        {"icon": "Wallet", "title": "Skema Pembelian Fleksibel", "description": "Beli kuota alat tes satuan (1 kandidat/tes) atau Top-Up Saldo Wallet untuk transaksi serba cepat."}
    ]
}', TRUE),
('pricing_banner', 'Skema Alat Tes Ekonomis Rp 15.000 / Tes / Kandidat', 'Pilih alat tes sesuai kebutuhan posisi pekerjaan atau hemat lebih banyak dengan Paket Bundle Rekrutmen.', '{
    "highlights": [
        "Sekali pakai per kandidat (1 kuota = 1 tes selesai)",
        "Tanpa biaya langganan bulanan",
        "Mendukung pembayaran Virtual Account, QRIS & Transfer Bank",
        "Saldo Wallet tidak memiliki batas kadaluwarsa"
    ]
}', TRUE),
('faq', 'Pertanyaan Yang Sering Diajukan (FAQ)', 'Segala hal yang perlu Anda ketahui mengenai pendaftaran akun HR Client dan penggunaan tes.', '{
    "items": [
        {"q": "Bagaimana cara kerja pembelian kuota tes?", "a": "Anda dapat membeli kuota tes secara langsung (Pay-Per-Test) atau mengisi saldo wallet akun HR Client Anda. Setiap kandidat yang menyelesaikan tes akan memotong 1 kuota alat tes terkait."},
        {"q": "Apakah logo dan warna perusahaan saya bisa ditampilkan di layar tes kandidat?", "a": "Ya! Fitur White-Label memungkinkan Anda mengunggah logo dan mengatur warna identitas perusahaan pada Portal HR Client."},
        {"q": "Berapa lama masa berlaku kuota alat tes?", "a": "Kuota alat tes dan saldo wallet di PsikoTest.id tidak memiliki batas masa berlaku (berlaku selamanya)."},
        {"q": "Bagaimana kandidat mengerjakan tes?", "a": "HR Client cukup membuat link campaign dan membagikannya ke kandidat. Kandidat mengakses via browser tanpa perlu registrasi password ribet."}
    ]
}', TRUE),
('contact_info', 'Hubungi Tim Layanan Enterprise Kami', 'Siap membantu konsultasi instrumen tes dan kebutuhan rekrutmen perusahaan Anda.', '{
    "email": "support@psikotest.id",
    "phone": "+62 812-3456-7890",
    "whatsapp": "+62 812-3456-7890",
    "address": "Gedung PsikoTest Solusi, Lt. 8, Jl. Jend. Sudirman No. 45, Jakarta Selatan"
}', TRUE)
ON CONFLICT (section_key) DO UPDATE SET 
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    content = EXCLUDED.content;

-- ==========================================
-- 4. MASTER TESTS SEED
-- ==========================================
INSERT INTO master_tests (code, name, category, description, duration_sec, price, instructions, is_active) VALUES
('wpt', 'Wonderlic Personnel Test (WPT)', 'COGNITIVE', 'Tes kecerdasan kognitif dan daya tangkap logika penyelesaian masalah.', 720, 15000.00, 'Jawablah pertanyaan berikut dengan cepat dan tepat dalam waktu 12 menit.', TRUE),
('disc', 'DISC Personality Assessment', 'PERSONALITY', 'Asesmen 4 kuadran pola perilaku dan gaya komunikasi individu.', 600, 15000.00, 'Pilih satu pernyataan yang PALING dan KURANG menggambarkan diri Anda di lingkungan kerja.', TRUE),
('papi', 'PAPI Kostick Personality', 'PERSONALITY', 'Evaluasi 20 dimensi perilaku kerja dan gaya kepemimpinan.', 900, 20000.00, 'Pilih salah satu dari sepasang pernyataan (A atau B) yang paling sesuai dengan diri Anda.', TRUE),
('mbti', 'Myers-Briggs Type Indicator (MBTI)', 'PERSONALITY', 'Identifikasi 16 tipe kepribadian dan preferensi psikologis.', 900, 20000.00, 'Pilih salah satu pernyataan (A atau B) yang paling mencerminkan diri Anda secara jujur.', TRUE),
('riasec', 'Holland RIASEC Interest Test', 'VOKASIONAL', 'Tes minat karir, vokasional, dan kecocokan bidang pekerjaan.', 900, 15000.00, 'Jawablah apakah Anda menyukai atau tidak menyukai aktivitas pekerjaan berikut.', TRUE),
('ist', 'Intelligenz Struktur Test (IST)', 'COGNITIVE', 'Tes komprehensif struktur inteligensi verbal, numerik, dan spasial.', 5400, 35000.00, 'Selesaikan sembilan subtes kemampuan berpikir logis dan analitis.', TRUE),
('tech_js', 'Javascript & Node.js Developer Test', 'TECHNICAL', 'Asesmen kemampuan teknikal pemrograman Javascript menengah-lanjut.', 1800, 30000.00, 'Jawablah pertanyaan teoritis dan koding konseptual.', TRUE),
('msdt', 'Management Style Diagnostic Test', 'LEADERSHIP', 'Evaluasi gaya kepemimpinan dan manajemen efektivitas organisasi.', 1200, 25000.00, 'Pilih salah satu pernyataan (A atau B) yang paling sesuai kecenderungan kepemimpinan Anda.', TRUE),
('bigfive', 'Big Five Personality (OCEAN)', 'PERSONALITY', 'Asesmen 5 faktor kepribadian utama (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism).', 900, 20000.00, 'Pilih tingkat persetujuan Anda terhadap pernyataan berikut (skala 1-5).', TRUE),
('enneagram', 'Enneagram Assessment', 'PERSONALITY', 'Asesmen 9 tipe kepribadian motivasi dasar manusia.', 1200, 20000.00, 'Pilih tingkat kecocokan setiap pernyataan dengan diri Anda.', TRUE)
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    category = EXCLUDED.category;

-- ==========================================
-- 5. TEST BUNDLES SEED
-- ==========================================
INSERT INTO test_bundles (code, name, description, bundle_price, is_active) VALUES
('bundle_staff', 'Paket Rekrutmen Staf & Operasional', 'Kombinasi Tes Kognitif Logika (WPT) dan Asesmen Perilaku Kerja (DISC). Cocok untuk posisi Staf/Junior.', 25000.00, TRUE),
('bundle_manager', 'Paket Executive Managerial', 'Paket lengkap WPT + DISC + PAPI Kostick + MSDT Kepemimpinan. Cocok untuk posisi Supervisor, Manager & Lead.', 60000.00, TRUE)
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    bundle_price = EXCLUDED.bundle_price;

INSERT INTO test_bundle_items (bundle_id, test_id, quantity) VALUES
((SELECT id FROM test_bundles WHERE code = 'bundle_staff'), (SELECT id FROM master_tests WHERE code = 'wpt'), 1),
((SELECT id FROM test_bundles WHERE code = 'bundle_staff'), (SELECT id FROM master_tests WHERE code = 'disc'), 1),
((SELECT id FROM test_bundles WHERE code = 'bundle_manager'), (SELECT id FROM master_tests WHERE code = 'wpt'), 1),
((SELECT id FROM test_bundles WHERE code = 'bundle_manager'), (SELECT id FROM master_tests WHERE code = 'disc'), 1),
((SELECT id FROM test_bundles WHERE code = 'bundle_manager'), (SELECT id FROM master_tests WHERE code = 'papi'), 1),
((SELECT id FROM test_bundles WHERE code = 'bundle_manager'), (SELECT id FROM master_tests WHERE code = 'msdt'), 1)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 6. QUESTION BANKS SAMPLE SEED
-- ==========================================
INSERT INTO question_banks (test_id, question_type, question_data, order_number) VALUES
((SELECT id FROM master_tests WHERE code = 'wpt'), 'multiple_choice', '{"text": "Bulan lalu pada awal tahun ini adalah:", "options": ["Januari", "Maret", "Juli", "Desember", "Oktober"]}', 1),
((SELECT id FROM master_tests WHERE code = 'wpt'), 'multiple_choice', '{"text": "MENANGKAP adalah lawan kata dari:", "options": ["Meletakkan", "Membebaskan", "Beresiko", "Berusaha", "Turun tingkat", "Melepaskan"]}', 2),
((SELECT id FROM master_tests WHERE code = 'wpt'), 'true_false', '{"text": "Apakah kata KLIEN dan PELANGGAN memiliki arti yang persis sama dalam konteks hukum tata negara?"}', 3),
((SELECT id FROM master_tests WHERE code = 'wpt'), 'short_answer', '{"text": "Sebuah pesawat terbang 300 kaki dalam 0.5 detik. Pada kecepatan yang sama berapa kaki ia terbang dalam 10 detik?"}', 4),
((SELECT id FROM master_tests WHERE code = 'disc'), 'multiple_choice', '{"text": "Pilih satu pernyataan yang PALING menggambarkan Anda:", "options": ["Mudah bergaul, ramah", "Sangat teliti dan akurat", "Tegas dan suka memimpin", "Tenang, stabil, sabar"]}', 1),
((SELECT id FROM master_tests WHERE code = 'tech_js'), 'essay', '{"text": "Jelaskan perbedaan mendasar antara eksekusi Synchronous dan Asynchronous di ekosistem Node.js, sertakan contoh sederhana penggunaan Promises!"}', 1)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 7. SCORING CONFIGS & NORMS SEED
-- ==========================================
INSERT INTO scoring_configs (test_id, formula_type, config_data) VALUES
((SELECT id FROM master_tests WHERE code = 'wpt'), 'matching_key', '{"key": {"1": "4", "2": "2", "3": "false", "4": "6000"}}'),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc_matrix', '{"matrix_p": {"1": ["I","C","D","S"]}, "matrix_k": {"1": ["C","I","S","D"]}}')
ON CONFLICT (test_id) DO UPDATE SET formula_type = EXCLUDED.formula_type;

INSERT INTO test_norms (test_id, raw_score, norm_score, label, description) VALUES
((SELECT id FROM master_tests WHERE code = 'disc'), 'DI', 'Dominance-Influence', 'Result Oriented', 'Kandidat memiliki pengaruh dan ketegasan tinggi. Sangat cocok sebagai inovator atau pemimpin proyek yang dinamis.'),
((SELECT id FROM master_tests WHERE code = 'disc'), 'SC', 'Steadiness-Compliance', 'Detail Oriented', 'Kandidat sangat stabil, teliti, dan menyukai keteraturan. Andal dalam menangani infrastruktur sistem berskala besar.'),
((SELECT id FROM master_tests WHERE code = 'wpt'), '20', '100', 'Average', 'Kapasitas intelektual dan kognitif umum berada pada tingkat rata-rata populasi.'),
((SELECT id FROM master_tests WHERE code = 'wpt'), '35', '120', 'Superior', 'Kapasitas analitis sangat baik, mampu memecahkan arsitektur permasalahan yang rumit dengan cepat.')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 8. PAYMENT METHODS & INSTRUCTIONS SEED
-- ==========================================
INSERT INTO payment_methods (code, name, type, provider, admin_fee_flat, is_active, sort_order) VALUES
('BCA_VA', 'BCA Virtual Account', 'va', 'Xendit', 4000.00, TRUE, 1),
('MANDIRI_VA', 'Mandiri Virtual Account', 'va', 'Xendit', 4000.00, TRUE, 2),
('BRI_VA', 'BRI Virtual Account', 'va', 'Xendit', 4000.00, TRUE, 3),
('QRIS', 'QRIS (Semua E-Wallet & M-Banking)', 'qr_code', 'Xendit', 0.00, TRUE, 4),
('MANUAL_BCA', 'Transfer Bank BCA (Manual)', 'bank_transfer', 'Manual', 0.00, TRUE, 5)
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    admin_fee_flat = EXCLUDED.admin_fee_flat;

INSERT INTO payment_instructions (payment_method_id, title, content, sort_order) VALUES
((SELECT id FROM payment_methods WHERE code = 'BCA_VA'), 'Pembayaran via m-BCA', '<ol><li>Buka aplikasi m-BCA</li><li>Pilih m-Transfer > BCA Virtual Account</li><li>Masukkan nomor VA</li><li>Konfirmasi nominal Pembayaran</li></ol>', 1),
((SELECT id FROM payment_methods WHERE code = 'QRIS'), 'Pembayaran via QRIS', '<ol><li>Buka aplikasi e-Wallet (GoPay, OVO, Dana) atau m-Banking</li><li>Pilih menu Scan QRIS</li><li>Arahkan kamera ke QR Code di layar</li></ol>', 1),
((SELECT id FROM payment_methods WHERE code = 'MANUAL_BCA'), 'Transfer Manual BCA', '<ol><li>Transfer ke Rekening BCA: 123456789 a.n PT PsikoTest Solusi</li><li>Pastikan nominal transfer sama persis</li><li>Unggah bukti transfer di dashboard Admin</li></ol>', 1)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 9. CUSTOMER TEST QUOTAS SEED
-- ==========================================
INSERT INTO customer_test_quotas (customer_id, test_id, quota) VALUES
((SELECT id FROM customers WHERE email = 'hrd@telkomsel.co.id'), (SELECT id FROM master_tests WHERE code = 'wpt'), 150),
((SELECT id FROM customers WHERE email = 'hrd@telkomsel.co.id'), (SELECT id FROM master_tests WHERE code = 'disc'), 200),
((SELECT id FROM customers WHERE email = 'hrd@telkomsel.co.id'), (SELECT id FROM master_tests WHERE code = 'papi'), 100),
((SELECT id FROM customers WHERE email = 'rekrutmen@gojek.com'), (SELECT id FROM master_tests WHERE code = 'wpt'), 30),
((SELECT id FROM customers WHERE email = 'rekrutmen@gojek.com'), (SELECT id FROM master_tests WHERE code = 'disc'), 50),
((SELECT id FROM customers WHERE email = 'recruitment@bca.co.id'), (SELECT id FROM master_tests WHERE code = 'wpt'), 500),
((SELECT id FROM customers WHERE email = 'recruitment@bca.co.id'), (SELECT id FROM master_tests WHERE code = 'disc'), 500)
ON CONFLICT (customer_id, test_id) DO UPDATE SET quota = EXCLUDED.quota;

-- ==========================================
-- 10. ORDERS & ORDER ITEMS SEED
-- ==========================================
INSERT INTO test_orders (invoice_code, customer_id, order_type, payment_method_id, subtotal, fee_amount, total_amount, status, paid_at) VALUES
('ORD-20260613-001', (SELECT id FROM customers WHERE email = 'rekrutmen@gojek.com'), 'DIRECT_QUOTA', (SELECT id FROM payment_methods WHERE code = 'BCA_VA'), 1125000.00, 4000.00, 1129000.00, 'PAID', NOW()),
('ORD-20260613-002', (SELECT id FROM customers WHERE email = 'rekrutmen@gojek.com'), 'TOPUP_BALANCE', (SELECT id FROM payment_methods WHERE code = 'MANUAL_BCA'), 2500000.00, 0.00, 2500000.00, 'PAID', NOW()),
('ORD-20260614-001', (SELECT id FROM customers WHERE email = 'hrd@telkomsel.co.id'), 'BALANCE_PURCHASE', NULL, 1500000.00, 0.00, 1500000.00, 'PAID', NOW())
ON CONFLICT (invoice_code) DO UPDATE SET status = EXCLUDED.status;

INSERT INTO test_order_items (order_id, test_id, bundle_id, quantity, price_per_item, subtotal) VALUES
((SELECT id FROM test_orders WHERE invoice_code = 'ORD-20260613-001'), (SELECT id FROM master_tests WHERE code = 'disc'), NULL, 45, 25000.00, 1125000.00),
((SELECT id FROM test_orders WHERE invoice_code = 'ORD-20260613-002'), NULL, NULL, 1, 2500000.00, 2500000.00),
((SELECT id FROM test_orders WHERE invoice_code = 'ORD-20260614-001'), (SELECT id FROM master_tests WHERE code = 'wpt'), NULL, 100, 15000.00, 1500000.00)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 11. WALLET TRANSACTIONS SEED
-- ==========================================
INSERT INTO wallet_transactions (customer_id, order_id, type, amount, balance_before, balance_after, description) VALUES
((SELECT id FROM customers WHERE email = 'rekrutmen@gojek.com'), (SELECT id FROM test_orders WHERE invoice_code = 'ORD-20260613-002'), 'TOPUP', 2500000.00, 0.00, 2500000.00, 'Top-up saldo wallet via Transfer Manual BCA'),
((SELECT id FROM customers WHERE email = 'hrd@telkomsel.co.id'), (SELECT id FROM test_orders WHERE invoice_code = 'ORD-20260614-001'), 'PURCHASE_QUOTA', -1500000.00, 6500000.00, 5000000.00, 'Pembelian 100 kuota WPT menggunakan Saldo Wallet')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 12. CAMPAIGNS & PARTICIPANTS SEED
-- ==========================================
INSERT INTO campaigns (customer_id, title, description, access_token, max_participants, is_active) VALUES
((SELECT id FROM customers WHERE email = 'hrd@telkomsel.co.id'), 'Seleksi Manajer IT Telkomsel 2026', 'Rekrutmen Senior IT Manager & System Architect', 'cmp_telkomsel_it_2026', 50, TRUE),
((SELECT id FROM customers WHERE email = 'rekrutmen@gojek.com'), 'Rekrutmen Driver Acquisition Gojek', 'Seleksi pengemudi baru Gojek Jabodetabek', 'cmp_gojek_driver_2026', 100, TRUE)
ON CONFLICT (access_token) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO campaign_tests (campaign_id, test_id) VALUES
((SELECT id FROM campaigns WHERE access_token = 'cmp_telkomsel_it_2026'), (SELECT id FROM master_tests WHERE code = 'wpt')),
((SELECT id FROM campaigns WHERE access_token = 'cmp_telkomsel_it_2026'), (SELECT id FROM master_tests WHERE code = 'disc')),
((SELECT id FROM campaigns WHERE access_token = 'cmp_telkomsel_it_2026'), (SELECT id FROM master_tests WHERE code = 'papi')),
((SELECT id FROM campaigns WHERE access_token = 'cmp_gojek_driver_2026'), (SELECT id FROM master_tests WHERE code = 'disc'))
ON CONFLICT (campaign_id, test_id) DO NOTHING;

INSERT INTO participants (campaign_id, access_token, full_name, email, phone_number, masked_phone, phone_middle_digits, status, started_at, completed_at) VALUES
((SELECT id FROM campaigns WHERE access_token = 'cmp_telkomsel_it_2026'), 'part_budi_001', 'Budi Santoso', 'budi.santoso@email.com', '081234567890', '0812****7890', '3456', 'COMPLETED', NOW() - INTERVAL '2 HOURS', NOW() - INTERVAL '1 HOUR'),
((SELECT id FROM campaigns WHERE access_token = 'cmp_telkomsel_it_2026'), 'part_siti_002', 'Siti Rahma', 'siti.rahma@email.com', '081198765432', '0811****5432', '9876', 'RUNNING', NOW() - INTERVAL '30 MINUTES', NULL),
((SELECT id FROM campaigns WHERE access_token = 'cmp_gojek_driver_2026'), 'part_ahmad_003', 'Ahmad Reza', 'ahmad.reza@email.com', '081211112222', '0812****2222', '1111', 'COMPLETED', NOW() - INTERVAL '5 HOURS', NOW() - INTERVAL '4 HOURS')
ON CONFLICT (access_token) DO UPDATE SET full_name = EXCLUDED.full_name;

INSERT INTO test_results (participant_id, test_id, raw_answers, scoring_data) VALUES
((SELECT id FROM participants WHERE access_token = 'part_budi_001'), (SELECT id FROM master_tests WHERE code = 'wpt'), '{"1": "4", "2": "2", "3": "false", "4": "6000"}', '{"raw": 4, "score": 120, "label": "Superior", "description": "Kapasitas analitis sangat baik."}')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 13. QUOTA TRANSACTIONS SEED
-- ==========================================
INSERT INTO quota_transactions (customer_id, test_id, participant_id, reference_id, quantity, type, description) VALUES
((SELECT id FROM customers WHERE email = 'rekrutmen@gojek.com'), (SELECT id FROM master_tests WHERE code = 'disc'), NULL, 'ORD-20260613-001', 45, 'CREDIT', 'Pembelian kuota DISC via BCA Virtual Account'),
((SELECT id FROM customers WHERE email = 'hrd@telkomsel.co.id'), (SELECT id FROM master_tests WHERE code = 'wpt'), (SELECT id FROM participants WHERE access_token = 'part_budi_001'), 'PART-1', -1, 'DEBIT', 'Penggunaan kuota WPT: Budi Santoso (Seleksi Manajer IT Telkomsel 2026)')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 14. NOTIFICATION TEMPLATES SEED
-- ==========================================
INSERT INTO notification_templates (event_trigger, channel, message_content) VALUES
('OTP_VERIFICATION', 'EMAIL', '<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><style>body{font-family:"Segoe UI",sans-serif;background:#f8fafc;color:#1e293b;margin:0;padding:0}.container{max-width:580px;margin:30px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #e2e8f0}.header{background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4338ca 100%);padding:32px 24px;text-align:center;color:#ffffff}.logo{font-size:24px;font-weight:800;letter-spacing:-0.5px}.logo span{color:#818cf8}.content{padding:32px 28px}.title{font-size:20px;font-weight:700;color:#0f172a;margin-top:0;margin-bottom:12px}.text{font-size:15px;line-height:1.6;color:#475569;margin-bottom:24px}.otp-box{background:#f1f5f9;border:2px dashed #6366f1;border-radius:12px;padding:20px;text-align:center;margin:24px 0}.otp-code{font-size:36px;font-weight:800;letter-spacing:8px;color:#4338ca;font-family:"Courier New",monospace}.expiry-info{font-size:13px;color:#64748b;margin-top:8px;font-weight:500}.warning-box{background:#fffbeb;border-left:4px solid #f59e0b;padding:14px 16px;border-radius:6px;font-size:13px;color:#b45309;margin-top:24px}.footer{background:#f8fafc;padding:20px 24px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0}</style></head><body><div class="container"><div class="header"><div class="logo">PsikoTest<span>.id</span> Enterprise</div></div><div class="content"><h1 class="title">Verifikasi Email Akun Corporate</h1><p class="text">Terima kasih telah mendaftar di <strong>PsikoTest.id Enterprise</strong>. Silakan masukkan kode OTP di bawah ini untuk memverifikasi email perusahaan Anda:</p><div class="otp-box"><div class="otp-code">{otp_code}</div><div class="expiry-info">Kode ini berlaku selama <strong>{expiry_minutes} menit</strong></div></div><p class="text">Setelah verifikasi berhasil, Anda dapat melanjutkan untuk melengkapi profil perusahaan dan dapat masuk kapan saja dengan praktis via <strong>Google SSO</strong>.</p><div class="warning-box"><strong>Keamanan Akun:</strong> Jangan berikan kode OTP ini kepada siapa pun. Tim PsikoTest.id tidak pernah meminta kode OTP Anda.</div></div><div class="footer">&copy; 2026 PsikoTest.id Enterprise. Platform Asesmen Psikotes Online Terintegrasi.</div></div></body></html>'),
('ORDER_PAID', 'WHATSAPP', 'Halo HRD {company_name}, pembayaran pesanan kuota sebesar Rp {amount} dengan Invoice {invoice_code} BERHASIL. Kuota tes Anda telah didepositkan.'),
('ORDER_PENDING', 'WHATSAPP', 'Halo HRD {company_name}, pesanan kuota Anda sebesar Rp {total_amount} menunggu pembayaran. Silakan selesaikan pembayaran lewat {payment_method}.'),
('ASSESSMENT_INVITE', 'EMAIL', 'Yth. {participant_name}, Anda diundang oleh {company_name} untuk mengikuti tes asesmen. Silakan klik link berikut: {assessment_link}'),
('TELEGRAM_NEW_ORDER', 'TELEGRAM', '<b>🚨 ORDER BARU MASUK (PENDING) 🚨</b><br/><br/>• <b>Invoice:</b> <code>{invoice_code}</code><br/>• <b>Klien HR:</b> {company_name} ({customer_email})<br/>• <b>Jenis Order:</b> {order_type}<br/>• <b>Nominal Presisi:</b> <b>Rp {total_amount}</b> (Subtotal: Rp {subtotal} + Kode Unik: Rp {unique_code})<br/>• <b>Metode Bayar:</b> {payment_method}<br/>• <b>Status:</b> Menunggu Pembayaran Transfer<br/><br/>💡 <i>Pastikan Klien mentransfer nominal presisi Rp {total_amount} ke {bank_info}.</i>'),
('TELEGRAM_PAYMENT_PROOF', 'TELEGRAM', '<b>📸 BUKTI TRANSFER UNGGAH BARU! 📸</b><br/><br/>• <b>Invoice:</b> <code>{invoice_code}</code><br/>• <b>Klien HR:</b> {company_name} ({customer_email})<br/>• <b>Nominal Presisi:</b> <b>Rp {total_amount}</b><br/>• <b>Bukti Foto:</b> <a href="{proof_url}">Lihat Gambar Bukti</a><br/><br/>👉 <i>Silakan cek mutasi BCA & konfirmasi LUNAS di Superadmin Panel (/panel/orders)!</i>')
ON CONFLICT (event_trigger) DO UPDATE SET message_content = EXCLUDED.message_content;

-- RESET SEQUENCES FOR ID COUNTERS
SELECT setval('admins_id_seq', COALESCE((SELECT MAX(id) FROM admins), 1));
SELECT setval('customers_id_seq', COALESCE((SELECT MAX(id) FROM customers), 1));
SELECT setval('master_tests_id_seq', COALESCE((SELECT MAX(id) FROM master_tests), 1));
SELECT setval('test_bundles_id_seq', COALESCE((SELECT MAX(id) FROM test_bundles), 1));
SELECT setval('question_banks_id_seq', COALESCE((SELECT MAX(id) FROM question_banks), 1));
SELECT setval('scoring_configs_id_seq', COALESCE((SELECT MAX(id) FROM scoring_configs), 1));
SELECT setval('test_norms_id_seq', COALESCE((SELECT MAX(id) FROM test_norms), 1));
SELECT setval('campaigns_id_seq', COALESCE((SELECT MAX(id) FROM campaigns), 1));
SELECT setval('participants_id_seq', COALESCE((SELECT MAX(id) FROM participants), 1));
SELECT setval('test_results_id_seq', COALESCE((SELECT MAX(id) FROM test_results), 1));
SELECT setval('payment_methods_id_seq', COALESCE((SELECT MAX(id) FROM payment_methods), 1));
SELECT setval('payment_instructions_id_seq', COALESCE((SELECT MAX(id) FROM payment_instructions), 1));
SELECT setval('test_orders_id_seq', COALESCE((SELECT MAX(id) FROM test_orders), 1));
SELECT setval('test_order_items_id_seq', COALESCE((SELECT MAX(id) FROM test_order_items), 1));
SELECT setval('wallet_transactions_id_seq', COALESCE((SELECT MAX(id) FROM wallet_transactions), 1));
SELECT setval('customer_test_quotas_id_seq', COALESCE((SELECT MAX(id) FROM customer_test_quotas), 1));
SELECT setval('quota_transactions_id_seq', COALESCE((SELECT MAX(id) FROM quota_transactions), 1));
SELECT setval('payment_logs_id_seq', COALESCE((SELECT MAX(id) FROM payment_logs), 1));
SELECT setval('landing_page_contents_id_seq', COALESCE((SELECT MAX(id) FROM landing_page_contents), 1));
SELECT setval('notification_templates_id_seq', COALESCE((SELECT MAX(id) FROM notification_templates), 1));
SELECT setval('notification_logs_id_seq', COALESCE((SELECT MAX(id) FROM notification_logs), 1));
  `;

  try {
    await pool.query(seedQuery);
    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
