import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { sql } from '@/lib/neon';
import { requireAdmin, requireCustomer } from '@/lib/authGuards';
import { UniversalPdfDocument } from '@/components/reports/ParticipantReport';
import {
  BULK_PDF_MAX_DURATION_SECONDS,
  ESTIMATED_SECONDS_PER_PDF,
  assertCampaignOwnership,
  bulkZipFileName,
  clampBulkLimit,
  groupResultsByParticipant,
  parseOffsetParam,
  parseOptionalPositiveInt,
  participantPdfFileName,
  planBulkBatches,
  resolveBulkBatchSize,
  resolveBulkCustomer,
  type BulkActor,
} from '@/lib/combinedReport';
import { buildStoredZip } from '@/lib/zipStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Keep in sync with BULK_PDF_MAX_DURATION_SECONDS. Literal so Next can read the segment config.
export const maxDuration = 300;

async function countParticipants(customerId: number, campaignId: number | null) {
  if (campaignId) {
    return sql`
      SELECT COUNT(*)::int AS total
      FROM participants p
      JOIN campaigns c ON p.campaign_id = c.id
      WHERE c.customer_id = ${customerId}
        AND c.id = ${campaignId}
        AND EXISTS (SELECT 1 FROM test_results tr WHERE tr.participant_id = p.id)
    `;
  }
  return sql`
    SELECT COUNT(*)::int AS total
    FROM participants p
    JOIN campaigns c ON p.campaign_id = c.id
    WHERE c.customer_id = ${customerId}
      AND EXISTS (SELECT 1 FROM test_results tr WHERE tr.participant_id = p.id)
  `;
}

