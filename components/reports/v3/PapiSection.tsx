import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { papiSectionModel } from '@/lib/reportTemplateV3';
import { SectionBlock, theme } from '@/components/reports/v3/ReportShell';

const ACCENT = '#0f9d74';
const ZONE_COLOR = { Low: '#0891b2', Middle: '#d97706', High: '#dc2626' } as const;

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: theme.ink,
    paddingBottom: 3,
    marginBottom: 1,
  },
  headText: { fontSize: 7, fontWeight: 'bold', color: theme.ink },
  zoneRow: { flexDirection: 'row', width: 168 },
  zone: { textAlign: 'center', fontSize: 6, fontWeight: 'bold' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0.4,
    borderBottomColor: theme.line,
    paddingVertical: 2,
  },
  groupStart: { borderTopWidth: 1, borderTopColor: '#cbd5e1' },
  cat: { width: 68, fontSize: 6.5, fontWeight: 'bold', textAlign: 'center' },
  name: { width: 168, fontSize: 7, color: theme.ink, paddingRight: 4 },
  barCell: { width: 168, height: 8, justifyContent: 'center' },
  barTrack: { height: 7, borderRadius: 3, backgroundColor: '#f3f4f6', position: 'relative' },
  barFill: { height: 7, borderRadius: 3 },
  tick: { position: 'absolute', top: 0, bottom: 0, width: 0.6, backgroundColor: '#d1d5db' },
  score: { width: 36, fontSize: 7.5, fontWeight: 'bold', textAlign: 'center', color: theme.ink },
  paragraphs: { marginTop: 8 },
  body: { fontSize: 8, color: theme.ink, lineHeight: 1.35 },
  following: { marginTop: 6 },
});

export function PapiSection({
  scoring,
  sectionNumber,
  participantName,
}: {
  scoring: Record<string, any> | null | undefined;
  sectionNumber: number;
  participantName?: string | null;
}) {
  const model = papiSectionModel(scoring, participantName);
  const tableHead = (
    <View style={styles.head}>
      <Text style={[styles.headText, { width: 68 }]}>Kategori</Text>
      <Text style={[styles.headText, { width: 168 }]}>Aspek</Text>
      <View style={styles.zoneRow}>
        <Text style={[styles.zone, { width: '33.333%', color: ZONE_COLOR.Low }]}>Low (≤3)</Text>
        <Text style={[styles.zone, { width: '22.222%', color: ZONE_COLOR.Middle }]}>Middle (4–5)</Text>
        <Text style={[styles.zone, { width: '44.445%', color: ZONE_COLOR.High }]}>High (≥6)</Text>
      </View>
      <Text style={[styles.headText, { width: 36, textAlign: 'center' }]}>Skor</Text>
    </View>
  );
  const groupRows = (group: (typeof model.groups)[number]) =>
    group.rows.map((row, index) => (
      <View key={row.code} style={[styles.row, index === 0 ? styles.groupStart : {}]}>
        <Text style={[styles.cat, { color: group.color }]}>{index === 0 ? group.category : ''}</Text>
        <Text style={styles.name}>{row.name}</Text>
        <View style={styles.barCell}>
          <View style={styles.barTrack}>
            <View style={[styles.tick, { left: '33.333%' }]} />
            <View style={[styles.tick, { left: '55.556%' }]} />
            <View style={[styles.barFill, { width: `${row.fraction * 100}%`, backgroundColor: ZONE_COLOR[row.zone] }]} />
          </View>
        </View>
        <Text style={styles.score}>{row.scoreText}</Text>
      </View>
    ));

  return (
    <SectionBlock
      accent={ACCENT}
      kicker={`Bagian Tes ${sectionNumber}`}
      title="PAPI Kostick"
      subtitle={model.ringkasan}
      lead={
        <View>
          {tableHead}
          {model.groups[0] ? groupRows(model.groups[0]) : null}
        </View>
      }
    >
      {model.groups.slice(1).map((group) => (
        <View key={group.category} wrap={false}>
          {groupRows(group)}
        </View>
      ))}
      {model.highParagraph || model.lowParagraph ? (
        <View style={styles.paragraphs}>
          {model.highParagraph ? <Text style={styles.body}>{model.highParagraph}</Text> : null}
          {model.lowParagraph ? (
            <Text style={model.highParagraph ? [styles.body, styles.following] : styles.body}>{model.lowParagraph}</Text>
          ) : null}
        </View>
      ) : null}
    </SectionBlock>
  );
}
