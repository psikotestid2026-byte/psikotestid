import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getClientData } from '@/app/(client)/clients/actions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const customerId = session?.user && (session.user as any).id ? Number((session.user as any).id) : 2;
    const data = await getClientData(customerId);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

