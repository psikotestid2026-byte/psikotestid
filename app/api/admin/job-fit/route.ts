import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authGuards';
import { loadJobFitAdminData } from '@/lib/jobFitAdmin';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    return NextResponse.json(await loadJobFitAdminData(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('GET admin/job-fit error:', err);
    return NextResponse.json({ success: false, error: 'Gagal memuat data.' }, { status: 500 });
  }
}
