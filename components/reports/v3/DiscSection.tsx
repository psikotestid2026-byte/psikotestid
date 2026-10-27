import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { Circle, Font, G, Line, Polyline, Svg, Text, View, StyleSheet } from '@react-pdf/renderer';
import { DISC_AXIS_MAX, DISC_AXIS_MIN, DISC_COLORS, DISC_ORDER, discSectionModel, formatDecimal } from '@/lib/reportTemplateV3';
import type { DiscReportDictionary } from '@/lib/scoring/discReportDictionary';
import { SectionBlock } from '@/components/reports/v3/ReportShell';

const RED = '#B61213';
const GOLD = '#FDB223';
const INK = '#1D1D1D';
const CODE_BLUE = '#1D4ED8';
const FONT_DIR = path.join(process.cwd(), 'public/fonts/poppins');

if (fs.existsSync(path.join(FONT_DIR, 'Poppins-Regular.ttf'))) {
  Font.register({
    family: 'Poppins',
    fonts: [
      { src: path.join(FONT_DIR, 'Poppins-Regular.ttf') },
      { src: path.join(FONT_DIR, 'Poppins-Bold.ttf'), fontWeight: 'bold' },
      { src: path.join(FONT_DIR, 'Poppins-Italic.ttf'), fontStyle: 'italic' },
      { src: path.join(FONT_DIR, 'Poppins-BoldItalic.ttf'), fontWeight: 'bold', fontStyle: 'italic' },
    ],
  });
}

const chart = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  box: {
    width: '32.4%',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderTopWidth: 3,
    borderTopColor: RED,
    borderRadius: 6,
    paddingTop: 6,
    paddingBottom: 6,
    paddingHorizontal: 4,
    backgroundColor: '#ffffff',
    fontFamily: 'Poppins',
  },
  title: { fontSize: 8, fontFamily: 'Poppins', fontWeight: 'bold', textAlign: 'center', color: INK },
  sub: { fontSize: 6.2, fontFamily: 'Poppins', textAlign: 'center', color: '#4B5563', marginBottom: 2 },
  pattern: {
    fontSize: 8,
    fontFamily: 'Poppins',
    fontWeight: 'bold',
    textAlign: 'center',
    color: INK,
    marginTop: 3,
  },
  kode: {
    fontSize: 7.5,
    fontFamily: 'Poppins',
    fontWeight: 'bold',
    textAlign: 'center',
    color: CODE_BLUE,
    marginTop: 1,
  },
  subTrait: {
    fontSize: 6.4,
    fontFamily: 'Poppins',
    fontStyle: 'italic',
    textAlign: 'center',
    color: INK,
    marginTop: 1,
  },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2, marginBottom: 6 },
  legendItem: { fontSize: 7, fontFamily: 'Poppins', fontWeight: 'bold' },
  block: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 4,
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  bar: {
    backgroundColor: RED,
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  barText: {
    color: '#ffffff',
    fontSize: 7.4,
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  body: { paddingHorizontal: 8, paddingTop: 6, paddingBottom: 7 },
  paragraph: {
    fontSize: 8,
    fontFamily: 'Poppins',
    color: INK,
    lineHeight: 1.4,
    marginBottom: 4,
  },
  divider: {
    borderBottomWidth: 0.6,
    borderBottomColor: '#E5E7EB',
    marginTop: 2,
    marginBottom: 6,
  },
  smallCaps: {
    fontSize: 7.2,
    fontFamily: 'Poppins',
    fontWeight: 'bold',
    color: INK,
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  jobLabel: {
    fontSize: 7.4,
    fontFamily: 'Poppins',
    fontWeight: 'bold',
    color: INK,
    marginBottom: 4,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 2,
    paddingVertical: 2,
    paddingHorizontal: 5,
    marginRight: 4,
    marginBottom: 4,
    fontSize: 6.6,
    fontFamily: 'Poppins',
    fontWeight: 'bold',
    color: INK,
    letterSpacing: 0.2,
  },
});

function DiscGraph({
  title,
  subtitle,
  patternName,
  code,
  subTraitLabel,
  values,
}: {
  title: string;
  subtitle: string;
  patternName: string;
  code: string;
  subTraitLabel: string;
  values: { D: number; I: number; S: number; C: number };
}) {
  const W = 168;
  const H = 118;
  const padL = 18;
  const padR = 6;
  const padT = 10;
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
        <Text x={padL - 2} y={gy + 2} style={{ fontSize: 5.5, fontFamily: 'Poppins', fill: '#6b7280', textAnchor: 'end' }}>
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
        <Polyline points={points} fill="none" stroke={INK} strokeWidth={1.3} />
        {DISC_ORDER.map((letter, index) => {
          const value = values[letter];
          const cx = xs[index];
          const cy = yOf(value);
          const labelY = value >= 0 ? cy - 6 : cy + 8;
          return (
            <G key={letter}>
              <Circle cx={cx} cy={cy} r={3} fill={DISC_COLORS[letter]} stroke="#ffffff" strokeWidth={0.6} />
              <Text x={cx} y={labelY} style={{ fontSize: 6, fontFamily: 'Poppins', fontWeight: 'bold', fill: DISC_COLORS[letter], textAnchor: 'middle' }}>
                {formatDecimal(value)}
              </Text>
              <Text x={cx} y={H - 2} style={{ fontSize: 8, fontFamily: 'Poppins', fontWeight: 'bold', fill: DISC_COLORS[letter], textAnchor: 'middle' }}>
                {letter}
              </Text>
            </G>
          );
        })}
      </Svg>
      <Text style={chart.pattern}>{patternName}</Text>
      <Text style={chart.kode}>KODE: {code}</Text>
      <Text style={chart.subTrait}>Sub-trait: {subTraitLabel}</Text>
    </View>
  );
}

