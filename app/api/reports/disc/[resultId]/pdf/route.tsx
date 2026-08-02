import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { sql } from '@/lib/neon';
import { DiscScoreResult } from '@/lib/scoring/disc';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  metaCol: {
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
  },
  table: {
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
  },
  tableCellHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#475569',
    width: '20%',
    textAlign: 'center',
  },
  tableCell: {
    fontSize: 9,
    color: '#334155',
    width: '20%',
    textAlign: 'center',
  },
  tableCellLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
    width: '20%',
    textAlign: 'left',
  },
  summaryBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  profileTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1d4ed8',
    marginBottom: 4,
  },
  profileDesc: {
    fontSize: 9,
    color: '#334155',
    lineHeight: 1.4,
  },
  bulletList: {
    marginTop: 6,
  },
  bulletItem: {
    fontSize: 9,
    color: '#334155',
    marginBottom: 4,
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
});

function DiscPdfDocument({
  participant,
  scoring,
}: {
  participant: any;
  scoring: DiscScoreResult;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>DISC PERSONALITY ASSESSMENT REPORT</Text>
          <Text style={styles.subtitle}>PsikoTest.id Enterprise · Laporan Asesmen Kepribadian</Text>
        </View>

        {/* Participant Info */}
        <View style={styles.metaContainer}>
          <View style={styles.metaCol}>
            <Text style={styles.label}>Nama Peserta</Text>
            <Text style={styles.value}>{participant.full_name}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{participant.email}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.label}>Sesi Tes (Campaign)</Text>
            <Text style={styles.value}>{participant.campaign_title || '-'}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.label}>Tanggal Asesmen</Text>
            <Text style={styles.value}>
              {new Date(participant.created_at || Date.now()).toLocaleDateString('id-ID')}
            </Text>
          </View>
        </View>

        {/* Profile Result Box */}
        <View style={styles.summaryBox}>
          <Text style={styles.profileTitle}>
            Tipe Kepribadian: {scoring.dominantLabel} — {scoring.dominantType}
          </Text>
          <Text style={styles.profileDesc}>
            Profil kepribadian utama berdasarkan Grafik 3 (Change / Perceived Self).
            Sub-Trait Utama: {scoring.subTraits.g3}.
            {scoring.hasStressPotential ? ' (Terdeteksi Potensi Penyesuaian Style / Stress)' : ''}
          </Text>
        </View>

        {/* Score Summary Table */}
        <Text style={styles.sectionTitle}>Ringkasan Skor Mentah & Grafik Nilai</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellLabel}>Kategori / Grafik</Text>
            <Text style={styles.tableCellHeader}>D</Text>
            <Text style={styles.tableCellHeader}>I</Text>
            <Text style={styles.tableCellHeader}>S</Text>
            <Text style={styles.tableCellHeader}>C</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Most (Paling)</Text>
            <Text style={styles.tableCell}>{scoring.most.D}</Text>
            <Text style={styles.tableCell}>{scoring.most.I}</Text>
            <Text style={styles.tableCell}>{scoring.most.S}</Text>
            <Text style={styles.tableCell}>{scoring.most.C}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Least (Kurang)</Text>
            <Text style={styles.tableCell}>{scoring.least.D}</Text>
            <Text style={styles.tableCell}>{scoring.least.I}</Text>
            <Text style={styles.tableCell}>{scoring.least.S}</Text>
            <Text style={styles.tableCell}>{scoring.least.C}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Change (Selisih)</Text>
            <Text style={styles.tableCell}>{scoring.change.D}</Text>
            <Text style={styles.tableCell}>{scoring.change.I}</Text>
            <Text style={styles.tableCell}>{scoring.change.S}</Text>
            <Text style={styles.tableCell}>{scoring.change.C}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Graph 1 (MOST)</Text>
            <Text style={styles.tableCell}>{scoring.g1.D}</Text>
            <Text style={styles.tableCell}>{scoring.g1.I}</Text>
            <Text style={styles.tableCell}>{scoring.g1.S}</Text>
            <Text style={styles.tableCell}>{scoring.g1.C}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Graph 2 (LEAST)</Text>
            <Text style={styles.tableCell}>{scoring.g2.D}</Text>
            <Text style={styles.tableCell}>{scoring.g2.I}</Text>
            <Text style={styles.tableCell}>{scoring.g2.S}</Text>
            <Text style={styles.tableCell}>{scoring.g2.C}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Graph 3 (CHANGE)</Text>
            <Text style={styles.tableCell}>{scoring.g3.D}</Text>
            <Text style={styles.tableCell}>{scoring.g3.I}</Text>
            <Text style={styles.tableCell}>{scoring.g3.S}</Text>
            <Text style={styles.tableCell}>{scoring.g3.C}</Text>
          </View>
        </View>

        {/* Recommendations Section */}
        <Text style={styles.sectionTitle}>Saran & Rekomendasi Pengembangan</Text>
        <View style={styles.bulletList}>
          {scoring.recommendations.map((rec, idx) => (
            <Text key={idx} style={styles.bulletItem}>
              • {rec}
            </Text>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Laporan ini diterbitkan secara otomatis oleh PsikoTest.id Enterprise.
        </Text>
      </Page>
    </Document>
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ resultId: string }> | { resultId: string } }
) {
  try {
    const resolvedParams = await params;
    const resultId = Number(resolvedParams.resultId);

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
    let scoring: DiscScoreResult = row.scoring_data;

    if (!scoring && row.raw_answers) {
      const { calculateDiscScore } = await import('@/lib/scoring/disc');
      scoring = calculateDiscScore(row.raw_answers);
    }

    if (!scoring) {
      return NextResponse.json({ error: 'Scoring data invalid' }, { status: 400 });
    }

    const pdfStream = await renderToStream(
      <DiscPdfDocument participant={row} scoring={scoring} />
    );

    return new Response(pdfStream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="DISC-Report-${row.full_name.replace(/\s+/g, '_')}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
