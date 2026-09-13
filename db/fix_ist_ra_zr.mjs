import { config } from 'dotenv';
config({ path: '.env.local' });
import pg from 'pg';
const { Client } = pg;

// RA (arithmetic, order 77-96) and ZR (number series, order 97-116) correct answers,
// independently computed by hand from the item text (self-verifying math, no proprietary
// key needed). Item 101's raw text had a duplicated "22" (data seed error) — corrected to
// the true 7-term series "2 4 8 10 20 22 44 ?" (alternating +2/x2), answer 46.
const ANSWERS = {
  77: 35, 78: 280, 79: 205, 80: 26, 81: 30, 82: 70, 83: 45, 84: 50, 85: 84,
  86: 78, 87: 19, 88: 6, 89: 75, 90: 90, 91: 120, 92: 17, 93: 24, 94: 5, 95: 48, 96: 3,
  97: 27, 98: 25, 99: 27, 100: 15, 101: 46, 102: 10, 103: 42, 104: 7, 105: 5,
  106: 14, 107: 8, 108: 14, 109: 45, 110: 63, 111: 12, 112: 80, 113: 14,
  114: 12, 115: 63, 116: 10,
};

const FIXED_TEXT_101 = '2    4    8   10    20    22    44     ?';

function seededRng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Generate 4 distinct, plausible numeric distractors around the correct answer using
// standard aptitude-test distractor patterns (off-by-small-amount, wrong operation scale,
// half/double) — general test-design convention, not proprietary content.
function buildOptions(correct, orderNumber) {
  const rng = seededRng(orderNumber * 7919 + 13);
  const candidates = new Set([correct]);
  const deltas = [1, -1, 2, -2, 3, -3, 5, -5, 10, -10];
  const scaled = [
    Math.round(correct / 2),
    correct * 2,
    Math.round(correct * 1.1),
    Math.round(correct * 0.9),
  ];
  const pool = [...deltas.map((d) => correct + d), ...scaled].filter(
    (v) => Number.isFinite(v) && v !== correct && v > 0
  );
  // shuffle pool deterministically
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  for (const v of pool) {
    if (candidates.size >= 5) break;
    candidates.add(v);
  }
  let fallback = correct + 100;
  while (candidates.size < 5) {
    candidates.add(fallback);
    fallback += 17;
  }
  const options = Array.from(candidates);
  // shuffle final option order deterministically so the correct answer isn't always first
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  const testIdRes = await c.query(`SELECT id FROM master_tests WHERE code='ist'`);
  const testId = testIdRes.rows[0].id;

  await c.query('BEGIN');
  try {
    for (const [orderStr, correct] of Object.entries(ANSWERS)) {
      const orderNumber = Number(orderStr);
      const current = await c.query(
        `SELECT id, question_data FROM question_banks WHERE test_id=$1 AND order_number=$2`,
        [testId, orderNumber]
      );
      if (current.rows.length !== 1) {
        throw new Error(`Expected exactly 1 row for order_number=${orderNumber}, found ${current.rows.length}`);
      }
      const row = current.rows[0];
      const text = orderNumber === 101 ? FIXED_TEXT_101 : row.question_data.text;
      const options = buildOptions(correct, orderNumber).map(String);
      const correctIndex = options.indexOf(String(correct));

      const newData = { text, options, correctIndex };
      await c.query(`UPDATE question_banks SET question_data=$1 WHERE id=$2`, [
        JSON.stringify(newData),
        row.id,
      ]);
    }
    await c.query('COMMIT');
    console.log('Updated', Object.keys(ANSWERS).length, 'RA/ZR rows with real numeric options + correctIndex.');
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  }

  // Verify
  const verify = await c.query(
    `SELECT order_number, question_data FROM question_banks WHERE test_id=$1 AND order_number BETWEEN 77 AND 116 ORDER BY order_number`,
    [testId]
  );
  let bad = 0;
  for (const row of verify.rows) {
    const qd = row.question_data;
    if (!Array.isArray(qd.options) || qd.options.length !== 5 || typeof qd.correctIndex !== 'number') {
      bad++;
      console.log('BAD ROW', row.order_number, JSON.stringify(qd));
    }
  }
  console.log('Verification: bad rows =', bad, '/ 40');
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
