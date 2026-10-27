import React from 'react';
import { calculateBigFiveScore } from '@/lib/scoring/bigfive';
import { calculatePapiScore } from '@/lib/scoring/papi';
import { calculateMsdtScore } from '@/lib/scoring/msdt';
import {
  normalizeTestCode,
  resolveBigFiveScoring,
  resolveMsdtScoring,
  resolvePapiScoring,
} from '@/lib/combinedReport';
import type { DiscReportDictionary } from '@/lib/scoring/discReportDictionary';
import { DiscSection } from '@/components/reports/v3/DiscSection';
import { BigFiveSection } from '@/components/reports/v3/BigFiveSection';
import { PapiSection } from '@/components/reports/v3/PapiSection';
import { WptSection } from '@/components/reports/v3/WptSection';
import { MsdtSection } from '@/components/reports/v3/MsdtSection';

export function V3TestSection({
  result,
  sectionNumber,
  participantName,
  discDictionary,
}: {
  result: { test_code?: string | null; scoring_data?: any; raw_answers?: unknown };
  sectionNumber: number;
  participantName?: string | null;
  discDictionary?: DiscReportDictionary | null;
}) {
  const code = normalizeTestCode(result.test_code);
  const scoring = result.scoring_data || {};

  if (code === 'disc') {
    return (
      <DiscSection
        scoring={scoring}
        sectionNumber={sectionNumber}
        participantName={participantName}
        dictionary={discDictionary}
      />
    );
  }
  if (code === 'bigfive') {
    const resolved = resolveBigFiveScoring(result.scoring_data, result.raw_answers, calculateBigFiveScore);
    return <BigFiveSection scoring={resolved} sectionNumber={sectionNumber} />;
  }
  if (code === 'papi') {
    const resolved = resolvePapiScoring(result.scoring_data, result.raw_answers, calculatePapiScore);
    return <PapiSection scoring={resolved ?? scoring} sectionNumber={sectionNumber} />;
  }
  if (code === 'wpt') return <WptSection scoring={scoring} sectionNumber={sectionNumber} />;
  if (code === 'msdt') {
    const resolved = resolveMsdtScoring(result.scoring_data, result.raw_answers, calculateMsdtScore);
    return <MsdtSection scoring={resolved ?? scoring} sectionNumber={sectionNumber} />;
  }
  return null;
}
