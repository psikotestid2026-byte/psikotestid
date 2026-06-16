import { NextResponse } from 'next/server';
import { getSuperAdminData } from '@/app/(admin)/panel/actions';

export async function GET() {
  try {
    const data = await getSuperAdminData();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
