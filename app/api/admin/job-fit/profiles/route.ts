import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { requireAdmin } from '@/lib/authGuards';
import { invalidateScoringConfigCache } from '@/lib/participantScoring';
import { LEVEL_CODE_PATTERN, validateDimensionProfiles, validateProfileNumbers } from '@/lib/jobFitValidation';

export const runtime = 'nodejs';

/** Creates a new level. Optionally copies weights and ideal profile from an existing level. */
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    const levelCode = typeof body?.level_code === 'string' ? body.level_code.trim().toUpperCase() : '';
    const levelName = typeof body?.level_name === 'string' ? body.level_name.trim().slice(0, 100) : '';
    const copyFrom = typeof body?.copy_from === 'string' ? body.copy_from : '';

    if (!LEVEL_CODE_PATTERN.test(levelCode)) {
      return NextResponse.json(
        { success: false, error: 'Kode level harus 2-30 karakter: huruf besar, angka, atau garis bawah, diawali huruf.' },
        { status: 400 }
      );
    }
    if (!levelName) return NextResponse.json({ success: false, error: 'Nama level wajib diisi.' }, { status: 400 });

    const source = copyFrom
      ? (await sql`SELECT * FROM jabatan_level_profiles WHERE level_code = ${copyFrom} LIMIT 1`)[0]
      : (await sql`SELECT * FROM jabatan_level_profiles WHERE level_code = 'STAF' LIMIT 1`)[0];
    if (copyFrom && !source) {
      return NextResponse.json({ success: false, error: 'Level sumber tidak ditemukan.' }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO jabatan_level_profiles
        (level_code, level_name, sort_order,
         weight_wpt, weight_disc, weight_bigfive, weight_papi, weight_msdt,
         min_score_wpt, min_score_disc, min_score_bigfive, min_score_papi, min_score_msdt,
         threshold_recommended, threshold_considered, dimension_profiles, is_active)
      SELECT ${levelCode}, ${levelName}, COALESCE((SELECT MAX(sort_order) FROM jabatan_level_profiles), 0) + 1,
        COALESCE(s.weight_wpt, 0.20), COALESCE(s.weight_disc, 0.20), COALESCE(s.weight_bigfive, 0.20),
        COALESCE(s.weight_papi, 0.20), COALESCE(s.weight_msdt, 0.20),
        COALESCE(s.min_score_wpt, 50), COALESCE(s.min_score_disc, 50), COALESCE(s.min_score_bigfive, 50),
        COALESCE(s.min_score_papi, 50), COALESCE(s.min_score_msdt, 50),
        COALESCE(s.threshold_recommended, 75), COALESCE(s.threshold_considered, 55),
        COALESCE(s.dimension_profiles, '{}'::jsonb), TRUE
      FROM (SELECT 1) base
      LEFT JOIN jabatan_level_profiles s ON s.level_code = ${source ? source.level_code : ''}
      ON CONFLICT (level_code) DO NOTHING
      RETURNING id
    `;
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Kode level sudah digunakan.' }, { status: 409 });
    }
    invalidateScoringConfigCache();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST admin/job-fit/profiles error:', err);
    return NextResponse.json({ success: false, error: 'Gagal membuat level baru.' }, { status: 500 });
  }
}

/** Updates one level profile (levels are never deleted; use is_active to disable). */
export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    const levelCode = typeof body?.level_code === 'string' ? body.level_code : '';
    if (!levelCode) return NextResponse.json({ success: false, error: 'Kode level wajib diisi.' }, { status: 400 });

    const numbers = validateProfileNumbers(body);
    if (!numbers.ok) return NextResponse.json({ success: false, error: numbers.error }, { status: 400 });
    const { weights, min_scores: mins, threshold_recommended: rec, threshold_considered: con } = numbers.value;

    const dimsError = validateDimensionProfiles(body?.dimension_profiles);
    if (dimsError) return NextResponse.json({ success: false, error: dimsError }, { status: 400 });

    const levelName = typeof body?.level_name === 'string' && body.level_name.trim() ? body.level_name.trim().slice(0, 100) : null;
    const isActive = body?.is_active !== false;

    if (!isActive) {
      const others = await sql`SELECT COUNT(*)::int AS total FROM jabatan_level_profiles WHERE is_active AND level_code <> ${levelCode}`;
      if (others[0].total === 0) {
        return NextResponse.json({ success: false, error: 'Minimal satu level harus tetap aktif.' }, { status: 409 });
      }
    }

    const rows = await sql`
      UPDATE jabatan_level_profiles SET
        level_name = COALESCE(${levelName}, level_name),
        weight_wpt = ${weights.wpt}, weight_disc = ${weights.disc}, weight_bigfive = ${weights.bigfive},
        weight_papi = ${weights.papi}, weight_msdt = ${weights.msdt},
        min_score_wpt = ${mins.wpt}, min_score_disc = ${mins.disc}, min_score_bigfive = ${mins.bigfive},
        min_score_papi = ${mins.papi}, min_score_msdt = ${mins.msdt},
        threshold_recommended = ${rec}, threshold_considered = ${con},
        dimension_profiles = ${JSON.stringify(body.dimension_profiles)}::jsonb,
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
