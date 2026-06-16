import { pgTable, bigserial, varchar, timestamp, text, integer, numeric, boolean, jsonb, index, primaryKey, unique } from 'drizzle-orm/pg-core';

export const customers = pgTable('customers', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  auth_user_id: varchar('auth_user_id', { length: 255 }).unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  company_name: varchar('company_name', { length: 255 }).notNull(),
  phone_number: varchar('phone_number', { length: 50 }),
  logo_url: varchar('logo_url', { length: 1024 }),
  brand_color: varchar('brand_color', { length: 20 }).default('#2563eb'),
  role: varchar('role', { length: 50 }).default('CUSTOMER'),
  status: varchar('status', { length: 20 }).default('ACTIVE'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const master_tests = pgTable('master_tests', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  duration_sec: integer('duration_sec').notNull().default(0),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0.00'),
  instructions: text('instructions'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
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
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    customer_idx: index('idx_campaigns_customer').on(table.customer_id),
  };
});

export const campaign_tests = pgTable('campaign_tests', {
  campaign_id: integer('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  test_id: integer('test_id').notNull().references(() => master_tests.id, { onDelete: 'cascade' }),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.campaign_id, table.test_id] }),
  };
});

export const participants = pgTable('participants', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  campaign_id: integer('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  full_name: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone_number: varchar('phone_number', { length: 50 }),
  status: varchar('status', { length: 50 }).default('RUNNING'),
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
  payment_method_id: integer('payment_method_id').references(() => payment_methods.id, { onDelete: 'set null' }),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
  fee_amount: numeric('fee_amount', { precision: 15, scale: 2 }).default('0.00'),
  total_amount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
  payment_url: varchar('payment_url', { length: 1024 }),
  payment_token: varchar('payment_token', { length: 255 }),
  proof_url: varchar('proof_url', { length: 1024 }),
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
  test_id: integer('test_id').notNull().references(() => master_tests.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  price_per_item: numeric('price_per_item', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    order_idx: index('idx_test_order_items_order').on(table.order_id),
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
  reference_id: varchar('reference_id', { length: 100 }),
  quantity: integer('quantity').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    customer_test_desc_idx: index('idx_quota_transactions_customer_test').on(table.customer_id, table.test_id), // Drizzle index doesn't fully support DESC nicely without raw SQL, but this is fine
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
