/**
 * Recompute stored WPT scoring_data from raw_answers with calculateWptScore.
 *
 * Dry-run by default. Prints every WPT row as old raw/IQ versus the new score.
 * --apply updates only test_results.scoring_data on WPT rows whose raw score
 * or IQ differs, then calls scoreParticipant for each affected participant
 * who has already completed the bundle.
 *
 * --force-composite also re-runs scoreParticipant for completed participants
 * whose WPT score is already current (retry after a composite failure).
 *
 * Rows whose scoring_data has no raw_score field are skipped and logged.
 * That covers legacy rows such as participant 10 (campaign 13 demo).
 * --exclude=<ids> and --only=<ids> filter by participant id (comma-separated).
 *
 * Does not write raw_answers. Does not insert or delete rows.
 *
 *   npx tsx scripts/rescore-wpt.ts
 *   npx tsx scripts/rescore-wpt.ts --apply
 *   npx tsx scripts/rescore-wpt.ts --exclude=10
 *   npx tsx scripts/rescore-wpt.ts --only=15,16 --apply
 *   npx tsx scripts/rescore-wpt.ts --apply --force-composite
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { calculateWptScore } from '@/lib/scoring/wpt';

config({ path: '.env.local' });

interface WptRow {
  id: string;
  participant_id: string;
  full_name: string;
  status: string | null;
  scoring_status: string | null;
  raw_answers: unknown;
  scoring_data: unknown;
}

function asObject(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
    return {};
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function formatMetric(value: number | null): string {
  return value == null ? '—' : String(value);
}

function hasRawScoreField(value: unknown): boolean {
  if (typeof value === 'string') {
    try {
      return hasRawScoreField(JSON.parse(value) as unknown);
    } catch {
      return false;
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.prototype.hasOwnProperty.call(value, 'raw_score');
}

/** `--exclude=1,2` or `--exclude 1,2`. Null when the flag is absent. */
function readParticipantIds(flag: '--exclude' | '--only'): Set<number> | null {
  const inline = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  let raw: string | null = null;
  if (inline) {
    raw = inline.slice(flag.length + 1);
  } else {
    const index = process.argv.indexOf(flag);
    if (index >= 0) raw = process.argv[index + 1] ?? '';
  }
  if (raw == null) return null;
  if (raw.trim() === '' || raw.startsWith('--')) {
    throw new Error(`${flag} membutuhkan daftar id peserta, misalnya ${flag}=10`);
  }
  const ids = new Set<number>();
  for (const part of raw.split(',')) {
    const token = part.trim();
    if (!/^\d+$/.test(token)) {
      throw new Error(`${flag} berisi id yang tidak valid: ${token}`);
    }
    ids.add(Number(token));
  }
  return ids;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const forceComposite = process.argv.includes('--force-composite');
  const onlyIds = readParticipantIds('--only');
  const excludeIds = readParticipantIds('--exclude');
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL belum diisi. Skor WPT tidak dihitung ulang.');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const rows = (await sql`
    SELECT tr.id::text AS id,
           tr.participant_id::text AS participant_id,
           p.full_name,
           p.status,
           p.scoring_status,
           tr.raw_answers,
           tr.scoring_data
    FROM test_results tr
    JOIN master_tests mt ON mt.id = tr.test_id
    JOIN participants p ON p.id = tr.participant_id
    WHERE LOWER(mt.code) = 'wpt'
    ORDER BY tr.participant_id, tr.id
  `) as WptRow[];

  console.log(apply ? 'Mode tulis (--apply).' : 'Mode uji (dry-run). Tidak ada baris yang ditulis.');
  if (onlyIds) console.log(`Hanya peserta: ${[...onlyIds].join(', ')}`);
  if (excludeIds) console.log(`Kecuali peserta: ${[...excludeIds].join(', ')}`);
  console.log(`${rows.length} hasil WPT.`);

  const affectedCompleted: number[] = [];
  let changed = 0;
  let skippedLegacy = 0;
  let skippedFilter = 0;

  for (const row of rows) {
    const participantId = Number(row.participant_id);
    const label = `#${row.participant_id} ${row.full_name}`;

    if (onlyIds && !onlyIds.has(participantId)) {
      skippedFilter += 1;
      console.log(`lewati ${label}: di luar --only`);
      continue;
    }
    if (excludeIds && excludeIds.has(participantId)) {
      skippedFilter += 1;
      console.log(`lewati ${label}: ada di --exclude`);
      continue;
    }
    if (!hasRawScoreField(row.scoring_data)) {
      skippedLegacy += 1;
      console.log(`lewati ${label}: scoring_data tidak memiliki raw_score (format lama)`);
      continue;
    }

    const previous = asObject(row.scoring_data);
    const oldRaw = readNumber(previous.raw_score);
    const oldIq = readNumber(previous.iq);
    const answers = asObject(row.raw_answers);
    const next = calculateWptScore(answers);
    const differs = oldRaw !== next.raw_score || oldIq !== next.iq;
    if (differs) changed += 1;

    const completed = String(row.status || '').toUpperCase() === 'COMPLETED';
    console.log(
      `#${row.participant_id} ${row.full_name} [${row.status || 'UNKNOWN'}] raw ${formatMetric(oldRaw)} -> ${next.raw_score}  IQ ${formatMetric(oldIq)} -> ${next.iq}${differs ? '  BERUBAH' : ''}`
    );

    if (!differs && !(forceComposite && completed)) continue;

    if (!apply) {
      if (differs && completed) {
        console.log(`  akan memperbarui scoring_data dan menghitung ulang job fit peserta ${participantId}`);
      } else if (differs) {
        console.log(`  akan memperbarui scoring_data; job fit dilewati karena status bukan COMPLETED`);
      }
      continue;
    }

    if (differs) {
      const payload = JSON.stringify(next);
      const updated = await sql`
        UPDATE test_results AS tr
        SET scoring_data = ${payload}::jsonb
        WHERE tr.id = ${row.id}::bigint
          AND EXISTS (
            SELECT 1 FROM master_tests mt
            WHERE mt.id = tr.test_id AND LOWER(mt.code) = 'wpt'
          )
        RETURNING tr.id::text AS id
      `;
      if (updated.length !== 1) {
        throw new Error(`Gagal memperbarui test_results ${row.id} (WPT).`);
      }
    }

    if (completed && (differs || forceComposite)) {
      affectedCompleted.push(participantId);
    }
  }

  if (apply && affectedCompleted.length > 0) {
    const { scoreParticipant } = await import('@/lib/participantScoring');
    let compositeFailures = 0;
    for (const participantId of affectedCompleted) {
      const outcome = await scoreParticipant(participantId);
      if (outcome.ok) {
        console.log(
          `job fit peserta ${participantId}: ${outcome.level_code} komposit ${outcome.composite} (${outcome.status})`
        );
        continue;
      }
      if (outcome.incomplete) {
        console.log(`job fit peserta ${participantId} dilewati: ${outcome.error}`);
        continue;
      }
      compositeFailures += 1;
      console.error(`job fit peserta ${participantId} gagal: ${outcome.error}`);
    }
    if (compositeFailures > 0) {
      console.error(
        `${compositeFailures} job fit gagal. Ulangi dengan --apply --force-composite setelah penyebabnya diperbaiki.`
      );
      process.exit(1);
    }
  }

  const considered = rows.length - skippedLegacy - skippedFilter;
  console.log(
    `Selesai. ${changed} dari ${considered} skor WPT berbeda. ${skippedLegacy} baris dilewati karena tidak ada raw_score. ${skippedFilter} baris dilewati oleh --only/--exclude.${apply ? '' : ' Jalankan dengan --apply untuk menulis.'}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
