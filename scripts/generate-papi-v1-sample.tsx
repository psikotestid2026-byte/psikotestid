import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { UniversalPdfDocument } from '@/components/reports/ParticipantReport';

const scores = {
  N: 9, G: 8, A: 7, L: 7, P: 6, I: 6, T: 6,
  V: 5, X: 5, S: 4, B: 4, O: 5, R: 4,
  D: 3, C: 2, Z: 1, E: 3, K: 2, F: 0, W: 3,
};

async function main() {
  const buffer = await renderToBuffer(
    <UniversalPdfDocument
      participant={{ full_name: 'Selasmawati', status: 'COMPLETED' }}
      results={[
        {
          id: 1,
          test_code: 'papi',
          test_name: 'PAPI Kostick',
          scoring_data: { scores, totalScore: 90, completed: true, total_answers: 90 },
          created_at: '2026-10-27T03:00:00.000Z',
        },
      ]}
    />
  );
  const dir = '/opt/cursor/artifacts';
  mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, 'contoh-papi-v2.pdf');
  writeFileSync(filePath, buffer);
  console.log(filePath, buffer.length);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
