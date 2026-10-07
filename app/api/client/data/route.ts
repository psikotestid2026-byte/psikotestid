import { NextResponse } from 'next/server';
import { getClientData } from '@/app/(client)/clients/actions';
import { requireCustomer } from '@/lib/authGuards';

export async function GET() {
  try {
    const auth = await requireCustomer();
    if (!auth.ok) return auth.response;

    const data = await getClientData(Number(auth.customer.id));
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
