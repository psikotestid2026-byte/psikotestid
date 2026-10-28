import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { requireAdmin } from '@/lib/authGuards';
import { invalidateScoringConfigCache } from '@/lib/participantScoring';

export const runtime = 'nodejs';

const TESTS = ['wpt', 'disc', 'bigfive', 'papi', 'msdt'] as const;

function num(value: unknown, min: number, max: number): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

/** Updates one level profile (levels are never deleted; use is_active to disable). */
export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    const levelCode = typeof body?.level_code === 'string' ? body.level_code : '';
    if (!levelCode) return NextResponse.json({ success: false, error: 'Kode level wajib diisi.' }, { status: 400 });

    const weights: Record<string, number> = {};
    const mins: Record<string, number> = {};
    for (const t of TESTS) {
      const w = num(body?.weights?.[t], 0, 1);
      const m = num(body?.min_scores?.[t], 0, 100);
      if (w == null || m == null) {
        return NextResponse.json({ success: false, error: `Bobot atau skor minimum ${t.toUpperCase()} tidak valid.` }, { status: 400 });
      }
      weights[t] = w;
      mins[t] = m;
    }
    const sum = TESTS.reduce((s, t) => s + weights[t], 0);
    if (Math.abs(sum - 1) > 0.01) {
      return NextResponse.json({ success: false, error: 'Total bobot harus sama dengan 100%.' }, { status: 400 });
    }

    const rec = num(body?.threshold_recommended, 0, 100);
    const con = num(body?.threshold_considered, 0, 100);
    if (rec == null || con == null || con >= rec) {
      return NextResponse.json({ success: false, error: 'Ambang Direkomendasikan harus lebih besar dari ambang Dipertimbangkan.' }, { status: 400 });
    }

    const dims = body?.dimension_profiles;
    if (!dims || typeof dims !== 'object' || Array.isArray(dims)) {
      return NextResponse.json({ success: false, error: 'Profil dimensi harus berupa objek JSON.' }, { status: 400 });
    }
    const levelName = typeof body?.level_name === 'string' && body.level_name.trim() ? body.level_name.trim().slice(0, 100) : null;
    const isActive = body?.is_active !== false;

    const rows = await sql`
      UPDATE jabatan_level_profiles SET
        level_name = COALESCE(${levelName}, level_name),
        weight_wpt = ${weights.wpt}, weight_disc = ${weights.disc}, weight_bigfive = ${weights.bigfive},
        weight_papi = ${weights.papi}, weight_msdt = ${weights.msdt},
        min_score_wpt = ${mins.wpt}, min_score_disc = ${mins.disc}, min_score_bigfive = ${mins.bigfive},
        min_score_papi = ${mins.papi}, min_score_msdt = ${mins.msdt},
        threshold_recommended = ${rec}, threshold_considered = ${con},
        dimension_profiles = ${JSON.stringify(dims)}::jsonb,
        is_active = ${isActive},
        updated_at = NOW()
      WHERE level_code = ${levelCode}
      RETURNING id
    `;
    if (!rows.length) return NextResponse.json({ success: false, error: 'Level tidak ditemukan.' }, { status: 404 });

    invalidateScoringConfigCache();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PUT admin/job-fit/profiles error:', err);
    return NextResponse.json({ success: false, error: 'Gagal menyimpan profil level.' }, { status: 500 });
  }
}
