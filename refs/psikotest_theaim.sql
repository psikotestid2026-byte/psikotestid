-- -------------------------------------------------------------
-- PsikoTest.id Enterprise Database Dump & Seed Reference
-- Architecture: Serverless PostgreSQL (Neon)
-- -------------------------------------------------------------

DROP TABLE IF EXISTS "public"."notification_logs";
DROP TABLE IF EXISTS "public"."notification_templates";
DROP TABLE IF EXISTS "public"."payment_logs";
DROP TABLE IF EXISTS "public"."quota_transactions";
DROP TABLE IF EXISTS "public"."customer_test_quotas";
DROP TABLE IF EXISTS "public"."wallet_transactions";
DROP TABLE IF EXISTS "public"."test_order_items";
DROP TABLE IF EXISTS "public"."test_orders";
DROP TABLE IF EXISTS "public"."payment_instructions";
DROP TABLE IF EXISTS "public"."payment_methods";
DROP TABLE IF EXISTS "public"."test_results";
DROP TABLE IF EXISTS "public"."participants";
DROP TABLE IF EXISTS "public"."campaign_tests";
DROP TABLE IF EXISTS "public"."campaigns";
DROP TABLE IF EXISTS "public"."test_norms";
DROP TABLE IF EXISTS "public"."scoring_configs";
DROP TABLE IF EXISTS "public"."question_banks";
DROP TABLE IF EXISTS "public"."test_bundle_items";
DROP TABLE IF EXISTS "public"."test_bundles";
DROP TABLE IF EXISTS "public"."master_tests";
DROP TABLE IF EXISTS "public"."landing_page_contents";
DROP TABLE IF EXISTS "public"."customers";
DROP TABLE IF EXISTS "public"."admins";

