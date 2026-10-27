import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import React from 'react';
import { Document, renderToBuffer, Text } from '@react-pdf/renderer';
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
        <Text style={{ fontSize: 12, marginBottom: 6, fontFamily: 'Helvetica' }}>Selasmawati</Text>
        <DiscSection scoring={scoring} sectionNumber={1} />
      </FlowPage>
    </Document>
  );
  const dir = '/opt/cursor/artifacts';
  mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, 'contoh-disc-v7.pdf');
  writeFileSync(filePath, buffer);
  console.log(filePath, buffer.length);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
