import { NextResponse } from 'next/server';
import { getAdminPaymentMethods } from '@/app/(admin)/panel/payment-methods/actions';
import { requireAdmin } from '@/lib/authGuards';

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const data = await getAdminPaymentMethods();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
