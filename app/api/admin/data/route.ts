import { NextResponse } from 'next/server';
import { getSuperAdminData } from '@/app/(admin)/panel/actions';
import { requireAdmin } from '@/lib/authGuards';

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const data = await getSuperAdminData();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
