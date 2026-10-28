import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { requireAdmin } from '@/lib/authGuards';
import { explainJobLevel, type JabatanMapping } from '@/lib/jobFit';

export const runtime = 'nodejs';

/** Preview: which level would a given jabatan text resolve to (active mappings only). */
export async function GET(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const position = new URL(req.url).searchParams.get('position') || '';
    if (position.length > 255) {
      return NextResponse.json({ success: false, error: 'Teks jabatan terlalu panjang.' }, { status: 400 });
    }
    const mappings = await sql`
      SELECT jabatan_keyword, match_mode, level_code, priority
      FROM jabatan_mappings WHERE is_active
    `;
    const result = explainJobLevel(position, mappings as unknown as JabatanMapping[]);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('GET admin/job-fit/resolve error:', err);
    return NextResponse.json({ success: false, error: 'Gagal menguji jabatan.' }, { status: 500 });
  }
}
