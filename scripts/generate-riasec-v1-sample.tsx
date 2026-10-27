import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { UniversalPdfDocument } from '@/components/reports/ParticipantReport';

const participant = {
  full_name: 'Selasmawati',
  email: 'selasmawati@example.com',
  status: 'COMPLETED',
  started_at: '2026-10-27T01:00:00.000Z',
  completed_at: '2026-10-27T01:40:00.000Z',
};

const riasec = {
  id: 3,
  test_code: 'riasec',
  test_name: 'Holland RIASEC',
  scoring_data: {
    ranking: ['S', 'A', 'E', 'R', 'I', 'C'],
    scores: { R: 4, I: 6, A: 14, S: 16, E: 11, C: 3 },
    interestCode: 'SAE',
    consistency: 'Tinggi',
    comboProfessions: ['Interpreter', 'Translator', 'Choreographer'],
  },
  created_at: '2026-10-27T01:40:00.000Z',
};

const disc = {
  id: 1,
  test_code: 'disc',
  test_name: 'DISC',
  scoring_data: {
    g1: { D: 1, I: 5, S: -1, C: -6 },
    g2: { D: 1, I: 7, S: -2, C: 2 },
    g3: { D: -0.5, I: 1, S: -4, C: -4 },
  },
  created_at: '2026-10-27T01:20:00.000Z',
};

const papi = {
  id: 2,
  test_code: 'papi',
  test_name: 'PAPI Kostick',
  scoring_data: {
    scores: {
      N: 9, G: 8, A: 7, L: 7, P: 6, I: 6, T: 6,
      V: 5, X: 5, S: 4, B: 4, O: 5, R: 4,
      D: 3, C: 2, Z: 1, E: 3, K: 2, F: 0, W: 3,
    },
    totalScore: 90,
    completed: true,
    total_answers: 90,
  },
  created_at: '2026-10-27T01:30:00.000Z',
};

async function writePdf(fileName: string, results: unknown[]) {
  const buffer = await renderToBuffer(
    <UniversalPdfDocument participant={participant} results={results as never[]} />
  );
  const dir = '/opt/cursor/artifacts';
  mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, fileName);
  writeFileSync(filePath, buffer);
  console.log(filePath, buffer.length);
}

async function main() {
  await writePdf('contoh-riasec-v1.pdf', [disc, papi, riasec]);
  await writePdf('contoh-riasec-only-v1.pdf', [riasec]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
