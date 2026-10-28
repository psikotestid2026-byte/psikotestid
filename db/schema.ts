import { pgTable, bigserial, varchar, timestamp, text, integer, numeric, boolean, jsonb, index, primaryKey, unique, uniqueIndex } from 'drizzle-orm/pg-core';

export const customers = pgTable('customers', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  auth_user_id: varchar('auth_user_id', { length: 255 }).unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }),
  company_name: varchar('company_name', { length: 255 }).notNull(),
  contact_name: varchar('contact_name', { length: 255 }),
  phone_number: varchar('phone_number', { length: 50 }),
  balance: numeric('balance', { precision: 15, scale: 2 }).notNull().default('0.00'),
  address: text('address'),
  logo_url: varchar('logo_url', { length: 1024 }),
  brand_color: varchar('brand_color', { length: 20 }).default('#2563eb'),
  role: varchar('role', { length: 50 }).default('CUSTOMER'),
  status: varchar('status', { length: 20 }).default('ACTIVE'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const master_tests = pgTable('master_tests', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }).default('GENERAL'),
  description: text('description'),
  duration_sec: integer('duration_sec').notNull().default(0),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0.00'),
  instructions: text('instructions'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const test_bundles = pgTable('test_bundles', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  bundle_price: numeric('bundle_price', { precision: 10, scale: 2 }).notNull(),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const test_bundle_items = pgTable('test_bundle_items', {
  bundle_id: integer('bundle_id').notNull().references(() => test_bundles.id, { onDelete: 'cascade' }),
  test_id: integer('test_id').notNull().references(() => master_tests.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.bundle_id, table.test_id] }),
  };
});

export const question_banks = pgTable('question_banks', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  test_id: integer('test_id').notNull().references(() => master_tests.id, { onDelete: 'cascade' }),
  question_type: varchar('question_type', { length: 50 }).notNull(),
  question_data: jsonb('question_data').notNull(),
  order_number: integer('order_number').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    test_order_idx: index('idx_question_banks_test_order').on(table.test_id, table.order_number),
  };
});

export const scoring_configs = pgTable('scoring_configs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  test_id: integer('test_id').notNull().unique().references(() => master_tests.id, { onDelete: 'cascade' }),
  formula_type: varchar('formula_type', { length: 100 }).notNull(),
  config_data: jsonb('config_data').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const test_norms = pgTable('test_norms', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  test_id: integer('test_id').notNull().references(() => master_tests.id, { onDelete: 'cascade' }),
  raw_score: varchar('raw_score', { length: 50 }).notNull(),
  norm_score: varchar('norm_score', { length: 50 }).notNull(),
  label: varchar('label', { length: 100 }),
  description: text('description'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const campaigns = pgTable('campaigns', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  customer_id: integer('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  access_token: varchar('access_token', { length: 100 }).unique(),
  registration_type: varchar('registration_type', { length: 50 }).default('OPEN_LINK'),
  campaign_mode: varchar('campaign_mode', { length: 30 }).default('OPEN'), // OPEN | MANDATORY_BUNDLE
  valid_until: timestamp('valid_until', { withTimezone: true }),
  max_participants: integer('max_participants').default(0),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    customer_idx: index('idx_campaigns_customer').on(table.customer_id),
  };
});

export const campaign_tests = pgTable('campaign_tests', {
  campaign_id: integer('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  test_id: integer('test_id').notNull().references(() => master_tests.id, { onDelete: 'cascade' }),
  order_number: integer('order_number').default(0),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.campaign_id, table.test_id] }),
  };
});

