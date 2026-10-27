import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { Document } from '@react-pdf/renderer';
import { DiscSection } from '@/components/reports/v3/DiscSection';
import { FlowPage } from '@/components/reports/v3/ReportShell';

const scoring = {
  g1: { D: 1, I: 5, S: -1, C: -6 },
  g2: { D: 1, I: 7, S: -2, C: 2 },
  g3: { D: -0.5, I: 1, S: -4, C: -4 },
};

async function main() {
  const buffer = await renderToBuffer(
    <Document>
      <FlowPage>
        <DiscSection scoring={scoring} sectionNumber={1} participantName="Selasmawati" />
      </FlowPage>
    </Document>
  );
  const dir = '/opt/cursor/artifacts';
  mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, 'contoh-disc-v4.pdf');
  const { writeFileSync } = await import('node:fs');
  writeFileSync(filePath, buffer);
  console.log(filePath, buffer.length);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
