import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const theme = {
  primary: '#1e293b',       // slate-800
  accent: '#4f46e5',        // indigo-600
  emerald: '#059669',       // emerald-600
  amber: '#d97706',         // amber-600
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0f172a',
  bgLight: '#f8fafc',
  line: '#e2e8f0',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 36,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: theme.slate900,
    fontSize: 9,
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: theme.accent,
    paddingBottom: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.slate900,
  },
  subtitle: {
    fontSize: 7.5,
    color: theme.slate500,
    marginTop: 2,
  },
  metaRight: {
    textAlign: 'right',
  },
  metaCompany: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.accent,
  },
  candidateCard: {
    backgroundColor: theme.bgLight,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 6,
    padding: 8,
    marginBottom: 14,
  },
  candidateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  candidateCol: {
    width: '48%',
  },
  candidateLabel: {
    fontSize: 6.5,
    color: theme.slate500,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  candidateValue: {
    fontSize: 8,
    color: theme.slate900,
    fontWeight: 'bold',
    marginTop: 1,
  },
  testSection: {
    marginBottom: 14,
  },
  testTitleBanner: {
    backgroundColor: theme.primary,
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  testTitleText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  testSubtitleText: {
    fontSize: 7.5,
    color: '#cbd5e1',
  },
  questionRow: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.line,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  questionNum: {
    fontSize: 8,
    fontWeight: 'bold',
    color: theme.accent,
    width: 24,
    flexShrink: 0,
  },
  questionText: {
    flex: 1,
    fontSize: 8,
    color: theme.slate900,
    lineHeight: 1.3,
  },
  optionsText: {
    fontSize: 7,
    color: theme.slate500,
    marginTop: 2,
    marginLeft: 28,
    lineHeight: 1.25,
  },
  answerBox: {
    marginTop: 3,
    marginLeft: 28,
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: theme.bgLight,
    borderRadius: 3,
    borderLeftWidth: 2,
    borderLeftColor: theme.accent,
  },
  answerLabel: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: theme.slate500,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  answerText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: theme.slate900,
    lineHeight: 1.3,
  },
  discAnswerLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 1.5,
  },
  discBadge: {
    fontSize: 6.5,
    fontWeight: 'bold',
    paddingVertical: 1,
    paddingHorizontal: 3,
    borderRadius: 2,
    marginRight: 4,
    flexShrink: 0,
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: theme.line,
    paddingTop: 4,
    fontSize: 7,
    color: theme.slate400,
  },
});

export interface ParticipantAnswersPdfProps {
  participant: any;
  testResults: any[];
  questionsByTest: Record<number, any[]>;
}

