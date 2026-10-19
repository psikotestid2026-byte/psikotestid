import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { bigFiveBars } from '@/lib/reportTemplateV3';
import { IconHeading, ReportPage, cardStyles, theme } from '@/components/reports/v3/ReportShell';

const ACCENT = '#2563eb';
const SOFT = '#e8f0ff';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  labelWrap: { width: 148 },
  name: { fontSize: 8.5, fontWeight: 'bold', color: theme.ink },
  hint: { fontSize: 7, color: theme.muted },
  track: { flex: 1, height: 8, backgroundColor: '#ffffff', borderRadius: 4, marginHorizontal: 6 },
  fill: { height: 8, borderRadius: 4, backgroundColor: ACCENT },
  valueWrap: { width: 62, alignItems: 'flex-end' },
  percent: { fontSize: 8.5, fontWeight: 'bold', color: theme.ink },
  category: { fontSize: 7, color: theme.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  half: { width: '49%' },
  full: { width: '100%' },
});

export function BigFiveSection({
  scoring,
  sectionNumber,
}: {
  scoring: { dimensions?: Record<string, any> } | null | undefined;
  sectionNumber: number;
}) {
  const bars = bigFiveBars(scoring?.dimensions);
  return (
    <ReportPage accent={ACCENT} soft={SOFT} kicker={`Bagian Tes ${sectionNumber}`} title="Big Five Personality Test">
      <View style={[cardStyles.card, { backgroundColor: SOFT, borderTopColor: ACCENT }]}>
        <Text style={[cardStyles.cardTitle, { marginBottom: 6 }]}>Profil lima dimensi</Text>
        {bars.map((bar) => (
          <View key={bar.code} style={styles.row}>
            <View style={styles.labelWrap}>
              <Text style={styles.name}>
                {bar.name} ({bar.code})
              </Text>
              <Text style={styles.hint}>{bar.hint}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${bar.barWidth}%` }]} />
            </View>
            <View style={styles.valueWrap}>
              <Text style={styles.percent}>{bar.percentText}</Text>
              <Text style={styles.category}>{bar.category}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {bars.map((bar) => (
          <View
            key={bar.code}
            style={[
              cardStyles.card,
              bar.code === 'O' ? styles.full : styles.half,
              { backgroundColor: SOFT, borderTopColor: ACCENT },
            ]}
          >
            <IconHeading accent={ACCENT} icon={bar.code} title={bar.name} />
            {bar.narrative ? <Text style={cardStyles.body}>{bar.narrative}</Text> : null}
          </View>
        ))}
      </View>
    </ReportPage>
  );
}
