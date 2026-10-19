import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import {
  buildClosingContent,
  CATATAN_KETERBATASAN,
  coverFields,
  coverStatus,
  hasilUtama,
  orderCoverResults,
  sectionSummaries,
  summaryIcon,
  summaryTitle,
} from '@/lib/reportTemplateV3';
import { isSkippedDetailTest } from '@/lib/combinedReport';
import { IconHeading, ReportPage, cardStyles, theme } from '@/components/reports/v3/ReportShell';

const COVER = '#1d4ed8';
const COVER_SOFT = '#e8f0ff';
const CLOSE = '#0f172a';
const CLOSE_SOFT = '#eef2f6';

const styles = StyleSheet.create({
  info: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 8,
  },
  infoCell: {
    width: '50%',
    paddingVertical: 4,
    paddingRight: 8,
    borderBottomWidth: 0.4,
    borderBottomColor: theme.line,
  },
  infoLabel: {
    fontSize: 6.5,
    color: theme.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoValue: { fontSize: 8.5, fontWeight: 'bold', color: theme.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  half: { width: '49%' },
  full: { width: '100%' },
  hasil: { fontSize: 8.5, color: theme.ink, lineHeight: 1.35 },
  status: { fontSize: 7, color: theme.muted, marginTop: 2 },
  note: { fontSize: 7.5, color: theme.muted, marginTop: 2 },
  signRow: { flexDirection: 'row', marginTop: 16 },
  signCol: { width: '46%', marginRight: 16 },
  signLabel: { fontSize: 9, color: theme.ink },
  signLine: { marginTop: 36, borderTopWidth: 1, borderTopColor: theme.ink, paddingTop: 3 },
});

export function CoverPage({
  participant,
  results,
}: {
  participant: Record<string, any>;
  results: any[];
}) {
  const fields = coverFields(participant);
  const rows = orderCoverResults(results);
  const skipped = rows.filter((row) => isSkippedDetailTest(row?.test_code)).length;

  return (
    <ReportPage
      accent={COVER}
      soft={COVER_SOFT}
      kicker="Laporan Hasil Asesmen Psikotes"
      title={String(participant?.full_name || 'Kandidat')}
      subtitle="Laporan lengkap evaluasi talenta"
    >
      <Text style={cardStyles.sectionLabel}>Informasi Kandidat</Text>
      <View style={styles.info}>
        {fields.map((field) => (
          <View key={field.label} style={styles.infoCell}>
            <Text style={styles.infoLabel}>{field.label}</Text>
            <Text style={styles.infoValue}>{field.value}</Text>
          </View>
        ))}
      </View>
      <Text style={cardStyles.sectionLabel}>Ringkasan Hasil</Text>
      {rows.length === 0 ? (
        <Text style={styles.note}>Belum ada instrumen tes dikerjakan.</Text>
      ) : (
        <View style={styles.grid}>
          {rows.map((row, index) => {
            const wide = rows.length % 2 === 1 && index === rows.length - 1;
            return (
              <View
                key={`${row.test_code || 'tes'}-${index}`}
                style={[
                  cardStyles.card,
                  wide ? styles.full : styles.half,
                  { backgroundColor: COVER_SOFT, borderTopColor: COVER },
                ]}
              >
                <IconHeading accent={COVER} icon={summaryIcon(row.test_code)} title={summaryTitle(row.test_code, row.test_name)} />
                <Text style={styles.hasil}>{hasilUtama(row.test_code, row.scoring_data)}</Text>
                <Text style={styles.status}>{coverStatus(row.test_code)}</Text>
              </View>
            );
          })}
        </View>
      )}
      {skipped > 0 ? (
        <Text style={styles.note}>
          Instrumen IST dan tes teknis tercatat pada ringkasan di atas, tetapi tidak dibuatkan halaman detail.
        </Text>
      ) : null}
    </ReportPage>
  );
}

export function ClosingPage({
  participant,
  results,
}: {
  participant: Record<string, any>;
  results: { test_code?: string | null; test_name?: string | null; scoring_data?: any }[];
}) {
  const closing = buildClosingContent(participant, sectionSummaries(results));
  return (
    <ReportPage accent={CLOSE} soft={CLOSE_SOFT} kicker="Bagian Tambahan" title="Ringkasan & Rekomendasi">
      {closing.executive ? (
        <View style={[cardStyles.card, { backgroundColor: CLOSE_SOFT, borderTopColor: CLOSE }]}>
          <IconHeading accent={CLOSE} icon="1" title="Ringkasan eksekutif" />
          <Text style={cardStyles.body}>{closing.executive}</Text>
        </View>
      ) : null}
      {closing.recommendation ? (
        <View style={[cardStyles.card, { backgroundColor: CLOSE_SOFT, borderTopColor: CLOSE }]}>
          <IconHeading accent={CLOSE} icon="2" title="Rekomendasi pengembangan terpadu" />
          <Text style={cardStyles.body}>{closing.recommendation}</Text>
        </View>
      ) : null}
      <View style={[cardStyles.card, cardStyles.plain, { borderTopColor: CLOSE }]}>
        <IconHeading accent={CLOSE} icon="!" title="Catatan keterbatasan tes" />
        <Text style={cardStyles.body}>{CATATAN_KETERBATASAN}</Text>
      </View>
      <View style={styles.signRow}>
        <View style={styles.signCol}>
          <Text style={styles.signLabel}>Assessor</Text>
          <View style={styles.signLine} />
        </View>
        <View style={styles.signCol}>
          <Text style={styles.signLabel}>Tanggal validasi</Text>
          <View style={styles.signLine} />
        </View>
      </View>
    </ReportPage>
  );
}
