import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Rect, Polygon, Circle, Line, G } from '@react-pdf/renderer';

const theme = {
  primary: '#4f46e5', // indigo-600
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate700: '#334155',
  slate900: '#0f172a',
  bgLight: '#f8fafc',
  line: '#e2e8f0',
};

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: theme.slate900,
    fontSize: 9,
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: theme.primary,
    paddingBottom: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.slate900,
  },
  subtitle: {
    fontSize: 8.5,
    color: theme.slate500,
    marginTop: 2,
  },
  metaRight: {
    textAlign: 'right',
  },
  metaCompany: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.primary,
  },
  metaDate: {
    fontSize: 7.5,
    color: theme.slate500,
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: theme.bgLight,
    borderWidth: 1,
    borderColor: theme.line,
  },
  kpiLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: theme.slate500,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  kpiSubtext: {
    fontSize: 6.5,
    color: theme.slate400,
  },
  section: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#ffffff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
    paddingBottom: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.slate900,
  },
  table: {
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: theme.line,
    paddingVertical: 4,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: theme.bgLight,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
    fontWeight: 'bold',
  },
  cellText: {
    fontSize: 7.5,
    color: theme.slate700,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 32,
    right: 32,
    borderTopWidth: 0.5,
    borderTopColor: theme.line,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: theme.slate400,
  },
});

interface StatsPdfProps {
  campaign: {
    id: number;
    title: string;
    company_name?: string;
  };
  summary: {
    total?: number;
    direkomendasikan?: number;
    dipertimbangkan?: number;
    tidak_direkomendasikan?: number;
    belum?: number;
    done?: number;
  };
  unitStats: Array<{
    unit: string;
    total: number;
    direkomendasikan: number;
    dipertimbangkan: number;
    tidak_direkomendasikan: number;
    belum: number;
  }>;
  jobLevelStats: Array<{
    level: string;
    total: number;
    direkomendasikan: number;
    dipertimbangkan: number;
    tidak_direkomendasikan: number;
    belum: number;
  }>;
  avgScores: {
    avg_wpt?: string;
    avg_disc?: string;
    avg_bigfive?: string;
    avg_papi?: string;
    avg_msdt?: string;
    avg_overall?: string;
  };
  scoreDistribution: Array<{
    bucket: string;
    count: number;
  }>;
}