export const participants = pgTable('participants', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  campaign_id: integer('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  access_token: varchar('access_token', { length: 100 }).unique(),
  full_name: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone_number: varchar('phone_number', { length: 50 }),
  nik: varchar('nik', { length: 50 }),
  registration_source: varchar('registration_source', { length: 50 }).default('OPEN_LINK'),
  masked_phone: varchar('masked_phone', { length: 50 }),
  phone_middle_digits: varchar('phone_middle_digits', { length: 10 }),
  gender: varchar('gender', { length: 20 }),
  date_of_birth: timestamp('date_of_birth', { withTimezone: true }),
  status: varchar('status', { length: 50 }).default('RUNNING'),
  username: varchar('username', { length: 100 }).unique(),
  password_hash: varchar('password_hash', { length: 255 }),
  default_password: varchar('default_password', { length: 100 }),
  employee_id: varchar('employee_id', { length: 50 }),
  position: varchar('position', { length: 255 }),
  unit_work: varchar('unit_work', { length: 255 }),
  education: varchar('education', { length: 50 }),
  employment_status: varchar('employment_status', { length: 100 }),
  job_level_code: varchar('job_level_code', { length: 50 }),
  reset_count: integer('reset_count').notNull().default(0),
  scoring_status: varchar('scoring_status', { length: 30 }).default('PENDING'), // PENDING | PROCESSING | DONE | FAILED
  scoring_error: text('scoring_error'),
  scored_at: timestamp('scored_at', { withTimezone: true }),
  recommendation_status: varchar('recommendation_status', { length: 50 }), // DIREKOMENDASIKAN | DIPERTIMBANGKAN | TIDAK_DIREKOMENDASIKAN
  system_recommendation_status: varchar('system_recommendation_status', { length: 50 }),
  recommendation_score: numeric('recommendation_score', { precision: 5, scale: 2 }),
  score_breakdown: jsonb('score_breakdown'),
  assessor_override: boolean('assessor_override').default(false),
  assessor_notes: text('assessor_notes'),
  assessor_email: varchar('assessor_email', { length: 255 }),
  assessor_updated_at: timestamp('assessor_updated_at', { withTimezone: true }),
  started_at: timestamp('started_at', { withTimezone: true }),
  completed_at: timestamp('completed_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    campaign_idx: index('idx_participants_campaign').on(table.campaign_id),
  };
});

export const test_results = pgTable('test_results', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  participant_id: integer('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  test_id: integer('test_id').notNull().references(() => master_tests.id, { onDelete: 'cascade' }),
  raw_answers: jsonb('raw_answers').notNull(),
  scoring_data: jsonb('scoring_data'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    participant_test_idx: index('idx_test_results_part_test').on(table.participant_id, table.test_id),
    unq: unique().on(table.participant_id, table.test_id),
  };
});

export const payment_methods = pgTable('payment_methods', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  logo_url: varchar('logo_url', { length: 1024 }),
  type: varchar('type', { length: 50 }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  admin_fee_flat: numeric('admin_fee_flat', { precision: 10, scale: 2 }).default('0.00'),
  admin_fee_pct: numeric('admin_fee_pct', { precision: 5, scale: 2 }).default('0.00'),
  is_active: boolean('is_active').default(true),
  sort_order: integer('sort_order').default(0),
});

export const payment_instructions = pgTable('payment_instructions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  payment_method_id: integer('payment_method_id').notNull().references(() => payment_methods.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  sort_order: integer('sort_order').default(0),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const test_orders = pgTable('test_orders', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  invoice_code: varchar('invoice_code', { length: 100 }).notNull().unique(),
  customer_id: integer('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  order_type: varchar('order_type', { length: 50 }).notNull().default('DIRECT_QUOTA'),
  payment_method_id: integer('payment_method_id').references(() => payment_methods.id, { onDelete: 'set null' }),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
  fee_amount: numeric('fee_amount', { precision: 15, scale: 2 }).default('0.00'),
  total_amount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
  payment_url: varchar('payment_url', { length: 1024 }),
  payment_token: varchar('payment_token', { length: 255 }),
  proof_url: varchar('proof_url', { length: 1024 }),
  notes: text('notes'),
  status: varchar('status', { length: 50 }).default('PENDING'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  paid_at: timestamp('paid_at', { withTimezone: true }),
}, (table) => {
  return {
    invoice_idx: index('idx_test_orders_invoice').on(table.invoice_code),
    customer_idx: index('idx_test_orders_customer').on(table.customer_id),
  };
});

export const test_order_items = pgTable('test_order_items', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  order_id: integer('order_id').notNull().references(() => test_orders.id, { onDelete: 'cascade' }),
  test_id: integer('test_id').references(() => master_tests.id, { onDelete: 'cascade' }),
  bundle_id: integer('bundle_id').references(() => test_bundles.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  price_per_item: numeric('price_per_item', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    order_idx: index('idx_test_order_items_order').on(table.order_id),
  };
});

export const wallet_transactions = pgTable('wallet_transactions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  customer_id: integer('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  order_id: integer('order_id').references(() => test_orders.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 50 }).notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  balance_before: numeric('balance_before', { precision: 15, scale: 2 }).notNull(),
  balance_after: numeric('balance_after', { precision: 15, scale: 2 }).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    customer_idx: index('idx_wallet_transactions_customer').on(table.customer_id),
  };
});

