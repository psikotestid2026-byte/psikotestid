import React from 'react';
import { Document, Text, View, StyleSheet } from '@react-pdf/renderer';
import { RIASEC_TYPE_DETAILS } from '@/lib/scoring/riasec';
import { normalizeTestCode, partitionReportResults } from '@/lib/combinedReport';
import { isV3TestCode, orderDetailResults } from '@/lib/reportTemplateV3';
import { ClosingBlock, CoverBlock } from '@/components/reports/v3/CoverAndClosing';
import { FlowPage } from '@/components/reports/v3/ReportShell';
import { V3TestSection } from '@/components/reports/v3/V3TestSection';

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 8.5,
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
    padding: 10,
    borderRadius: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metaCol: {
    flexDirection: 'column',
    gap: 2,
  },
  label: {
    fontSize: 7.5,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    marginTop: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 4,
  },
  discBanner: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  discBannerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 2,
  },
  discBannerSub: {
    fontSize: 8.5,
    color: '#94a3b8',
  },
  chartsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  chartBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    padding: 6,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 1,
  },
  chartSub: {
    fontSize: 7,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 4,
  },
  table: {
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableHeader: {
    backgroundColor: '#f1f5f9',
  },
  tableCellHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#334155',
  },
  tableCell: {
    fontSize: 8,
    color: '#334155',
  },
  testCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  testCardTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1d4ed8',
    marginBottom: 4,
  },
  testCardDesc: {
    fontSize: 9.5,
    color: '#334155',
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  subHeading: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 4,
  },
  bulletItem: {
    fontSize: 9.5,
    color: '#334155',
    lineHeight: 1.5,
    marginBottom: 3,
    textAlign: 'justify',
  },
});

