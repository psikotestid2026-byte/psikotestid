import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { sql } from '@/lib/neon';
import { requireParticipantAccess } from '@/lib/authGuards';
import { ParticipantAnswersPdfDocument } from '@/components/reports/ParticipantAnswersPdf';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ participantId: string }> | { participantId: string } }
) {
  try {
    const resolvedParams = await params;
    const participantId = Number(resolvedParams.participantId);

    if (!participantId) {
      return NextResponse.json({ error: 'ID Peserta tidak valid' }, { status: 400 });
    }

    const auth = await requireParticipantAccess(participantId);
    if (!auth.ok) return auth.response;

    const [participantRows, results] = await Promise.all([
      sql`
        SELECT p.*, c.title as campaign_title, cust.company_name, cust.logo_url
        FROM participants p
        JOIN campaigns c ON p.campaign_id = c.id
        JOIN customers cust ON c.customer_id = cust.id
        WHERE p.id = ${participantId}
        LIMIT 1
      `,
      sql`
        SELECT tr.*, mt.code as test_code, mt.name as test_name
        FROM test_results tr
        JOIN master_tests mt ON tr.test_id = mt.id
        WHERE tr.participant_id = ${participantId}
        ORDER BY tr.id ASC
      `,
    ]);

    if (!participantRows.length) {
      return NextResponse.json({ error: 'Peserta tidak ditemukan' }, { status: 404 });
    }

    const participant = participantRows[0];
    const testIds = results.map((r: any) => Number(r.test_id)).filter(Boolean);

    let questionsByTest: Record<number, any[]> = {};
    if (testIds.length > 0) {
      const questions = await sql`
        SELECT id, test_id, order_number, question_type, question_data
        FROM question_banks
        WHERE test_id = ANY(${testIds}::int[])
        ORDER BY test_id, order_number ASC
      `;
      for (const q of questions) {
        const tid = Number(q.test_id);
        if (!questionsByTest[tid]) questionsByTest[tid] = [];
        questionsByTest[tid].push(q);
      }
    }

    const pdfStream = await renderToStream(
      <ParticipantAnswersPdfDocument
        participant={participant}
        testResults={results}
        questionsByTest={questionsByTest}
      />
    );

    const safeName = (participant.full_name || 'Kandidat').replace(/\s+/g, '_');
    return new Response(pdfStream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Jawaban-Tes-${safeName}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Participant answers PDF error:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat PDF jawaban' }, { status: 500 });
  }
}

