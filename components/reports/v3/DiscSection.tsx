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
    fontSize: 7.2,
    fontFamily: 'Poppins',
    fontWeight: 'bold',
    textAlign: 'center',
    color: INK,
    marginTop: 3,
  },
  kode: {
    fontSize: 7,
    fontFamily: 'Poppins',
    fontWeight: 'bold',
    textAlign: 'center',
    color: CODE_BLUE,
    marginTop: 1,
  },
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
    fontSize: 7.2,
    fontFamily: 'Poppins',
    fontWeight: 'bold',
    lineHeight: 1.35,
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
  aspectLabel: {
    fontSize: 7.4,
    fontFamily: 'Poppins',
    fontWeight: 'bold',
    color: INK,
    marginBottom: 2,
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
    color: INK,
  },
  bullet: {
    fontSize: 8,
    fontFamily: 'Poppins',
    color: INK,
    lineHeight: 1.4,
    marginBottom: 2,
  },
});

function DiscGraph({
  title,
  subtitle,
  patternName,
  kodeText,
  status,
  values,
}: {
  title: string;
  subtitle: string;
  patternName: string;
  kodeText: string | null;
  status: string | null;
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
      {status ? <Text style={chart.pattern}>{status}</Text> : null}
      {!status && patternName ? <Text style={chart.pattern}>{patternName}</Text> : null}
      {!status && kodeText ? <Text style={chart.kode}>KODE: {kodeText}</Text> : null}
    </View>
  );
}

export function DiscSection({
  scoring,
  sectionNumber,
  dictionary,
}: {
  scoring: Record<string, any> | null | undefined;
  sectionNumber: number;
  dictionary?: DiscReportDictionary | null;
}) {
  const model = discSectionModel(scoring, { dictionary });
  const kicker = `Bagian Tes ${sectionNumber}`;

  return (
    <SectionBlock
      accent={RED}
      kicker={kicker}
      title="Analisis Perilaku dan Gaya Komunikasi Kerja (DISC)"
      lead={
        <View style={chart.row}>
          {model.graphs.map((graph) => (
            <DiscGraph
              key={graph.key}
              title={graph.title}
              subtitle={graph.label}
              patternName={graph.patternName}
              kodeText={graph.kodeText}
              status={graph.status}
              values={graph.values}
            />
          ))}
        </View>
      }
    >
      {model.blocks.map((block) => (
        <View key={block.graphKeys.join('-')} style={chart.block}>
          <View style={chart.bar} minPresenceAhead={48}>
            <Text style={chart.barText}>{block.header}</Text>
          </View>
          <View style={chart.body}>
            {block.kind === 'status' ? (
              <>
                {block.arti ? <Text style={chart.paragraph}>{block.arti}</Text> : null}
                {block.context ? <Text style={chart.paragraph}>{block.context}</Text> : null}
              </>
            ) : (
              <>
                {block.description ? <Text style={chart.paragraph}>{block.description}</Text> : null}
                {block.characteristics.length > 0 ? (
                  <>
                    <View style={chart.divider} />
                    <Text style={chart.aspectLabel}>Karakteristik Utama</Text>
                    {block.characteristics.map((item) => (
                      <Text key={item.label} style={chart.bullet}>
                        • <Text style={{ fontWeight: 'bold' }}>{item.label}:</Text> {item.text}
                      </Text>
                    ))}
                  </>
                ) : null}
                {block.cautions.length > 0 ? (
                  <>
                    <View style={chart.divider} />
                    <Text style={chart.aspectLabel}>Hal yang Perlu Diperhatikan</Text>
                    {block.cautions.map((item) => (
                      <Text key={item} style={chart.bullet}>
                        • {item}
                      </Text>
                    ))}
                  </>
                ) : null}
                {block.motivators ? (
                  <>
                    <View style={chart.divider} />
                    <Text style={chart.aspectLabel}>Faktor yang Memotivasi</Text>
                    <Text style={chart.paragraph}>{block.motivators}</Text>
                  </>
                ) : null}
                {block.jobs.length > 0 ? (
                  <>
                    <View style={chart.divider} />
                    <Text style={chart.jobLabel}>Profesi cocok</Text>
                    <View style={chart.chips}>
                      {block.jobs.map((job) => (
                        <Text key={job} style={chart.chip}>
                          {job}
                        </Text>
                      ))}
                    </View>
                  </>
                ) : null}
              </>
            )}
          </View>
        </View>
      ))}
      <View style={chart.block}>
        <View wrap={false}>
          <View style={chart.bar}>
            <Text style={chart.barText}>{model.traits.heading}</Text>
          </View>
          <View style={chart.body}>
            <Text style={chart.aspectLabel}>{model.traits.aspects[0]?.label}</Text>
            <Text style={chart.paragraph}>{(model.traits.aspects[0]?.items || []).join(' · ')}</Text>
          </View>
        </View>
        <View style={chart.body}>
          {model.traits.aspects.slice(1).map((aspect) => (
            <View key={aspect.label} wrap={false}>
              <View style={chart.divider} />
              <Text style={chart.aspectLabel}>{aspect.label}</Text>
              <Text style={chart.paragraph}>{aspect.items.join(' · ')}</Text>
            </View>
          ))}
        </View>
      </View>
      {model.development.items.length > 0 ? (
        <View style={chart.block}>
          <View style={chart.bar} minPresenceAhead={48}>
            <Text style={chart.barText}>Saran Pengembangan</Text>
          </View>
          <View style={chart.body}>
            {model.development.items.map((item) => (
              <Text key={item} style={chart.bullet}>
                • {item}
              </Text>
            ))}
          </View>
        </View>
      ) : null}
    </SectionBlock>
  );
}
