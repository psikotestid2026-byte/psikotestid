import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { sql } from '@/lib/neon';
import { requireParticipantAccess } from '@/lib/authGuards';
import { BigFivePdfDocument } from '@/components/reports/BigFiveReport';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ resultId: string }> | { resultId: string } }
) {
  try {
    const resolvedParams = await params;
    const resultId = Number(resolvedParams.resultId);

    if (!resultId) {
      return NextResponse.json({ error: 'Invalid result ID' }, { status: 400 });
    }

    const resultRows = await sql`
      SELECT tr.*, p.full_name, p.email, c.title as campaign_title
      FROM test_results tr
      JOIN participants p ON tr.participant_id = p.id
      JOIN campaigns c ON p.campaign_id = c.id
      WHERE tr.id = ${resultId}
      LIMIT 1
    `;

    if (!resultRows.length) {
      return NextResponse.json({ error: 'Test result not found' }, { status: 404 });
    }

    const row = resultRows[0];
    const auth = await requireParticipantAccess(Number(row.participant_id));
    if (!auth.ok) return auth.response;
    let scoring = row.scoring_data;

    if (!scoring && row.raw_answers) {
      const { calculateBigFiveScore } = await import('@/lib/scoring/bigfive');
      scoring = calculateBigFiveScore(row.raw_answers);
    }

    if (!scoring) {
      return NextResponse.json({ error: 'Scoring data invalid' }, { status: 400 });
    }

    const pdfStream = await renderToStream(
      <BigFivePdfDocument participant={row} scoring={scoring} />
    );

    return new Response(pdfStream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="BFI-Report-${row.full_name.replace(/\s+/g, '_')}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
