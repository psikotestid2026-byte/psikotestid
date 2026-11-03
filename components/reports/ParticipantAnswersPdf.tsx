import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const theme = {
  primary: '#4f46e5',
  emerald: '#059669',
  amber: '#d97706',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate700: '#334155',
  slate900: '#0f172a',
  bgLight: '#f8fafc',
  line: '#e2e8f0',
};

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: theme.slate900,
    fontSize: 9,
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: theme.primary,
    paddingBottom: 10,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.slate900,
  },
  subtitle: {
    fontSize: 8,
    color: theme.slate500,
    marginTop: 2,
  },
  metaRight: {
    textAlign: 'right',
  },
  metaCompany: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: theme.primary,
  },
  candidateCard: {
    backgroundColor: theme.bgLight,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  candidateItem: {
    minWidth: '45%',
  },
  candidateLabel: {
    fontSize: 7,
    color: theme.slate500,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  candidateValue: {
    fontSize: 8.5,
    color: theme.slate900,
    fontWeight: 'bold',
    marginTop: 1,
  },
  testSection: {
    marginBottom: 16,
  },
  testTitleBanner: {
    backgroundColor: theme.primary,
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testTitleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  testSubtitleText: {
    fontSize: 7.5,
    color: '#e0e7ff',
  },
  questionRow: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.line,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  questionNum: {
    fontSize: 8,
    fontWeight: 'bold',
    color: theme.primary,
    width: 24,
  },
  questionText: {
    flex: 1,
    fontSize: 8.5,
    color: theme.slate900,
    fontWeight: 'bold',
    lineHeight: 1.3,
  },
  optionsText: {
    fontSize: 7.5,
    color: theme.slate500,
    marginTop: 2,
    marginLeft: 30,
    fontStyle: 'italic',
  },
  answerBox: {
    marginTop: 4,
    marginLeft: 30,
    padding: 4,
    backgroundColor: theme.bgLight,
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: theme.primary,
  },
  answerLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: theme.slate500,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  answerText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: theme.slate900,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: theme.line,
    paddingTop: 6,
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
          <View>
            <Text style={styles.title}>Lembar Rincian Jawaban Soal Asesmen</Text>
            <Text style={styles.subtitle}>
              Arsip resmi seluruh butir pertanyaan dan pilihan jawaban yang dikerjakan kandidat
            </Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaCompany}>{participant.company_name || 'PsikoTest.id Enterprise'}</Text>
            <Text style={styles.subtitle}>{printDate}</Text>
          </View>
        </View>

        {/* Candidate Information Card */}
        <View style={styles.candidateCard}>
          <View style={styles.candidateItem}>
            <Text style={styles.candidateLabel}>Nama Lengkap Kandidat</Text>
            <Text style={styles.candidateValue}>{participant.full_name || '-'}</Text>
          </View>
          <View style={styles.candidateItem}>
            <Text style={styles.candidateLabel}>Email / Akun</Text>
            <Text style={styles.candidateValue}>{participant.email || '-'}</Text>
          </View>
          <View style={styles.candidateItem}>
            <Text style={styles.candidateLabel}>Jabatan / Posisi</Text>
            <Text style={styles.candidateValue}>{participant.position || '-'}</Text>
          </View>
          <View style={styles.candidateItem}>
            <Text style={styles.candidateLabel}>Unit Kerja / Cabang</Text>
            <Text style={styles.candidateValue}>{participant.unit_work || '-'}</Text>
          </View>
          <View style={styles.candidateItem}>
            <Text style={styles.candidateLabel}>Nama Sesi Asesmen (Campaign)</Text>
            <Text style={styles.candidateValue}>{participant.campaign_title || '-'}</Text>
          </View>
          <View style={styles.candidateItem}>
            <Text style={styles.candidateLabel}>Waktu Penyelesaian</Text>
            <Text style={styles.candidateValue}>
              {participant.completed_at
                ? new Date(participant.completed_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
                : '-'}
            </Text>
          </View>
        </View>

        {/* Iteration over Each Test Result */}
        {testResults.map((tr: any) => {
          const testId = Number(tr.test_id);
          const questions: any[] = questionsByTest[testId] || [];
          const rawAnswers = tr.raw_answers || {};
          const testTitle = `${tr.test_name} (${tr.test_code?.toUpperCase() || 'TES'})`;

          return (
            <View key={tr.id} style={styles.testSection} wrap={false}>
              {/* Test Title Banner */}
              <View style={styles.testTitleBanner}>
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

                  // Render Answer String
                  let answerString = 'Tidak dijawab';
                  if (rawAns !== undefined && rawAns !== null && rawAns !== '') {
                    if (typeof rawAns === 'object' && ('K' in rawAns || 'P' in rawAns)) {
                      const options = q?.question_data?.options || [];
                      const pText = options[rawAns.P] ?? `Pilihan ${rawAns.P + 1}`;
                      const kText = options[rawAns.K] ?? `Pilihan ${rawAns.K + 1}`;
                      answerString = `[Paling Sesuai / P]: ${pText}  |  [Kurang Sesuai / K]: ${kText}`;
                    } else if (typeof rawAns === 'object') {
                      answerString = JSON.stringify(rawAns);
                    } else {
                      answerString = String(rawAns);
                    }
                  }

                  const optionsSummary = Array.isArray(q.question_data?.options)
                    ? `Pilihan: ${q.question_data.options.join('  •  ')}`
                    : '';

                  return (
                    <View key={q.id || qIdx} style={styles.questionRow} wrap={false}>
                      <View style={styles.questionHeader}>
                        <Text style={styles.questionNum}>#{qNum}.</Text>
                        <Text style={styles.questionText}>
                          {q.question_data?.text || `Pernyataan / Soal No. ${qNum}`}
                        </Text>
                      </View>

                      {optionsSummary ? (
                        <Text style={styles.optionsText}>{optionsSummary}</Text>
                      ) : null}

                      <View style={styles.answerBox}>
                        <Text style={styles.answerLabel}>Jawaban Terpilih:</Text>
                        <Text style={styles.answerText}>{answerString}</Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                // Fallback from raw answers
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

