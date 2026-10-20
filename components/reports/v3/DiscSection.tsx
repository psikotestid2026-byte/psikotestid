import React from 'react';
import { Circle, G, Line, Polyline, Svg, Text, View, StyleSheet } from '@react-pdf/renderer';
import { DISC_AXIS_MAX, DISC_AXIS_MIN, DISC_COLORS, DISC_ORDER, discSectionModel, formatDecimal } from '@/lib/reportTemplateV3';
import { IconHeading, SectionBlock, cardStyles, theme } from '@/components/reports/v3/ReportShell';

const ACCENT = '#e8590c';
const SOFT = '#fff1e6';

const chart = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  box: {
    width: '32.5%',
    borderWidth: 1,
    borderColor: theme.line,
    borderTopWidth: 3,
    borderTopColor: ACCENT,
    borderRadius: 8,
    padding: 4,
    backgroundColor: '#ffffff',
  },
  title: { fontSize: 7.5, fontWeight: 'bold', textAlign: 'center', color: theme.ink },
  sub: { fontSize: 6.5, textAlign: 'center', color: theme.muted, marginBottom: 2 },
  how: { fontSize: 6.2, color: '#374151', lineHeight: 1.3, marginTop: 2 },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  legendItem: { fontSize: 7.5, fontWeight: 'bold' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  chip: {
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginRight: 4,
    marginBottom: 3,
    fontSize: 8,
    color: theme.ink,
  },
});

function DiscGraph({
  title,
  subtitle,
  howToRead,
  values,
}: {
  title: string;
  subtitle: string;
  howToRead: string;
  values: { D: number; I: number; S: number; C: number };
}) {
  const W = 168;
  const H = 132;
  const padL = 20;
  const padR = 6;
  const padT = 12;
  const padB = 14;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const yOf = (value: number) => {
    const clamped = Math.max(DISC_AXIS_MIN, Math.min(DISC_AXIS_MAX, value));
    return padT + (plotH * (DISC_AXIS_MAX - clamped)) / (DISC_AXIS_MAX - DISC_AXIS_MIN);
  };
  const xs = DISC_ORDER.map((_, index) => padL + (plotW * (index + 0.5)) / 4);
  const points = DISC_ORDER.map((letter, index) => `${xs[index].toFixed(1)},${yOf(values[letter]).toFixed(1)}`).join(' ');

  const grid = [];
  for (let tick = DISC_AXIS_MAX; tick >= DISC_AXIS_MIN; tick -= 6) {
    const gy = yOf(tick);
    grid.push(
      <G key={tick}>
        <Line
          x1={padL}
          y1={gy}
          x2={W - padR}
          y2={gy}
          stroke={tick === 0 ? '#9ca3af' : '#e5e7eb'}
          strokeWidth={tick === 0 ? 0.8 : 0.4}
        />
        <Text x={padL - 2} y={gy + 2} style={{ fontSize: 5.5, fill: '#6b7280', textAnchor: 'end' }}>
          {String(tick)}
        </Text>
      </G>
    );
  }

  return (
    <View style={chart.box}>
      <Text style={chart.title}>{title}</Text>
      <Text style={chart.sub}>{subtitle}</Text>
      <Svg width={W} height={H}>
        {grid}
        <Polyline points={points} fill="none" stroke="#46566e" strokeWidth={1.4} opacity={0.7} />
        {DISC_ORDER.map((letter, index) => {
          const value = values[letter];
          const cx = xs[index];
          const cy = yOf(value);
          const labelY = value >= 0 ? cy - 6 : cy + 8;
          return (
            <G key={letter}>
              <Circle cx={cx} cy={cy} r={3.2} fill={DISC_COLORS[letter]} stroke="#ffffff" strokeWidth={0.8} />
              <Text
                x={cx}
                y={labelY}
                style={{ fontSize: 6, fontWeight: 'bold', fill: DISC_COLORS[letter], textAnchor: 'middle' }}
              >
                {formatDecimal(value)}
              </Text>
              <Text
                x={cx}
                y={H - 2}
                style={{ fontSize: 8, fontWeight: 'bold', fill: DISC_COLORS[letter], textAnchor: 'middle' }}
              >
                {letter}
              </Text>
            </G>
          );
        })}
      </Svg>
      <Text style={chart.how}>{howToRead}</Text>
    </View>
  );
}

export function DiscSection({
  scoring,
  sectionNumber,
}: {
  scoring: Record<string, any> | null | undefined;
  sectionNumber: number;
}) {
  const model = discSectionModel(scoring);
  const kicker = `Bagian Tes ${sectionNumber}`;

  const narratives = model.graphs.map((graph, index) => (
    <View key={graph.key} style={[cardStyles.card, { backgroundColor: SOFT, borderTopColor: ACCENT }]} wrap={false}>
      <IconHeading accent={ACCENT} icon={String(index + 1)} title={graph.cardTitle} />
      <Text style={cardStyles.body}>Sub-trait: {graph.subTrait}</Text>
      {graph.narrative ? <Text style={[cardStyles.body, { marginTop: 2 }]}>{graph.narrative}</Text> : null}
    </View>
  ));

  return (
    <>
      <SectionBlock
        accent={ACCENT}
        kicker={kicker}
        title="Analisis Perilaku & Gaya Komunikasi Kerja (DISC)"
        lead={
          <>
            <View style={chart.chipRow}>
              <Text style={chart.chip}>Tipe {model.kode}</Text>
              <Text style={chart.chip}>Label {model.label}</Text>
              <Text style={chart.chip}>Sub-trait utama {model.subtrait}</Text>
              <Text style={chart.chip}>Stress potential {model.stress}</Text>
            </View>
            <View style={chart.row}>
              {model.graphs.map((graph) => (
                <DiscGraph
                  key={graph.key}
                  title={graph.title}
                  subtitle={graph.subtitle}
                  howToRead={graph.howToRead}
                  values={graph.values}
                />
              ))}
            </View>
            <View style={chart.legend}>
              {DISC_ORDER.map((letter) => (
                <Text key={letter} style={[chart.legendItem, { color: DISC_COLORS[letter] }]}>
                  {letter} {letter === 'D' ? 'Dominance' : letter === 'I' ? 'Influence' : letter === 'S' ? 'Steadiness' : 'Compliance'}
                </Text>
              ))}
            </View>
          </>
        }
      />

      <SectionBlock accent={ACCENT} kicker={kicker} title="Deskripsi Perilaku DISC" lead={narratives[0]}>
        {narratives.slice(1)}
        {model.profil ? (
          <View style={[cardStyles.card, { backgroundColor: SOFT, borderTopColor: ACCENT }]} wrap={false}>
            <IconHeading accent={ACCENT} icon="P" title="Deskripsi profil utama" />
            <Text style={cardStyles.body}>{model.profil}</Text>
          </View>
        ) : null}
        {model.penempatan ? (
          <View style={[cardStyles.card, { backgroundColor: SOFT, borderTopColor: ACCENT }]} wrap={false}>
            <IconHeading accent={ACCENT} icon="P" title="Proyeksi penempatan posisi, profesi, dan bidang" />
            <Text style={cardStyles.body}>{model.penempatan}</Text>
          </View>
        ) : null}
      </SectionBlock>
    </>
  );
}
