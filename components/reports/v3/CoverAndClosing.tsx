import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import {
  buildClosingContent,
  CATATAN_KETERBATASAN,
  coverFields,
  reportValidationLine,
  sectionSummaries,
} from '@/lib/reportTemplateV3';
import { IconHeading, SectionBlock, cardStyles, theme } from '@/components/reports/v3/ReportShell';

const COVER = '#1d4ed8';
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
  dateLine: { fontSize: 10, color: theme.ink, marginTop: 12 },
  signSpace: { height: 78 },
  expert: { fontSize: 10, fontWeight: 'bold', color: '#1D1D1D' },
});

export function CoverBlock({ participant }: { participant: Record<string, any> }) {
  const fields = coverFields(participant);

  return (
    <SectionBlock
      accent={COVER}
      kicker="Laporan Hasil Asesmen Psikotes"
      title={String(participant?.full_name || 'Kandidat')}
      subtitle="Laporan lengkap evaluasi talenta"
      lead={
        <View>
          <Text style={cardStyles.sectionLabel}>Informasi Kandidat</Text>
          <View style={styles.info}>
            {fields.map((field) => (
              <View key={field.label} style={styles.infoCell}>
                <Text style={styles.infoLabel}>{field.label}</Text>
                <Text style={styles.infoValue}>{field.value}</Text>
              </View>
            ))}
          </View>
        </View>
      }
    />
  );
}

export function ClosingBlock({
  participant,
  results,
}: {
  participant: Record<string, any>;
  results: { test_code?: string | null; test_name?: string | null; scoring_data?: any }[];
}) {
  const closing = buildClosingContent(participant, sectionSummaries(results));
  return (
    <SectionBlock accent={CLOSE} kicker="Bagian Tambahan" title="Ringkasan & Rekomendasi">
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
      <View wrap={false}>
        <Text style={styles.dateLine}>{reportValidationLine(participant)}</Text>
        <View style={styles.signSpace} />
        <Text style={styles.expert}>Expert ruangtes.theaim.id</Text>
      </View>
    </SectionBlock>
  );
}
