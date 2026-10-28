import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { requireAdmin } from '@/lib/authGuards';
import { invalidateScoringConfigCache } from '@/lib/participantScoring';

export const runtime = 'nodejs';

const MATCH_MODES = ['PREFIX', 'CONTAINS'] as const;

/** Creates or re-activates a mapping keyword (upsert on keyword + match mode). */
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    const keyword = typeof body?.jabatan_keyword === 'string' ? body.jabatan_keyword.trim().toUpperCase() : '';
    const mode = body?.match_mode;
    const levelCode = typeof body?.level_code === 'string' ? body.level_code : '';
    const priority = Number.isInteger(Number(body?.priority)) ? Number(body.priority) : 100;

    if (!keyword || keyword.length > 255) {
      return NextResponse.json({ success: false, error: 'Kata kunci jabatan tidak valid.' }, { status: 400 });
    }
    if (!MATCH_MODES.includes(mode)) {
      return NextResponse.json({ success: false, error: 'Mode pencocokan tidak valid.' }, { status: 400 });
    }
    const levels = await sql`SELECT 1 FROM jabatan_level_profiles WHERE level_code = ${levelCode} LIMIT 1`;
    if (!levels.length) return NextResponse.json({ success: false, error: 'Level tidak ditemukan.' }, { status: 400 });

    await sql`
      INSERT INTO jabatan_mappings (jabatan_keyword, match_mode, level_code, priority, is_active)
      VALUES (${keyword}, ${mode}, ${levelCode}, ${priority}, TRUE)
      ON CONFLICT (jabatan_keyword, match_mode)
      DO UPDATE SET level_code = EXCLUDED.level_code, priority = EXCLUDED.priority, is_active = TRUE
    `;
    invalidateScoringConfigCache();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST admin/job-fit/mappings error:', err);
    return NextResponse.json({ success: false, error: 'Gagal menyimpan pemetaan jabatan.' }, { status: 500 });
  }
}

/** Updates level, priority or active flag. Mappings are never deleted. */
export async function PATCH(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    const id = Number(body?.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ success: false, error: 'ID tidak valid.' }, { status: 400 });
    }
    const levelCode = typeof body?.level_code === 'string' ? body.level_code : null;
    const priority = body?.priority != null && Number.isInteger(Number(body.priority)) ? Number(body.priority) : null;
    const isActive = typeof body?.is_active === 'boolean' ? body.is_active : null;

    if (levelCode) {
      const levels = await sql`SELECT 1 FROM jabatan_level_profiles WHERE level_code = ${levelCode} LIMIT 1`;
      if (!levels.length) return NextResponse.json({ success: false, error: 'Level tidak ditemukan.' }, { status: 400 });
    }

    const rows = await sql`
      UPDATE jabatan_mappings SET
        level_code = COALESCE(${levelCode}, level_code),
        priority = COALESCE(${priority}::int, priority),
        is_active = COALESCE(${isActive}::boolean, is_active)
      WHERE id = ${id}
      RETURNING id
    `;
    if (!rows.length) return NextResponse.json({ success: false, error: 'Pemetaan tidak ditemukan.' }, { status: 404 });
    invalidateScoringConfigCache();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH admin/job-fit/mappings error:', err);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui pemetaan jabatan.' }, { status: 500 });
  }
}