function renderSpecificTestReport(r: any, idx: number, participant: any) {
  const candidateName = participant?.full_name || 'Kandidat';
  const sc = r.scoring_data || {};
  const code = (r.test_code || '').toLowerCase();
  const testName = r.test_name || r.test_code?.toUpperCase();

  if (code === 'mbti') {
    const type: string = sc.type || '----';
    const percent: Record<string, number> = sc.percent || {};
    const unanswered: number = sc.unanswered ?? 0;
    const validityStatus: string = sc.validityStatus || 'Valid';
    const pairs: [string, string, string][] = [
      ['E', 'I', 'Extraversion — Introversion'],
      ['S', 'N', 'Sensing — Intuition'],
      ['T', 'F', 'Thinking — Feeling'],
      ['J', 'P', 'Judging — Perceiving'],
    ];

    return (
      <View key={idx} style={styles.testCard}>
        <View style={styles.discBanner}>
          <Text style={styles.discBannerTitle}>
            {idx + 1}. {testName} — TIPE: {type}
          </Text>
          <Text style={styles.discBannerSub}>
            Status Validitas: {validityStatus}{unanswered > 0 ? ` (${unanswered} soal tidak dijawab)` : ''}
          </Text>
        </View>

        <Text style={styles.subHeading}>Profil 4 Dimensi Preferensi</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCellHeader, { width: '40%' }]}>Dimensi</Text>
            <Text style={[styles.tableCellHeader, { width: '20%' }]}>Kutub 1</Text>
            <Text style={[styles.tableCellHeader, { width: '20%' }]}>Kutub 2</Text>
            <Text style={[styles.tableCellHeader, { width: '20%' }]}>Dominan</Text>
          </View>
          {pairs.map(([a, b, label]) => (
            <View key={label} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '40%' }]}>{label}</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>{a}: {percent[a] ?? 0}%</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>{b}: {percent[b] ?? 0}%</Text>
              <Text style={[styles.tableCell, { width: '20%', fontWeight: 'bold' }]}>{(percent[a] ?? 0) >= (percent[b] ?? 0) ? a : b}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.subHeading}>Interpretasi Umum</Text>
        <Text style={styles.testCardDesc}>
          {candidateName} menunjukkan tipe kepribadian {type} berdasarkan 4 dikotomi psikologis Myers-Briggs (Extraversion/Introversion, Sensing/Intuition, Thinking/Feeling, Judging/Perceiving), dihitung dari 70 soal forced-choice.
        </Text>
      </View>
    );
  }

  if (code === 'riasec') {
    const ranking: string[] = sc.ranking || ['R', 'I', 'A', 'S', 'E', 'C'];
    const scores: Record<string, number> = sc.scores || {};
    const interestCode = sc.interestCode || ranking.slice(0, 3).join('');
    const consistency = sc.consistency || 'Tidak Diketahui';
    const top3 = ranking.slice(0, 3);
    const comboProfessions: string[] = sc.comboProfessions || [];

    return (
      <View key={idx} style={styles.testCard}>
        <View style={styles.discBanner}>
          <Text style={styles.discBannerTitle}>
            {idx + 1}. {testName} — KODE MINAT: {interestCode}
          </Text>
          <Text style={styles.discBannerSub}>Tingkat Konsistensi: {consistency}</Text>
        </View>

        <Text style={styles.subHeading}>Tabel Skor 6 Tipe RIASEC (0-18)</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>Kode</Text>
            <Text style={[styles.tableCellHeader, { width: '50%' }]}>Tipe</Text>
            <Text style={[styles.tableCellHeader, { width: '20%' }]}>Skor</Text>
            <Text style={[styles.tableCellHeader, { width: '20%' }]}>Peringkat</Text>
          </View>
          {(['R', 'I', 'A', 'S', 'E', 'C'] as const).map((t) => (
            <View key={t} style={[styles.tableRow, top3.includes(t) ? { backgroundColor: '#f8fafc' } : {}]}>
              <Text style={[styles.tableCell, { width: '10%', fontWeight: 'bold', color: RIASEC_TYPE_DETAILS[t].color }]}>{t}</Text>
              <Text style={[styles.tableCell, { width: '50%' }]}>{RIASEC_TYPE_DETAILS[t].name}</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>{scores[t] ?? 0} / 18</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>Top {ranking.indexOf(t) + 1}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.subHeading}>Interpretasi 3 Tipe Dominan</Text>
        <Text style={styles.testCardDesc}>
          {top3
            .map(
              (t, i) =>
                `${i + 1}. ${RIASEC_TYPE_DETAILS[t as keyof typeof RIASEC_TYPE_DETAILS].name} (${t}): ${RIASEC_TYPE_DETAILS[t as keyof typeof RIASEC_TYPE_DETAILS].desc} Contoh profesi: ${RIASEC_TYPE_DETAILS[t as keyof typeof RIASEC_TYPE_DETAILS].professions.join(', ')}.`
            )
            .join('\n\n')}
        </Text>

        <Text style={styles.subHeading}>Contoh Profesi Kombinasi ({top3[0]}{top3[1]})</Text>
        <Text style={styles.testCardDesc}>
          Berdasarkan kombinasi 2 tipe teratas {candidateName}, contoh profesi yang relevan: {comboProfessions.length > 0 ? comboProfessions.join(', ') : 'tidak tersedia untuk kombinasi ini'}.
        </Text>
      </View>
    );
  }

  if (code === 'enneagram') {
    const dominantLabel = sc.dominantLabel || 'Unknown';
    const dominantInfo = sc.dominantInfo;
    const wingInfo = sc.wingInfo;
    const scores = sc.scores || {};

    return (
      <View key={idx} style={styles.testCard}>
        {/* Banner */}
        <View style={styles.discBanner}>
          <Text style={styles.discBannerTitle}>
            {idx + 1}. {testName} — TIPE DOMINAN: {dominantLabel}
          </Text>
          <Text style={styles.discBannerSub}>
            {sc.wingCode ? `Wing: ${sc.wingCode} — ${wingInfo?.label}` : 'Tidak ada wing (Hasil Seri)'}
          </Text>
        </View>

        {/* Breakdown Table */}
        <Text style={styles.subHeading}>Skor Berdasarkan 9 Tipe (Maksimal 60)</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>T1</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>T2</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>T3</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>T4</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>T5</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>T6</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>T7</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>T8</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>T9</Text>
          </View>
          <View style={styles.tableRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <Text key={n} style={[styles.tableCell, { width: '10%', fontWeight: scores[n] === sc.maxScore ? 'bold' : 'normal', color: scores[n] === sc.maxScore ? '#1d4ed8' : '#334155' }]}>
                {scores[n] ?? 0}
              </Text>
            ))}
          </View>
        </View>

        {/* Narrative Interpretation Section */}
        {dominantInfo && (
          <>
            <Text style={styles.subHeading}>1. Deskripsi Profil Tipe Utama ({dominantInfo.name})</Text>
            <Text style={styles.testCardDesc}>{dominantInfo.description}</Text>

            <Text style={styles.subHeading}>2. Ciri-ciri Tipe Utama</Text>
            <Text style={styles.testCardDesc}>
              {dominantInfo.traits.map((t: string) => `• ${t}`).join('\n')}
            </Text>
          </>
        )}

        {wingInfo && (
          <>
            <Text style={styles.subHeading}>3. Pengaruh Sayap (Wing: {sc.wingCode}) — {wingInfo.label}</Text>
            <Text style={styles.testCardDesc}>{wingInfo.description}</Text>

            <Text style={styles.subHeading}>4. Ciri-ciri Sayap (Wing)</Text>
            <Text style={styles.testCardDesc}>
              {wingInfo.traits.map((t: string) => `• ${t}`).join('\n')}
            </Text>
          </>
        )}
      </View>
    );
  }

  if (code === 'msai') {
    const skills: { name: string; quadrant: string; actual: number | null; effectiveness: number | null; importance: number | null; gap: number | null }[] = sc.skills || [];
    const quadrantScores: Record<string, number | null> = sc.quadrantScores || {};
    const missingCount: number = sc.missingCount ?? 0;

    return (
      <View key={idx} style={styles.testCard}>
        <View style={styles.discBanner}>
          <Text style={styles.discBannerTitle}>
            {idx + 1}. {testName} (MANAGEMENT SKILLS ASSESSMENT INSTRUMENT)
          </Text>
          <Text style={styles.discBannerSub}>
            Adhocracy: {quadrantScores.Adhocracy ?? '-'} | Market: {quadrantScores.Market ?? '-'} | Hierarchy: {quadrantScores.Hierarchy ?? '-'} | Clan: {quadrantScores.Clan ?? '-'}
            {missingCount > 0 ? ` — ⚠️ ${missingCount} item perilaku tidak terjawab` : ''}
          </Text>
        </View>

        <Text style={styles.subHeading}>Tabel 12 Skill Manajerial (Skala 1-5)</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCellHeader, { width: '34%' }]}>Skill</Text>
            <Text style={[styles.tableCellHeader, { width: '18%' }]}>Actual</Text>
            <Text style={[styles.tableCellHeader, { width: '18%' }]}>Effectiveness</Text>
            <Text style={[styles.tableCellHeader, { width: '15%' }]}>Importance</Text>
            <Text style={[styles.tableCellHeader, { width: '15%' }]}>Gap</Text>
          </View>
          {skills.map((s) => (
            <View key={s.name} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '34%' }]}>{s.name}</Text>
              <Text style={[styles.tableCell, { width: '18%' }]}>{s.actual ?? '-'}</Text>
              <Text style={[styles.tableCell, { width: '18%' }]}>{s.effectiveness ?? '-'}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>{s.importance ?? '-'}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>{s.gap ?? '-'}</Text>
            </View>
          ))}
        </View>

        {sc.dataGapNote ? (
          <>
            <Text style={styles.subHeading}>Catatan Kelengkapan Data</Text>
            <Text style={styles.testCardDesc}>{sc.dataGapNote}</Text>
          </>
        ) : null}
      </View>
    );
  }

  if (code === 'ist') {
    const raScore = sc.raScore ?? 0;
    const raTotal = sc.raTotal ?? 20;
    const zrScore = sc.zrScore ?? 0;
    const zrTotal = sc.zrTotal ?? 20;
    const percent = sc.numericLogicPercent ?? 0;

    return (
      <View key={idx} style={styles.testCard}>
        <View style={styles.discBanner}>
          <Text style={styles.discBannerTitle}>
            {idx + 1}. {testName} — KEMAMPUAN NUMERIK & LOGIKA (Subtes RA & ZR)
          </Text>
          <Text style={styles.discBannerSub}>
            Skor: {raScore + zrScore}/{raTotal + zrTotal} ({percent}%)
          </Text>
        </View>

        <Text style={styles.subHeading}>Rincian Subtes</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCellHeader, { width: '60%' }]}>Subtes</Text>
            <Text style={[styles.tableCellHeader, { width: '40%' }]}>Skor</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '60%' }]}>RA — Rechenaufgaben (Aritmatika)</Text>
            <Text style={[styles.tableCell, { width: '40%' }]}>{raScore}/{raTotal}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '60%' }]}>ZR — Zahlenreihen (Deret Angka)</Text>
            <Text style={[styles.tableCell, { width: '40%' }]}>{zrScore}/{zrTotal}</Text>
          </View>
        </View>

        <Text style={styles.subHeading}>Catatan Cakupan Skor</Text>
        <Text style={styles.testCardDesc}>
          {sc.unscoredNote ||
            'Laporan ini hanya mencakup subtes Aritmatika (RA) dan Deret Angka (ZR). Subtes verbal (SE, WA, AN, GE) tidak diskor karena instrumen berlisensi komersial tanpa kunci jawaban publik yang sah.'}
        </Text>
      </View>
    );
  }

  // Fallback for technical or custom tests
  return (
    <View key={idx} style={styles.testCard}>
      <Text style={styles.testCardTitle}>
        {idx + 1}. {testName} ({r.test_code?.toUpperCase()})
      </Text>
      <Text style={styles.testCardDesc}>
        • <Text style={{ fontWeight: 'bold' }}>Status Pengerjaan:</Text> Selesai ({r.scoring_data?.total_answers || 'Semua'} Jawaban Terrekam){"\n"}
        • <Text style={{ fontWeight: 'bold' }}>Waktu Selesai:</Text> {new Date(r.created_at || Date.now()).toLocaleString('id-ID')}{"\n"}
        • <Text style={{ fontWeight: 'bold' }}>Catatan Analisis:</Text> Berkas jawaban {candidateName} telah tersimpan dengan aman dan memenuhi norma kriteria kualifikasi asesmen HR.
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
  const list = Array.isArray(results) ? results : [];
  const { detail } = partitionReportResults(list);
  const ordered = orderDetailResults(detail);

  return (
    <Document>
      <FlowPage>
        <CoverBlock participant={participant} />
        {ordered.map((r, idx) => {
          const code = normalizeTestCode(r.test_code);
          const pageKey = r.id || `${code}-${idx}`;
          if (isV3TestCode(code)) {
            return <V3TestSection key={pageKey} result={r} sectionNumber={idx + 1} />;
          }
          return <View key={pageKey}>{renderSpecificTestReport(r, idx, participant)}</View>;
        })}
        <ClosingBlock participant={participant} results={ordered} />
      </FlowPage>
    </Document>
  );
}

