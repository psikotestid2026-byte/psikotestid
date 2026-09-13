import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Line, Polyline, Circle, G } from '@react-pdf/renderer';
import { sql } from '@/lib/neon';
import { findDiscTypeInfo, DISC_MAIN_TRAITS, DiscMainTrait } from '@/lib/scoring/disc_dictionary';
import { PAPI_ASPECT_DETAILS } from '@/lib/scoring/papi';
import { MSDT_TYPE_DETAILS } from '@/lib/scoring/msdt';
import { RIASEC_TYPE_DETAILS } from '@/lib/scoring/riasec';

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 8.5,
    color: '#64748b',
  },
  companyBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metaCol: {
    flexDirection: 'column',
    gap: 2,
  },
  label: {
    fontSize: 7.5,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    marginTop: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 4,
  },
  discBanner: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  discBannerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 2,
  },
  discBannerSub: {
    fontSize: 8.5,
    color: '#94a3b8',
  },
  chartsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  chartBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    padding: 6,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 1,
  },
  chartSub: {
    fontSize: 7,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 4,
  },
  table: {
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableHeader: {
    backgroundColor: '#f1f5f9',
  },
  tableCellHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#334155',
  },
  tableCell: {
    fontSize: 8,
    color: '#334155',
  },
  testCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  testCardTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1d4ed8',
    marginBottom: 4,
  },
  testCardDesc: {
    fontSize: 9.5,
    color: '#334155',
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  subHeading: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 4,
  },
  bulletItem: {
    fontSize: 9.5,
    color: '#334155',
    lineHeight: 1.5,
    marginBottom: 3,
    textAlign: 'justify',
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 32,
    right: 32,
    textAlign: 'center',
    fontSize: 7.5,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 4,
  },
});

const ORDER: ('D' | 'I' | 'S' | 'C')[] = ['D', 'I', 'S', 'C'];
const COLORS = { D: '#D7263D', I: '#E8A317', S: '#2E9E5B', C: '#2D6CDF' };
const AXMIN = -16;
const AXMAX = 18;