export const customer_test_quotas = pgTable('customer_test_quotas', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  customer_id: integer('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  test_id: integer('test_id').notNull().references(() => master_tests.id, { onDelete: 'cascade' }),
  quota: integer('quota').notNull().default(0),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    customer_test_idx: index('idx_customer_test_quotas_customer_test').on(table.customer_id, table.test_id),
    unq: unique().on(table.customer_id, table.test_id),
  };
});

export const quota_transactions = pgTable('quota_transactions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  customer_id: integer('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  test_id: integer('test_id').notNull().references(() => master_tests.id, { onDelete: 'cascade' }),
  participant_id: integer('participant_id').references(() => participants.id, { onDelete: 'set null' }),
  reference_id: varchar('reference_id', { length: 100 }),
  quantity: integer('quantity').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    customer_test_desc_idx: index('idx_quota_transactions_customer_test').on(table.customer_id, table.test_id),
  };
});

export const payment_logs = pgTable('payment_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  invoice_code: varchar('invoice_code', { length: 100 }).notNull(),
  endpoint: varchar('endpoint', { length: 255 }),
  type: varchar('type', { length: 50 }),
  request_payload: text('request_payload'),
  response_payload: text('response_payload'),
  http_status: integer('http_status'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    invoice_idx: index('idx_payment_logs_invoice').on(table.invoice_code),
  };
});

export const landing_page_contents = pgTable('landing_page_contents', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  section_key: varchar('section_key', { length: 100 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  subtitle: text('subtitle'),
  content: jsonb('content').notNull(),
  is_active: boolean('is_active').default(true),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const notification_templates = pgTable('notification_templates', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  event_trigger: varchar('event_trigger', { length: 50 }).notNull().unique(),
  channel: varchar('channel', { length: 20 }).notNull(),
  message_content: text('message_content').notNull(),
  is_active: boolean('is_active').default(true),
});

export const notification_logs = pgTable('notification_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  template_id: integer('template_id').references(() => notification_templates.id, { onDelete: 'set null' }),
  reference_code: varchar('reference_code', { length: 100 }),
  recipient: varchar('recipient', { length: 150 }).notNull(),
  channel: varchar('channel', { length: 20 }).notNull(),
  request_payload: text('request_payload'),
  response_payload: text('response_payload'),
  status: varchar('status', { length: 20 }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    ref_idx: index('idx_notification_logs_ref').on(table.reference_code),
  };
});

export const disc_patterns = pgTable('disc_patterns', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  code: varchar('code', { length: 32 }).notNull(),
  name: varchar('name', { length: 160 }).notNull(),
  description: text('description').notNull(),
  jobs: jsonb('jobs').notNull(),
  characteristics: jsonb('characteristics'),
  cautions: jsonb('cautions'),
  motivators: text('motivators'),
  is_active: boolean('is_active').notNull().default(true),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    code_uq: uniqueIndex('uq_disc_patterns_code').on(table.code),
    active_idx: index('idx_disc_patterns_is_active').on(table.is_active),
  };
});

export const disc_subtraits = pgTable('disc_subtraits', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  pair_key: varchar('pair_key', { length: 16 }).notNull(),
  label_id: varchar('label_id', { length: 80 }).notNull(),
  pair_label: varchar('pair_label', { length: 120 }).notNull(),
  narrative: text('narrative').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    pair_uq: uniqueIndex('uq_disc_subtraits_pair_key').on(table.pair_key),
    active_idx: index('idx_disc_subtraits_is_active').on(table.is_active),
  };
});

