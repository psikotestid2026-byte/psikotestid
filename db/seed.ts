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
DELETE FROM question_banks WHERE test_id = (SELECT id FROM master_tests WHERE code = 'disc');

INSERT INTO question_banks (test_id, question_type, question_data, order_number) VALUES
((SELECT id FROM master_tests WHERE code = 'wpt'), 'multiple_choice', '{"text": "Bulan lalu pada awal tahun ini adalah:", "options": ["Januari", "Maret", "Juli", "Desember", "Oktober"]}', 1),
((SELECT id FROM master_tests WHERE code = 'wpt'), 'multiple_choice', '{"text": "MENANGKAP adalah lawan kata dari:", "options": ["Meletakkan", "Membebaskan", "Beresiko", "Berusaha", "Turun tingkat", "Melepaskan"]}', 2),
((SELECT id FROM master_tests WHERE code = 'wpt'), 'true_false', '{"text": "Apakah kata KLIEN dan PELANGGAN memiliki arti yang persis sama dalam konteks hukum tata negara?"}', 3),
((SELECT id FROM master_tests WHERE code = 'wpt'), 'short_answer', '{"text": "Sebuah pesawat terbang 300 kaki dalam 0.5 detik. Pada kecepatan yang sama berapa kaki ia terbang dalam 10 detik?"}', 4),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Mudah bergaul, ramah, menyenangkan", "Penuh Kepercayaan, percaya kepada orang lain", "Petualang, pengambil risiko", "Toleran, penuh hormat"]}', 1),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Lembut dalam tutur kata, pendiam", "Optimis, berpikir ke masa depan", "Suka menjadi pusat perhatian, mudah bersosialisasi", "Pendamai, menyukai keseimbangan"]}', 2),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Memotivasi orang lain", "Berjuang mencapai kesempurnaan", "Menyukai menjadi bagian dari kelompok", "Ingin menggapai hasil/target"]}', 3),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Mudah frustasi", "Menyimpan sendiri perasaan dan emosi", "Dapat menceritakan kejadian dengan versi saya sendiri", "Berani menghadapi pihak oposisi"]}', 4),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Lincah, suka bicara", "Cekatan, mempunyai keyakinan", "Mencoba menjaga keseimbangan", "Mencoba mengikuti aturan"]}', 5),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Dapat mengelola waktu secara efisien", "Tergesa-gesa, merasa tertekan", "Lebih mementingkan hal-hal sosial", "Menuntaskan apa yang sudah dikerjakan"]}', 6),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Menolak perubahan yang mendadak", "Cenderung berjanji secara berlebihan", "Menarik diri ketika tertekan", "Tidak takut untuk melawan"]}', 7),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Motivator yang andal", "Pendengar yang baik", "Penganalisa yang teliti", "Pendelegasi yang efisien"]}', 8),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Hasil adalah yang terpenting", "Mengerjakan dengan benar, ketepatan sangat penting", "Menikmati proses", "Mengerjakan bersama-sama"]}', 9),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Tidak tergantung apapun, kontrol diri", "Akan membeli berdasarkan hasrat", "Akan menunggu, tidak ada tekanan", "Akan membelanjakan sesuai keinginan"]}', 10),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Ramah, teman yang menyenangkan", "Unik, bosan dengan rutinitas", "Sering mengubah sesuatu", "Menginginkan kepastian"]}', 11),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Tidak konfrontatif, mudah menyerah", "Sangat perhatian terhadap detail", "Mudah berubah pada detik-detik terakhir", "Penuntut, gegabah"]}', 12),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Menghendaki kemajuan", "Mudah puas diri, merasa terpenuhi", "Memperlihatkan perasaan secara terbuka, ekspresif", "Rendah hati, sederhana"]}', 13),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Dingin, pendiam", "Bahagia, riang", "Menyenangkan, baik hati", "Tegas, pemberani"]}', 14),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Menghabiskan waktu yang berkualitas dengan orang lain", "Mempersiapkan masa depan, mempersiapkan diri", "Menyukai petualangan baru", "Menikmati penghargaan atas pencapaian"]}', 15),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Peraturan perlu dipertanyakan", "Peraturan membuat adil", "Peraturan membosankan", "Peraturan membuat aman"]}', 16),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Pendidikan, kebudayaan", "Pencapaian, penghargaan", "Keselamatan, keamanan", "Sosialisasi, pertemuan kelompok"]}', 17),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Mengambil tanggung jawab, terlibat langsung", "Senang berteman, antusias", "Mudah ditebak, konsisten", "Berhati-hati, waspada"]}', 18),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Tidak mudah dikalahkan", "Melakukan seperti yang diperintahkan, mengikuti pemimpin", "Penuh semangat, gembira", "Menghendaki keteraturan, rapi"]}', 19),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Saya akan memimpin mereka", "Saya akan mengikuti dengan setia", "Saya akan membujuk mereka", "Saya akan mendapatkan faktanya"]}', 20),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Memikirkan orang lain terlebih dahulu", "Kompetitif, menyukai tantangan", "Optimis, bersikap positif", "Berpikir logis, sistematis"]}', 21),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Menyenangkan orang lain, ramah", "Tertawa terbahak-bahak, enerjik", "Berani, tegas", "Tenang, pendiam"]}', 22),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Menghendaki kekuasaan lebih", "Menghendaki kesempatan baru", "Menghindari konflik", "Menghendaki petunjuk dan arahan yang jelas"]}', 23),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc', '{"options": ["Dapat diandalkan, dapat dipercaya", "Kreatif, unik", "Berorientasi kepada hasil", "Berpegang teguh pada standar yang tinggi, akurat"]}', 24),
((SELECT id FROM master_tests WHERE code = 'tech_js'), 'essay', '{"text": "Jelaskan perbedaan mendasar antara eksekusi Synchronous dan Asynchronous di ekosistem Node.js, sertakan contoh sederhana penggunaan Promises!"}', 1),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya banyak bicara."}', 1),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya cenderung mencari-cari kesalahan orang lain."}', 2),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya melakukan pekerjaan dengan tuntas."}', 3),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya sering merasa murung atau sedih."}', 4),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya memiliki ide-ide baru yang orisinil."}', 5),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya cenderung pendiam."}', 6),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya suka menolong dan tidak egois."}', 7),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya terkadang bisa bertindak ceroboh."}', 8),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya santai dan mampu mengatasi stres dengan baik."}', 9),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya memiliki rasa ingin tahu yang besar terhadap banyak hal."}', 10),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya penuh energi."}', 11),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya sering memulai pertengkaran dengan orang lain."}', 12),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya adalah pekerja yang dapat diandalkan."}', 13),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya mudah merasa tegang."}', 14),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya pemikir yang mendalam dan cerdik."}', 15),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya mampu membangkitkan antusiasme orang lain."}', 16),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya memiliki sifat pemaaf."}', 17),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya cenderung kurang terorganisir."}', 18),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya sering merasa khawatir."}', 19),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya memiliki imajinasi yang aktif."}', 20),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya cenderung tidak banyak bicara."}', 21),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya mudah mempercayai orang lain."}', 22),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya cenderung malas."}', 23),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya stabil secara emosi dan tidak mudah marah."}', 24),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya sangat inventif atau kreatif."}', 25),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya memiliki kepribadian yang asertif atau tegas."}', 26),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya terkadang bersikap dingin dan acuh tak acuh."}', 27),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya tekun hingga tugas selesai."}', 28),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Suasana hati saya mudah berubah-ubah (moody)."}', 29),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya sangat menghargai pengalaman seni dan estetika."}', 30),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya terkadang pemalu dan menahan diri."}', 31),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya penuh perhatian dan baik hati kepada hampir semua orang."}', 32),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya melakukan segala sesuatu secara efisien."}', 33),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya tetap tenang dalam situasi yang menegangkan."}', 34),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya lebih menyukai pekerjaan yang bersifat rutinitas."}', 35),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya mudah bergaul dan suka bersosialisasi."}', 36),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya terkadang bersikap kasar pada orang lain."}', 37),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya membuat rencana dan mematuhinya."}', 38),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya mudah merasa gugup."}', 39),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya suka merenung dan bermain dengan ide-ide."}', 40),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya kurang memiliki ketertarikan pada hal-hal berbau seni."}', 41),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya suka bekerja sama dengan orang lain."}', 42),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Perhatian saya mudah teralihkan."}', 43),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'likert_5', '{"text": "Saya memiliki pemahaman yang baik dalam seni, musik, atau sastra."}', 44)
ON CONFLICT DO NOTHING;

