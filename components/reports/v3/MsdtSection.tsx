import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { msdtSectionModel } from '@/lib/reportTemplateV3';
import { IconHeading, SectionBlock, cardStyles, theme } from '@/components/reports/v3/ReportShell';

const ACCENT = '#d6336c';
const SOFT = '#ffe9f1';

const styles = StyleSheet.create({
  banner: {
    backgroundColor: SOFT,
    borderRadius: 8,
    borderTopWidth: 3,
    borderTopColor: ACCENT,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  code: { fontSize: 26, fontWeight: 'bold', color: ACCENT, width: 70 },
  caption: { fontSize: 8, color: theme.muted, letterSpacing: 0.6 },
  name: { fontSize: 13, fontWeight: 'bold', color: theme.ink, marginTop: 1 },
});

export function MsdtSection({
  scoring,
  sectionNumber,
}: {
  scoring: Record<string, any> | null | undefined;
  sectionNumber: number;
}) {
  const model = msdtSectionModel(scoring);
  return (
    <SectionBlock
      accent={ACCENT}
      kicker={`Bagian Tes ${sectionNumber}`}
      title="Management Style Diagnostic Test"
      lead={
        <View style={styles.banner}>
          <Text style={styles.code}>{model.code}</Text>
          <View>
            <Text style={styles.caption}>GAYA DOMINAN</Text>
            <Text style={styles.name}>{model.name}</Text>
          </View>
        </View>
      }
    >
      {model.narrative ? (
        <View style={[cardStyles.card, cardStyles.plain, { borderTopColor: ACCENT }]} wrap={false}>
          <IconHeading accent={ACCENT} icon="i" title="Interpretasi" />
          <Text style={cardStyles.body}>{model.narrative}</Text>
        </View>
      ) : null}
    </SectionBlock>
  );
}
