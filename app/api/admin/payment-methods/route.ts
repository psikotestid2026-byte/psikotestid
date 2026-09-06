import { NextResponse } from 'next/server';
import { getAdminPaymentMethods } from '@/app/(admin)/panel/payment-methods/actions';

export async function GET() {
  try {
    const data = await getAdminPaymentMethods();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
