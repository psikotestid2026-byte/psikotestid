import { NextResponse } from 'next/server';
import { getAdminParticipants } from '@/app/(admin)/panel/participants/actions';

export async function GET() {
  try {
    const data = await getAdminParticipants();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
