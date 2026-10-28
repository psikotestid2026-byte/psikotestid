import { mkdirSync, writeFileSync } from 'node:fs';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { UniversalPdfDocument } from '@/components/reports/ParticipantReport';
import { calculateBigFiveScore } from '@/lib/scoring/bigfive';
import { calculateDiscScore } from '@/lib/scoring/disc';
import { checkDiscStatus } from '@/lib/scoring/discPatternCode';
import { calculateWptScore, WPT_ANSWER_KEYS } from '@/lib/scoring/wpt';

const discAnswers: Record<string, { P: number; K: number }> = {};
for (let q = 0; q < 24; q++) {
  discAnswers[String(q)] = { P: q % 4, K: (q + 2) % 4 };
}
const disc = calculateDiscScore(discAnswers);
console.log('DISC sample statuses', {
  g1: checkDiscStatus(disc.g1),
  g2: checkDiscStatus(disc.g2),
  g3: checkDiscStatus(disc.g3),
  graphs: { g1: disc.g1, g2: disc.g2, g3: disc.g3 },
});

const likert = ['Sangat Tidak Setuju', 'Tidak Setuju', 'Netral', 'Setuju', 'Sangat Setuju'];
const bigFiveAnswers: Record<string, string> = {};
for (let i = 0; i < 44; i++) bigFiveAnswers[String(i)] = likert[(i * 3) % 5];

const wptAnswers: Record<string, string> = {};
for (let q = 1; q <= 30; q++) {
  const key = WPT_ANSWER_KEYS[q];
  wptAnswers[String(q - 1)] = Array.isArray(key) ? key[0] : key;
}

const participant = {
  full_name: 'Budi Santoso',
  email: 'budi.santoso@example.com',
  phone_number: '081200000000',
  position: 'Supervisor Operasional',
  unit_work: 'Operasi',
  company_name: 'PT Contoh Nusantara',
  curriculum_name: 'Paket Asesmen Jabatan',
  campaign_title: 'Contoh Campaign 15',
  campaign_mode: 'MANDATORY_BUNDLE',
  status: 'COMPLETED',
  started_at: '2026-10-27T01:00:00.000Z',
  completed_at: '2026-10-27T03:10:00.000Z',
  recommendation_status: 'DIPERTIMBANGKAN',
  system_recommendation_status: 'DIPERTIMBANGKAN',
  recommendation_score: 62.5,
  score_breakdown: {
    level_name: 'Supervisor',
    thresholds: { recommended: 75, considered: 60 },
    tests: {
      wpt: { score: 70, weight: 0.2, min_score: 50 },
      disc: { score: 64, weight: 0.2, min_score: 50 },
      bigfive: { score: 58, weight: 0.25, min_score: 50 },
      papi: { score: 61, weight: 0.2, min_score: 50 },
      msdt: { score: 55, weight: 0.15, min_score: 50 },
    },
  },
  ringkasan_eksekutif:
    'Budi Santoso menunjukkan kombinasi gaya kerja yang dapat dipertimbangkan untuk peran supervisor, dengan catatan pada area yang masih perlu penguatan.',
};

const results = [
  {
    id: 1,
    test_code: 'wpt',
    test_name: 'Wonderlic Personnel Test',
    scoring_data: calculateWptScore(wptAnswers),
  },
  {
    id: 2,
    test_code: 'disc',
    test_name: 'DISC',
    raw_answers: discAnswers,
    scoring_data: disc,
  },
  {
    id: 3,
    test_code: 'bigfive',
    test_name: 'Big Five',
    scoring_data: calculateBigFiveScore(bigFiveAnswers),
  },
  {
    id: 4,
    test_code: 'papi',
    test_name: 'PAPI Kostick',
    scoring_data: {
      scores: {
        N: 9, G: 8, A: 7, L: 6, P: 6, I: 6, T: 6,
        V: 5, X: 5, S: 4, B: 4, O: 5, R: 4,
        D: 3, C: 2, Z: 1, E: 3, K: 2, F: 0, W: 3,
      },
      totalScore: 90,
    },
  },
  {
    id: 5,
    test_code: 'msdt',
    test_name: 'MSDT',
    scoring_data: { dominantType: 'Dv', dominantLabel: 'Dv - Developer' },
  },
];

async function main() {
  const outDir = '/opt/cursor/artifacts';
  mkdirSync(outDir, { recursive: true });
  const buffer = await renderToBuffer(
    <UniversalPdfDocument participant={participant} results={results} />
  );
  const pdfPath = `${outDir}/contoh-campaign15-revisi.pdf`;
  writeFileSync(pdfPath, buffer);
  console.log(`Wrote ${pdfPath} (${buffer.length} bytes)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