export function CampaignStatsPdfDocument({
  campaign,
  summary,
  unitStats,
  jobLevelStats,
  avgScores,
  scoreDistribution,
}: StatsPdfProps) {
  const total = Number(summary.total || 0);
  const direkomendasikan = Number(summary.direkomendasikan || 0);
  const dipertimbangkan = Number(summary.dipertimbangkan || 0);
  const tidakRekomendasi = Number(summary.tidak_direkomendasikan || 0);
  const belum = Number(summary.belum || 0);
  const done = Number(summary.done || total - belum);

  const recoRate = total > 0 ? Math.round(((direkomendasikan + dipertimbangkan) / total) * 100) : 0;
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Radar points calculation for SVG Radar Chart (Center: 120, 90, Radius: 65)
  const radarMetrics = [
    { label: 'WPT (Logika)', score: Number(avgScores.avg_wpt || 0) },
    { label: 'DISC (Kepribadian)', score: Number(avgScores.avg_disc || 0) },
    { label: 'Big Five (Karakter)', score: Number(avgScores.avg_bigfive || 0) },
    { label: 'PAPI (Gaya Kerja)', score: Number(avgScores.avg_papi || 0) },
    { label: 'MSDT (Manajerial)', score: Number(avgScores.avg_msdt || 0) },
  ];

  const cx = 130;
  const cy = 80;
  const rMax = 55;
  const points = radarMetrics.map((m, i) => {
    const angle = (Math.PI * 2 * i) / radarMetrics.length - Math.PI / 2;
    const r = (Math.min(100, Math.max(0, m.score)) / 100) * rMax;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      lx: cx + (rMax + 14) * Math.cos(angle),
      ly: cy + (rMax + 14) * Math.sin(angle),
      score: m.score,
      label: m.label,
    };
  });
  const polygonPointsStr = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Maximum count for histogram
  const maxBucketCount = Math.max(1, ...scoreDistribution.map((d) => Number(d.count || 0)));

  return (
    <Document title={`Laporan-Statistik-Asesmen-${campaign.id}.pdf`}>
      {/* PAGE 1: Executive Summary, Status, Radar & Score Distribution */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Laporan Statistik Asesmen Karyawan</Text>
            <Text style={styles.subtitle}>
              {campaign.title} (ID: CMP-{campaign.id})
            </Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaCompany}>{campaign.company_name || 'PsikoTest.id Enterprise'}</Text>
            <Text style={styles.metaDate}>Dicetak pada: {printDate}</Text>
          </View>
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Rata-Rata Skor</Text>
            <Text style={[styles.kpiValue, { color: theme.primary }]}>{avgScores.avg_overall || '-'}</Text>
            <Text style={styles.kpiSubtext}>Skala 100 (Skor Gabungan)</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Tingkat Rekomendasi</Text>
            <Text style={[styles.kpiValue, { color: theme.emerald }]}>{recoRate}%</Text>
            <Text style={styles.kpiSubtext}>Direkomendasikan + Dipertimbangkan</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Selesai Dinilai</Text>
            <Text style={[styles.kpiValue, { color: theme.slate900 }]}>
              {done} / {total}
            </Text>
            <Text style={styles.kpiSubtext}>Karyawan tuntas mengisi</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Belum Selesai</Text>
            <Text style={[styles.kpiValue, { color: theme.amber }]}>{belum}</Text>
            <Text style={styles.kpiSubtext}>Karyawan belum tuntas</Text>
          </View>
        </View>

        {/* Section 1: Distribusi Rekomendasi (Visual Stack Bar + Table) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>1. Distribusi Status Rekomendasi Karyawan</Text>
            <Text style={{ fontSize: 7, color: theme.slate500 }}>Total: {total} Karyawan</Text>
          </View>

          {/* Verification Notice */}
          <View style={{ backgroundColor: '#fffbeb', borderWidth: 0.8, borderColor: '#fde68a', borderRadius: 4, padding: 6, marginBottom: 8 }}>
            <Text style={{ fontSize: 7, color: '#78350f', lineHeight: 1.3 }}>
              <Text style={{ fontWeight: 'bold' }}>Data ini belum divalidasi secara manual.</Text> Nilai dan status rekomendasi bersifat sementara dan dapat berubah setelah proses verifikasi oleh tim HR.
            </Text>
          </View>

          {/* Visual Stacked Bar */}
          <View style={{ width: '100%', height: 16, flexDirection: 'row', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
            {direkomendasikan > 0 && (
              <View style={{ width: `${(direkomendasikan / total) * 100}%`, backgroundColor: theme.emerald }} />
            )}
            {dipertimbangkan > 0 && (
              <View style={{ width: `${(dipertimbangkan / total) * 100}%`, backgroundColor: theme.amber }} />
            )}
            {tidakRekomendasi > 0 && (
              <View style={{ width: `${(tidakRekomendasi / total) * 100}%`, backgroundColor: theme.red }} />
            )}
            {belum > 0 && (
              <View style={{ width: `${(belum / total) * 100}%`, backgroundColor: theme.slate400 }} />
            )}
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.emerald }]} />
              <Text style={styles.cellText}>
                Direkomendasikan: {direkomendasikan} ({total > 0 ? Math.round((direkomendasikan / total) * 100) : 0}%)
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.amber }]} />
              <Text style={styles.cellText}>
                Dipertimbangkan: {dipertimbangkan} ({total > 0 ? Math.round((dipertimbangkan / total) * 100) : 0}%)
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.red }]} />
              <Text style={styles.cellText}>
                Tidak Rekomendasi: {tidakRekomendasi} ({total > 0 ? Math.round((tidakRekomendasi / total) * 100) : 0}%)
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.slate400 }]} />
              <Text style={styles.cellText}>
                Belum Selesai: {belum} ({total > 0 ? Math.round((belum / total) * 100) : 0}%)
              </Text>
            </View>
          </View>
        </View>

        {/* Section 2: Profil Alat Tes (Radar SVG) & Sebaran Rentang Nilai */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {/* Radar Chart per Alat Tes */}
          <View style={[styles.section, { flex: 1, marginBottom: 0 }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>2. Rata-Rata per Alat Tes</Text>
            </View>

            <Svg width="250" height="155">
              {/* Web Rings */}
              {[0.25, 0.5, 0.75, 1].map((scale, sIdx) => {
                const ringPoints = radarMetrics.map((_, i) => {
                  const angle = (Math.PI * 2 * i) / radarMetrics.length - Math.PI / 2;
                  const r = scale * rMax;
                  return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
                }).join(' ');
                return (
                  <Polygon
                    key={sIdx}
                    points={ringPoints}
                    stroke={theme.line}
                    strokeWidth="0.8"
                    fill="none"
                  />
                );
              })}

              {/* Spoke lines */}
              {radarMetrics.map((_, i) => {
                const angle = (Math.PI * 2 * i) / radarMetrics.length - Math.PI / 2;
                return (
                  <Line
                    key={i}
                    x1={cx}
                    y1={cy}
                    x2={cx + rMax * Math.cos(angle)}
                    y2={cy + rMax * Math.sin(angle)}
                    stroke={theme.line}
                    strokeWidth="0.8"
                  />
                );
              })}

              {/* Data Polygon */}
              <Polygon
                points={polygonPointsStr}
                stroke={theme.primary}
                strokeWidth="1.5"
                fill={theme.primary}
                fillOpacity="0.3"
              />

              {/* Vertices and labels */}
              {points.map((p, idx) => (
                <G key={idx}>
                  <Circle cx={p.x} cy={p.y} r="2.5" fill={theme.primary} />
                  <Text
                    x={p.lx - 20}
                    y={p.ly}
                    style={{ fontSize: 6.5, fill: theme.slate700, fontWeight: 'bold' }}
                  >
                    {p.score}
                  </Text>
                </G>
              ))}
            </Svg>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4, justifyContent: 'center' }}>
              {radarMetrics.map((m) => (
                <Text key={m.label} style={{ fontSize: 6.5, color: theme.slate500 }}>
                  {m.label}: <Text style={{ fontWeight: 'bold', color: theme.slate900 }}>{m.score}</Text>
                </Text>
              ))}
            </View>
          </View>

          {/* Histogram Sebaran Nilai */}
          <View style={[styles.section, { flex: 1, marginBottom: 0 }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>3. Sebaran Rentang Nilai</Text>
            </View>

            <View style={{ gap: 5, paddingVertical: 4 }}>
              {scoreDistribution.map((d) => {
                const count = Number(d.count || 0);
                const barWidth = maxBucketCount > 0 ? (count / maxBucketCount) * 100 : 0;
                return (
                  <View key={d.bucket} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ width: 44, fontSize: 7, color: theme.slate700, textAlign: 'right' }}>
                      {d.bucket}
                    </Text>
                    <View style={{ flex: 1, height: 11, backgroundColor: theme.bgLight, borderRadius: 2 }}>
                      <View
                        style={{
                          width: `${Math.max(4, barWidth)}%`,
                          height: '100%',
                          backgroundColor: theme.primary,
                          borderRadius: 2,
                        }}
                      />
                    </View>
                    <Text style={{ width: 28, fontSize: 7, fontWeight: 'bold', color: theme.slate900 }}>
                      {count} org
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Section 4: Breakdown per Level Jabatan */}
        <View style={[styles.section, { marginTop: 12 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>4. Hasil Rekomendasi per Level Jabatan</Text>
          </View>

          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.cellText, { width: '28%', fontWeight: 'bold' }]}>Level Jabatan</Text>
              <Text style={[styles.cellText, { width: '18%', textAlign: 'center', fontWeight: 'bold' }]}>Direkomendasikan</Text>
              <Text style={[styles.cellText, { width: '18%', textAlign: 'center', fontWeight: 'bold' }]}>Dipertimbangkan</Text>
              <Text style={[styles.cellText, { width: '18%', textAlign: 'center', fontWeight: 'bold' }]}>Tidak Rekomendasi</Text>
              <Text style={[styles.cellText, { width: '18%', textAlign: 'center', fontWeight: 'bold' }]}>Total</Text>
            </View>

            {jobLevelStats.map((row) => (
              <View key={row.level} style={styles.tableRow}>
                <Text style={[styles.cellText, { width: '28%', fontWeight: 'bold' }]}>{row.level}</Text>
                <Text style={[styles.cellText, { width: '18%', textAlign: 'center', color: theme.emerald, fontWeight: 'bold' }]}>
                  {row.direkomendasikan}
                </Text>
                <Text style={[styles.cellText, { width: '18%', textAlign: 'center', color: theme.amber, fontWeight: 'bold' }]}>
                  {row.dipertimbangkan}
                </Text>
                <Text style={[styles.cellText, { width: '18%', textAlign: 'center', color: theme.red, fontWeight: 'bold' }]}>
                  {row.tidak_direkomendasikan}
                </Text>
                <Text style={[styles.cellText, { width: '18%', textAlign: 'center', fontWeight: 'bold' }]}>
                  {row.total}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>PsikoTest.id Enterprise · Portal Rekrutmen & Asesmen</Text>
          <Text>Halaman 1 dari 2</Text>
        </View>
      </Page>

      {/* PAGE 2: Breakdown per Unit Kerja */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Laporan Statistik Asesmen - Unit Kerja</Text>
            <Text style={styles.subtitle}>
              {campaign.title} · Rincian Hasil per Unit Penempatan
            </Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaCompany}>{campaign.company_name || 'PsikoTest.id Enterprise'}</Text>
            <Text style={styles.metaDate}>{printDate}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>5. Rekapitulasi Status per Unit Kerja / Cabang</Text>
            <Text style={{ fontSize: 7, color: theme.slate500 }}>Menampilkan unit terdaftar</Text>
          </View>

          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.cellText, { width: '32%', fontWeight: 'bold' }]}>Unit Kerja / Cabang</Text>
              <Text style={[styles.cellText, { width: '17%', textAlign: 'center', fontWeight: 'bold', color: theme.emerald }]}>
                Direkomendasikan
              </Text>
              <Text style={[styles.cellText, { width: '17%', textAlign: 'center', fontWeight: 'bold', color: theme.amber }]}>
                Dipertimbangkan
              </Text>
              <Text style={[styles.cellText, { width: '17%', textAlign: 'center', fontWeight: 'bold', color: theme.red }]}>
                Tidak Rekomendasi
              </Text>
              <Text style={[styles.cellText, { width: '17%', textAlign: 'center', fontWeight: 'bold' }]}>
                Total Peserta
              </Text>
            </View>

            {unitStats.map((row, idx) => (
              <View key={row.unit + idx} style={styles.tableRow}>
                <Text style={[styles.cellText, { width: '32%', fontWeight: 'bold' }]}>{row.unit}</Text>
                <Text style={[styles.cellText, { width: '17%', textAlign: 'center', color: theme.emerald, fontWeight: 'bold' }]}>
                  {row.direkomendasikan}
                </Text>
                <Text style={[styles.cellText, { width: '17%', textAlign: 'center', color: theme.amber, fontWeight: 'bold' }]}>
                  {row.dipertimbangkan}
                </Text>
                <Text style={[styles.cellText, { width: '17%', textAlign: 'center', color: theme.red, fontWeight: 'bold' }]}>
                  {row.tidak_direkomendasikan}
                </Text>
                <Text style={[styles.cellText, { width: '17%', textAlign: 'center', fontWeight: 'bold' }]}>
                  {row.total}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.bgLight }]}>
          <Text style={[styles.sectionTitle, { fontSize: 8.5, marginBottom: 4 }]}>Catatan & Panduan Evaluasi:</Text>
          <Text style={{ fontSize: 7, color: theme.slate700, lineHeight: 1.4 }}>
            • Status <Text style={{ color: theme.emerald, fontWeight: 'bold' }}>Direkomendasikan</Text> menunjukkan profil kompetensi dan karakter kandidat sesuai dengan ekspektasi standar jabatan.
            {'\n'}• Status <Text style={{ color: theme.amber, fontWeight: 'bold' }}>Dipertimbangkan</Text> menunjukkan kandidat memiliki aspek keunggulan tertentu dengan beberapa area yang membutuhkan pendampingan atau pelatihan (development areas).
            {'\n'}• Status <Text style={{ color: theme.red, fontWeight: 'bold' }}>Tidak Direkomendasikan</Text> mengindikasikan adanya diskrepansi signifikan antara profil hasil uji dengan tuntutan posisi saat ini.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>PsikoTest.id Enterprise · Portal Rekrutmen & Asesmen</Text>
          <Text>Halaman 2 dari 2</Text>
        </View>
      </Page>
    </Document>
  );
}