function PdfDiscSingleGraph({ title, subtitle, values }: { title: string; subtitle: string; values: any }) {
  const W = 160;
  const H = 150;
  const padL = 24;
  const padR = 10;
  const padT = 10;
  const padB = 18;

  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const getY = (v: number) => {
    const clamped = Math.max(AXMIN, Math.min(AXMAX, v || 0));
    return padT + (plotH * (AXMAX - clamped)) / (AXMAX - AXMIN);
  };

  const xs = ORDER.map((_, i) => padL + (plotW * (i + 0.5)) / 4);
  const pointsStr = ORDER.map((d, i) => `${xs[i].toFixed(1)},${getY(values?.[d] || 0).toFixed(1)}`).join(' ');

  const gridElements = [];
  for (let g = AXMAX; g >= AXMIN; g -= 6) {
    const gy = getY(g);
    const isZero = g === 0;
    gridElements.push(
      <G key={g}>
        <Line
          x1={padL}
          y1={gy}
          x2={W - padR}
          y2={gy}
          stroke={isZero ? '#64748b' : '#e2e8f0'}
          strokeWidth={isZero ? 1 : 0.5}
        />
        <Text
          x={padL - 4}
          y={gy + 2}
          style={{ fontSize: 6, fill: '#94a3b8', textAnchor: 'end' }}
        >
          {g}
        </Text>
      </G>
    );
  }

  return (
    <View style={styles.chartBox}>
      <Text style={styles.chartTitle}>{title}</Text>
      <Text style={styles.chartSub}>{subtitle}</Text>
      <Svg width={W} height={H}>
        {gridElements}
        <Polyline
          points={pointsStr}
          fill="none"
          stroke="#475569"
          strokeWidth={1.5}
          opacity={0.7}
        />
        {ORDER.map((d, i) => {
          const val = values?.[d] || 0;
          const cx = xs[i];
          const cy = getY(val);
          const textY = val >= 0 ? cy - 7 : cy + 9;

          return (
            <G key={d}>
              <Circle cx={cx} cy={cy} r={4} fill={COLORS[d]} stroke="#ffffff" strokeWidth={1} />
              <Text
                x={cx}
                y={textY}
                style={{ fontSize: 7, fontWeight: 'bold', fill: COLORS[d], textAnchor: 'middle' }}
              >
                {val}
              </Text>
              <Text
                x={cx}
                y={H - 4}
                style={{ fontSize: 8, fontWeight: 'bold', fill: COLORS[d], textAnchor: 'middle' }}
              >
                {d}
              </Text>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

function renderSpecificTestReport(r: any, idx: number, participant: any) {
  const candidateName = participant?.full_name || 'Kandidat';
  const sc = r.scoring_data || {};
  const code = (r.test_code || '').toLowerCase();
  const testName = r.test_name || r.test_code?.toUpperCase();

  if (code === 'disc') {
    const dominantLabel = sc.dominantLabel || 'DI';
    const dominantType = sc.dominantType || 'Dominance-Influence';
    const g1 = sc.g1 || { D: 0, I: 0, S: 0, C: 0 };
    const g2 = sc.g2 || { D: 0, I: 0, S: 0, C: 0 };
    const g3 = sc.g3 || { D: 0, I: 0, S: 0, C: 0 };
    const most = sc.most || { D: 0, I: 0, S: 0, C: 0 };
    const least = sc.least || { D: 0, I: 0, S: 0, C: 0 };
    const change = sc.change || { D: 0, I: 0, S: 0, C: 0 };

    const typeInfo = findDiscTypeInfo(dominantLabel);
    const mainDim = dominantLabel ? dominantLabel[0] : 'D';
    const mainTrait = DISC_MAIN_TRAITS[mainDim] as DiscMainTrait | undefined;

    return (
      <View key={idx} style={styles.testCard}>
        {/* DISC Banner */}
        <View style={styles.discBanner}>
          <Text style={styles.discBannerTitle}>
            {idx + 1}. {testName} — TIPE: {dominantLabel} ({typeInfo?.name || dominantType})
          </Text>
          <Text style={styles.discBannerSub}>
            Sub-Trait Utama: {sc.subTraits?.g3 || 'Balance'} (Graph 3) | Stress Potential:{' '}
            {sc.hasStressPotential ? 'Ya (Terindikasi Penyesuaian Style)' : 'Normal'}
          </Text>
        </View>

        {/* 3 DISC SVG Charts */}
        <Text style={styles.subHeading}>Visualisasi Tiga Grafik DISC</Text>
        <View style={styles.chartsRow}>
          <PdfDiscSingleGraph title="Graph 1: MOST" subtitle="Diri Adaptif (Public Self)" values={g1} />
          <PdfDiscSingleGraph title="Graph 2: LEAST" subtitle="Diri Alami (Private Self)" values={g2} />
          <PdfDiscSingleGraph title="Graph 3: CHANGE" subtitle="Persepsi Diri (Perceived Self)" values={g3} />
        </View>

        {/* Breakdown Table */}
        <Text style={styles.subHeading}>Tabel Konversi Skor DISC</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCellHeader, { width: '32%' }]}>Kategori / Dimensi</Text>
            <Text style={[styles.tableCellHeader, { width: '17%', color: COLORS.D }]}>D (Dominance)</Text>
            <Text style={[styles.tableCellHeader, { width: '17%', color: COLORS.I }]}>I (Influence)</Text>
            <Text style={[styles.tableCellHeader, { width: '17%', color: COLORS.S }]}>S (Steadiness)</Text>
            <Text style={[styles.tableCellHeader, { width: '17%', color: COLORS.C }]}>C (Compliance)</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '32%', fontWeight: 'bold' }]}>Most (Jawaban Paling)</Text>
            <Text style={[styles.tableCell, { width: '17%' }]}>{most.D}</Text>
            <Text style={[styles.tableCell, { width: '17%' }]}>{most.I}</Text>
            <Text style={[styles.tableCell, { width: '17%' }]}>{most.S}</Text>
            <Text style={[styles.tableCell, { width: '17%' }]}>{most.C}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '32%', fontWeight: 'bold' }]}>Least (Jawaban Kurang)</Text>
            <Text style={[styles.tableCell, { width: '17%' }]}>{least.D}</Text>
            <Text style={[styles.tableCell, { width: '17%' }]}>{least.I}</Text>
            <Text style={[styles.tableCell, { width: '17%' }]}>{least.S}</Text>
            <Text style={[styles.tableCell, { width: '17%' }]}>{least.C}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '32%', fontWeight: 'bold' }]}>Change (Selisih M-L)</Text>
            <Text style={[styles.tableCell, { width: '17%' }]}>{change.D}</Text>
            <Text style={[styles.tableCell, { width: '17%' }]}>{change.I}</Text>
            <Text style={[styles.tableCell, { width: '17%' }]}>{change.S}</Text>
            <Text style={[styles.tableCell, { width: '17%' }]}>{change.C}</Text>
          </View>
          <View style={[styles.tableRow, { backgroundColor: '#f8fafc' }]}>
            <Text style={[styles.tableCell, { width: '32%', fontWeight: 'bold' }]}>Graph 1 (MOST Norm)</Text>
            <Text style={[styles.tableCell, { width: '17%', fontWeight: 'bold', color: COLORS.D }]}>{g1.D}</Text>
            <Text style={[styles.tableCell, { width: '17%', fontWeight: 'bold', color: COLORS.I }]}>{g1.I}</Text>
            <Text style={[styles.tableCell, { width: '17%', fontWeight: 'bold', color: COLORS.S }]}>{g1.S}</Text>
            <Text style={[styles.tableCell, { width: '17%', fontWeight: 'bold', color: COLORS.C }]}>{g1.C}</Text>
          </View>
          <View style={[styles.tableRow, { backgroundColor: '#f8fafc' }]}>
            <Text style={[styles.tableCell, { width: '32%', fontWeight: 'bold' }]}>Graph 2 (LEAST Norm)</Text>
            <Text style={[styles.tableCell, { width: '17%', fontWeight: 'bold', color: COLORS.D }]}>{g2.D}</Text>
            <Text style={[styles.tableCell, { width: '17%', fontWeight: 'bold', color: COLORS.I }]}>{g2.I}</Text>
            <Text style={[styles.tableCell, { width: '17%', fontWeight: 'bold', color: COLORS.S }]}>{g2.S}</Text>
            <Text style={[styles.tableCell, { width: '17%', fontWeight: 'bold', color: COLORS.C }]}>{g2.C}</Text>
          </View>
          <View style={[styles.tableRow, { backgroundColor: '#f8fafc' }]}>
            <Text style={[styles.tableCell, { width: '32%', fontWeight: 'bold' }]}>Graph 3 (CHANGE Norm)</Text>
            <Text style={[styles.tableCell, { width: '17%', fontWeight: 'bold', color: COLORS.D }]}>{g3.D}</Text>
            <Text style={[styles.tableCell, { width: '17%', fontWeight: 'bold', color: COLORS.I }]}>{g3.I}</Text>
            <Text style={[styles.tableCell, { width: '17%', fontWeight: 'bold', color: COLORS.S }]}>{g3.S}</Text>
            <Text style={[styles.tableCell, { width: '17%', fontWeight: 'bold', color: COLORS.C }]}>{g3.C}</Text>
          </View>
        </View>

        {/* Narrative Interpretation Section */}
        {typeInfo && (
          <>
            <Text style={styles.subHeading}>1. Deskripsi Profil Utama</Text>
            <Text style={styles.testCardDesc}>{typeInfo.description}</Text>

            <Text style={styles.subHeading}>2. Proyeksi Penempatan Posisi / Profesi / Bidang Ideal</Text>
            <Text style={styles.testCardDesc}>{typeInfo.jobs}</Text>
          </>
        )}

        {mainTrait && (
          <>
            <Text style={styles.subHeading}>3. Potret Diri & Lingkungan Ideal ({mainTrait.dimension})</Text>
            <Text style={styles.bulletItem}>• <Text style={{ fontWeight: 'bold' }}>Potret Diri:</Text> {mainTrait.potretDiri}</Text>
            <Text style={styles.bulletItem}>• <Text style={{ fontWeight: 'bold' }}>Lingkungan Cocok:</Text> {mainTrait.lingkunganCocok}</Text>

            <Text style={styles.subHeading}>4. Kelebihan & Kecenderungan</Text>
            <Text style={styles.bulletItem}>• <Text style={{ fontWeight: 'bold' }}>Kelebihan:</Text> {mainTrait.kelebihan}</Text>
            <Text style={styles.bulletItem}>• <Text style={{ fontWeight: 'bold' }}>Kecenderungan:</Text> {mainTrait.kecenderungan}</Text>

            <Text style={styles.subHeading}>5. Kekurangan & Saran Perbaikan</Text>
            <Text style={styles.bulletItem}>• <Text style={{ fontWeight: 'bold' }}>Kekurangan:</Text> {mainTrait.kekurangan}</Text>
            <Text style={styles.bulletItem}>• <Text style={{ fontWeight: 'bold' }}>Saran Perbaikan:</Text> {mainTrait.saranPerbaikan}</Text>
          </>
        )}


      </View>
    );
  }

  if (code === 'wpt') {
    const score = sc.score !== undefined ? sc.score : sc.wptScore !== undefined ? sc.wptScore : (sc.total_answers || 0);
    const label = sc.label || (score >= 30 ? 'Superior Intelektual' : score >= 20 ? 'Rata-rata Atas (Average)' : 'Cukup');

    return (
      <View key={idx} style={styles.testCard}>
        <Text style={styles.testCardTitle}>
          {idx + 1}. {testName} (WONDERLIC PERSONNEL TEST - COGNITIVE)
        </Text>
        <Text style={styles.testCardDesc}>
          • <Text style={{ fontWeight: 'bold' }}>Skor Mentah Kognitif:</Text> {score} / 50 Poin Pilihan Benar{"\n"}
          • <Text style={{ fontWeight: 'bold' }}>Kapasitas Intelektual:</Text> {label}{"\n\n"}
          
          <Text style={{ fontWeight: 'bold', fontSize: 10 }}>Analisis Mendalam Kapasitas Kognitif</Text>{"\n"}
          Wonderlic Personnel Test (WPT) adalah instrumen pengukuran kapasitas kognitif (general intelligence) yang sangat terpercaya untuk memprediksi kemampuan {candidateName} dalam memecahkan masalah (problem solving), menyerap informasi atau instruksi baru, dan membuat keputusan logis dalam batasan waktu yang sangat ketat.{"\n\n"}

          <Text style={{ fontWeight: 'bold' }}>1. Daya Tangkap & Kecepatan Berpikir (Mental Agility)</Text>{"\n"}
          Berdasarkan perolehan skor, {candidateName} menunjukkan tingkat kelincahan mental (mental agility) yang sesuai dengan kategorinya. {candidateName} mampu memahami instruksi teknis yang kompleks tanpa memerlukan pengulangan berlebih. Dalam situasi yang membutuhkan respon cepat (time-critical situations), {candidateName} dapat mengolah data spasial, numerik, dan verbal secara simultan dengan tingkat kesalahan yang minim.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>2. Kapasitas Penyelesaian Masalah Logika (Logical Problem Solving)</Text>{"\n"}
          Kandidat tidak hanya mengandalkan intuisi dalam bekerja, melainkan mengedepankan pendekatan deduktif rasional. Mereka mampu memetakan hubungan sebab-akibat dari sebuah anomali masalah, mengidentifikasi akar penyebab (root cause), dan menawarkan beberapa skenario solusi alternatif. Mereka sangat cakap menangani pekerjaan yang bersifat non-rutin dan menuntut daya analitis.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>3. Kemampuan Belajar Adaptif (Learning Capability)</Text>{"\n"}
          Bila ditempatkan di lingkungan industri yang sangat dinamis (seperti teknologi, keuangan, atau operasional strategis), {candidateName} tidak akan mengalami kesulitan berarti dalam menyerap kurikulum training yang padat. {candidateName} merupakan pembelajar mandiri (self-learner) yang proaktif mencari tahu detail sistem dan prosedur (SOP) perusahaan tanpa harus selalu "disuapi" oleh mentor atau atasan.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>4. Proyeksi Kecocokan (Bidang & Posisi)</Text>{"\n"}
          Kandidat sangat cocok ditempatkan pada posisi penyelia (supervisor), analis strategis, business intelligence, maupun posisi spesialis teknis (IT, engineering, finance) yang menuntut akurasi intelektual dan keputusan berisiko tinggi di bawah batasan waktu yang sempit. Sangat ideal untuk industri yang bergerak sangat cepat (fast-paced) seperti perbankan, teknologi (startup), dan manufaktur berskala besar.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>5. Proyeksi Ketidakcocokan (Area yang Dihindari)</Text>{"\n"}
          Kurang ideal jika ditempatkan pada pekerjaan klerikal yang sangat repetitif, entri data statis bertahun-tahun, atau pekerjaan pabrik perakitan dasar yang tidak memberikan tantangan intelektual apa pun. Jika dipaksa pada rutinitas tanpa variasi, {candidateName} dengan kognitif tinggi ini akan sangat cepat merasa bosan, *demotivasi*, dan akhirnya berisiko tinggi untuk mengajukan pengunduran diri (turnover).{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>6. Saran Treatment & Pembinaan</Text>{"\n"}
          Berikan mereka tantangan proyek baru (stretch assignments) secara berkala. Hindari pengawasan *micromanagement* yang mengekang; sebaliknya, berikan kebebasan intelektual untuk mengeksplorasi efisiensi cara kerja baru. Mereka merespons sangat baik terhadap *feedback* rasional yang berbasis logika dan data faktual, bukan sekadar opini emosional atasan.
        </Text>
      </View>
    );
  }

  if (code === 'papi') {
    const scores: Record<string, number> = sc.scores || {};
    const highAspects: string[] = sc.highAspects || [];
    const lowAspects: string[] = sc.lowAspects || [];
    const totalScore = sc.totalScore ?? 0;
    const aspectOrder = Object.keys(PAPI_ASPECT_DETAILS);

    return (
      <View key={idx} style={styles.testCard}>
        <Text style={styles.testCardTitle}>
          {idx + 1}. {testName} (PAPI KOSTICK 20 DIMENSI PERILAKU)
        </Text>
        <Text style={styles.testCardDesc}>
          <Text style={{ fontWeight: 'bold', fontSize: 10 }}>Ringkasan Eksekutif PAPI Kostick</Text>{"\n"}
          Asesmen PAPI Kostick (Personality and Preference Inventory) mengukur 20 dimensi kebutuhan (needs) dan peran (roles) yang secara spesifik berkaitan dengan lingkungan profesional dan gaya kerja {candidateName}. Total skor tervalidasi: {totalScore} / 90 {sc.isValid ? '(Lengkap)' : '(Data tidak lengkap)'}.
        </Text>

        <Text style={styles.subHeading}>Tabel Skor 20 Aspek (0-9)</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>Kode</Text>
            <Text style={[styles.tableCellHeader, { width: '50%' }]}>Aspek</Text>
            <Text style={[styles.tableCellHeader, { width: '15%' }]}>Skor</Text>
            <Text style={[styles.tableCellHeader, { width: '25%' }]}>Kategori</Text>
          </View>
          {aspectOrder.map((code2) => {
            const s = scores[code2] ?? 0;
            const cat = s >= 6 ? 'High' : s >= 4 ? 'Middle' : 'Low';
            return (
              <View key={code2} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '10%', fontWeight: 'bold' }]}>{code2}</Text>
                <Text style={[styles.tableCell, { width: '50%' }]}>{PAPI_ASPECT_DETAILS[code2 as keyof typeof PAPI_ASPECT_DETAILS]?.name}</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>{s}</Text>
                <Text style={[styles.tableCell, { width: '25%' }]}>{cat}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.subHeading}>Aspek Dominan (High, Skor ≥ 6)</Text>
        <Text style={styles.testCardDesc}>
          {highAspects.length === 0
            ? 'Tidak ada aspek berkategori High.'
            : highAspects
                .map((a) => `• ${a} – ${PAPI_ASPECT_DETAILS[a as keyof typeof PAPI_ASPECT_DETAILS]?.name} (Skor ${scores[a]}): ${candidateName} ${PAPI_ASPECT_DETAILS[a as keyof typeof PAPI_ASPECT_DETAILS]?.high}`)
                .join('\n')}
        </Text>

        <Text style={styles.subHeading}>Aspek Rendah (Low, Skor ≤ 3)</Text>
        <Text style={styles.testCardDesc}>
          {lowAspects.length === 0
            ? 'Tidak ada aspek berkategori Low.'
            : lowAspects
                .map((a) => `• ${a} – ${PAPI_ASPECT_DETAILS[a as keyof typeof PAPI_ASPECT_DETAILS]?.name} (Skor ${scores[a]}): ${candidateName} ${PAPI_ASPECT_DETAILS[a as keyof typeof PAPI_ASPECT_DETAILS]?.low}`)
                .join('\n')}
        </Text>
      </View>
    );
  }

  if (code === 'msdt') {
    const dominantType = sc.dominantType || 'Ds';
    const typeInfo = MSDT_TYPE_DETAILS[dominantType as keyof typeof MSDT_TYPE_DETAILS];
    const scores: Record<string, number> = sc.scores || {};
    const orientation = sc.orientation || { TO: 0, RO: 0, E: 0, O: 0 };
    const dimOrder = Object.keys(MSDT_TYPE_DETAILS);

    return (
      <View key={idx} style={styles.testCard}>
        <View style={styles.discBanner}>
          <Text style={styles.discBannerTitle}>
            {idx + 1}. {testName} — GAYA DOMINAN: {dominantType} ({typeInfo?.name})
          </Text>
          <Text style={styles.discBannerSub}>
            TO: {orientation.TO} | RO: {orientation.RO} | E: {orientation.E} | O (Deserter check): {orientation.O}
          </Text>
        </View>

        <Text style={styles.subHeading}>Tabel Skor 8 Dimensi Gaya Manajemen</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>Kode</Text>
            <Text style={[styles.tableCellHeader, { width: '50%' }]}>Gaya</Text>
            <Text style={[styles.tableCellHeader, { width: '20%' }]}>Skor Akhir</Text>
            <Text style={[styles.tableCellHeader, { width: '20%' }]}>Dominan</Text>
          </View>
          {dimOrder.map((d) => (
            <View key={d} style={[styles.tableRow, d === dominantType ? { backgroundColor: '#f8fafc' } : {}]}>
              <Text style={[styles.tableCell, { width: '10%', fontWeight: 'bold' }]}>{d}</Text>
              <Text style={[styles.tableCell, { width: '50%' }]}>{MSDT_TYPE_DETAILS[d as keyof typeof MSDT_TYPE_DETAILS].name}</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>{scores[d] ?? 0}</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>{d === dominantType ? '🏆 Ya' : ''}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.subHeading}>Interpretasi Gaya Manajemen Dominan</Text>
        <Text style={styles.testCardDesc}>
          {candidateName} menunjukkan kecenderungan gaya manajerial dominan "{typeInfo?.name}" ({dominantType}), ditentukan dari kombinasi kategori Task Orientation, Relationship Orientation, dan Effectiveness (bukan semata skor dimensi tertinggi).{"\n\n"}
          {typeInfo?.narrative}
        </Text>
      </View>
    );
  }

  if (code === 'mbti') {
    const type: string = sc.type || '----';
    const percent: Record<string, number> = sc.percent || {};
    const unanswered: number = sc.unanswered ?? 0;
    const validityStatus: string = sc.validityStatus || 'Valid';
    const pairs: [string, string, string][] = [
      ['E', 'I', 'Extraversion — Introversion'],
      ['S', 'N', 'Sensing — Intuition'],
      ['T', 'F', 'Thinking — Feeling'],
      ['J', 'P', 'Judging — Perceiving'],
    ];

    return (
      <View key={idx} style={styles.testCard}>
        <View style={styles.discBanner}>
          <Text style={styles.discBannerTitle}>
            {idx + 1}. {testName} — TIPE: {type}
          </Text>
          <Text style={styles.discBannerSub}>
            Status Validitas: {validityStatus}{unanswered > 0 ? ` (${unanswered} soal tidak dijawab)` : ''}
          </Text>
        </View>

        <Text style={styles.subHeading}>Profil 4 Dimensi Preferensi</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCellHeader, { width: '40%' }]}>Dimensi</Text>
            <Text style={[styles.tableCellHeader, { width: '20%' }]}>Kutub 1</Text>
            <Text style={[styles.tableCellHeader, { width: '20%' }]}>Kutub 2</Text>
            <Text style={[styles.tableCellHeader, { width: '20%' }]}>Dominan</Text>
          </View>
          {pairs.map(([a, b, label]) => (
            <View key={label} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '40%' }]}>{label}</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>{a}: {percent[a] ?? 0}%</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>{b}: {percent[b] ?? 0}%</Text>
              <Text style={[styles.tableCell, { width: '20%', fontWeight: 'bold' }]}>{(percent[a] ?? 0) >= (percent[b] ?? 0) ? a : b}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.subHeading}>Interpretasi Umum</Text>
        <Text style={styles.testCardDesc}>
          {candidateName} menunjukkan tipe kepribadian {type} berdasarkan 4 dikotomi psikologis Myers-Briggs (Extraversion/Introversion, Sensing/Intuition, Thinking/Feeling, Judging/Perceiving), dihitung dari 70 soal forced-choice.
        </Text>
      </View>
    );
  }

  if (code === 'riasec') {
    const ranking: string[] = sc.ranking || ['R', 'I', 'A', 'S', 'E', 'C'];
    const scores: Record<string, number> = sc.scores || {};
    const interestCode = sc.interestCode || ranking.slice(0, 3).join('');
    const consistency = sc.consistency || 'Tidak Diketahui';
    const top3 = ranking.slice(0, 3);
    const comboProfessions: string[] = sc.comboProfessions || [];

    return (
      <View key={idx} style={styles.testCard}>
        <View style={styles.discBanner}>
          <Text style={styles.discBannerTitle}>
            {idx + 1}. {testName} — KODE MINAT: {interestCode}
          </Text>
          <Text style={styles.discBannerSub}>Tingkat Konsistensi: {consistency}</Text>
        </View>

        <Text style={styles.subHeading}>Tabel Skor 6 Tipe RIASEC (0-18)</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>Kode</Text>
            <Text style={[styles.tableCellHeader, { width: '50%' }]}>Tipe</Text>
            <Text style={[styles.tableCellHeader, { width: '20%' }]}>Skor</Text>
            <Text style={[styles.tableCellHeader, { width: '20%' }]}>Peringkat</Text>
          </View>
          {(['R', 'I', 'A', 'S', 'E', 'C'] as const).map((t) => (
            <View key={t} style={[styles.tableRow, top3.includes(t) ? { backgroundColor: '#f8fafc' } : {}]}>
              <Text style={[styles.tableCell, { width: '10%', fontWeight: 'bold', color: RIASEC_TYPE_DETAILS[t].color }]}>{t}</Text>
              <Text style={[styles.tableCell, { width: '50%' }]}>{RIASEC_TYPE_DETAILS[t].name}</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>{scores[t] ?? 0} / 18</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>Top {ranking.indexOf(t) + 1}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.subHeading}>Interpretasi 3 Tipe Dominan</Text>
        <Text style={styles.testCardDesc}>
          {top3
            .map(
              (t, i) =>
                `${i + 1}. ${RIASEC_TYPE_DETAILS[t as keyof typeof RIASEC_TYPE_DETAILS].name} (${t}): ${RIASEC_TYPE_DETAILS[t as keyof typeof RIASEC_TYPE_DETAILS].desc} Contoh profesi: ${RIASEC_TYPE_DETAILS[t as keyof typeof RIASEC_TYPE_DETAILS].professions.join(', ')}.`
            )
            .join('\n\n')}
        </Text>

        <Text style={styles.subHeading}>Contoh Profesi Kombinasi ({top3[0]}{top3[1]})</Text>
        <Text style={styles.testCardDesc}>
          Berdasarkan kombinasi 2 tipe teratas {candidateName}, contoh profesi yang relevan: {comboProfessions.length > 0 ? comboProfessions.join(', ') : 'tidak tersedia untuk kombinasi ini'}.
        </Text>
      </View>
    );
  }

  if (code === 'enneagram') {
    const dominantLabel = sc.dominantLabel || 'Unknown';
    const dominantInfo = sc.dominantInfo;
    const wingInfo = sc.wingInfo;
    const scores = sc.scores || {};

    return (
      <View key={idx} style={styles.testCard}>
        {/* Banner */}
        <View style={styles.discBanner}>
          <Text style={styles.discBannerTitle}>
            {idx + 1}. {testName} — TIPE DOMINAN: {dominantLabel}
          </Text>
          <Text style={styles.discBannerSub}>
            {sc.wingCode ? `Wing: ${sc.wingCode} — ${wingInfo?.label}` : 'Tidak ada wing (Hasil Seri)'}
          </Text>
        </View>

        {/* Breakdown Table */}
        <Text style={styles.subHeading}>Skor Berdasarkan 9 Tipe (Maksimal 60)</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>T1</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>T2</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>T3</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>T4</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>T5</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>T6</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>T7</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>T8</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>T9</Text>
          </View>
          <View style={styles.tableRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <Text key={n} style={[styles.tableCell, { width: '10%', fontWeight: scores[n] === sc.maxScore ? 'bold' : 'normal', color: scores[n] === sc.maxScore ? '#1d4ed8' : '#334155' }]}>
                {scores[n] ?? 0}
              </Text>
            ))}
          </View>
        </View>

        {/* Narrative Interpretation Section */}
        {dominantInfo && (
          <>
            <Text style={styles.subHeading}>1. Deskripsi Profil Tipe Utama ({dominantInfo.name})</Text>
            <Text style={styles.testCardDesc}>{dominantInfo.description}</Text>

            <Text style={styles.subHeading}>2. Ciri-ciri Tipe Utama</Text>
            <Text style={styles.testCardDesc}>
              {dominantInfo.traits.map((t: string) => `• ${t}`).join('\n')}
            </Text>
          </>
        )}

        {wingInfo && (
          <>
            <Text style={styles.subHeading}>3. Pengaruh Sayap (Wing: {sc.wingCode}) — {wingInfo.label}</Text>
            <Text style={styles.testCardDesc}>{wingInfo.description}</Text>

            <Text style={styles.subHeading}>4. Ciri-ciri Sayap (Wing)</Text>
            <Text style={styles.testCardDesc}>
              {wingInfo.traits.map((t: string) => `• ${t}`).join('\n')}
            </Text>
          </>
        )}
      </View>
    );
  }

  if (code === 'msai') {
    const skills: { name: string; quadrant: string; actual: number | null; effectiveness: number | null; importance: number | null; gap: number | null }[] = sc.skills || [];
    const quadrantScores: Record<string, number | null> = sc.quadrantScores || {};
    const missingCount: number = sc.missingCount ?? 0;

    return (
      <View key={idx} style={styles.testCard}>
        <View style={styles.discBanner}>
          <Text style={styles.discBannerTitle}>
            {idx + 1}. {testName} (MANAGEMENT SKILLS ASSESSMENT INSTRUMENT)
          </Text>
          <Text style={styles.discBannerSub}>
            Adhocracy: {quadrantScores.Adhocracy ?? '-'} | Market: {quadrantScores.Market ?? '-'} | Hierarchy: {quadrantScores.Hierarchy ?? '-'} | Clan: {quadrantScores.Clan ?? '-'}
            {missingCount > 0 ? ` — ⚠️ ${missingCount} item perilaku tidak terjawab` : ''}
          </Text>
        </View>

        <Text style={styles.subHeading}>Tabel 12 Skill Manajerial (Skala 1-5)</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCellHeader, { width: '34%' }]}>Skill</Text>
            <Text style={[styles.tableCellHeader, { width: '18%' }]}>Actual</Text>
            <Text style={[styles.tableCellHeader, { width: '18%' }]}>Effectiveness</Text>
            <Text style={[styles.tableCellHeader, { width: '15%' }]}>Importance</Text>
            <Text style={[styles.tableCellHeader, { width: '15%' }]}>Gap</Text>
          </View>
          {skills.map((s) => (
            <View key={s.name} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '34%' }]}>{s.name}</Text>
              <Text style={[styles.tableCell, { width: '18%' }]}>{s.actual ?? '-'}</Text>
              <Text style={[styles.tableCell, { width: '18%' }]}>{s.effectiveness ?? '-'}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>{s.importance ?? '-'}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>{s.gap ?? '-'}</Text>
            </View>
          ))}
        </View>

        {sc.dataGapNote ? (
          <>
            <Text style={styles.subHeading}>Catatan Kelengkapan Data</Text>
            <Text style={styles.testCardDesc}>{sc.dataGapNote}</Text>
          </>
        ) : null}
      </View>
    );
  }

  if (code === 'ist') {
    const raScore = sc.raScore ?? 0;
    const raTotal = sc.raTotal ?? 20;
    const zrScore = sc.zrScore ?? 0;
    const zrTotal = sc.zrTotal ?? 20;
    const percent = sc.numericLogicPercent ?? 0;

    return (
      <View key={idx} style={styles.testCard}>
        <View style={styles.discBanner}>
          <Text style={styles.discBannerTitle}>
            {idx + 1}. {testName} — KEMAMPUAN NUMERIK & LOGIKA (Subtes RA & ZR)
          </Text>
          <Text style={styles.discBannerSub}>
            Skor: {raScore + zrScore}/{raTotal + zrTotal} ({percent}%)
          </Text>
        </View>

        <Text style={styles.subHeading}>Rincian Subtes</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCellHeader, { width: '60%' }]}>Subtes</Text>
            <Text style={[styles.tableCellHeader, { width: '40%' }]}>Skor</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '60%' }]}>RA — Rechenaufgaben (Aritmatika)</Text>
            <Text style={[styles.tableCell, { width: '40%' }]}>{raScore}/{raTotal}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '60%' }]}>ZR — Zahlenreihen (Deret Angka)</Text>
            <Text style={[styles.tableCell, { width: '40%' }]}>{zrScore}/{zrTotal}</Text>
          </View>
        </View>

        <Text style={styles.subHeading}>Catatan Cakupan Skor</Text>
        <Text style={styles.testCardDesc}>
          {sc.unscoredNote ||
            'Laporan ini hanya mencakup subtes Aritmatika (RA) dan Deret Angka (ZR). Subtes verbal (SE, WA, AN, GE) tidak diskor karena instrumen berlisensi komersial tanpa kunci jawaban publik yang sah.'}
        </Text>
      </View>
    );
  }

  // Fallback for technical or custom tests
  return (
    <View key={idx} style={styles.testCard}>
      <Text style={styles.testCardTitle}>
        {idx + 1}. {testName} ({r.test_code?.toUpperCase()})
      </Text>
      <Text style={styles.testCardDesc}>
        • <Text style={{ fontWeight: 'bold' }}>Status Pengerjaan:</Text> Selesai ({r.scoring_data?.total_answers || 'Semua'} Jawaban Terrekam){"\n"}
        • <Text style={{ fontWeight: 'bold' }}>Waktu Selesai:</Text> {new Date(r.created_at || Date.now()).toLocaleString('id-ID')}{"\n"}
        • <Text style={{ fontWeight: 'bold' }}>Catatan Analisis:</Text> Berkas jawaban {candidateName} telah tersimpan dengan aman dan memenuhi norma kriteria kualifikasi asesmen HR.
      </Text>
    </View>
  );
}

