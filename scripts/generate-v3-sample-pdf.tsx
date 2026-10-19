import { mkdirSync, writeFileSync } from 'node:fs';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { UniversalPdfDocument } from '@/components/reports/ParticipantReport';
import { calculateBigFiveScore } from '@/lib/scoring/bigfive';
import { calculateWptScore, WPT_ANSWER_KEYS } from '@/lib/scoring/wpt';
import { discSubTrait } from '@/lib/scoring/disc';
import { findDiscTypeInfo } from '@/lib/scoring/disc_dictionary';

const g1 = { D: -8, I: 2, S: 8, C: 1 };
const g2 = { D: -2, I: 0, S: 1, C: 12 };
const g3 = { D: -4, I: 0, S: 6, C: 8 };
const discInfo = findDiscTypeInfo('SC');

const likert = ['Sangat Tidak Setuju', 'Tidak Setuju', 'Netral', 'Setuju', 'Sangat Setuju'];
const bigFiveAnswers: Record<string, string> = {};
for (let i = 0; i < 44; i++) bigFiveAnswers[String(i)] = likert[(i * 2 + (i % 3)) % 5];

const wptAnswers: Record<string, string> = {};
for (let q = 1; q <= 30; q++) {
  const key = WPT_ANSWER_KEYS[q];
  wptAnswers[String(q - 1)] = Array.isArray(key) ? key[0] : key;
}

const participant = {
  full_name: 'Sari Wulandari',
  email: 'sari.wulandari@example.com',
  phone_number: '081234567890',
  position: 'Supervisor Operasional',
  company_name: 'PT Contoh Nusantara',
  curriculum_name: 'Paket Executive Managerial',
  campaign_title: 'Rekrutmen Supervisor 2026',
  status: 'COMPLETED',
  started_at: '2026-10-16T01:00:00.000Z',
  completed_at: '2026-10-16T01:42:00.000Z',
};

const results = [
  {
    id: 1,
    test_code: 'disc',
    test_name: 'DISC Personality',
    category: 'PERSONALITY',
    scoring_data: {
      dominantLabel: 'SC',
      dominantType: discInfo?.name || 'PEACEMAKER',
      hasStressPotential: true,
      subTraits: { g1: discSubTrait(g1), g2: discSubTrait(g2), g3: discSubTrait(g3) },
      g1,
      g2,
      g3,
    },
  },
  {
    id: 2,
    test_code: 'bigfive',
    test_name: 'Big Five Personality',
    category: 'PERSONALITY',
    scoring_data: calculateBigFiveScore(bigFiveAnswers),
  },
  {
    id: 3,
    test_code: 'papi',
    test_name: 'PAPI Kostick',
    category: 'PERSONALITY',
    scoring_data: {
      scores: {
        N: 7, G: 5, A: 3, L: 8, P: 4, I: 1, T: 3, V: 6, X: 7, S: 5,
        B: 1, O: 6, R: 3, D: 5, C: 5, Z: 4, E: 4, K: 6, F: 4, W: 3,
      },
      dominantLabel: 'L - Leadership Role',
    },
  },
  {
    id: 4,
    test_code: 'wpt',
    test_name: 'Wonderlic Personnel Test',
    category: 'COGNITIVE',
    scoring_data: calculateWptScore(wptAnswers),
  },
  {
    id: 5,
    test_code: 'msdt',
    test_name: 'Management Style Diagnostic Test',
    category: 'LEADERSHIP',
    scoring_data: {
      dominantType: 'Ds',
      dominantLabel: 'Ds - Deserter',
    },
  },
];

async function main() {
  const output = process.argv[2] || '/opt/cursor/artifacts/laporan-theaim-v3-contoh.pdf';
  const buffer = await renderToBuffer(<UniversalPdfDocument participant={participant} results={results} />);
  mkdirSync(output.slice(0, output.lastIndexOf('/')), { recursive: true });
  writeFileSync(output, buffer);
  console.log(`wrote ${output} (${buffer.length} bytes)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