-- 1. ADMINS
CREATE TABLE "public"."admins" (
    "id" bigserial PRIMARY KEY,
    "email" varchar(255) NOT NULL UNIQUE,
    "password_hash" varchar(255),
    "name" varchar(255) NOT NULL,
    "role" varchar(50) DEFAULT 'SUPERADMIN',
    "status" varchar(20) DEFAULT 'ACTIVE',
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- 2. CUSTOMERS (HR Client)
CREATE TABLE "public"."customers" (
    "id" bigserial PRIMARY KEY,
    "auth_user_id" varchar(255) UNIQUE,
    "email" varchar(255) NOT NULL UNIQUE,
    "password_hash" varchar(255),
    "company_name" varchar(255) NOT NULL,
    "contact_name" varchar(255),
    "phone_number" varchar(50),
    "balance" numeric(15,2) NOT NULL DEFAULT 0.00,
    "address" text,
    "logo_url" varchar(1024),
    "brand_color" varchar(20) DEFAULT '#2563eb',
    "role" varchar(50) DEFAULT 'CUSTOMER',
    "status" varchar(20) DEFAULT 'ACTIVE',
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- 3. LANDING PAGE CMS
CREATE TABLE "public"."landing_page_contents" (
    "id" bigserial PRIMARY KEY,
    "section_key" varchar(100) NOT NULL UNIQUE,
    "title" varchar(255) NOT NULL,
    "subtitle" text,
    "content" jsonb NOT NULL,
    "is_active" bool DEFAULT true,
    "updated_at" timestamptz DEFAULT now()
);

-- 4. MASTER TESTS
CREATE TABLE "public"."master_tests" (
    "id" bigserial PRIMARY KEY,
    "code" varchar(50) NOT NULL UNIQUE,
    "name" varchar(255) NOT NULL,
    "category" varchar(50) DEFAULT 'GENERAL',
    "description" text,
    "duration_sec" int4 NOT NULL DEFAULT 0,
    "price" numeric(10,2) NOT NULL DEFAULT 0.00,
    "instructions" text,
    "is_active" bool DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- 5. TEST BUNDLES
CREATE TABLE "public"."test_bundles" (
    "id" bigserial PRIMARY KEY,
    "code" varchar(50) NOT NULL UNIQUE,
    "name" varchar(255) NOT NULL,
    "description" text,
    "bundle_price" numeric(10,2) NOT NULL,
    "is_active" bool DEFAULT true,
    "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "public"."test_bundle_items" (
    "bundle_id" int4 NOT NULL REFERENCES "public"."test_bundles"("id") ON DELETE CASCADE,
    "test_id" int4 NOT NULL REFERENCES "public"."master_tests"("id") ON DELETE CASCADE,
    "quantity" int4 NOT NULL DEFAULT 1,
    PRIMARY KEY ("bundle_id", "test_id")
);

-- 6. QUESTION BANKS
CREATE TABLE "public"."question_banks" (
    "id" bigserial PRIMARY KEY,
    "test_id" int4 NOT NULL REFERENCES "public"."master_tests"("id") ON DELETE CASCADE,
    "question_type" varchar(50) NOT NULL,
    "question_data" jsonb NOT NULL,
    "order_number" int4 NOT NULL,
    "created_at" timestamptz DEFAULT now()
);
CREATE INDEX idx_question_banks_test_order ON "public"."question_banks" (test_id, order_number);

-- 7. SCORING & NORMS
CREATE TABLE "public"."scoring_configs" (
    "id" bigserial PRIMARY KEY,
    "test_id" int4 NOT NULL UNIQUE REFERENCES "public"."master_tests"("id") ON DELETE CASCADE,
    "formula_type" varchar(100) NOT NULL,
    "config_data" jsonb NOT NULL,
    "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "public"."test_norms" (
    "id" bigserial PRIMARY KEY,
    "test_id" int4 NOT NULL REFERENCES "public"."master_tests"("id") ON DELETE CASCADE,
    "raw_score" varchar(50) NOT NULL,
    "norm_score" varchar(50) NOT NULL,
    "label" varchar(100),
    "description" text,
    "created_at" timestamptz DEFAULT now()
);

-- 8. CAMPAIGNS & PARTICIPANTS
CREATE TABLE "public"."campaigns" (
    "id" bigserial PRIMARY KEY,
    "customer_id" int4 NOT NULL REFERENCES "public"."customers"("id") ON DELETE CASCADE,
    "title" varchar(255) NOT NULL,
    "description" text,
    "access_token" varchar(100) UNIQUE,
    "valid_until" timestamptz,
    "max_participants" int4 DEFAULT 0,
    "is_active" bool DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);
CREATE INDEX idx_campaigns_customer ON "public"."campaigns" (customer_id);

CREATE TABLE "public"."campaign_tests" (
    "campaign_id" int4 NOT NULL REFERENCES "public"."campaigns"("id") ON DELETE CASCADE,
    "test_id" int4 NOT NULL REFERENCES "public"."master_tests"("id") ON DELETE CASCADE,
    PRIMARY KEY ("campaign_id", "test_id")
);

CREATE TABLE "public"."participants" (
    "id" bigserial PRIMARY KEY,
    "campaign_id" int4 NOT NULL REFERENCES "public"."campaigns"("id") ON DELETE CASCADE,
    "access_token" varchar(100) UNIQUE,
    "full_name" varchar(255) NOT NULL,
    "email" varchar(255) NOT NULL,
    "phone_number" varchar(50),
    "masked_phone" varchar(50),
    "phone_middle_digits" varchar(10),
    "gender" varchar(20),
    "date_of_birth" timestamptz,
    "status" varchar(50) DEFAULT 'RUNNING',
    "started_at" timestamptz,
    "completed_at" timestamptz,
    "created_at" timestamptz DEFAULT now()
);
CREATE INDEX idx_participants_campaign ON "public"."participants" (campaign_id);

CREATE TABLE "public"."test_results" (
    "id" bigserial PRIMARY KEY,
    "participant_id" int4 NOT NULL REFERENCES "public"."participants"("id") ON DELETE CASCADE,
    "test_id" int4 NOT NULL REFERENCES "public"."master_tests"("id") ON DELETE CASCADE,
    "raw_answers" jsonb NOT NULL,
    "scoring_data" jsonb,
    "created_at" timestamptz DEFAULT now(),
    CONSTRAINT unq_participant_test UNIQUE ("participant_id", "test_id")
);

-- 9. PAYMENT & ORDERS
CREATE TABLE "public"."payment_methods" (
    "id" bigserial PRIMARY KEY,
    "code" varchar(50) NOT NULL UNIQUE,
    "name" varchar(100) NOT NULL,
    "logo_url" varchar(1024),
    "type" varchar(50) NOT NULL,
    "provider" varchar(50) NOT NULL,
    "admin_fee_flat" numeric(10,2) DEFAULT 0.00,
    "admin_fee_pct" numeric(5,2) DEFAULT 0.00,
    "is_active" bool DEFAULT true,
    "sort_order" int4 DEFAULT 0
);

CREATE TABLE "public"."payment_instructions" (
    "id" bigserial PRIMARY KEY,
    "payment_method_id" int4 NOT NULL REFERENCES "public"."payment_methods"("id") ON DELETE CASCADE,
    "title" varchar(255) NOT NULL,
    "content" text NOT NULL,
    "sort_order" int4 DEFAULT 0,
    "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "public"."test_orders" (
    "id" bigserial PRIMARY KEY,
    "invoice_code" varchar(100) NOT NULL UNIQUE,
    "customer_id" int4 NOT NULL REFERENCES "public"."customers"("id") ON DELETE CASCADE,
    "order_type" varchar(50) NOT NULL DEFAULT 'DIRECT_QUOTA',
    "payment_method_id" int4 REFERENCES "public"."payment_methods"("id") ON DELETE SET NULL,
    "subtotal" numeric(15,2) NOT NULL,
    "fee_amount" numeric(15,2) DEFAULT 0.00,
    "total_amount" numeric(15,2) NOT NULL,
    "payment_url" varchar(1024),
    "payment_token" varchar(255),
    "proof_url" varchar(1024),
    "notes" text,
    "status" varchar(50) DEFAULT 'PENDING',
    "created_at" timestamptz DEFAULT now(),
    "paid_at" timestamptz
);
CREATE INDEX idx_test_orders_invoice ON "public"."test_orders" (invoice_code);
CREATE INDEX idx_test_orders_customer ON "public"."test_orders" (customer_id);

CREATE TABLE "public"."test_order_items" (
    "id" bigserial PRIMARY KEY,
    "order_id" int4 NOT NULL REFERENCES "public"."test_orders"("id") ON DELETE CASCADE,
    "test_id" int4 REFERENCES "public"."master_tests"("id") ON DELETE CASCADE,
    "bundle_id" int4 REFERENCES "public"."test_bundles"("id") ON DELETE CASCADE,
    "quantity" int4 NOT NULL,
    "price_per_item" numeric(10,2) NOT NULL,
    "subtotal" numeric(15,2) NOT NULL,
    "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "public"."wallet_transactions" (
    "id" bigserial PRIMARY KEY,
    "customer_id" int4 NOT NULL REFERENCES "public"."customers"("id") ON DELETE CASCADE,
    "order_id" int4 REFERENCES "public"."test_orders"("id") ON DELETE SET NULL,
    "type" varchar(50) NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "balance_before" numeric(15,2) NOT NULL,
    "balance_after" numeric(15,2) NOT NULL,
    "description" varchar(255) NOT NULL,
    "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "public"."customer_test_quotas" (
    "id" bigserial PRIMARY KEY,
    "customer_id" int4 NOT NULL REFERENCES "public"."customers"("id") ON DELETE CASCADE,
    "test_id" int4 NOT NULL REFERENCES "public"."master_tests"("id") ON DELETE CASCADE,
    "quota" int4 NOT NULL DEFAULT 0,
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT unq_customer_test UNIQUE ("customer_id", "test_id")
);

CREATE TABLE "public"."quota_transactions" (
    "id" bigserial PRIMARY KEY,
    "customer_id" int4 NOT NULL REFERENCES "public"."customers"("id") ON DELETE CASCADE,
    "test_id" int4 NOT NULL REFERENCES "public"."master_tests"("id") ON DELETE CASCADE,
    "participant_id" int4 REFERENCES "public"."participants"("id") ON DELETE SET NULL,
    "reference_id" varchar(100),
    "quantity" int4 NOT NULL,
    "type" varchar(50) NOT NULL,
    "description" varchar(255) NOT NULL,
    "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "public"."payment_logs" (
    "id" bigserial PRIMARY KEY,
    "invoice_code" varchar(100) NOT NULL,
    "endpoint" varchar(255),
    "type" varchar(50),
    "request_payload" text,
    "response_payload" text,
    "http_status" int4,
    "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "public"."notification_templates" (
    "id" bigserial PRIMARY KEY,
    "event_trigger" varchar(50) NOT NULL UNIQUE,
    "channel" varchar(20) NOT NULL,
    "message_content" text NOT NULL,
    "is_active" bool DEFAULT true
);

CREATE TABLE "public"."notification_logs" (
    "id" bigserial PRIMARY KEY,
    "template_id" int4 REFERENCES "public"."notification_templates"("id") ON DELETE SET NULL,
    "reference_code" varchar(100),
    "recipient" varchar(150) NOT NULL,
    "channel" varchar(20) NOT NULL,
    "request_payload" text,
    "response_payload" text,
    "status" varchar(20),
    "created_at" timestamptz DEFAULT now()
);

-- SEEDING INSERTS
INSERT INTO "public"."admins" ("id", "email", "password_hash", "name", "role", "status") VALUES
(1, 'admin@psikotest.id', '$2a$10$wE8M14P7pE/2bM9gZf0O1.n8uW2hM/R4m2eH2kH2kH2kH2kH2kH2', 'Super Admin PsikoTest', 'SUPERADMIN', 'ACTIVE');

INSERT INTO "public"."customers" ("id", "email", "password_hash", "company_name", "contact_name", "phone_number", "balance", "address", "logo_url", "brand_color", "role", "status") VALUES
(1, 'admin@psikotest.id', '$2a$10$wE8M14P7pE/2bM9gZf0O1.n8uW2hM/R4m2eH2kH2kH2kH2kH2kH2', 'PsikoTest.id HQ', 'Tim Utama PsikoTest', '6281234567890', 10000000.00, 'Jl. Jend. Sudirman No. 45, Jakarta Selatan', 'https://images.pexels.com/photos/1337380/pexels-photo-1337380.jpeg', '#16a34a', 'SUPERADMIN', 'ACTIVE'),
(2, 'hrd@telkomsel.co.id', '$2a$10$wE8M14P7pE/2bM9gZf0O1.n8uW2hM/R4m2eH2kH2kH2kH2kH2kH2', 'PT Telekomunikasi Selular', 'Budi Santoso (HR Director)', '628111111111', 5000000.00, 'Telkomsel Smart Office, Jl. Gatot Subroto Kav. 52, Jakarta', 'https://images.pexels.com/photos/269077/pexels-photo-269077.jpeg', '#e11d48', 'CUSTOMER', 'ACTIVE'),
(3, 'rekrutmen@gojek.com', '$2a$10$wE8M14P7pE/2bM9gZf0O1.n8uW2hM/R4m2eH2kH2kH2kH2kH2kH2', 'PT GoTo Gojek Tokopedia', 'Siti Rahma (Talent Acquisition)', '628122222222', 2500000.00, 'Pasar Daya Blok B, Jl. Iskandarsyah II No. 2, Jakarta', 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg', '#059669', 'CUSTOMER', 'ACTIVE'),
(4, 'recruitment@bca.co.id', '$2a$10$wE8M14P7pE/2bM9gZf0O1.n8uW2hM/R4m2eH2kH2kH2kH2kH2kH2', 'PT Bank Central Asia Tbk', 'Bambang Wijaya (Head of HR)', '628133333333', 10000000.00, 'Menara BCA, Grand Indonesia, Jl. M.H. Thamrin No. 1, Jakarta', 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg', '#0056b3', 'CUSTOMER', 'ACTIVE');

INSERT INTO "public"."master_tests" ("id", "code", "name", "category", "description", "duration_sec", "price", "instructions", "is_active") VALUES
(1, 'wpt', 'Wonderlic Personnel Test (WPT)', 'COGNITIVE', 'Tes kecerdasan kognitif dan daya tangkap logika penyelesaian masalah.', 720, 15000.00, 'Jawablah pertanyaan berikut dengan cepat dan tepat dalam waktu 12 menit.', true),
(2, 'disc', 'DISC Personality Assessment', 'PERSONALITY', 'Asesmen 4 kuadran pola perilaku dan gaya komunikasi individu.', 600, 15000.00, 'Pilih satu pernyataan yang PALING dan KURANG menggambarkan diri Anda di lingkungan kerja.', true),
(3, 'papi', 'PAPI Kostick Personality', 'PERSONALITY', 'Evaluasi 20 dimensi perilaku kerja dan gaya kepemimpinan.', 900, 20000.00, 'Pilih salah satu dari sepasang pernyataan (A atau B) yang paling sesuai dengan diri Anda.', true),
(4, 'mbti', 'Myers-Briggs Type Indicator (MBTI)', 'PERSONALITY', 'Identifikasi 16 tipe kepribadian dan preferensi psikologis.', 900, 20000.00, 'Pilih salah satu pernyataan (A atau B) yang paling mencerminkan diri Anda secara jujur.', true),
(5, 'riasec', 'Holland RIASEC Interest Test', 'VOKASIONAL', 'Tes minat karir, vokasional, dan kecocokan bidang pekerjaan.', 900, 15000.00, 'Jawablah apakah Anda menyukai atau tidak menyukai aktivitas pekerjaan berikut.', true),
(6, 'ist', 'Intelligenz Struktur Test (IST)', 'COGNITIVE', 'Tes komprehensif struktur inteligensi verbal, numerik, dan spasial.', 5400, 35000.00, 'Selesaikan sembilan subtes kemampuan berpikir logis dan analitis.', true),
(7, 'tech_js', 'Javascript & Node.js Developer Test', 'TECHNICAL', 'Asesmen kemampuan teknikal pemrograman Javascript menengah-lanjut.', 1800, 30000.00, 'Jawablah pertanyaan teoritis dan koding konseptual.', true),
(8, 'msdt', 'Management Style Diagnostic Test', 'LEADERSHIP', 'Evaluasi gaya kepemimpinan dan manajemen efektivitas organisasi.', 1200, 25000.00, 'Pilih salah satu pernyataan (A atau B) yang paling sesuai kecenderungan kepemimpinan Anda.', true),
(9, 'bigfive', 'Big Five Personality (OCEAN)', 'PERSONALITY', 'Asesmen 5 faktor kepribadian utama (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism).', 900, 20000.00, 'Pilih tingkat persetujuan Anda terhadap pernyataan berikut (skala 1-5).', true),
(10, 'enneagram', 'Enneagram Assessment', 'PERSONALITY', 'Asesmen 9 tipe kepribadian motivasi dasar manusia.', 1200, 20000.00, 'Pilih tingkat kecocokan setiap pernyataan dengan diri Anda.', true);

INSERT INTO "public"."test_bundles" ("id", "code", "name", "description", "bundle_price", "is_active") VALUES
(1, 'bundle_staff', 'Paket Rekrutmen Staf & Operasional', 'Kombinasi Tes Kognitif Logika (WPT) dan Asesmen Perilaku Kerja (DISC). Cocok untuk posisi Staf/Junior.', 25000.00, true),
(2, 'bundle_manager', 'Paket Executive Managerial', 'Paket lengkap WPT + DISC + PAPI Kostick + MSDT Kepemimpinan. Cocok untuk posisi Supervisor, Manager & Lead.', 60000.00, true);

INSERT INTO "public"."test_bundle_items" ("bundle_id", "test_id", "quantity") VALUES
(1, 1, 1),
(1, 2, 1),
(2, 1, 1),
(2, 2, 1),
(2, 3, 1),
(2, 8, 1);
