import React from 'react';
import { Circle, Line, Path, Svg, Text, View, StyleSheet } from '@react-pdf/renderer';
import { wptSectionModel } from '@/lib/reportTemplateV3';
import { IconHeading, SectionBlock, cardStyles, theme } from '@/components/reports/v3/ReportShell';

const ACCENT = '#7c3aed';
const SOFT = '#f1eaff';

const styles = StyleSheet.create({
  gaugeCard: {
    backgroundColor: SOFT,
    borderRadius: 8,
    borderTopWidth: 3,
    borderTopColor: ACCENT,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  labels: { flexDirection: 'row', justifyContent: 'space-between', width: 360, marginTop: 2 },
  label: { fontSize: 8, color: theme.muted },
  caption: { marginTop: 8, fontSize: 8, color: theme.muted, letterSpacing: 0.6 },
  score: { fontSize: 28, fontWeight: 'bold', color: ACCENT, marginTop: 1 },
});

function needlePoint(angle: number) {
  const radians = (angle * Math.PI) / 180;
  const length = 78;
  return {
    x: 150 + Math.sin(radians) * length,
    y: 150 - Math.cos(radians) * length,
  };
}

export function WptSection({
  scoring,
  sectionNumber,
}: {
  scoring: Record<string, any> | null | undefined;
  sectionNumber: number;
}) {
  const model = wptSectionModel(scoring);
  const angle = model.angle ?? 0;
  const tip = needlePoint(angle);

  return (
    <SectionBlock
      accent={ACCENT}
      kicker={`Bagian Tes ${sectionNumber}`}
      title="Tes Kognitif"
      lead={
        <View style={styles.gaugeCard}>
          <Svg width={360} height={168} viewBox="0 18 300 160">
            <Path d="M40 150 A110 110 0 0 1 61 85.3" stroke="#f87171" strokeWidth={22} fill="none" />
            <Path d="M61 85.3 A110 110 0 0 1 116 45.4" stroke="#fbbf24" strokeWidth={22} fill="none" />
            <Path d="M116 45.4 A110 110 0 0 1 184 45.4" stroke="#a3e635" strokeWidth={22} fill="none" />
            <Path d="M184 45.4 A110 110 0 0 1 239 85.3" stroke="#34d399" strokeWidth={22} fill="none" />
            <Path d="M239 85.3 A110 110 0 0 1 260 150" stroke="#60a5fa" strokeWidth={22} fill="none" />
            <Line x1={150} y1={150} x2={tip.x} y2={tip.y} stroke="#1f2933" strokeWidth={3.5} strokeLinecap="round" />
            <Circle cx={150} cy={150} r={7} fill="#1f2933" />
          </Svg>
          <View style={styles.labels}>
            <Text style={styles.label}>Di bawah rata-rata</Text>
            <Text style={styles.label}>Rata-rata</Text>
            <Text style={styles.label}>Di atas rata-rata</Text>
          </View>
          <Text style={styles.caption}>SKOR KOGNITIF</Text>
          <Text style={styles.score}>{model.scoreText}</Text>
        </View>
      }
    >
      {model.narrative ? (
        <View style={[cardStyles.card, cardStyles.plain, { borderTopColor: ACCENT }]} wrap={false}>
          <IconHeading accent={ACCENT} icon="i" title="Ringkasan" />
          <Text style={cardStyles.body}>{model.narrative}</Text>
        </View>
      ) : null}
    </SectionBlock>
  );
}
