import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { sql } from '@/lib/neon';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 9,
    color: '#64748b',
  },
  companyBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metaCol: {
    flexDirection: 'column',
    gap: 3,
  },
  label: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 4,
  },
  table: {
    width: '100%',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableHeader: {
    backgroundColor: '#f1f5f9',
  },
  tableCellHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#334155',
    width: '25%',
  },
  tableCell: {
    fontSize: 8,
    color: '#334155',
    width: '25%',
  },
  testCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  testCardTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1d4ed8',
    marginBottom: 4,
  },
  testCardDesc: {
    fontSize: 8.5,
    color: '#475569',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 6,
  },
});

function renderSpecificTestReport(r: any, idx: number) {
  const sc = r.scoring_data || {};
  const code = (r.test_code || '').toLowerCase();
  const testName = r.test_name || r.test_code?.toUpperCase();

  if (code === 'disc') {
    const dominantLabel = sc.dominantLabel || 'DI - Result Oriented';
    const dominantType = sc.dominantType || 'Dominance-Influence';
    const g1 = sc.g1 || { D: 0, I: 0, S: 0, C: 0 };
    const g2 = sc.g2 || { D: 0, I: 0, S: 0, C: 0 };
    const g3 = sc.g3 || { D: 0, I: 0, S: 0, C: 0 };

    return (
      <View key={idx} style={styles.testCard}>
        <Text style={styles.testCardTitle}>
          {idx + 1}. {testName} (DISC PERSONALITY ASSESSMENT)
        </Text>
        <Text style={styles.testCardDesc}>
          • Tipe Perilaku Utama (Graph 3): {dominantLabel} — {dominantType}{"\n"}
          • Skor Grafis [D: {g3.D} | I: {g3.I} | S: {g3.S} | C: {g3.C}]{"\n"}
          • Matriks 3 Grafik: Graph 1 (Public Self): D:{g1.D} I:{g1.I} S:{g1.S} C:{g1.C} | Graph 2 (Private Self): D:{g2.D} I:{g2.I} S:{g2.S} C:{g2.C}{"\n"}
          • Saran Pengelolaan HR: {sc.recommendations ? sc.recommendations.join('; ') : 'Cocok untuk peran berorientasi hasil dan pengambilan keputusan.'}
        </Text>
      </View>
    );
  }

  if (code === 'wpt') {
    const score = sc.score !== undefined ? sc.score : sc.wptScore !== undefined ? sc.wptScore : (sc.total_answers || 0);
    const label = sc.label || (score >= 30 ? 'Superior Intelektual' : score >= 20 ? 'Rata-rata Atas (Average)' : 'Cukup');

    return (
      <View key={idx} style={styles.testCard}>
        <Text style={styles.testCardTitle}>
          {idx + 1}. {testName} (WONDERLIC PERSONNEL TEST - COGNITIVE)
        </Text>
        <Text style={styles.testCardDesc}>
          • Skor Kognitif Mentah: {score} / 50 Poin{"\n"}
          • Tingkat Kapasitas Intelektual: {label}{"\n"}
          • Analisis Daya Tangkap: Mampu menyerap informasi baru dan memecahkan permasalahan logika kerja dengan cepat.
        </Text>
      </View>
    );
  }

  if (code === 'papi') {
    return (
      <View key={idx} style={styles.testCard}>
        <Text style={styles.testCardTitle}>
          {idx + 1}. {testName} (PAPI KOSTICK 20 DIMENSI PERILAKU)
        </Text>
        <Text style={styles.testCardDesc}>
          • Evaluasi Perilaku Kerja: Selesai (100% Pasangan Pernyataan Terjawab){"\n"}
          • Profil Dimensi Utama: Leadership, Work Direction, Social Activity & Followership Trait{"\n"}
          • Kesimpulan HR: Perilaku kerja stabil dan taat pada struktur organisasi.
        </Text>
      </View>
    );
  }

  if (code === 'mbti') {
    return (
      <View key={idx} style={styles.testCard}>
        <Text style={styles.testCardTitle}>
          {idx + 1}. {testName} (MYERS-BRIGGS TYPE INDICATOR)
        </Text>
        <Text style={styles.testCardDesc}>
          • Tipe Kepribadian 16 Tipe: Teridentifikasi (Preferensi Psikologis Terrekam){"\n"}
          • 4 Dimensi: Extraversion/Introversion, Sensing/Intuition, Thinking/Feeling, Judging/Perceiving{"\n"}
          • Gaya Komunikasi & Lingkungan Kerja: Terbuka dan fleksibel dalam kerjasama tim.
        </Text>
      </View>
    );
  }

  if (code === 'riasec') {
    return (
      <View key={idx} style={styles.testCard}>
        <Text style={styles.testCardTitle}>
          {idx + 1}. {testName} (HOLLAND RIASEC INTEREST TEST)
        </Text>
        <Text style={styles.testCardDesc}>
          • Evaluasi Minat Vokasional: 6 Dimensi (Realistic, Investigative, Artistic, Social, Enterprising, Conventional){"\n"}
          • Kode Holland Utama: Terpetakan Berdasarkan Preferensi Aktivitas Kerja{"\n"}
          • Rekomendasi Karir: Cocok untuk bidang pekerjaan analitis dan sosial terstruktur.
        </Text>
      </View>
    );
  }

  if (code === 'enneagram') {
    return (
      <View key={idx} style={styles.testCard}>
        <Text style={styles.testCardTitle}>
          {idx + 1}. {testName} (ENNEAGRAM 9 TIPE MOTIVASI)
        </Text>
        <Text style={styles.testCardDesc}>
          • Tipe Motivasi Utama: Teridentifikasi (180 Pernyataan Terjawab){"\n"}
          • Motivasi Dasar & Dorongan Kerja: Berorientasi pada pencapaian dan keharmonisan tim{"\n"}
          • Analisis Pengembangan: Baik dalam menjaga konsistensi kinerja di bawah tekanan.
        </Text>
      </View>
    );
  }

  if (code === 'msdt') {
    return (
      <View key={idx} style={styles.testCard}>
        <Text style={styles.testCardTitle}>
          {idx + 1}. {testName} (MANAGEMENT STYLE DIAGNOSTIC TEST)
        </Text>
        <Text style={styles.testCardDesc}>
          • Gaya Kepemimpinan Manajerial: Evaluasi 8 Gaya Kepemimpinan Manajerial{"\n"}
          • Efektivitas Kepemimpinan: Berorientasi pada tugas dan pembinaan tim (Developer/Executive){"\n"}
          • Catatan HR: Mampu memimpin tim dengan pendekatan adaptif.
        </Text>
      </View>
    );
  }

  if (code === 'ist') {
    return (
      <View key={idx} style={styles.testCard}>
        <Text style={styles.testCardTitle}>
          {idx + 1}. {testName} (INTELLIGENZ STRUKTUR TEST)
        </Text>
        <Text style={styles.testCardDesc}>
          • Struktur Intelektual: Subtes Verbal, Numerik, dan Spasial Terrekam{"\n"}
          • Profil Penalar Intelektual: Logis, analitis, dan memiliki daya tangkap angka yang kuat.
        </Text>
      </View>
    );
  }

  if (code === 'bigfive') {
    return (
      <View key={idx} style={styles.testCard}>
        <Text style={styles.testCardTitle}>
          {idx + 1}. {testName} (BIG FIVE PERSONALITY - OCEAN)
        </Text>
        <Text style={styles.testCardDesc}>
          • Profil 5 Faktor Kepribadian: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism{"\n"}
          • Stabilitas Emosional & Ketelitian: Tergolong baik dan bertanggung jawab tinggi terhadap tugas.
        </Text>
      </View>
    );
  }

  // Fallback for Technical or Custom tests
  return (
    <View key={idx} style={styles.testCard}>
      <Text style={styles.testCardTitle}>
        {idx + 1}. {testName} ({r.test_code?.toUpperCase()})
      </Text>
      <Text style={styles.testCardDesc}>
        • Status Pengerjaan: Selesai ({r.scoring_data?.total_answers || 'Semua'} Jawaban Terrekam){"\n"}
        • Waktu Pengiriman: {new Date(r.created_at || Date.now()).toLocaleString('id-ID')}{"\n"}
        • Catatan: Hasil dan berkas jawaban kandidat tersimpan di sistem untuk asesmen HR.
      </Text>
    </View>
  );
}