export function DiscSection({
  scoring,
  sectionNumber,
  participantName,
  dictionary,
}: {
  scoring: Record<string, any> | null | undefined;
  sectionNumber: number;
  participantName?: string | null;
  dictionary?: DiscReportDictionary | null;
}) {
  const model = discSectionModel(scoring, { participantName, dictionary });
  const kicker = `Bagian Tes ${sectionNumber}`;

  return (
    <SectionBlock
      accent={RED}
      kicker={kicker}
      title="Analisis Perilaku dan Gaya Komunikasi Kerja (DISC)"
      lead={
        <>
          <View style={chart.row}>
            {model.graphs.map((graph) => (
              <DiscGraph
                key={graph.key}
                title={graph.title}
                subtitle={graph.subtitle}
                patternName={graph.patternName}
                code={graph.code}
                subTraitLabel={graph.subTraitLabel}
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
    >
      {model.blocks.map((block) => (
        <View key={block.graphKeys.join('-')} style={chart.block}>
          <View style={chart.bar} minPresenceAhead={48}>
            <Text style={chart.barText}>{block.header}</Text>
          </View>
          <View style={chart.body}>
            {block.meanings.map((meaning, index) => (
              <Text key={`${block.code}-makna-${index}`} style={chart.paragraph}>
                {meaning}
              </Text>
            ))}
            <View style={chart.divider} />
            <Text style={chart.paragraph}>{block.description}</Text>
            {block.subTraits.map((subTrait) => (
              <View key={subTrait.pairKey}>
                <View style={chart.divider} />
                <Text style={chart.smallCaps}>{subTrait.heading}</Text>
                <Text style={chart.paragraph}>{subTrait.narrative}</Text>
              </View>
            ))}
            <View style={chart.divider} />
            <Text style={chart.jobLabel}>REKOMENDASI JABATAN / PROFESI</Text>
            <View style={chart.chips}>
              {block.jobs.map((job) => (
                <Text key={job} style={chart.chip}>
                  {job}
                </Text>
              ))}
            </View>
          </View>
        </View>
      ))}
    </SectionBlock>
  );
}