DELETE FROM question_banks WHERE test_id = (SELECT id FROM master_tests WHERE code = 'enneagram');

INSERT INTO question_banks (test_id, question_type, question_data, order_number) VALUES
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya suka ide melibatkan pasangan intim saya dalam kehidupan kerja saya, jadi kami tidak berpisah.", "type_target": 3}', 1),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Kebanyakan orang melihat saya lebih damai daripada yang sebenarnya.", "type_target": 9}', 2),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya sering merasakan kerinduan tanpa benar-benar tahu mengapa.", "type_target": 4}', 3),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Keinginan saya untuk berpikir positif terkadang bisa seperti kecanduan.", "type_target": 7}', 4),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Memiliki ruang pribadi adalah kebutuhan, bukan kemewahan.", "type_target": 5}', 5),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Bertemu deadline saya lebih penting daripada mendapatkan setiap detail kecil tepat.", "type_target": 3}', 6),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Perasaan takut saya kurang kuat ketika saya memiliki proyek untuk dikerjakan.", "type_target": 6}', 7),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya bisa merangkul sisi manis dari kesedihan.", "type_target": 4}', 8),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Aku adalah kekuatan yang harus diperhitungkan.", "type_target": 8}', 9),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Ketidakjujuran saya kadang-kadang bisa melenyapkan orang.", "type_target": 8}', 10),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya benci meminta bantuan, meskipun saya suka memberikannya.", "type_target": 2}', 11),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya merasa sulit untuk menahan ketika datang untuk menawarkan bantuan dan saran.", "type_target": 2}', 12),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Menjadi pemenang membuat usaha saya berharga.", "type_target": 3}', 13),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Berada di alam sangat menenangkanku.", "type_target": 9}', 14),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Aku bisa marah ketika semuanya menjadi terlalu rumit.", "type_target": 9}', 15),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Membuat orang lain tertawa membantu saya merasa lebih tenang dan kurang cemas.", "type_target": 6}', 16),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Situasi emosional yang kuat membuat saya merasa benar-benar hidup.", "type_target": 4}', 17),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya suka melakukan sesuatu yang baru, bukan hal yang sama.", "type_target": 7}', 18),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya bangga dengan cara saya membuat orang merasa nyaman.", "type_target": 2}', 19),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya suka melakukan banyak hal sehingga mudah untuk menyebarkan diri terlalu kurus.", "type_target": 7}', 20),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Keinginan saya untuk mencapai tidak mengenal batas.", "type_target": 3}', 21),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Bahkan ketika saya terlihat diterima oleh suatu kelompok, sulit untuk merasa bahwa saya benar-benar milik.", "type_target": 4}', 22),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya bisa keras kepala dengan cara yang menghindari konfrontasi langsung.", "type_target": 9}', 23),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Orang mengatakan saya memiliki aura yang kuat.", "type_target": 8}', 24),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya bisa membuat peraturan dan menegakkannya.", "type_target": 8}', 25),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Sulit untuk tidak menangis ketika saya merasa sentimental, bahkan ketika saya berada di depan umum.", "type_target": 2}', 26),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya bisa merasa kesal karena tidak ada alasan khusus.", "type_target": 1}', 27),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya mampu menciptakan keharmonisan di lingkungan saya.", "type_target": 9}', 28),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya mencari orang-orang yang tidak dapat melihat diri mereka sendiri.", "type_target": 8}', 29),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Menemukan tujuan hidup saya berarti segalanya bagi saya.", "type_target": 4}', 30),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya lebih suka memikirkan masalah sebelum bertindak.", "type_target": 5}', 31),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Belajar untuk menegaskan diri memberi saya kepercayaan diri dan mengurangi kecemasan saya.", "type_target": 6}', 32),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya tidak bisa membantu tetapi melihat kedua sisi dari hampir semua pertanyaan.", "type_target": 9}', 33),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya merasa tidak nyaman berbicara dengan orang-orang yang tampaknya tidak terlibat secara emosional.", "type_target": 2}', 34),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya ingin membuat hidup sederhana dan tidak rumit.", "type_target": 9}', 35),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Mempertahankan hubungan dekat dengan teman dan keluarga membantu saya merasa aman di dunia yang kacau.", "type_target": 6}', 36),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Meskipun saya dapat dengan mudah membayangkan panik dalam krisis, ketika keadaan darurat yang sebenarnya datang, saya melakukannya dengan sangat baik.", "type_target": 6}', 37),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya jauh lebih dari hati orang daripada kepala orang.", "type_target": 2}', 38),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Mendapatkan pekerjaan yang dilakukan dengan benar lebih penting daripada menyelesaikan pekerjaan dengan cepat.", "type_target": 1}', 39),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya suka membaca terlebih dahulu sebelum mencoba beberapa aktivitas baru.", "type_target": 5}', 40),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya lebih menghargai orisinalitas daripada sukses.", "type_target": 4}', 41),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Sesuai dengan norma kelompok tidak memungkinkan saya untuk mengungkapkan siapa diri saya sebenarnya.", "type_target": 4}', 42),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya merasa sulit untuk menanggung aspek-aspek kehidupan yang menumpulkan hati dan membunuh jiwa.", "type_target": 4}', 43),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Tidak ada yang saya nikmati seperti membuat perkenalan dan membantu orang saling mengenal satu sama lain.", "type_target": 2}', 44),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Sebagai seorang anak, saya lebih serius dan realistis daripada banyak anak lain.", "type_target": 1}', 45),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Detail masa kecil saya terkadang tampak kabur dan jauh.", "type_target": 9}', 46),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Tidak ada yang lebih kritis terhadap saya daripada saya sendiri.", "type_target": 1}', 47),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya sering merasa sulit untuk mencapai sesuatu tanpa terganggu oleh tugas-tugas lain.", "type_target": 9}', 48),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Iman dan kepercayaan itu sulit bagiku, karena aku meragukan hal-hal yang tampaknya diterima sebagian besar orang.", "type_target": 6}', 49),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Perhatian saya terlalu mudah pergi ke skenario terburuk, bahkan ketika mereka tidak mungkin terjadi.", "type_target": 6}', 50),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya cenderung membuat diri saya begitu sibuk dengan pekerjaan sehingga tidak ada banyak waktu untuk duduk dan merenung.", "type_target": 3}', 51),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya terkadang dilihat oleh orang lain sebagai tidak responsif secara sosial.", "type_target": 5}', 52),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya merasakan dorongan untuk melarikan diri ketika saya mendarat dalam situasi yang membutuhkan komitmen emosional.", "type_target": 7}', 53),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya cenderung menghormati atau menentang otoritas.", "type_target": 6}', 54),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya suka berkonsentrasi pada satu hal pada satu waktu dan tidak menghargai gangguan.", "type_target": 1}', 55),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Terkadang sulit untuk membedakan antara gambar yang saya proyeksikan dan orang yang ada di dalam saya.", "type_target": 3}', 56),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya selalu sadar akan aturan yang harus saya ikuti, apakah saya memilih untuk menyesuaikan dengan mereka atau melanggarnya.", "type_target": 6}', 57),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya optimis tentang banyak hal.", "type_target": 7}', 58),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Sulit untuk tidak merasa gugup saat bertemu orang baru.", "type_target": 6}', 59),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya tidak dapat membayangkan kehidupan tanpa banyak kenalan dan kontak sosial saya.", "type_target": 2}', 60),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Naluri pertama saya selalu membantu orang, apakah mereka memintanya atau tidak.", "type_target": 2}', 61),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Orang-orang melihat saya sebagai pemimpin alami.", "type_target": 8}', 62),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Dalam situasi kelompok, saya biasanya lebih suka berbaur, daripada mengambil pimpinan atau keberatan suara.", "type_target": 9}', 63),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Memiliki rutinitas sehari-hari membantu saya tetap di jalur dan menyelesaikan berbagai hal.", "type_target": 9}', 64),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya tidak perlu membuktikan apa pun kepada siapa pun.", "type_target": 8}', 65),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Sebagai orang tua atau wali, saya lebih ketat daripada permisif.", "type_target": 1}', 66),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya bekerja keras untuk berhasil karena kegagalan bukanlah pilihan.", "type_target": 3}', 67),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya lebih bersedia daripada banyak orang untuk melakukan pekerjaan \"menggerutu\" pada proyek kelompok.", "type_target": 6}', 68),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Menjadi orang yang autentik lebih berarti bagiku daripada kesuksesan materi.", "type_target": 4}', 69),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya memiliki begitu banyak ide berdengung di kepala saya sehingga sulit untuk mengerjakannya satu per satu.", "type_target": 7}', 70),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya adalah karyawan yang sangat andal, setia, dan mantap.", "type_target": 6}', 71),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Seringkali saya merasa bahwa pendapat pribadi saya tidak begitu penting untuk diskusi kelompok.", "type_target": 9}', 72),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya sangat sadar akan kesan yang saya buat pada orang lain.", "type_target": 3}', 73),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Kebanggaan adalah kekuatan terbesar saya dan kelemahan terbesar saya.", "type_target": 2}', 74),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Meluangkan waktu untuk hubungan bisa jadi sulit karena jadwal sibuk saya.", "type_target": 3}', 75),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Memberi, peduli, dan berbagi sangat berarti bagiku.", "type_target": 2}', 76),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Mendengarkan dengan tidak sopan datang dengan mudah bagi saya.", "type_target": 9}', 77),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Ide sering datang kepada saya seperti kilatan petir.", "type_target": 7}', 78),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya memiliki banyak energi gugup dan imajinasi yang terlalu aktif.", "type_target": 6}', 79),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Ketidaktahuan emosi benar-benar menggangguku.", "type_target": 4}', 80),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya bisa sangat terbelit oleh keprihatinan saya terhadap orang lain.", "type_target": 2}', 81),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya memiliki kekuatan untuk mengambil tugas yang akan mengalahkan orang yang lebih lemah.", "type_target": 8}', 82),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Emosi mendalam saya adalah sumber daya kreatif terbesar saya.", "type_target": 4}', 83),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Ini sangat memalukan untuk dikritik publik.", "type_target": 2}', 84),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Orang yang tidak menganggap serius sesuatu mengganggu saya.", "type_target": 1}', 85),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Tidak ada yang memotivasi saya seperti pencapaian yang tinggi.", "type_target": 3}', 86),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Mengendalikan amarah saya sangat sulit.", "type_target": 8}', 87),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya disebut perfeksionis, meskipun saya merasa tidak sempurna.", "type_target": 1}', 88),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Karena saya melakukan banyak hal untuk orang lain, saya terkadang merasa berhak atas perlakuan khusus.", "type_target": 2}', 89),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Pengakuan publik sangat berarti bagi saya.", "type_target": 3}', 90),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya cenderung melihat orang lain sebagai sederajat.", "type_target": 7}', 91),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya ingin memastikan bahwa saya memenuhi standar perilaku tinggi saya sendiri.", "type_target": 1}', 92),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Ketika saya beresonansi dengan seseorang, itu bukan pada tingkat yang dangkal.", "type_target": 4}', 93),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Penting bagi saya untuk menjadi pendengar yang simpatik dan teman yang mendukung.", "type_target": 2}', 94),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya menghargai makanan yang baik, perusahaan yang baik, dan kehidupan yang baik.", "type_target": 7}', 95),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Terkadang melakukan pelanggaran adalah satu-satunya cara untuk menaklukkan rasa takut.", "type_target": 6}', 96),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya sangat tertarik dengan pekerjaan kemanusiaan dengan orang atau hewan.", "type_target": 2}', 97),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Kegembiraan alami saya biasanya membuat saya tidak terjebak dalam emosi yang berat.", "type_target": 7}', 98),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya adalah pemelihara alami.", "type_target": 2}', 99),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya biasanya menikmati mengendap-endap dan kehilangan diri sendiri dalam tugas-tugas kecil kehidupan sehari-hari.", "type_target": 9}', 100),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya adalah pengamat yang cermat terhadap orang dan situasi.", "type_target": 5}', 101),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Meskipun saya ingin diterima, saya benci gagasan penyesuaian tanpa berpikir.", "type_target": 4}', 102),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Ketika saya peduli dengan orang lain, saya ingin memperbaiki perilaku mereka.", "type_target": 1}', 103),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Tidak terlalu menyenangkan hanya melakukan satu aktivitas dalam satu waktu.", "type_target": 7}', 104),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Ketika saya berjalan di ruangan penuh orang, saya langsung merasakan siapa yang bertanggung jawab.", "type_target": 8}', 105),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya senang mencari solusi yang cerdik untuk masalah yang tidak biasa.", "type_target": 5}', 106),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya menemukan tampilan umum emosi tidak menarik.", "type_target": 5}', 107),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya mengambil sesuatu secara pribadi dan tidak peduli siapa yang mengetahuinya.", "type_target": 8}', 108),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Kebanyakan orang menganggap saya tidak menghakimi dan santai.", "type_target": 9}', 109),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Menjunjung tinggi etika dan prinsip sangat penting bagi saya.", "type_target": 1}', 110),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Menerjemahkan visi batin saya ke dalam karya seni dapat menjadi sangat menarik.", "type_target": 4}', 111),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya dapat menyesuaikan pakaian dan perilaku saya dengan kebutuhan situasi.", "type_target": 3}', 112),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya mencoba membuka opsi saya.", "type_target": 7}', 113),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya dapat mengabaikan emosi yang menyakitkan untuk menyelesaikan pekerjaan.", "type_target": 3}', 114),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Game dapat membuat saya terpesona.", "type_target": 5}', 115),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Berada di lingkungan yang plastik dan impersonal hanya menguras kehidupan langsung dari saya.", "type_target": 4}', 116),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya suka mempelajari pola yang rumit dan konsep yang rumit.", "type_target": 5}', 117),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya memiliki kritik batin yang sangat aktif.", "type_target": 1}', 118),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Kadang-kadang sulit untuk memenuhi kebutuhan pribadi saya sendiri.", "type_target": 9}', 119),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya merasa sulit untuk tidak menghakimi orang terlalu keras.", "type_target": 1}', 120),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Rumah dan keluarga saya memberi saya tempat berlindung yang aman di dunia yang tidak aman.", "type_target": 6}', 121),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Kata-kata saya adalah ikatan saya.", "type_target": 8}', 122),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Toleransi datang dengan mudah bagi saya.", "type_target": 9}', 123),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya tidak keberatan memberikan cinta yang kuat ketika dibutuhkan.", "type_target": 8}', 124),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya merasa cukup bersalah ketika saya marah tanpa pembenaran.", "type_target": 1}', 125),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya cenderung tidak taat ketika orang mendorong reaksi emosional.", "type_target": 5}', 126),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Ketika saya menyukai seni, sering ada sesuatu yang aneh atau tidak biasa.", "type_target": 5}', 127),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Kenyamanan yang familier memberi saya rasa damai.", "type_target": 9}', 128),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya jarang menerima ide yang tidak bertahan dalam ujian waktu.", "type_target": 6}', 129),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Kadang-kadang butuh waktu untuk emosi saya untuk mengejar pikiran saya.", "type_target": 5}', 130),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya adalah ketua di lingkaran teman-teman saya.", "type_target": 8}', 131),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Merasa rentan membuatku menggeliat.", "type_target": 8}', 132),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya tidak peduli dengan gangguan ketika saya mencoba memikirkan masalah.", "type_target": 5}', 133),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Teman-teman menggambarkan saya sebagai orang yang hangat, romantis, dan penuh kasih sayang.", "type_target": 2}', 134),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Lebih dari segalanya, saya adalah tipe orang yang \"bisa melakukan\".", "type_target": 3}', 135),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Tidak sulit untuk berhati-hati jika diperlukan.", "type_target": 5}', 136),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Teman-teman terkadang mengatakan bahwa saya terlalu keras untuk diri sendiri.", "type_target": 1}', 137),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya menjadi tegang atau kritis lebih mudah daripada kebanyakan orang.", "type_target": 1}', 138),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Berada di mata publik adalah sesuatu yang biasanya saya nikmati.", "type_target": 3}', 139),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya selalu melindungi apa milik saya.", "type_target": 8}', 140),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Sudah menjadi sifat saya untuk mencari hal baru, bukan rutinitas.", "type_target": 7}', 141),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya sangat sensitif dengan suasana hati orang lain.", "type_target": 4}', 142),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Apapun yang saya lakukan, saya selalu berusaha melebihi yang terbaik dari diri saya.", "type_target": 3}', 143),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya sangat setia kepada orang-orang yang telah mendapatkan kepercayaan saya.", "type_target": 6}', 144),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya seorang pemikir sistem yang dapat memisahkan pikiran dari emosi.", "type_target": 5}', 145),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya adalah orang yang selamat alami, dan persediaan saya ditimbun untuk membuktikannya!", "type_target": 8}', 146),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya sering dapat memilih ide \"keluar dari udara.\"", "type_target": 7}', 147),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Ketika saya dihalau, itu membantu saya menjalankan rencana yang ada, bukan hanya mengembangkan yang baru.", "type_target": 7}', 148),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya tahu bagaimana rasanya mengalami kesepian yang intens.", "type_target": 4}', 149),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Dalam hubungan yang intim, saya sering mengalami perasaan cemburu, meskipun saya tidak menyetujui mereka.", "type_target": 1}', 150),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Prestasi dan pengakuan memberi tahu saya bahwa saya menargetkan sasaran saya.", "type_target": 3}', 151),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya pandai membuat orang tertawa, karena saya cepat tanggap dan tidak menganggap diri saya terlalu serius.", "type_target": 7}', 152),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya menggunakan \"radar batin\" saya untuk menggerakkan motif orang lain dan memutuskan apakah aman untuk memercayai mereka atau tidak.", "type_target": 6}', 153),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya menghargai pertukaran intelektual lebih dari berbagi secara emosional.", "type_target": 5}', 154),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya merasa terkejut dengan proyek-proyek inovatif atau ide-ide visioner.", "type_target": 7}', 155),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Kata-kata \"harus\" dan \"seharusnya\" muncul banyak dalam pemikiran saya.", "type_target": 1}', 156),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Banyak orang menganggap saya terlalu emosional atau dramatis.", "type_target": 4}', 157),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya sering menjadi ahli dalam topik yang saya pelajari.", "type_target": 5}', 158),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Sendirian memungkinkan saya untuk berhubungan dengan diri saya yang terdalam.", "type_target": 4}', 159),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya lebih terpisah daripada emosional.", "type_target": 5}', 160),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya bersedia berkorban untuk berada dalam hubungan.", "type_target": 2}', 161),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya memiliki selera besar dan keinginan \"lebih besar dari hidup\".", "type_target": 8}', 162),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Istilah \"Tipe A kepribadian\" diciptakan dengan saya dalam pikiran.", "type_target": 3}', 163),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Jika saya masuk ke grup yang tidak memiliki pemimpin, saya akan bertanggung jawab.", "type_target": 8}', 164),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Terkadang saya merasa seperti akan meledak.", "type_target": 1}', 165),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya bisa menjadi penindas kejam yang menempel untuk diunggulkan.", "type_target": 6}', 166),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Pembicaraan kecil tidak banyak bermanfaat bagi saya.", "type_target": 5}', 167),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Merasa dihargai sangat berarti bagiku.", "type_target": 2}', 168),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Membuat kesan yang baik itu penting bagiku.", "type_target": 3}', 169),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Mengetahui saya benar mengambil tepi dari ketegangan yang saya rasakan.", "type_target": 1}', 170),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Keputusan pribadi yang besar dapat melumpuhkan saya.", "type_target": 9}', 171),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya alami suka bermain, suka bersenang-senang, dan berjiwa bebas.", "type_target": 7}', 172),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Kadang-kadang lebih mudah untuk langsung menghadapi ketakutan saya daripada membiarkan imajinasi saya menjadi liar.", "type_target": 6}', 173),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya seorang pemain tim yang hebat.", "type_target": 3}', 174),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya secara mental keluar ketika saya kekurangan waktu sendirian.", "type_target": 5}', 175),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Pikiran saya cepat, tetapi tidak terlalu menyeluruh.", "type_target": 7}', 176),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Sangat mudah untuk membiarkan teman-teman saya memutuskan bagaimana kita menghabiskan waktu bersama.", "type_target": 9}', 177),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya mudah mengidentifikasi dengan luka yang telah saya terima dalam hidup.", "type_target": 4}', 178),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Saya mengambil tindakan ketika orang lain masih mencoba memilah perasaan mereka.", "type_target": 8}', 179),
((SELECT id FROM master_tests WHERE code = 'enneagram'), 'likert_4', '{"text": "Kebebasan lebih berarti bagi saya daripada hampir apa pun.", "type_target": 7}', 180);

