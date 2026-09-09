import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { sql } from '@/lib/neon';

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#2563eb', paddingBottom: 10 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#64748b' },
  metaContainer: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 12, borderRadius: 6, marginBottom: 20 },
  metaCol: { flexDirection: 'column', gap: 4 },
  label: { fontSize: 8, color: '#64748b', textTransform: 'uppercase' },
  value: { fontSize: 10, fontWeight: 'bold', color: '#0f172a' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#1e293b', marginBottom: 8, marginTop: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 4 },
  table: { width: '100%', marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 6, paddingHorizontal: 8 },
  tableHeader: { backgroundColor: '#f8fafc' },
  tableCellHeader: { fontSize: 9, fontWeight: 'bold', color: '#475569', width: '25%', textAlign: 'left' },
  tableCell: { fontSize: 9, color: '#334155', width: '25%', textAlign: 'left' },
  chartContainer: { marginBottom: 16 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  barLabel: { width: '20%', fontSize: 9, fontWeight: 'bold', color: '#1e293b' },
  barTrack: { width: '60%', height: 12, backgroundColor: '#f1f5f9', borderRadius: 6, overflow: 'hidden', marginRight: 8 },
  barFill: { height: '100%', borderRadius: 6 },
  barValue: { width: '20%', fontSize: 9, color: '#475569', textAlign: 'right' },
  narrativeCard: { marginBottom: 12, paddingLeft: 10, borderLeftWidth: 3 },
  narrativeTitle: { fontSize: 11, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  narrativeText: { fontSize: 9, color: '#334155', lineHeight: 1.5 },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, textAlign: 'center', fontSize: 8, color: '#94a3b8', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 },
});

const DIM_NAMES: Record<string, string> = {
  E: 'Extraversion',
  A: 'Agreeableness',
  C: 'Conscientiousness',
  N: 'Neuroticism',
  O: 'Openness',
};

function getCategoryColor(dim: string, category: string) {
  if (dim === 'N') {
    if (category === 'Tinggi') return '#dc2626';
    if (category === 'Sedang') return '#eab308';
    return '#16a34a';
  }
  if (category === 'Tinggi') return '#16a34a';
  if (category === 'Sedang') return '#eab308';
  return '#dc2626';
}

export function BigFivePdfDocument({ participant, scoring }: { participant: any; scoring: any }) {
  const dims = ['E', 'A', 'C', 'N', 'O'];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>LAPORAN BIG FIVE INVENTORY (BFI)</Text>
          <Text style={styles.subtitle}>RuangTes Enterprise · Laporan Asesmen Kepribadian</Text>
        </View>

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
            <Text style={styles.label}>Sesi Tes</Text>
            <Text style={styles.value}>{participant.campaign_title || '-'}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.label}>Tanggal</Text>
            <Text style={styles.value}>
              {new Date(participant.created_at || Date.now()).toLocaleDateString('id-ID')}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Visualisasi Profil 5 Dimensi</Text>
        <View style={styles.chartContainer}>
          {dims.map((dim) => {
            const data = scoring.dimensions[dim];
            if (!data) return null;
            const color = getCategoryColor(dim, data.category);
            return (
              <View key={dim} style={styles.barRow}>
                <Text style={styles.barLabel}>{DIM_NAMES[dim]} ({dim})</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${data.percent}%`, backgroundColor: color }]} />
                </View>
                <Text style={styles.barValue}>{data.percent}% ({data.category})</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Tabel Skor Detail</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellHeader}>Dimensi</Text>
            <Text style={styles.tableCellHeader}>Skor Mentah</Text>
            <Text style={styles.tableCellHeader}>Persentase</Text>
            <Text style={styles.tableCellHeader}>Kategori</Text>
          </View>
          {dims.map((dim) => {
            const data = scoring.dimensions[dim];
            if (!data) return null;
            return (
              <View key={dim} style={styles.tableRow}>
                <Text style={styles.tableCell}>{DIM_NAMES[dim]} ({dim})</Text>
                <Text style={styles.tableCell}>{data.raw} / {data.max}</Text>
                <Text style={styles.tableCell}>{data.percent}%</Text>
                <Text style={styles.tableCell}>{data.category}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Interpretasi Kepribadian</Text>
        {dims.map((dim) => {
          const data = scoring.dimensions[dim];
          if (!data) return null;
          const color = getCategoryColor(dim, data.category);
          return (
            <View key={dim} style={[styles.narrativeCard, { borderLeftColor: color }]}>
              <Text style={styles.narrativeTitle}>{DIM_NAMES[dim]} — {data.category}</Text>
              <Text style={styles.narrativeText}>{data.narrative}</Text>
            </View>
          );
        })}

        <Text style={styles.footer}>
          Laporan ini bersifat rahasia dan hanya untuk keperluan asesmen.
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
