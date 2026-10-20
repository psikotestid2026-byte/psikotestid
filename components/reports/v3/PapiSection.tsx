import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { papiSectionModel } from '@/lib/reportTemplateV3';
import { IconHeading, SectionBlock, cardStyles, theme } from '@/components/reports/v3/ReportShell';

const ACCENT = '#0f9d74';

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
  zone: { width: 56, textAlign: 'center', fontSize: 6.5, fontWeight: 'bold' },
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
});

export function PapiSection({
  scoring,
  sectionNumber,
}: {
  scoring: Record<string, any> | null | undefined;
  sectionNumber: number;
}) {
  const model = papiSectionModel(scoring);
  const tableHead = (
    <View style={styles.head}>
      <Text style={[styles.headText, { width: 68 }]}>Kategori</Text>
      <Text style={[styles.headText, { width: 168 }]}>Aspek</Text>
      <View style={styles.zoneRow}>
        <Text style={[styles.zone, { color: '#dc2626' }]}>Rendah (1-3)</Text>
        <Text style={[styles.zone, { color: '#d97706' }]}>Sedang (4-6)</Text>
        <Text style={[styles.zone, { color: '#16a34a' }]}>Tinggi (7-9)</Text>
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
            <View style={[styles.tick, { left: '33.3%' }]} />
            <View style={[styles.tick, { left: '66.6%' }]} />
            <View style={[styles.barFill, { width: `${row.fraction * 100}%`, backgroundColor: group.color }]} />
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
      {model.narrative ? (
        <View style={[cardStyles.card, cardStyles.plain, { borderTopColor: ACCENT, marginTop: 6 }]}>
          <IconHeading accent={ACCENT} icon="i" title="Interpretasi" />
          <Text style={cardStyles.body}>{model.narrative}</Text>
        </View>
      ) : null}
    </SectionBlock>
  );
}