-- ==========================================
-- 7. SCORING CONFIGS & NORMS SEED
-- ==========================================
INSERT INTO scoring_configs (test_id, formula_type, config_data) VALUES
((SELECT id FROM master_tests WHERE code = 'wpt'), 'matching_key', '{"key": {"1": "4", "2": "2", "3": "false", "4": "6000"}}'),
((SELECT id FROM master_tests WHERE code = 'disc'), 'disc_matrix', '{"matrix_p": {"1": ["I","C","D","S"]}, "matrix_k": {"1": ["C","I","S","D"]}}'),
((SELECT id FROM master_tests WHERE code = 'bigfive'), 'bigfive_matrix', '{"dimensions": {"E": [1,6,11,16,21,26,31,36], "A": [2,7,12,17,22,27,32,37,42], "C": [3,8,13,18,23,28,33,38,43], "N": [4,9,14,19,24,29,34,39], "O": [5,10,15,20,25,30,35,40,41,44]}, "reversed": [2,6,8,9,12,18,21,23,24,27,31,34,35,37,41,43]}')
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
('TELEGRAM_NEW_ORDER', 'TELEGRAM', '<b>🚨 ORDER BARU MASUK (PENDING) 🚨</b><br/><br/>• <b>Invoice:</b> <code>{invoice_code}</code><br/>• <b>Klien HR:</b> {company_name} ({customer_email})<br/>• <b>Kontak HR:</b> {contact_name} ({phone_number})<br/>• <b>Hubungi WA HR:</b> <a href="{whatsapp_link}">Chat WhatsApp ({phone_number})</a><br/>• <b>Jenis Order:</b> {order_type}<br/>• <b>Nominal Presisi:</b> <b>Rp {total_amount}</b> (Subtotal: Rp {subtotal} + Kode Unik: Rp {unique_code})<br/>• <b>Metode Bayar:</b> {payment_method}<br/>• <b>Status:</b> Menunggu Pembayaran Transfer<br/><br/>💡 <i>Pastikan Klien mentransfer nominal presisi Rp {total_amount} ke {bank_info}.</i>'),
('TELEGRAM_PAYMENT_PROOF', 'TELEGRAM', '<b>📸 BUKTI TRANSFER UNGGAH BARU! 📸</b><br/><br/>• <b>Invoice:</b> <code>{invoice_code}</code><br/>• <b>Klien HR:</b> {company_name} ({customer_email})<br/>• <b>Kontak HR:</b> {contact_name} ({phone_number})<br/>• <b>Hubungi WA HR:</b> <a href="{whatsapp_link}">Chat WhatsApp ({phone_number})</a><br/>• <b>Nominal Presisi:</b> <b>Rp {total_amount}</b><br/>• <b>Bukti Foto:</b> <a href="{proof_url}">Lihat Gambar Bukti</a><br/><br/>👉 <i>Silakan cek mutasi BCA & konfirmasi LUNAS di Superadmin Panel (/panel/orders)!</i>'),
('PARTICIPANT_COMPLETED_HR_NOTIF', 'EMAIL', '<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><style>body{font-family:"Segoe UI",sans-serif;background:#f8fafc;color:#1e293b;margin:0;padding:0}.container{max-width:580px;margin:30px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #e2e8f0}.header{background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4338ca 100%);padding:32px 24px;text-align:center;color:#ffffff}.logo{font-size:24px;font-weight:800;letter-spacing:-0.5px}.logo span{color:#818cf8}.content{padding:32px 28px}.title{font-size:20px;font-weight:700;color:#0f172a;margin-top:0;margin-bottom:12px}.text{font-size:15px;line-height:1.6;color:#475569;margin-bottom:24px}.info-box{background:#f1f5f9;border-left:4px solid #4338ca;padding:16px 20px;border-radius:8px;margin:20px 0}.info-item{margin-bottom:8px;font-size:14px;color:#334155}.info-item strong{color:#0f172a}.btn{display:inline-block;background:#4338ca;color:#ffffff!important;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;margin-top:16px}.footer{background:#f8fafc;padding:20px 24px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0}</style></head><body><div class="container"><div class="header"><div class="logo">PsikoTest<span>.id</span> Enterprise</div></div><div class="content"><h1 class="title">Notifikasi Hasil Asesmen Peserta Selesai 🎉</h1><p class="text">Halo Team HR <strong>{company_name}</strong>,</p><p class="text">Kandidat peserta di bawah ini telah berhasil menyelesaikan seluruh rangkaian sesi tes psikotes online:</p><div class="info-box"><div class="info-item"><strong>Nama Kandidat:</strong> {participant_name}</div><div class="info-item"><strong>Email Kandidat:</strong> {participant_email}</div><div class="info-item"><strong>Sesi Ujian (Campaign):</strong> {campaign_title}</div><div class="info-item"><strong>Waktu Selesai:</strong> {completion_time}</div></div><p class="text">📎 <strong>Lampiran File PDF:</strong> Laporan hasil analisis asesmen psikotes lengkap kandidat telah kami lampirkan secara otomatis dalam email ini (format PDF).</p><p class="text">Anda juga dapat melihat rekapan kumulatif dan mengunduh ulang laporan hasil kandidat ini kapan saja melalui Dashboard Panel HR Client:</p><p style="text-align:center;"><a href="{dashboard_url}" class="btn">Buka Panel HR Client & Lihat Hasil ➔</a></p></div><div class="footer">&copy; 2026 PsikoTest.id Enterprise. Platform Asesmen Psikotes Online Terintegrasi.</div></div></body></html>')
ON CONFLICT (event_trigger) DO UPDATE SET message_content = EXCLUDED.message_content;

-- ==========================================
-- 15. CMS & HR WELCOME BONUS SEED
-- ==========================================
INSERT INTO landing_page_contents (section_key, title, subtitle, content, is_active) VALUES
('hr_welcome_bonus', 'Bonus Saldo Pendaftaran HR Client Baru', 'Konfigurasi bonus saldo pendaftaran gratis untuk akun HR baru', '{"is_enabled": true, "bonus_amount": 25000}', TRUE)
ON CONFLICT (section_key) DO UPDATE SET content = EXCLUDED.content;


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