export function UniversalPdfDocument({
  participant,
  results,
}: {
  participant: any;
  results: any[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>LAPORAN HASIL ASESMEN PSIKOTES</Text>
            <Text style={styles.subtitle}>RuangTes Enterprise · Laporan Lengkap Evaluasi Talenta</Text>
          </View>
          <Text style={styles.companyBadge}>{participant.company_name || 'Corporate'}</Text>
        </View>

        {/* Participant Info */}
        <View style={styles.metaContainer}>
          <View style={styles.metaCol}>
            <Text style={styles.label}>Nama Kandidat</Text>
            <Text style={styles.value}>{participant.full_name}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{participant.email}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.label}>Sesi Ujian (Campaign)</Text>
            <Text style={styles.value}>{participant.campaign_title || '-'}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.label}>Status & Waktu</Text>
            <Text style={styles.value}>
              {participant.status === 'COMPLETED' ? 'SELESAI' : 'BERJALAN'} ({new Date(participant.created_at || Date.now()).toLocaleDateString('id-ID')})
            </Text>
          </View>
        </View>

        {/* Summary Table of All Assigned Tests */}
        <Text style={styles.sectionTitle}>Ringkasan Hasil Evaluasi Instrumen Tes</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCellHeader, { width: '30%' }]}>Kode & Nama Tes</Text>
            <Text style={[styles.tableCellHeader, { width: '25%' }]}>Kategori</Text>
            <Text style={[styles.tableCellHeader, { width: '25%' }]}>Status Jawaban</Text>
            <Text style={[styles.tableCellHeader, { width: '20%' }]}>Skor / Ringkasan</Text>
          </View>

          {results.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '100%', textAlign: 'center' }]}>Belum ada instrumen tes dikerjakan.</Text>
            </View>
          ) : (
            results.map((r, idx) => {
              const sc = r.scoring_data;
              let scoreSummary = 'Selesai';
              if (sc?.dominantLabel) {
                scoreSummary = `${sc.dominantLabel} (${sc.dominantType})`;
              } else if (sc?.score !== undefined || sc?.wptScore !== undefined) {
                scoreSummary = `Skor Kognitif: ${sc.score || sc.wptScore}`;
              } else if (sc?.total_answers) {
                scoreSummary = `${sc.total_answers} Terjawab`;
              }

              return (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: '30%', fontWeight: 'bold' }]}>
                    {r.test_code?.toUpperCase()} - {r.test_name}
                  </Text>
                  <Text style={[styles.tableCell, { width: '25%' }]}>{r.category || 'PERSONALITY'}</Text>
                  <Text style={[styles.tableCell, { width: '25%' }]}>SELESAI & TERSIMPAN</Text>
                  <Text style={[styles.tableCell, { width: '20%', fontWeight: 'bold' }]}>{scoreSummary}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* Detailed Breakdown for each test */}
        <Text style={styles.sectionTitle}>Detail Analisis & Interpretasi Per Alat Tes</Text>
        {results.map((r, idx) => renderSpecificTestReport(r, idx, participant))}

        {/* Footer */}
        <Text style={styles.footer}>
          Laporan ini diterbitkan secara resmi & terverifikasi oleh RuangTes Enterprise Platform.
        </Text>
      </Page>
    </Document>
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ participantId: string }> | { participantId: string } }
) {
  try {
    const resolvedParams = await params;
    const participantId = Number(resolvedParams.participantId);

    const participantRows = await sql`
      SELECT p.*, c.title as campaign_title, cust.company_name, cust.logo_url
      FROM participants p
      JOIN campaigns c ON p.campaign_id = c.id
      JOIN customers cust ON c.customer_id = cust.id
      WHERE p.id = ${participantId}
      LIMIT 1
    `;

    if (!participantRows.length) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    const participant = participantRows[0];

    const results = await sql`
      SELECT tr.*, mt.code as test_code, mt.name as test_name, mt.category
      FROM test_results tr
      JOIN master_tests mt ON tr.test_id = mt.id
      WHERE tr.participant_id = ${participantId}
      ORDER BY tr.id ASC
    `;

    const pdfStream = await renderToStream(
      <UniversalPdfDocument participant={participant} results={results} />
    );

    const safeName = (participant.full_name || 'Kandidat').replace(/\s+/g, '_');
    return new Response(pdfStream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Laporan-Psikotes-${safeName}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF report error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