export const disc_graph_meanings = pgTable('disc_graph_meanings', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  graph_key: varchar('graph_key', { length: 8 }).notNull(),
  title: varchar('title', { length: 160 }).notNull(),
  meaning: text('meaning').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    graph_uq: uniqueIndex('uq_disc_graph_meanings_graph_key').on(table.graph_key),
    active_idx: index('idx_disc_graph_meanings_is_active').on(table.is_active),
  };
});

export const disc_dimension_traits = pgTable('disc_dimension_traits', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  dim: varchar('dim', { length: 1 }).notNull(),
  heading: varchar('heading', { length: 80 }).notNull(),
  potret_diri: jsonb('potret_diri').notNull(),
  kelebihan: jsonb('kelebihan').notNull(),
  kekurangan: jsonb('kekurangan').notNull(),
  kecenderungan: jsonb('kecenderungan').notNull(),
  lingkungan_cocok: jsonb('lingkungan_cocok').notNull(),
  saran_perbaikan: jsonb('saran_perbaikan').notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    dim_uq: uniqueIndex('uq_disc_dimension_traits_dim').on(table.dim),
  };
});

export const disc_special_statuses = pgTable('disc_special_statuses', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  status: varchar('status', { length: 32 }).notNull(),
  graph_key: varchar('graph_key', { length: 8 }).notNull(),
  arti: text('arti').notNull(),
  context: text('context').notNull().default(''),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    status_graph_uq: uniqueIndex('uq_disc_special_statuses_status_graph').on(table.status, table.graph_key),
  };
});

export const admins = pgTable('admins', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('SUPERADMIN'),
  status: varchar('status', { length: 20 }).default('ACTIVE'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const jabatan_level_profiles = pgTable('jabatan_level_profiles', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  level_code: varchar('level_code', { length: 50 }).notNull().unique(),
  level_name: varchar('level_name', { length: 100 }).notNull(),
  sort_order: integer('sort_order').notNull().default(0),
  weight_wpt: numeric('weight_wpt', { precision: 4, scale: 3 }).notNull().default('0.200'),
  weight_disc: numeric('weight_disc', { precision: 4, scale: 3 }).notNull().default('0.200'),
  weight_bigfive: numeric('weight_bigfive', { precision: 4, scale: 3 }).notNull().default('0.200'),
  weight_papi: numeric('weight_papi', { precision: 4, scale: 3 }).notNull().default('0.200'),
  weight_msdt: numeric('weight_msdt', { precision: 4, scale: 3 }).notNull().default('0.200'),
  min_score_wpt: numeric('min_score_wpt', { precision: 5, scale: 2 }).notNull().default('50'),
  min_score_disc: numeric('min_score_disc', { precision: 5, scale: 2 }).notNull().default('50'),
  min_score_bigfive: numeric('min_score_bigfive', { precision: 5, scale: 2 }).notNull().default('50'),
  min_score_papi: numeric('min_score_papi', { precision: 5, scale: 2 }).notNull().default('50'),
  min_score_msdt: numeric('min_score_msdt', { precision: 5, scale: 2 }).notNull().default('50'),
  threshold_recommended: numeric('threshold_recommended', { precision: 5, scale: 2 }).notNull().default('75'),
  threshold_considered: numeric('threshold_considered', { precision: 5, scale: 2 }).notNull().default('55'),
  dimension_profiles: jsonb('dimension_profiles').notNull().default({}),
  requires_msdt: boolean('requires_msdt').notNull().default(true),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const jabatan_mappings = pgTable('jabatan_mappings', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  jabatan_keyword: varchar('jabatan_keyword', { length: 255 }).notNull(),
  match_mode: varchar('match_mode', { length: 20 }).notNull().default('PREFIX'), // PREFIX | CONTAINS
  level_code: varchar('level_code', { length: 50 }).notNull().references(() => jabatan_level_profiles.level_code),
  priority: integer('priority').notNull().default(100),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    keyword_mode_uq: unique().on(table.jabatan_keyword, table.match_mode),
  };
});
