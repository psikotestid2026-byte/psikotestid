import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Line, Polyline, Circle, G } from '@react-pdf/renderer';
import { sql } from '@/lib/neon';
import { getDiscProfileInterpretation } from '@/lib/scoring/interpretations';

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

function renderSpecificTestReport(r: any, idx: number) {
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

    const interp = getDiscProfileInterpretation(dominantLabel);

    return (
      <View key={idx} style={styles.testCard}>
        {/* DISC Banner */}
        <View style={styles.discBanner}>
          <Text style={styles.discBannerTitle}>
            {idx + 1}. {testName} — TIPE: {dominantLabel} ({interp.typeName})
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
        <Text style={styles.subHeading}>1. Gambaran Umum & Karakteristik Perilaku Utama</Text>
        <Text style={styles.testCardDesc}>{interp.generalDescription}</Text>

        <Text style={styles.subHeading}>2. Proyeksi Penempatan Posisi / Profesi / Bidang Ideal</Text>
        <Text style={styles.testCardDesc}>{interp.rolesNarrative}</Text>
        {interp.recommendedRoles.map((role, i) => (
          <Text key={i} style={styles.bulletItem}>
            • <Text style={{ fontWeight: 'bold' }}>{role}</Text>
          </Text>
        ))}

        <Text style={styles.subHeading}>3. Uraian Kekuatan Utama dalam Pekerjaan</Text>
        <Text style={styles.testCardDesc}>{interp.strengthsNarrative}</Text>
        {interp.strengths.map((str, i) => (
          <Text key={i} style={styles.bulletItem}>
            • {str}
          </Text>
        ))}

        <Text style={styles.subHeading}>4. Uraian Area Pengembangan & Potensi Risiko</Text>
        <Text style={styles.testCardDesc}>{interp.weaknessesNarrative}</Text>
        {interp.weaknesses.map((wk, i) => (
          <Text key={i} style={styles.bulletItem}>
            • {wk}
          </Text>
        ))}

        <Text style={styles.subHeading}>5. Potensi Konflik Kerja & Solusi Penanganan</Text>
        <Text style={styles.testCardDesc}>{interp.conflictsNarrative}</Text>
        {interp.potentialConflicts.map((cnf, i) => (
          <Text key={i} style={styles.bulletItem}>
            • <Text style={{ fontWeight: 'bold' }}>Pemicu Konflik:</Text> {cnf.trigger}{"\n"}
            {'  '}<Text style={{ fontWeight: 'bold' }}>Dampak Perilaku:</Text> {cnf.impact}{"\n"}
            {'  '}<Text style={{ fontWeight: 'bold' }}>Solusi Taktis:</Text> {cnf.solution}
          </Text>
        ))}

        <Text style={styles.subHeading}>6. Treatment Terbaik (Pendekatan Efektif Atasan & HR)</Text>
        <Text style={styles.testCardDesc}>{interp.treatmentsNarrative}</Text>
        {interp.bestTreatments.map((trm, i) => (
          <Text key={i} style={styles.bulletItem}>
            • {trm}
          </Text>
        ))}

        <Text style={styles.subHeading}>7. Gaya Komunikasi & Lingkungan Kerja Ideal</Text>
        <Text style={styles.bulletItem}>
          • <Text style={{ fontWeight: 'bold' }}>Gaya Komunikasi:</Text> {interp.communicationStyle}
        </Text>
        <Text style={styles.bulletItem}>
          • <Text style={{ fontWeight: 'bold' }}>Lingkungan Ideal:</Text> {interp.idealEnvironment}
        </Text>

        <Text style={styles.subHeading}>8. Rekomendasi Pengelolaan & Pembinaan HR</Text>
        {interp.hrManagementGuide.map((hr, i) => (
          <Text key={i} style={styles.bulletItem}>
            • {hr}
          </Text>
        ))}

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
          Wonderlic Personnel Test (WPT) adalah instrumen pengukuran kapasitas kognitif (general intelligence) yang sangat terpercaya untuk memprediksi kemampuan kandidat dalam memecahkan masalah (problem solving), menyerap informasi atau instruksi baru, dan membuat keputusan logis dalam batasan waktu yang sangat ketat.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>1. Daya Tangkap & Kecepatan Berpikir (Mental Agility)</Text>{"\n"}
          Berdasarkan perolehan skor, kandidat menunjukkan tingkat kelincahan mental (mental agility) yang sesuai dengan kategorinya. Mereka mampu memahami instruksi teknis yang kompleks tanpa memerlukan pengulangan berlebih. Dalam situasi yang membutuhkan respon cepat (time-critical situations), kandidat dapat mengolah data spasial, numerik, dan verbal secara simultan dengan tingkat kesalahan yang minim.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>2. Kapasitas Penyelesaian Masalah Logika (Logical Problem Solving)</Text>{"\n"}
          Kandidat tidak hanya mengandalkan intuisi dalam bekerja, melainkan mengedepankan pendekatan deduktif rasional. Mereka mampu memetakan hubungan sebab-akibat dari sebuah anomali masalah, mengidentifikasi akar penyebab (root cause), dan menawarkan beberapa skenario solusi alternatif. Mereka sangat cakap menangani pekerjaan yang bersifat non-rutin dan menuntut daya analitis.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>3. Kemampuan Belajar Adaptif (Learning Capability)</Text>{"\n"}
          Bila ditempatkan di lingkungan industri yang sangat dinamis (seperti teknologi, keuangan, atau operasional strategis), kandidat tidak akan mengalami kesulitan berarti dalam menyerap kurikulum training yang padat. Mereka merupakan pembelajar mandiri (self-learner) yang proaktif mencari tahu detail sistem dan prosedur (SOP) perusahaan tanpa harus selalu "disuapi" oleh mentor atau atasan.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>4. Proyeksi Kecocokan (Bidang & Posisi)</Text>{"\n"}
          Kandidat sangat cocok ditempatkan pada posisi penyelia (supervisor), analis strategis, business intelligence, maupun posisi spesialis teknis (IT, engineering, finance) yang menuntut akurasi intelektual dan keputusan berisiko tinggi di bawah batasan waktu yang sempit. Sangat ideal untuk industri yang bergerak sangat cepat (fast-paced) seperti perbankan, teknologi (startup), dan manufaktur berskala besar.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>5. Proyeksi Ketidakcocokan (Area yang Dihindari)</Text>{"\n"}
          Kurang ideal jika ditempatkan pada pekerjaan klerikal yang sangat repetitif, entri data statis bertahun-tahun, atau pekerjaan pabrik perakitan dasar yang tidak memberikan tantangan intelektual apa pun. Jika dipaksa pada rutinitas tanpa variasi, kandidat dengan kognitif tinggi ini akan sangat cepat merasa bosan, *demotivasi*, dan akhirnya berisiko tinggi untuk mengajukan pengunduran diri (turnover).{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>6. Saran Treatment & Pembinaan</Text>{"\n"}
          Berikan mereka tantangan proyek baru (stretch assignments) secara berkala. Hindari pengawasan *micromanagement* yang mengekang; sebaliknya, berikan kebebasan intelektual untuk mengeksplorasi efisiensi cara kerja baru. Mereka merespons sangat baik terhadap *feedback* rasional yang berbasis logika dan data faktual, bukan sekadar opini emosional atasan.
        </Text>
      </View>
    );
  }

  if (code === 'papi') {
    return (
      <View key={idx} style={styles.testCard}>
        <Text style={styles.testCardTitle}>
          {idx + 1}. {testName} (PAPI KOSTICK 20 DIMENSI PERILAKU)
        </Text>
        <Text style={styles.testCardDesc}>
          <Text style={{ fontWeight: 'bold', fontSize: 10 }}>Ringkasan Eksekutif PAPI Kostick</Text>{"\n"}
          Asesmen PAPI Kostick (Personality and Preference Inventory) mengukur 20 dimensi kebutuhan (needs) dan peran (roles) yang secara spesifik berkaitan dengan lingkungan profesional dan gaya kerja kandidat. Berdasarkan pemetaan skor yang dihasilkan, kandidat menunjukkan profil kinerja yang sangat solid dengan dominasi pada area penyelesaian tugas (task-oriented) dan kepatuhan pada hierarki organisasi (followership).{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>1. Dimensi Arah Kerja (Work Direction) & Dorongan Berprestasi</Text>{"\n"}
          Kandidat memiliki dorongan internal (need to achieve) yang kuat untuk menyelesaikan tugas dengan standar yang tinggi. Mereka menetapkan target pribadi yang lebih tinggi daripada yang diwajibkan oleh perusahaan. Dalam menghadapi beban kerja yang masif (hard intense worker), kandidat mampu menjaga fokus dan tidak mudah terdistraksi. Hal ini menjadikan mereka aset yang sangat berharga untuk posisi yang menuntut ketahanan mental dan penyelesaian tenggat waktu yang ketat.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>2. Dimensi Gaya Kepemimpinan (Leadership & Followership)</Text>{"\n"}
          Dalam konteks kepemimpinan, kandidat menunjukkan keseimbangan antara kemampuan mengarahkan orang lain (leadership role) dan kemampuan untuk dibimbing (need for rules and supervision). Mereka sangat menghormati otoritas dan tidak memiliki masalah dalam mengikuti instruksi dari atasan (need to support peers). Bila ditempatkan pada posisi manajerial, mereka akan memimpin dengan gaya demokratis yang menekankan pada panduan prosedur kerja (SOP) daripada gaya kepemimpinan otokratis murni.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>3. Dimensi Aktivitas Sosial (Social Activity) & Relasi Antar Pribadi</Text>{"\n"}
          Kandidat memiliki kebutuhan yang wajar untuk berafiliasi dengan rekan kerja (need to belong to groups). Mereka bukan tipe penyendiri ekstrem, namun juga tidak terlalu bergantung pada interaksi sosial untuk bisa produktif. Kestabilan emosional mereka sangat baik; mereka mampu menahan amarah dan tidak impulsif dalam merespons tekanan dari klien atau rekan kerja. Mereka cenderung menghindari konflik terbuka (need for harmonous relations) dan bertindak sebagai mediator yang tenang.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>4. Dimensi Analitik & Keteraturan (Detail & Organization)</Text>{"\n"}
          Kandidat menunjukkan preferensi yang kuat terhadap lingkungan kerja yang terstruktur (need for order). Mereka akan sangat cermat dalam menyusun dokumen, memverifikasi data, dan memastikan seluruh alur kerja berjalan sesuai dengan rencana. Ketelitian ini meminimalisir risiko kesalahan operasional, namun di sisi lain, kandidat mungkin membutuhkan waktu sedikit lebih lama untuk beradaptasi jika ada perubahan mendadak tanpa panduan sistematis.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>5. Proyeksi Kecocokan (Bidang & Posisi)</Text>{"\n"}
          Kandidat sangat direkomendasikan untuk posisi yang membutuhkan keseimbangan antara akurasi operasional dan keandalan mengeksekusi instruksi. Profesi di bidang manajerial menengah (Middle Manager), Administrasi Strategis, Operasional Teknis, Audit Kepatuhan, dan pengelolaan tim klerikal akan sangat memaksimalkan potensi mereka. Sangat cocok di industri perbankan, manufaktur, dan institusi birokrasi/pemerintahan.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>6. Proyeksi Ketidakcocokan (Area yang Dihindari)</Text>{"\n"}
          Kandidat ini akan mengalami stres luar biasa jika ditempatkan pada divisi perintis (pioneering) startup yang belum memiliki struktur kejelasan aturan kerja (zero SOP environment). Pekerjaan berisiko tinggi yang murni mengandalkan improvisasi tanpa jaring pengaman regulasi, atau peran *sales canvassing* ekstrem yang sangat kompetitif akan membuat mereka merasa kehilangan pijakan (disoriented) dan tidak aman secara emosional.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>7. Saran Treatment & Pembinaan HR</Text>{"\n"}
          Untuk memotivasi mereka, berikan kepastian arah karier yang jelas (clear career path). Apabila ada perubahan besar di perusahaan, sediakan waktu sosialisasi (transition period) yang memadai; jangan mendadak. Atasan disarankan untuk selalu memberikan instruksi yang tertulis (SOP/Email) untuk mengurangi kecemasan mereka terhadap ambiguitas operasional.
        </Text>
      </View>
    );
  }

  if (code === 'msdt') {
    return (
      <View key={idx} style={styles.testCard}>
        <Text style={styles.testCardTitle}>
          {idx + 1}. {testName} (MANAGEMENT STYLE DIAGNOSTIC TEST)
        </Text>
        <Text style={styles.testCardDesc}>
          <Text style={{ fontWeight: 'bold', fontSize: 10 }}>Laporan Eksekutif Gaya Kepemimpinan MSDT</Text>{"\n"}
          Management Style Diagnostic Test (MSDT) mengevaluasi efektivitas kepemimpinan kandidat berdasarkan tiga dimensi utama: Orientasi pada Tugas (Task Orientation), Orientasi pada Hubungan (Relationship Orientation), dan Efektivitas Situasional (Effectiveness).{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>1. Profil Gaya Manajerial Dominan</Text>{"\n"}
          Kandidat memiliki kecenderungan gaya manajerial "Executive" yang merupakan profil paling efektif dalam MSDT. Mereka mampu memberikan bobot perhatian yang seimbang antara penyelesaian tugas (task) dan kesejahteraan moral tim (relationship). Kandidat tidak menggunakan pendekatan otokratis secara membabi buta, melainkan menyesuaikan gaya instruksinya berdasarkan tingkat kematangan dan kompetensi bawahan.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>2. Orientasi Pada Tugas (Task-Oriented)</Text>{"\n"}
          Kandidat sangat proaktif dalam menetapkan target, mendistribusikan beban kerja, dan mengukur pencapaian KPI. Mereka memastikan setiap anggota tim memahami deskripsi pekerjaannya dengan jelas. Jika terjadi deviasi dari standar, kandidat tidak segan memberikan umpan balik (feedback) yang konstruktif dan tegas demi menjaga kualitas operasional.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>3. Orientasi Pada Hubungan (Relationship-Oriented)</Text>{"\n"}
          Di samping tuntutan kerja yang tinggi, kandidat juga memiliki kapasitas empati yang baik. Mereka memandang bawahan sebagai mitra kerja, bersedia meluangkan waktu untuk mendengarkan aspirasi tim, dan memberikan dukungan moral (coaching) saat tim mengalami krisis motivasi. Hal ini membangun budaya kerja yang aman (psychologically safe) namun tetap produktif.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>4. Efektivitas Situasional & Solusi Konflik</Text>{"\n"}
          Tingkat efektivitas kandidat dalam beradaptasi dengan perubahan krisis sangat tinggi. Mereka tidak kaku pada satu pendekatan. Saat menghadapi situasi darurat (krisis), mereka bisa mengambil alih kendali secara cepat. Sebaliknya, saat tim sudah mapan, mereka mempraktikkan pendelegasian wewenang yang luas. Konflik dikelola secara terbuka dan kolaboratif, bukan dihindari atau ditekan.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>5. Proyeksi Kecocokan (Bidang & Posisi)</Text>{"\n"}
          Profil MSDT "Executive" ini sangat layak ditempatkan pada jajaran eksekutif senior (C-Level), Pimpinan Departemen (Head of Division), atau Project Manager skala besar. Mereka adalah agen transformasi yang mampu meningkatkan produktivitas perusahaan berskala korporat tanpa merusak moral karyawan. Sangat diandalkan untuk memimpin tim lintas generasi, lintas divisi (cross-functional), dan mengelola manajemen perubahan (Change Management).{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>6. Proyeksi Ketidakcocokan (Area yang Dihindari)</Text>{"\n"}
          Gaya eksekutif ini tidak akan efektif (overqualified & restricted) bila diletakkan pada posisi manajerial tingkat terendah yang tidak memberikannya keleluasaan otoritas sama sekali (micro-managed by top level). Mereka juga tidak cocok berada di lingkungan perusahaan keluarga (family business) yang amat tradisional, di mana pengambilan keputusan hanya berpusat pada satu figur absolut tanpa ruang diskusi manajerial modern.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>7. Saran Treatment & Pembinaan Kepemimpinan</Text>{"\n"}
          Berikan kandidat tanggung jawab otonom pada *profit and loss* (P&L) atau proyek percontohan strategis. Mereka perlu dibina (coaching) langsung oleh jajaran Direksi untuk menyelaraskan visi bisnis makro. Pastikan sistem penilaian kinerja perusahaan (Performance Appraisal) terstruktur transparan, karena kandidat ini sangat menghargai keadilan (fairness) sistem dalam mempromosikan anak buahnya.
        </Text>
      </View>
    );
  }

  if (code === 'mbti') {
    return (
      <View key={idx} style={styles.testCard}>
        <Text style={styles.testCardTitle}>
          {idx + 1}. {testName} (MYERS-BRIGGS TYPE INDICATOR)
        </Text>
        <Text style={styles.testCardDesc}>
          • <Text style={{ fontWeight: 'bold' }}>Evaluasi Preferensi Kepribadian:</Text> Teridentifikasi (4 Dikotomi Psikologis Terukur){"\n"}
          • <Text style={{ fontWeight: 'bold' }}>4 Dimensi:</Text> Extraversion/Introversion, Sensing/Intuition, Thinking/Feeling, Judging/Perceiving{"\n"}
          • <Text style={{ fontWeight: 'bold' }}>Gaya Kerjasama:</Text> Mampu beradaptasi dengan baik di dalam tim, terbuka terhadap gagasan baru, dan menjaga keharmonisan komunikasi kerja.
        </Text>
      </View>
    );
  }

  if (code === 'enneagram') {
    return (
      <View key={idx} style={styles.testCard}>
        <Text style={styles.testCardTitle}>
          {idx + 1}. {testName} (ENNEAGRAM PERSONALITY TEST)
        </Text>
        <Text style={styles.testCardDesc}>
          <Text style={{ fontWeight: 'bold', fontSize: 10 }}>Analisis Mendalam 9 Tipe Kepribadian Enneagram</Text>{"\n"}
          Enneagram membedah arsitektur batin (inner architecture) dan akar motivasi mendasar yang menggerakkan perilaku, ketakutan (core fears), serta hasrat terdalam (core desires) dari kandidat. Analisis ini sangat krusial untuk memahami bagaimana kandidat bereaksi terhadap tekanan ekstrem dan apa yang memicu kepuasan intrinsik mereka di tempat kerja.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>1. Motivasi Dasar & Mekanisme Pertahanan (Core Motivations)</Text>{"\n"}
          Berdasarkan pola tanggapan, kandidat menunjukkan dorongan kuat untuk mencari keamanan struktural (security-oriented) dan keunggulan kompetitif (achievement-oriented). Mereka beroperasi dengan dorongan untuk menghindari kegagalan atau persepsi inkompetensi dari rekan kerja. Mekanisme pertahanan utama mereka saat berada dalam tekanan (stress point) adalah dengan meningkatkan volume kerja dan mengambil alih kendali secara perfeksionis, memastikan tidak ada celah kesalahan yang dapat disalahkan kepada mereka.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>2. Dinamika Integrasi (Pertumbuhan) & Disintegrasi (Stres)</Text>{"\n"}
          Dalam kondisi lingkungan yang sehat, saling mendukung, dan stabil (Integration Point), kandidat akan berevolusi menjadi sosok yang sangat empatik, mentor yang sabar, dan perencana visioner yang tenang. Namun, jika ditempatkan dalam ekosistem kerja yang toksik, penuh intrik politik, atau manajemen yang tidak jelas (Disintegration Point), mereka berisiko memunculkan sisi manipulatif, workaholic yang merusak keseimbangan hidup (burnout), serta bersikap sangat kritis (judgmental) terhadap anggota tim yang dianggap lamban.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>3. Pola Interaksi Sosial & Kolaborasi Tim (Social Subtype)</Text>{"\n"}
          Kandidat cenderung berperan sebagai "Sang Pemecah Masalah" di dalam dinamika kelompok. Mereka tidak segan untuk mengambil risiko atau menyuarakan pendapat yang bertentangan dengan arus utama (status quo) jika diyakini hal tersebut demi kebaikan proyek. Meskipun tampak tangguh di luar, mereka memiliki kebutuhan tersembunyi akan validasi atas kontribusi kerja keras mereka. Pengakuan (recognition) publik secara proporsional dari pimpinan tingkat atas akan melipatgandakan loyalitas dan produktivitas mereka.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>4. Proyeksi Kecocokan (Bidang & Posisi)</Text>{"\n"}
          Kandidat profil ini sangat unggul apabila diposisikan pada area inovasi dan pengembangan bisnis (Business Development), pemulihan proyek yang bermasalah (Troubleshooter/Turnaround Specialist), serta manajemen strategis tingkat lanjut. Mereka berkembang pesat di perusahaan yang memiliki budaya meritokrasi (menghargai hasil kerja murni) dan lingkungan dengan otonomi tinggi (seperti konsultan manajemen, firma hukum ternama, atau start-up unicorn).{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>5. Proyeksi Ketidakcocokan (Area yang Dihindari)</Text>{"\n"}
          Sangat tidak cocok ditempatkan pada perusahaan yang pergerakan karirnya didasarkan semata-mata pada senioritas umur/lama kerja (bukan performa kompetensi). Posisi sebagai staf pendukung pasif yang harus selalu menunggu instruksi detail berbulan-bulan tanpa ruang kreasi akan membunuh motivasi intrinsik mereka dan memicu pembangkangan.{"\n\n"}
          
          <Text style={{ fontWeight: 'bold' }}>6. Saran Treatment & Pembinaan Jangka Panjang</Text>{"\n"}
          Untuk memaksimalkan potensi kandidat ini, perusahaan diwajibkan menyediakan ruang (sandbox) bagi mereka untuk berinovasi tanpa ancaman *micromanagement* yang berlebihan. Berikan mereka otonomi dengan target akhir yang jelas. Hindari memberikan kritik tajam di hadapan publik; sebaliknya, gunakan sesi 1-on-1 yang privat dan berbasis pada fakta numerik (data-driven) agar masukan konstruktif dapat diterima tanpa memicu sikap defensif ego mereka.
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
        • <Text style={{ fontWeight: 'bold' }}>Catatan Analisis:</Text> Berkas jawaban kandidat telah tersimpan dengan aman dan memenuhi norma kriteria kualifikasi asesmen HR.
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
        {results.map((r, idx) => renderSpecificTestReport(r, idx))}

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