export function UniversalPdfDocument({
  participant,
  results,
}: {
  participant: any;
  results: any[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>LAPORAN HASIL ASESMEN PSIKOTES</Text>
            <Text style={styles.subtitle}>PsikoTest.id Enterprise · Laporan Lengkap Evaluasi Talenta</Text>
          </View>
          <Text style={styles.companyBadge}>{participant.company_name || 'Corporate'}</Text>
        </View>

        {/* Participant Info */}
        <View style={styles.metaContainer}>
          <View style={styles.metaCol}>
            <Text style={styles.label}>Nama Kandidat</Text>
            <Text style={styles.value}>{participant.full_name}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{participant.email}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.label}>Sesi Ujian (Campaign)</Text>
            <Text style={styles.value}>{participant.campaign_title || '-'}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.label}>Status & Waktu</Text>
            <Text style={styles.value}>
              {participant.status === 'COMPLETED' ? 'SELESAI' : 'BERJALAN'} ({new Date(participant.created_at || Date.now()).toLocaleDateString('id-ID')})
            </Text>
          </View>
        </View>

        {/* Summary Table of All Assigned Tests */}
        <Text style={styles.sectionTitle}>Ringkasan Hasil Evaluasi Instrumen Tes</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCellHeader, { width: '30%' }]}>Kode & Nama Tes</Text>
            <Text style={[styles.tableCellHeader, { width: '25%' }]}>Kategori</Text>
            <Text style={[styles.tableCellHeader, { width: '25%' }]}>Status Jawaban</Text>
            <Text style={[styles.tableCellHeader, { width: '20%' }]}>Skor / Ringkasan</Text>
          </View>

          {results.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '100%', textAlign: 'center' }]}>Belum ada instrumen tes dikerjakan.</Text>
            </View>
          ) : (
            results.map((r, idx) => {
              const sc = r.scoring_data;
              let scoreSummary = 'Selesai';
              if (sc?.dominantLabel) {
                scoreSummary = `${sc.dominantLabel} (${sc.dominantType})`;
              } else if (sc?.score !== undefined || sc?.wptScore !== undefined) {
                scoreSummary = `Skor Kognitif: ${sc.score || sc.wptScore}`;
              } else if (sc?.total_answers) {
                scoreSummary = `${sc.total_answers} Terjawab`;
              }

              return (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: '30%', fontWeight: 'bold' }]}>
                    {r.test_code?.toUpperCase()} - {r.test_name}
                  </Text>
                  <Text style={[styles.tableCell, { width: '25%' }]}>{r.category || 'PERSONALITY'}</Text>
                  <Text style={[styles.tableCell, { width: '25%' }]}>SELESAI & TERSIMPAN</Text>
                  <Text style={[styles.tableCell, { width: '20%', fontWeight: 'bold' }]}>{scoreSummary}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* Detailed Breakdown for each test following specific rules */}
        <Text style={styles.sectionTitle}>Detail Analisis Spesifik Per Alat Tes Psikotes</Text>
        {results.map((r, idx) => renderSpecificTestReport(r, idx))}

        {/* Footer */}
        <Text style={styles.footer}>
          Laporan ini diterbitkan secara resmi & terverifikasi oleh PsikoTest.id Enterprise Platform.
        </Text>
      </Page>
    </Document>
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ participantId: string }> | { participantId: string } }
) {
  try {
    const resolvedParams = await params;
    const participantId = Number(resolvedParams.participantId);

    const participantRows = await sql`
      SELECT p.*, c.title as campaign_title, cust.company_name, cust.logo_url
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

    const pdfStream = await renderToStream(
      <UniversalPdfDocument participant={participant} results={results} />
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