async function listParticipants(customerId: number, campaignId: number | null, offset: number, limit: number) {
  if (campaignId) {
    return sql`
      SELECT
        p.id,
        p.full_name,
        p.email,
        p.status,
        p.created_at,
        c.title AS campaign_title,
        cust.company_name,
        cust.logo_url
      FROM participants p
      JOIN campaigns c ON p.campaign_id = c.id
      JOIN customers cust ON c.customer_id = cust.id
      WHERE cust.id = ${customerId}
        AND c.id = ${campaignId}
        AND EXISTS (SELECT 1 FROM test_results tr WHERE tr.participant_id = p.id)
      ORDER BY p.id ASC
      OFFSET ${offset}
      LIMIT ${limit}
    `;
  }
  return sql`
    SELECT
      p.id,
      p.full_name,
      p.email,
      p.status,
      p.created_at,
      c.title AS campaign_title,
      cust.company_name,
      cust.logo_url
    FROM participants p
    JOIN campaigns c ON p.campaign_id = c.id
    JOIN customers cust ON c.customer_id = cust.id
    WHERE cust.id = ${customerId}
      AND EXISTS (SELECT 1 FROM test_results tr WHERE tr.participant_id = p.id)
    ORDER BY p.id ASC
    OFFSET ${offset}
    LIMIT ${limit}
  `;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const customerParsed = parseOptionalPositiveInt(url.searchParams.get('customerId'));
    if (!customerParsed.ok) {
      return NextResponse.json({ error: 'ID perusahaan tidak valid.' }, { status: 400 });
    }
    const campaignParsed = parseOptionalPositiveInt(url.searchParams.get('campaignId'));
    if (!campaignParsed.ok) {
      return NextResponse.json({ error: 'ID sesi ujian tidak valid.' }, { status: 400 });
    }
    const offsetParsed = parseOffsetParam(url.searchParams.get('offset'));
    if (!offsetParsed.ok) {
      return NextResponse.json({ error: 'Offset tidak valid.' }, { status: 400 });
    }
    const limitRaw = url.searchParams.get('limit');
    const limitParsed = parseOptionalPositiveInt(limitRaw);
    let requestedLimit: number | null = null;
    if (limitRaw && limitRaw.trim() !== '') {
      if (!limitParsed.ok) {
        return NextResponse.json({ error: 'Limit tidak valid.' }, { status: 400 });
      }
      requestedLimit = limitParsed.value;
    }

    const adminAuth = await requireAdmin();
    let actor: BulkActor;
    if (adminAuth.ok) {
      actor = { role: 'admin' };
    } else if (adminAuth.response.status === 401) {
      return adminAuth.response;
    } else {
      const customerAuth = await requireCustomer();
      if (!customerAuth.ok) return customerAuth.response;
      actor = { role: 'client', customerId: Number(customerAuth.customer.id) };
    }

    const scope = resolveBulkCustomer(actor, customerParsed.value);
    if (!scope.ok) {
      return NextResponse.json({ error: scope.error }, { status: scope.status });
    }

    const customers = await sql`
      SELECT id, company_name
      FROM customers
      WHERE id = ${scope.customerId}
      LIMIT 1
    `;
    if (!customers.length) {
      return NextResponse.json({ error: 'Perusahaan tidak ditemukan.' }, { status: 404 });
    }

    let campaignTitle: string | null = null;
    if (campaignParsed.value) {
      const campaigns = await sql`
        SELECT id, customer_id, title
        FROM campaigns
        WHERE id = ${campaignParsed.value}
        LIMIT 1
      `;
      const campaign = campaigns[0];
      const ownership = assertCampaignOwnership(
        scope.customerId,
        campaign ? Number(campaign.customer_id) : null
      );
      if (!ownership.ok) {
        return NextResponse.json({ error: ownership.error }, { status: ownership.status });
      }
      campaignTitle = String(campaign.title || '');
    }

    const batchSize = resolveBulkBatchSize(process.env.BULK_PDF_BATCH_SIZE);
    const limit = clampBulkLimit(requestedLimit, batchSize);
    const totalRows = await countParticipants(scope.customerId, campaignParsed.value);
    const total = Number(totalRows[0]?.total || 0);
    const zipFileName = bulkZipFileName(String(customers[0].company_name || 'Perusahaan'), campaignTitle);
    const batches = planBulkBatches(total, batchSize);

    if (url.searchParams.get('format') === 'manifest') {
      return NextResponse.json({
        success: true,
        total,
        batchSize,
        maxDurationSeconds: BULK_PDF_MAX_DURATION_SECONDS,
        estimatedSecondsPerPdf: ESTIMATED_SECONDS_PER_PDF,
        batches,
        zipFileName,
      });
    }

    if (total === 0) {
      return NextResponse.json(
        { error: 'Tidak ada peserta dengan hasil tes pada pilihan ini.' },
        { status: 404 }
      );
    }

    const participants = await listParticipants(scope.customerId, campaignParsed.value, offsetParsed.value, limit);
    if (!participants.length) {
      return NextResponse.json({ error: 'Tidak ada peserta pada batch ini.' }, { status: 404 });
    }

    const ids = participants.map((participant) => Number(participant.id));
    const resultRows = await sql`
      SELECT tr.*, mt.code AS test_code, mt.name AS test_name, mt.category
      FROM test_results tr
      JOIN master_tests mt ON tr.test_id = mt.id
      WHERE tr.participant_id = ANY(${ids}::bigint[])
      ORDER BY tr.id ASC
    `;
    const grouped = groupResultsByParticipant(resultRows as { participant_id?: number | string | null }[]);

    const files: { name: string; data: Uint8Array }[] = [];
    for (const participant of participants) {
      const results = grouped.get(String(participant.id)) || [];
      const pdf = await renderToBuffer(
        <UniversalPdfDocument participant={participant} results={results as any[]} />
      );
      files.push({
        name: participantPdfFileName(participant.full_name, Number(participant.id)),
        data: new Uint8Array(pdf),
      });
    }

    const zip = buildStoredZip(files);
    return new Response(Buffer.from(zip), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
        'Cache-Control': 'no-store',
        'X-Bulk-Total': String(total),
        'X-Bulk-Offset': String(offsetParsed.value),
        'X-Bulk-Limit': String(participants.length),
      },
    });
  } catch (error: any) {
    console.error('Bulk PDF export error:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat arsip laporan.' }, { status: 500 });
  }
}