export function ParticipantAnswersPdfDocument({
  participant,
  testResults,
  questionsByTest,
}: ParticipantAnswersPdfProps) {
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Document title={`Rincian-Jawaban-${participant.full_name || 'Kandidat'}`}>
      <Page size="A4" style={styles.page} wrap>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Lembar Rincian Jawaban Soal Asesmen</Text>
            <Text style={styles.subtitle}>
              Arsip seluruh butir pertanyaan dan pilihan jawaban yang dikerjakan kandidat
            </Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaCompany}>{participant.company_name || 'PsikoTest.id Enterprise'}</Text>
            <Text style={styles.subtitle}>{printDate}</Text>
          </View>
        </View>

        {/* Candidate Information Card */}
        <View style={styles.candidateCard}>
          <View style={styles.candidateRow}>
            <View style={styles.candidateCol}>
              <Text style={styles.candidateLabel}>Nama Lengkap Kandidat</Text>
              <Text style={styles.candidateValue}>{participant.full_name || '-'}</Text>
            </View>
            <View style={styles.candidateCol}>
              <Text style={styles.candidateLabel}>Email / Username Akun</Text>
              <Text style={styles.candidateValue}>{participant.email || participant.username || '-'}</Text>
            </View>
          </View>

          <View style={styles.candidateRow}>
            <View style={styles.candidateCol}>
              <Text style={styles.candidateLabel}>Jabatan / Posisi</Text>
              <Text style={styles.candidateValue}>{participant.position || '-'}</Text>
            </View>
            <View style={styles.candidateCol}>
              <Text style={styles.candidateLabel}>Unit Kerja / Cabang</Text>
              <Text style={styles.candidateValue}>{participant.unit_work || '-'}</Text>
            </View>
          </View>

          <View style={[styles.candidateRow, { marginBottom: 0 }]}>
            <View style={styles.candidateCol}>
              <Text style={styles.candidateLabel}>Nama Sesi Asesmen (Campaign)</Text>
              <Text style={styles.candidateValue}>{participant.campaign_title || '-'}</Text>
            </View>
            <View style={styles.candidateCol}>
              <Text style={styles.candidateLabel}>Waktu Selesai Pengerjaan</Text>
              <Text style={styles.candidateValue}>
                {participant.completed_at
                  ? new Date(participant.completed_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
                  : '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* Iteration over Each Test Result */}
        {testResults.map((tr: any) => {
          const testId = Number(tr.test_id);
          const questions: any[] = questionsByTest[testId] || [];
          const rawAnswers = tr.raw_answers || {};
          const testTitle = `${tr.test_name} (${tr.test_code?.toUpperCase() || 'TES'})`;

          return (
            <View key={tr.id} style={styles.testSection}>
              {/* Test Title Banner */}
              <View style={styles.testTitleBanner} wrap={false}>
                <Text style={styles.testTitleText}>{testTitle}</Text>
                <Text style={styles.testSubtitleText}>
                  {questions.length > 0 ? `${questions.length} Butir Soal` : `${Object.keys(rawAnswers).length} Jawaban Tersimpan`}
                </Text>
              </View>

              {/* Questions List */}
              {questions.length > 0 ? (
                questions.map((q: any, qIdx: number) => {
                  const keyZero = String(qIdx);
                  const keyOrder = String(q.order_number ?? qIdx + 1);
                  const rawAns = rawAnswers[keyZero] !== undefined ? rawAnswers[keyZero] : rawAnswers[keyOrder];
                  const qNum = q.order_number ?? qIdx + 1;

                  const isDisc = typeof rawAns === 'object' && rawAns !== null && ('K' in rawAns || 'P' in rawAns);
                  let pText = '';
                  let kText = '';
                  let plainAnswer = 'Tidak dijawab';

                  if (isDisc) {
                    const options = q?.question_data?.options || [];
                    pText = options[rawAns.P] ?? `Pilihan ${rawAns.P + 1}`;
                    kText = options[rawAns.K] ?? `Pilihan ${rawAns.K + 1}`;
                  } else if (rawAns !== undefined && rawAns !== null && rawAns !== '') {
                    if (typeof rawAns === 'object') {
                      plainAnswer = JSON.stringify(rawAns);
                    } else {
                      plainAnswer = String(rawAns);
                    }
                  }

                  const optionsSummary = !isDisc && Array.isArray(q.question_data?.options)
                    ? `Pilihan: ${q.question_data.options.join('  •  ')}`
                    : '';

                  return (
                    <View key={q.id || qIdx} style={styles.questionRow} wrap={false}>
                      <View style={styles.questionHeader}>
                        <Text style={styles.questionNum}>#{qNum}.</Text>
                        <Text style={styles.questionText}>
                          {q.question_data?.text || (isDisc ? 'Pilih salah satu paling sesuai (P) dan kurang sesuai (K):' : `Soal No. ${qNum}`)}
                        </Text>
                      </View>

                      {optionsSummary ? (
                        <Text style={styles.optionsText}>{optionsSummary}</Text>
                      ) : null}

                      <View style={styles.answerBox}>
                        <Text style={styles.answerLabel}>Jawaban Terpilih:</Text>
                        {isDisc ? (
                          <View style={{ marginTop: 1 }}>
                            <View style={styles.discAnswerLine}>
                              <Text style={[styles.discBadge, { backgroundColor: '#d1fae5', color: '#065f46' }]}>
                                PALING SESUAI (P):
                              </Text>
                              <Text style={styles.answerText}>{pText}</Text>
                            </View>
                            <View style={[styles.discAnswerLine, { marginTop: 2 }]}>
                              <Text style={[styles.discBadge, { backgroundColor: '#fef3c7', color: '#92400e' }]}>
                                KURANG SESUAI (K):
                              </Text>
                              <Text style={styles.answerText}>{kText}</Text>
                            </View>
                          </View>
                        ) : (
                          <Text style={styles.answerText}>{plainAnswer}</Text>
                        )}
                      </View>
                    </View>
                  );
                })
              ) : (
                Object.entries(rawAnswers).map(([k, val], idx) => {
                  let ansStr = '';
                  if (typeof val === 'object' && ('K' in (val as any) || 'P' in (val as any))) {
                    ansStr = `P: ${(val as any).P + 1}, K: ${(val as any).K + 1}`;
                  } else {
                    ansStr = String(val);
                  }
                  return (
                    <View key={k} style={styles.questionRow} wrap={false}>
                      <View style={styles.questionHeader}>
                        <Text style={styles.questionNum}>#{idx + 1}.</Text>
                        <Text style={styles.questionText}>Soal Item #{idx + 1}</Text>
                      </View>
                      <View style={styles.answerBox}>
                        <Text style={styles.answerLabel}>Jawaban Terpilih:</Text>
                        <Text style={styles.answerText}>{ansStr}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          );
        })}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>PsikoTest.id Enterprise · Portal Rekrutmen & Asesmen</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
