-- -------------------------------------------------------------
-- TablePlus 26.7.6(742)
--
-- https://tableplus.com/
--
-- Database: neondb
-- Generation Time: 2026-07-18 10:41:36.6660
-- -------------------------------------------------------------


DROP TABLE IF EXISTS "public"."campaigns";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS campaigns_id_seq;

-- Table Definition
CREATE TABLE "public"."campaigns" (
    "id" int8 NOT NULL DEFAULT nextval('campaigns_id_seq'::regclass),
    "customer_id" int4 NOT NULL,
    "title" varchar(255) NOT NULL,
    "is_active" bool DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."campaign_tests";
-- Table Definition
CREATE TABLE "public"."campaign_tests" (
    "campaign_id" int4 NOT NULL,
    "test_id" int4 NOT NULL,
    PRIMARY KEY ("campaign_id","test_id")
);

DROP TABLE IF EXISTS "public"."notification_logs";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS notification_logs_id_seq;

-- Table Definition
CREATE TABLE "public"."notification_logs" (
    "id" int8 NOT NULL DEFAULT nextval('notification_logs_id_seq'::regclass),
    "template_id" int4,
    "reference_code" varchar(100),
    "recipient" varchar(150) NOT NULL,
    "channel" varchar(20) NOT NULL,
    "request_payload" text,
    "response_payload" text,
    "status" varchar(20),
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."payment_instructions";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS payment_instructions_id_seq;

-- Table Definition
CREATE TABLE "public"."payment_instructions" (
    "id" int8 NOT NULL DEFAULT nextval('payment_instructions_id_seq'::regclass),
    "payment_method_id" int4 NOT NULL,
    "title" varchar(255) NOT NULL,
    "content" text NOT NULL,
    "sort_order" int4 DEFAULT 0,
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."test_norms";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS test_norms_id_seq;

-- Table Definition
CREATE TABLE "public"."test_norms" (
    "id" int8 NOT NULL DEFAULT nextval('test_norms_id_seq'::regclass),
    "test_id" int4 NOT NULL,
    "raw_score" varchar(50) NOT NULL,
    "norm_score" varchar(50) NOT NULL,
    "label" varchar(100),
    "description" text,
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."test_order_items";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS test_order_items_id_seq;

-- Table Definition
CREATE TABLE "public"."test_order_items" (
    "id" int8 NOT NULL DEFAULT nextval('test_order_items_id_seq'::regclass),
    "order_id" int4 NOT NULL,
    "test_id" int4 NOT NULL,
    "quantity" int4 NOT NULL,
    "price_per_item" numeric(10,2) NOT NULL,
    "subtotal" numeric(15,2) NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."test_results";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS test_results_id_seq;

-- Table Definition
CREATE TABLE "public"."test_results" (
    "id" int8 NOT NULL DEFAULT nextval('test_results_id_seq'::regclass),
    "participant_id" int4 NOT NULL,
    "test_id" int4 NOT NULL,
    "raw_answers" jsonb NOT NULL,
    "scoring_data" jsonb,
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."customer_test_quotas";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS customer_test_quotas_id_seq;

-- Table Definition
CREATE TABLE "public"."customer_test_quotas" (
    "id" int8 NOT NULL DEFAULT nextval('customer_test_quotas_id_seq'::regclass),
    "customer_id" int4 NOT NULL,
    "test_id" int4 NOT NULL,
    "quota" int4 NOT NULL DEFAULT 0,
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."customers";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS customers_id_seq;

-- Table Definition
CREATE TABLE "public"."customers" (
    "id" int8 NOT NULL DEFAULT nextval('customers_id_seq'::regclass),
    "auth_user_id" varchar(255),
    "email" varchar(255) NOT NULL,
    "company_name" varchar(255) NOT NULL,
    "phone_number" varchar(50),
    "logo_url" varchar(1024),
    "brand_color" varchar(20) DEFAULT '#2563eb'::character varying,
    "role" varchar(50) DEFAULT 'CUSTOMER'::character varying,
    "status" varchar(20) DEFAULT 'ACTIVE'::character varying,
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."participants";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS participants_id_seq;

-- Table Definition
CREATE TABLE "public"."participants" (
    "id" int8 NOT NULL DEFAULT nextval('participants_id_seq'::regclass),
    "campaign_id" int4 NOT NULL,
    "full_name" varchar(255) NOT NULL,
    "email" varchar(255) NOT NULL,
    "phone_number" varchar(50),
    "status" varchar(50) DEFAULT 'RUNNING'::character varying,
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."master_tests";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS master_tests_id_seq;

-- Table Definition
CREATE TABLE "public"."master_tests" (
    "id" int8 NOT NULL DEFAULT nextval('master_tests_id_seq'::regclass),
    "code" varchar(50) NOT NULL,
    "name" varchar(255) NOT NULL,
    "description" text,
    "duration_sec" int4 NOT NULL DEFAULT 0,
    "price" numeric(10,2) NOT NULL DEFAULT 0.00,
    "instructions" text,
    "is_active" bool DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."notification_templates";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS notification_templates_id_seq;

-- Table Definition
CREATE TABLE "public"."notification_templates" (
    "id" int8 NOT NULL DEFAULT nextval('notification_templates_id_seq'::regclass),
    "event_trigger" varchar(50) NOT NULL,
    "channel" varchar(20) NOT NULL,
    "message_content" text NOT NULL,
    "is_active" bool DEFAULT true,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."question_banks";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS question_banks_id_seq;

-- Table Definition
CREATE TABLE "public"."question_banks" (
    "id" int8 NOT NULL DEFAULT nextval('question_banks_id_seq'::regclass),
    "test_id" int4 NOT NULL,
    "question_type" varchar(50) NOT NULL,
    "question_data" jsonb NOT NULL,
    "order_number" int4 NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."payment_logs";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS payment_logs_id_seq;

-- Table Definition
CREATE TABLE "public"."payment_logs" (
    "id" int8 NOT NULL DEFAULT nextval('payment_logs_id_seq'::regclass),
    "invoice_code" varchar(100) NOT NULL,
    "endpoint" varchar(255),
    "type" varchar(50),
    "request_payload" text,
    "response_payload" text,
    "http_status" int4,
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."quota_transactions";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS quota_transactions_id_seq;

-- Table Definition
CREATE TABLE "public"."quota_transactions" (
    "id" int8 NOT NULL DEFAULT nextval('quota_transactions_id_seq'::regclass),
    "customer_id" int4 NOT NULL,
    "test_id" int4 NOT NULL,
    "reference_id" varchar(100),
    "quantity" int4 NOT NULL,
    "type" varchar(50) NOT NULL,
    "description" varchar(255) NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."scoring_configs";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS scoring_configs_id_seq;

-- Table Definition
CREATE TABLE "public"."scoring_configs" (
    "id" int8 NOT NULL DEFAULT nextval('scoring_configs_id_seq'::regclass),
    "test_id" int4 NOT NULL,
    "formula_type" varchar(100) NOT NULL,
    "config_data" jsonb NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."payment_methods";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS payment_methods_id_seq;

-- Table Definition
CREATE TABLE "public"."payment_methods" (
    "id" int8 NOT NULL DEFAULT nextval('payment_methods_id_seq'::regclass),
    "code" varchar(50) NOT NULL,
    "name" varchar(100) NOT NULL,
    "logo_url" varchar(1024),
    "type" varchar(50) NOT NULL,
    "provider" varchar(50) NOT NULL,
    "admin_fee_flat" numeric(10,2) DEFAULT 0.00,
    "admin_fee_pct" numeric(5,2) DEFAULT 0.00,
    "is_active" bool DEFAULT true,
    "sort_order" int4 DEFAULT 0,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."test_orders";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS test_orders_id_seq;

-- Table Definition
CREATE TABLE "public"."test_orders" (
    "id" int8 NOT NULL DEFAULT nextval('test_orders_id_seq'::regclass),
    "invoice_code" varchar(100) NOT NULL,
    "customer_id" int4 NOT NULL,
    "payment_method_id" int4,
    "subtotal" numeric(15,2) NOT NULL,
    "fee_amount" numeric(15,2) DEFAULT 0.00,
    "total_amount" numeric(15,2) NOT NULL,
    "payment_url" varchar(1024),
    "payment_token" varchar(255),
    "proof_url" varchar(1024),
    "status" varchar(50) DEFAULT 'PENDING'::character varying,
    "created_at" timestamptz DEFAULT now(),
    "paid_at" timestamptz,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."admins";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS admins_id_seq;

-- Table Definition
CREATE TABLE "public"."admins" (
    "id" int8 NOT NULL DEFAULT nextval('admins_id_seq'::regclass),
    "email" varchar(255) NOT NULL,
    "name" varchar(255) NOT NULL,
    "role" varchar(50) DEFAULT 'SUPERADMIN'::character varying,
    "status" varchar(20) DEFAULT 'ACTIVE'::character varying,
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

INSERT INTO "public"."campaigns" ("id", "customer_id", "title", "is_active", "created_at") VALUES
(1, 2, 'Seleksi Manajer IT Telkomsel', 't', '2026-06-16 22:41:14.170078+00'),
(2, 3, 'Rekrutmen Driver Acquisition Gojek', 't', '2026-06-16 22:41:14.170078+00'),
(3, 2, 'tes', 't', '2026-06-17 04:04:38.846992+00');

INSERT INTO "public"."campaign_tests" ("campaign_id", "test_id") VALUES
(1, 1),
(1, 2),
(1, 3),
(2, 2),
(3, 1);

INSERT INTO "public"."payment_instructions" ("id", "payment_method_id", "title", "content", "sort_order", "created_at") VALUES
(1, 1, 'Pembayaran via m-BCA', '<ol><li>Buka aplikasi m-BCA</li><li>Pilih m-Transfer > BCA Virtual Account</li><li>Masukkan nomor VA</li><li>Konfirmasi nominal Pembayaran</li></ol>', 1, '2026-06-16 22:41:14.170078+00'),
(2, 3, 'Pembayaran via QRIS', '<ol><li>Buka aplikasi e-Wallet (GoPay, OVO, Dana) atau m-Banking</li><li>Pilih menu Scan QRIS</li><li>Arahkan kamera ke QR Code di layar</li></ol>', 1, '2026-06-16 22:41:14.170078+00'),
(3, 4, 'Transfer Manual', '<ol><li>Transfer ke Rekening BCA: 123456789 a.n PT PsikoTest Solusi</li><li>Pastikan nominal transfer sama persis</li><li>Unggah bukti transfer di dashboard Admin</li></ol>', 1, '2026-06-16 22:41:14.170078+00');

INSERT INTO "public"."test_norms" ("id", "test_id", "raw_score", "norm_score", "label", "description", "created_at") VALUES
(1, 2, 'DI', 'Dominance-Influence', 'Result Oriented', 'Kandidat memiliki pengaruh dan ketegasan tinggi. Sangat cocok sebagai inovator atau pemimpin proyek yang dinamis.', '2026-06-16 22:41:14.170078+00'),
(2, 2, 'SC', 'Steadiness-Compliance', 'Detail Oriented', 'Kandidat sangat stabil, teliti, dan menyukai keteraturan. Andal dalam menangani infrastruktur sistem berskala besar.', '2026-06-16 22:41:14.170078+00'),
(3, 1, '20', '100', 'Average', 'Kapasitas intelektual dan kognitif umum berada pada tingkat rata-rata populasi.', '2026-06-16 22:41:14.170078+00'),
(4, 1, '35', '120', 'Superior', 'Kapasitas analitis sangat baik, mampu memecahkan arsitektur permasalahan yang rumit dengan cepat.', '2026-06-16 22:41:14.170078+00');

INSERT INTO "public"."test_order_items" ("id", "order_id", "test_id", "quantity", "price_per_item", "subtotal", "created_at") VALUES
(1, 1, 2, 45, 25000.00, 1125000.00, '2026-06-16 22:41:14.170078+00'),
(2, 2, 3, 50, 50000.00, 2500000.00, '2026-06-16 22:41:14.170078+00'),
(3, 3, 2, 10, 25000.00, 250000.00, '2026-06-17 04:24:37.561671+00');

INSERT INTO "public"."test_results" ("id", "participant_id", "test_id", "raw_answers", "scoring_data", "created_at") VALUES
(1, 1, 1, '{"1": "4", "2": "2", "3": "false", "4": "6000"}', '{"raw": 4, "label": "Superior", "score": 120, "description": "Kapasitas analitis sangat baik."}', '2026-06-16 22:41:14.170078+00');

INSERT INTO "public"."customer_test_quotas" ("id", "customer_id", "test_id", "quota", "updated_at") VALUES
(1, 2, 1, 150, '2026-06-16 22:41:14.170078+00'),
(2, 2, 2, 200, '2026-06-16 22:41:14.170078+00'),
(3, 2, 3, 100, '2026-06-16 22:41:14.170078+00'),
(4, 3, 2, 45, '2026-06-16 22:41:14.170078+00');

INSERT INTO "public"."customers" ("id", "auth_user_id", "email", "company_name", "phone_number", "logo_url", "brand_color", "role", "status", "created_at") VALUES
(1, NULL, 'admin@psikotest.id', 'PsikoTest.id HQ', '6281234567890', 'https://images.pexels.com/photos/1337380/pexels-photo-1337380.jpeg', '#16a34a', 'SUPERADMIN', 'ACTIVE', '2026-06-16 22:41:14.170078+00'),
(2, NULL, 'hrd@telkomsel.co.id', 'PT Telekomunikasi Selular', '628111111111', 'https://images.pexels.com/photos/269077/pexels-photo-269077.jpeg', '#e11d48', 'CUSTOMER', 'ACTIVE', '2026-06-16 22:41:14.170078+00'),
(3, NULL, 'rekrutmen@gojek.com', 'PT GoTo Gojek Tokopedia', '628122222222', 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg', '#059669', 'CUSTOMER', 'ACTIVE', '2026-06-16 22:41:14.170078+00');

INSERT INTO "public"."participants" ("id", "campaign_id", "full_name", "email", "phone_number", "status", "created_at") VALUES
(1, 1, 'Budi Santoso', 'budi.santoso@email.com', NULL, 'COMPLETED', '2026-06-16 22:41:14.170078+00'),
(2, 1, 'Siti Rahma', 'siti.rahma@email.com', NULL, 'RUNNING', '2026-06-16 22:41:14.170078+00'),
(3, 2, 'Ahmad Reza', 'ahmad.reza@email.com', NULL, 'COMPLETED', '2026-06-16 22:41:14.170078+00');

INSERT INTO "public"."master_tests" ("id", "code", "name", "description", "duration_sec", "price", "instructions", "is_active", "created_at") VALUES
(1, 'wpt', 'Wonderlic Personnel Test', 'Tes kognitif dan logika penyelesaian masalah', 720, 35000.00, 'Selesaikan sebanyak mungkin pertanyaan dengan tepat dalam waktu 12 menit.', 't', '2026-06-16 22:41:14.170078+00'),
(2, 'disc', 'DISC Personality', 'Asesmen 4 kuadran kepribadian dominan', 600, 25000.00, 'Pilih satu pernyataan yang PALING dan KURANG menggambarkan diri Anda di lingkungan kerja.', 't', '2026-06-16 22:41:14.170078+00'),
(3, 'tech_js', 'Javascript Developer Assessment', 'Tes teknikal pemrograman Javascript menengah-lanjut', 1800, 50000.00, 'Jawablah pertanyaan teoritis dan berikan penjelasan konseptual singkat.', 't', '2026-06-16 22:41:14.170078+00');

INSERT INTO "public"."notification_templates" ("id", "event_trigger", "channel", "message_content", "is_active") VALUES
(1, 'ORDER_PAID', 'WHATSAPP', 'Halo HRD {company_name}, pembayaran pesanan kuota sebesar Rp {amount} dengan Invoice {invoice_code} BERHASIL. Kuota tes Anda telah berhasil didepositkan.', 't'),
(2, 'ORDER_PENDING', 'WHATSAPP', 'Halo HRD {company_name}, pesanan kuota Anda sebesar Rp {total_amount} menunggu pembayaran. Silakan selesaikan pembayaran lewat {payment_method}.', 't'),
(3, 'ASSESSMENT_INVITE', 'EMAIL', 'Yth. {participant_name}, Anda diundang oleh {company_name} untuk mengikuti tes asesmen. Silakan klik link berikut: {assessment_link}', 't');

INSERT INTO "public"."question_banks" ("id", "test_id", "question_type", "question_data", "order_number", "created_at") VALUES
(1, 1, 'multiple_choice', '{"text": "Bulan lalu pada awal tahun ini adalah:", "options": ["Januari", "Maret", "Juli", "Desember", "Oktober"]}', 1, '2026-06-16 22:41:14.170078+00'),
(2, 1, 'multiple_choice', '{"text": "MENANGKAP adalah lawan kata dari:", "options": ["Meletakkan", "Membebaskan", "Beresiko", "Berusaha", "Turun tingkat", "Melepaskan"]}', 2, '2026-06-16 22:41:14.170078+00'),
(3, 1, 'true_false', '{"text": "Apakah kata KLIEN dan PELANGGAN memiliki arti yang persis sama dalam konteks hukum tata negara?"}', 3, '2026-06-16 22:41:14.170078+00'),
(4, 1, 'short_answer', '{"text": "Sebuah pesawat terbang 300 kaki dalam 0.5 detik. Pada kecepatan yang sama berapa kaki ia terbang dalam 10 detik?"}', 4, '2026-06-16 22:41:14.170078+00'),
(5, 3, 'essay', '{"text": "Jelaskan perbedaan mendasar antara eksekusi Synchronous dan Asynchronous di ekosistem Node.js, sertakan contoh sederhana penggunaan Promises!"}', 1, '2026-06-16 22:41:14.170078+00'),
(6, 2, 'multiple_choice', '{"text": "Pilih satu pernyataan yang PALING menggambarkan Anda:", "options": ["Mudah bergaul, ramah", "Sangat teliti dan akurat", "Tegas dan suka memimpin", "Tenang, stabil, sabar"]}', 1, '2026-06-16 22:41:14.170078+00');

INSERT INTO "public"."quota_transactions" ("id", "customer_id", "test_id", "reference_id", "quantity", "type", "description", "created_at") VALUES
(1, 3, 2, 'ORD-20260613-001', 45, 'CREDIT', 'Pembelian kuota DISC via BCA Virtual Account', '2026-06-16 22:41:14.170078+00'),
(2, 2, 1, 'PART-1', -1, 'DEBIT', 'Penggunaan kuota WPT: Budi Santoso (Seleksi Manajer IT Telkomsel)', '2026-06-16 22:41:14.170078+00');

INSERT INTO "public"."scoring_configs" ("id", "test_id", "formula_type", "config_data", "created_at") VALUES
(1, 1, 'matching_key', '{"key": {"1": "4", "2": "2", "3": "false", "4": "6000"}}', '2026-06-16 22:41:14.170078+00'),
(2, 2, 'disc_matrix', '{"matrix_k": {"1": ["C", "I", "S", "D"]}, "matrix_p": {"1": ["I", "C", "D", "S"]}}', '2026-06-16 22:41:14.170078+00');

INSERT INTO "public"."payment_methods" ("id", "code", "name", "logo_url", "type", "provider", "admin_fee_flat", "admin_fee_pct", "is_active", "sort_order") VALUES
(1, 'BCA_VA', 'BCA Virtual Account', NULL, 'va', 'Xendit', 4000.00, 0.00, 't', 1),
(2, 'MANDIRI_VA', 'Mandiri Virtual Account', NULL, 'va', 'Xendit', 4000.00, 0.00, 't', 2),
(3, 'QRIS', 'QRIS (All Payment)', NULL, 'qr_code', 'Xendit', 0.00, 0.00, 't', 3),
(4, 'MANUAL_BCA', 'BCA Transfer Manual', NULL, 'bank_transfer', 'Manual', 0.00, 0.00, 't', 4);

INSERT INTO "public"."test_orders" ("id", "invoice_code", "customer_id", "payment_method_id", "subtotal", "fee_amount", "total_amount", "payment_url", "payment_token", "proof_url", "status", "created_at", "paid_at") VALUES
(1, 'ORD-20260613-001', 3, 1, 1125000.00, 4000.00, 1129000.00, NULL, NULL, NULL, 'PAID', '2026-06-16 22:41:14.170078+00', '2026-06-13 09:00:00+00'),
(2, 'ORD-20260613-002', 3, 4, 2500000.00, 0.00, 2500000.00, NULL, NULL, NULL, 'PENDING', '2026-06-16 22:41:14.170078+00', NULL),
(3, 'INV-1781670277321', 2, NULL, 250000.00, 0.00, 250000.00, NULL, NULL, NULL, 'PENDING', '2026-06-17 04:24:37.476542+00', NULL);

INSERT INTO "public"."admins" ("id", "email", "name", "role", "status", "created_at") VALUES
(1, 'alifyaihya@gmail.com', 'Super Admin Default', 'SUPERADMIN', 'ACTIVE', '2026-06-17 06:55:52.321704+00'),
(2, 'irvanadrian151@gmail.com', 'Irvan (Superadmin)', 'SUPERADMIN', 'ACTIVE', '2026-06-17 06:55:52.321704+00');

ALTER TABLE "public"."campaigns" ADD FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;


-- Indices
CREATE INDEX idx_campaigns_customer ON public.campaigns USING btree (customer_id);
ALTER TABLE "public"."campaign_tests" ADD FOREIGN KEY ("test_id") REFERENCES "public"."master_tests"("id") ON DELETE CASCADE;
ALTER TABLE "public"."campaign_tests" ADD FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;


-- Indices
CREATE UNIQUE INDEX campaign_tests_campaign_id_test_id_pk ON public.campaign_tests USING btree (campaign_id, test_id);
ALTER TABLE "public"."notification_logs" ADD FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE SET NULL;


-- Indices
CREATE INDEX idx_notification_logs_ref ON public.notification_logs USING btree (reference_code);
ALTER TABLE "public"."payment_instructions" ADD FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE CASCADE;
ALTER TABLE "public"."test_norms" ADD FOREIGN KEY ("test_id") REFERENCES "public"."master_tests"("id") ON DELETE CASCADE;
ALTER TABLE "public"."test_order_items" ADD FOREIGN KEY ("test_id") REFERENCES "public"."master_tests"("id") ON DELETE CASCADE;
ALTER TABLE "public"."test_order_items" ADD FOREIGN KEY ("order_id") REFERENCES "public"."test_orders"("id") ON DELETE CASCADE;


-- Indices
CREATE INDEX idx_test_order_items_order ON public.test_order_items USING btree (order_id);
ALTER TABLE "public"."test_results" ADD FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE CASCADE;
ALTER TABLE "public"."test_results" ADD FOREIGN KEY ("test_id") REFERENCES "public"."master_tests"("id") ON DELETE CASCADE;


-- Indices
CREATE UNIQUE INDEX test_results_participant_id_test_id_unique ON public.test_results USING btree (participant_id, test_id);
CREATE INDEX idx_test_results_part_test ON public.test_results USING btree (participant_id, test_id);
ALTER TABLE "public"."customer_test_quotas" ADD FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;
ALTER TABLE "public"."customer_test_quotas" ADD FOREIGN KEY ("test_id") REFERENCES "public"."master_tests"("id") ON DELETE CASCADE;


-- Indices
CREATE UNIQUE INDEX customer_test_quotas_customer_id_test_id_unique ON public.customer_test_quotas USING btree (customer_id, test_id);
CREATE INDEX idx_customer_test_quotas_customer_test ON public.customer_test_quotas USING btree (customer_id, test_id);


-- Indices
CREATE UNIQUE INDEX customers_auth_user_id_unique ON public.customers USING btree (auth_user_id);
CREATE UNIQUE INDEX customers_email_unique ON public.customers USING btree (email);
ALTER TABLE "public"."participants" ADD FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;


-- Indices
CREATE INDEX idx_participants_campaign ON public.participants USING btree (campaign_id);


-- Indices
CREATE UNIQUE INDEX master_tests_code_unique ON public.master_tests USING btree (code);


-- Indices
CREATE UNIQUE INDEX notification_templates_event_trigger_unique ON public.notification_templates USING btree (event_trigger);
ALTER TABLE "public"."question_banks" ADD FOREIGN KEY ("test_id") REFERENCES "public"."master_tests"("id") ON DELETE CASCADE;


-- Indices
CREATE INDEX idx_question_banks_test_order ON public.question_banks USING btree (test_id, order_number);


-- Indices
CREATE INDEX idx_payment_logs_invoice ON public.payment_logs USING btree (invoice_code);
ALTER TABLE "public"."quota_transactions" ADD FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;
ALTER TABLE "public"."quota_transactions" ADD FOREIGN KEY ("test_id") REFERENCES "public"."master_tests"("id") ON DELETE CASCADE;


-- Indices
CREATE INDEX idx_quota_transactions_customer_test ON public.quota_transactions USING btree (customer_id, test_id);
ALTER TABLE "public"."scoring_configs" ADD FOREIGN KEY ("test_id") REFERENCES "public"."master_tests"("id") ON DELETE CASCADE;


-- Indices
CREATE UNIQUE INDEX scoring_configs_test_id_unique ON public.scoring_configs USING btree (test_id);


-- Indices
CREATE UNIQUE INDEX payment_methods_code_unique ON public.payment_methods USING btree (code);
ALTER TABLE "public"."test_orders" ADD FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;
ALTER TABLE "public"."test_orders" ADD FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE SET NULL;


-- Indices
CREATE UNIQUE INDEX test_orders_invoice_code_unique ON public.test_orders USING btree (invoice_code);
CREATE INDEX idx_test_orders_invoice ON public.test_orders USING btree (invoice_code);
CREATE INDEX idx_test_orders_customer ON public.test_orders USING btree (customer_id);


-- Indices
CREATE UNIQUE INDEX admins_email_unique ON public.admins USING btree (email);
