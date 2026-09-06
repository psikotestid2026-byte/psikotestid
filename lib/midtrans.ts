/**
 * Midtrans Payment Gateway Client Helper
 * Documentation: https://docs.midtrans.com/reference/snap-transaction
 */
import crypto from 'crypto';

interface MidtransItem {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

interface CreateMidtransSnapParams {
  orderId: string;
  grossAmount: number;
  customerDetails: {
    first_name: string;
    email: string;
    phone?: string;
  };
  items?: MidtransItem[];
  enabledPayments?: string[];
}

export function isMidtransProduction(): boolean {
  return process.env.MIDTRANS_IS_PRODUCTION === 'true';
}

export function getMidtransServerKey(): string {
  return process.env.MIDTRANS_SERVER_KEY || '';
}

export function getMidtransClientKey(): string {
  return process.env.MIDTRANS_CLIENT_KEY || '';
}

export function getMidtransSnapUrl(): string {
  return isMidtransProduction()
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
}

/**
 * Create Snap Transaction Token & Redirect URL
 */
export async function createMidtransSnapTransaction(params: CreateMidtransSnapParams): Promise<{
  token: string;
  redirect_url: string;
}> {
  const serverKey = getMidtransServerKey();
  if (!serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY belum dikonfigurasi di environment.');
  }

  const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;

  const payload: any = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.grossAmount),
    },
    customer_details: {
      first_name: params.customerDetails.first_name,
      email: params.customerDetails.email,
      phone: params.customerDetails.phone || undefined,
    },
  };

  if (params.items && params.items.length > 0) {
    payload.item_details = params.items.map((item) => ({
      id: item.id.slice(0, 50),
      price: Math.round(item.price),
      quantity: item.quantity,
      name: item.name.slice(0, 50),
    }));
  }

  if (params.enabledPayments && params.enabledPayments.length > 0) {
    payload.enabled_payments = params.enabledPayments;
  }

  const response = await fetch(getMidtransSnapUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify(payload),
  });

  const resJson = await response.json();

  if (!response.ok || !resJson.token) {
    console.error('Midtrans Snap Error:', resJson);
    throw new Error(resJson.error_messages ? resJson.error_messages.join(', ') : 'Gagal membuat sesi transaksi Midtrans.');
  }

  return {
    token: resJson.token,
    redirect_url: resJson.redirect_url,
  };
}

/**
 * Verify Midtrans Webhook Notification Signature
 * Signature formula: SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  const serverKey = getMidtransServerKey();
  const rawString = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const computedHash = crypto.createHash('sha512').update(rawString).digest('hex');
  return computedHash.toLowerCase() === signatureKey.toLowerCase();
}
