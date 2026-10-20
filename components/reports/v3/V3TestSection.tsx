import React from 'react';
import { calculateBigFiveScore } from '@/lib/scoring/bigfive';
import { normalizeTestCode, resolveBigFiveScoring } from '@/lib/combinedReport';
import { DiscSection } from '@/components/reports/v3/DiscSection';
import { BigFiveSection } from '@/components/reports/v3/BigFiveSection';
import { PapiSection } from '@/components/reports/v3/PapiSection';
import { WptSection } from '@/components/reports/v3/WptSection';
import { MsdtSection } from '@/components/reports/v3/MsdtSection';

export function V3TestSection({
  result,
  sectionNumber,
}: {
  result: { test_code?: string | null; scoring_data?: any; raw_answers?: unknown };
  sectionNumber: number;
}) {
  const code = normalizeTestCode(result.test_code);
  const scoring = result.scoring_data || {};

  if (code === 'disc') return <DiscSection scoring={scoring} sectionNumber={sectionNumber} />;
  if (code === 'bigfive') {
    const resolved = resolveBigFiveScoring(result.scoring_data, result.raw_answers, calculateBigFiveScore);
    return <BigFiveSection scoring={resolved} sectionNumber={sectionNumber} />;
  }
  if (code === 'papi') return <PapiSection scoring={scoring} sectionNumber={sectionNumber} />;
  if (code === 'wpt') return <WptSection scoring={scoring} sectionNumber={sectionNumber} />;
  if (code === 'msdt') return <MsdtSection scoring={scoring} sectionNumber={sectionNumber} />;
  return null;
}
