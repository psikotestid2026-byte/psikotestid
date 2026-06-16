import { NextResponse } from 'next/server';
import { getClientData } from '@/app/(client)/clients/actions';

export async function GET() {
  try {
    // Hardcoded to customer 2 for now
    const data = await getClientData(2);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
