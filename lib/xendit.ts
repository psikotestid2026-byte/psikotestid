/**
 * Xendit Payment Gateway Client Helper
 * Documentation: https://docs.xendit.co/api-reference/invoices/create-invoice
 */

interface CreateXenditInvoiceParams {
  externalId: string;
  amount: number;
  payerEmail: string;
  description: string;
  customerName?: string;
  paymentMethods?: string[];
}

export function getXenditApiKey(): string {
  return process.env.XENDIT_API_KEY || '';
}

export function getXenditWebhookToken(): string {
  return process.env.XENDIT_WEBHOOK_VERIFICATION_TOKEN || '';
}

/**
 * Create Invoice via Xendit API v2
 */
export async function createXenditInvoice(params: CreateXenditInvoiceParams): Promise<{
  id: string;
  invoice_url: string;
  expiry_date: string;
  status: string;
}> {
  const apiKey = getXenditApiKey();
  if (!apiKey) {
    throw new Error('XENDIT_API_KEY belum dikonfigurasi di environment.');
  }

  const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;

  const payload: any = {
    external_id: params.externalId,
    amount: Math.round(params.amount),
    payer_email: params.payerEmail,
    description: params.description,
    invoice_duration: 86400, // 24 jam
    currency: 'IDR',
  };

  if (params.customerName) {
    payload.customer = {
      given_names: params.customerName,
      email: params.payerEmail,
    };
  }

  if (params.paymentMethods && params.paymentMethods.length > 0) {
    payload.payment_methods = params.paymentMethods;
  }

  const response = await fetch('https://api.xendit.co/v2/invoices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify(payload),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.invoice_url) {
    console.error('Xendit Invoice Error:', resJson);
    throw new Error(resJson.message || 'Gagal membuat invoice tagihan Xendit.');
  }

  return {
    id: resJson.id,
    invoice_url: resJson.invoice_url,
    expiry_date: resJson.expiry_date,
    status: resJson.status,
  };
}

/**
 * Create Closed Virtual Account via Xendit Core API
 * Direct Account Number generated immediately without invoice redirect link
 */
export async function createXenditVirtualAccount(params: {
  externalId: string;
  bankCode: string;
  name: string;
  expectedAmount: number;
}): Promise<{
  id: string;
  account_number: string;
  bank_code: string;
  name: string;
  expected_amount: number;
  expiration_date: string;
  status: string;
}> {
  const apiKey = getXenditApiKey();
  if (!apiKey) {
    throw new Error('XENDIT_API_KEY belum dikonfigurasi di environment.');
  }

  const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
  const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const response = await fetch('https://api.xendit.co/callback_virtual_accounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({
      external_id: params.externalId,
      bank_code: params.bankCode.toUpperCase(),
      name: params.name.slice(0, 50),
      expected_amount: Math.round(params.expectedAmount),
      is_closed: true,
      expiration_date: expirationDate,
    }),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.account_number) {
    console.error('Xendit Core VA Error:', resJson);
    throw new Error(resJson.message || 'Gagal men-generate Virtual Account Xendit.');
  }

  return {
    id: resJson.id,
    account_number: resJson.account_number,
    bank_code: resJson.bank_code,
    name: resJson.name,
    expected_amount: resJson.expected_amount,
    expiration_date: resJson.expiration_date,
    status: resJson.status,
  };
}

/**
 * Create Dynamic QRIS Code via Xendit Core API
 * Generates raw QR string directly for instant in-page rendering
 */
export async function createXenditQrCode(params: {
  externalId: string;
  amount: number;
}): Promise<{
  id: string;
  qr_string: string;
  status: string;
  expires_at: string;
}> {
  const apiKey = getXenditApiKey();
  if (!apiKey) {
    throw new Error('XENDIT_API_KEY belum dikonfigurasi di environment.');
  }

  const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const response = await fetch('https://api.xendit.co/qr_codes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
      'api-version': '2022-07-31',
    },
    body: JSON.stringify({
      reference_id: params.externalId,
      type: 'DYNAMIC',
      currency: 'IDR',
      amount: Math.round(params.amount),
      expires_at: expiresAt,
    }),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.qr_string) {
    console.error('Xendit Core QR Error:', resJson);
    throw new Error(resJson.message || 'Gagal men-generate QRIS Xendit.');
  }

  return {
    id: resJson.id,
    qr_string: resJson.qr_string,
    status: resJson.status,
    expires_at: resJson.expires_at,
  };
}

/**
 * Create Retail Outlet Fixed Payment Code (Alfamart / Indomaret) via Xendit Core API
 */
export async function createXenditRetailCode(params: {
  externalId: string;
  retailOutletName: 'ALFAMART' | 'INDOMARET';
  name: string;
  expectedAmount: number;
}): Promise<{
  id: string;
  payment_code: string;
  retail_outlet_name: string;
  expected_amount: number;
  expiration_date: string;
  status: string;
}> {
  const apiKey = getXenditApiKey();
  if (!apiKey) {
    throw new Error('XENDIT_API_KEY belum dikonfigurasi di environment.');
  }

  const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
  const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const response = await fetch('https://api.xendit.co/fixed_payment_code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({
      external_id: params.externalId,
      retail_outlet_name: params.retailOutletName.toUpperCase(),
      name: params.name.slice(0, 50),
      expected_amount: Math.round(params.expectedAmount),
      is_single_use: true,
      expiration_date: expirationDate,
    }),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.payment_code) {
    console.error('Xendit Core Retail Error:', resJson);
    throw new Error(resJson.message || 'Gagal men-generate Kode Kasir Minimarket Xendit.');
  }

  return {
    id: resJson.id,
    payment_code: resJson.payment_code,
    retail_outlet_name: resJson.retail_outlet_name,
    expected_amount: resJson.expected_amount,
    expiration_date: resJson.expiration_date,
    status: resJson.status,
  };
}

/**
 * Verify Xendit Webhook Verification Token
 */
export function verifyXenditWebhook(callbackToken: string | null): boolean {
  const configuredToken = getXenditWebhookToken();
  if (!configuredToken) {
    // Jika webhook verification token belum diset di .env, kita izinkan proses namun log warning
    console.warn('XENDIT_WEBHOOK_VERIFICATION_TOKEN belum diset di .env.local.');
    return true;
  }
  return callbackToken === configuredToken;
}
