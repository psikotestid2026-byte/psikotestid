import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { sql } from '@/lib/neon';
import { getBundleCompletion, INCOMPLETE_RESULT_MESSAGE, loadRequiredTestsContext } from '@/lib/bundleCompletion';
import { omitUnrequiredMsdtFromReport } from '@/lib/requiredTests';
import { requireParticipantAccess } from '@/lib/authGuards';
import { UniversalPdfDocument } from '@/components/reports/ParticipantReport';
import { loadDiscReportDictionary } from '@/lib/loadDiscReportDictionary';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ participantId: string }> | { participantId: string } }
) {
  try {
    const resolvedParams = await params;
    const participantId = Number(resolvedParams.participantId);

    if (!participantId) {
      return NextResponse.json({ error: 'Invalid participant ID' }, { status: 400 });
    }

    const auth = await requireParticipantAccess(participantId);
    if (!auth.ok) return auth.response;

    const participantRows = await sql`
      SELECT p.*, c.title as campaign_title, c.campaign_mode, cust.company_name, cust.logo_url
      FROM participants p
      JOIN campaigns c ON p.campaign_id = c.id
      JOIN customers cust ON c.customer_id = cust.id
      WHERE p.id = ${participantId}
      LIMIT 1
    `;

    if (!participantRows.length) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    const participant = participantRows[0];

    const results = await sql`
      SELECT tr.*, mt.code as test_code, mt.name as test_name, mt.category
      FROM test_results tr
      JOIN master_tests mt ON tr.test_id = mt.id
      WHERE tr.participant_id = ${participantId}
      ORDER BY tr.id ASC
    `;

    let reportParticipant = participant;
    let reportResults = results;
    if (participant.campaign_mode === 'MANDATORY_BUNDLE') {
      const completion = await getBundleCompletion(participantId);
      if (!completion.isComplete || participant.scoring_status !== 'DONE') {
        return NextResponse.json({ error: INCOMPLETE_RESULT_MESSAGE }, { status: 409 });
      }
      const context = await loadRequiredTestsContext();
      const stripped = omitUnrequiredMsdtFromReport(participant, results as any[], context);
      reportParticipant = stripped.participant;
      reportResults = stripped.results;
    }

    const discDictionary = await loadDiscReportDictionary();
    const pdfStream = await renderToStream(
      <UniversalPdfDocument participant={reportParticipant} results={reportResults} discDictionary={discDictionary} />
    );

    const safeName = (participant.full_name || 'Kandidat').replace(/\s+/g, '_');
    return new Response(pdfStream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Laporan-Psikotes-${safeName}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF report error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
