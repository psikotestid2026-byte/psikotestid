import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { BUNDLE_TEST_CODES, RECOMMENDATION_LABELS, isRecommendationStatus, type RecommendationStatus } from '@/lib/jobFit';
import { IconHeading, SectionBlock, cardStyles, theme } from '@/components/reports/v3/ReportShell';

const TEST_LABELS: Record<string, string> = {
  wpt: 'WPT (Kemampuan Kognitif)',
  disc: 'DISC (Gaya Perilaku)',
  bigfive: 'Big Five (Kepribadian)',
  papi: 'PAPI Kostick (Preferensi Kerja)',
  msdt: 'MSDT (Gaya Kepemimpinan)',
};

const STATUS_COLORS: Record<RecommendationStatus, { fg: string; bg: string }> = {
  DIREKOMENDASIKAN: { fg: '#047857', bg: '#d1fae5' },
  DIPERTIMBANGKAN: { fg: '#b45309', bg: '#fef3c7' },
  TIDAK_DIREKOMENDASIKAN: { fg: '#b91c1c', bg: '#fee2e2' },
};

const styles = StyleSheet.create({
  identity: {
    position: 'absolute',
    top: 46,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.6,
    borderBottomColor: theme.line,
    paddingBottom: 3,
  },
  identityText: { fontSize: 8, color: theme.ink },
  identityName: { fontWeight: 'bold' },
  pill: { fontSize: 7.5, fontWeight: 'bold', borderRadius: 8, paddingVertical: 2, paddingHorizontal: 7 },
  bigPill: { fontSize: 13, fontWeight: 'bold', borderRadius: 10, paddingVertical: 5, paddingHorizontal: 12 },
  row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: theme.line, paddingVertical: 3 },
  head: { backgroundColor: '#f1f5f9' },
  cell: { fontSize: 8.5, color: theme.ink },
  cellHead: { fontSize: 8, fontWeight: 'bold', color: '#334155' },
});

export interface JobFitReportData {
  fullName: string;
  position: string;
  unitWork: string;
  status: RecommendationStatus | null;
  systemStatus: RecommendationStatus | null;
  composite: number | null;
  breakdown: any | null;
  assessorNotes: string | null;
  overridden: boolean;
}

export function buildJobFitReportData(participant: Record<string, any>): JobFitReportData {
  const status = isRecommendationStatus(participant?.recommendation_status) ? participant.recommendation_status : null;
  const systemStatus = isRecommendationStatus(participant?.system_recommendation_status)
    ? participant.system_recommendation_status
    : null;
  const composite = participant?.recommendation_score != null ? Number(participant.recommendation_score) : null;
  return {
    fullName: String(participant?.full_name || 'Kandidat'),
    position: String(participant?.position || '-'),
    unitWork: String(participant?.unit_work || '-'),
    status,
    systemStatus,
    composite: Number.isFinite(composite as number) ? composite : null,
    breakdown: participant?.score_breakdown && typeof participant.score_breakdown === 'object' ? participant.score_breakdown : null,
    assessorNotes: participant?.assessor_notes ? String(participant.assessor_notes) : null,
    overridden: Boolean(participant?.assessor_override),
  };
}

function StatusPill({ status, big }: { status: RecommendationStatus | null; big?: boolean }) {
  if (!status) {
    return <Text style={[big ? styles.bigPill : styles.pill, { color: '#475569', backgroundColor: '#e2e8f0' }]}>Belum Dinilai</Text>;
  }
  const c = STATUS_COLORS[status];
  return (
    <Text style={[big ? styles.bigPill : styles.pill, { color: c.fg, backgroundColor: c.bg }]}>
      {RECOMMENDATION_LABELS[status]}
    </Text>
  );
}

/** Fixed strip repeated on every page: name, jabatan, unit and the final status. */
export function IdentityStrip({ data }: { data: JobFitReportData }) {
  return (
    <View style={styles.identity} fixed>
      <Text style={styles.identityText}>
        <Text style={styles.identityName}>{data.fullName}</Text>
        {'  |  '}
        {data.position}
        {'  |  '}
        {data.unitWork}
      </Text>
      <StatusPill status={data.status} />
    </View>
  );
}

export function JobFitCoverBlock({ data, companyName }: { data: JobFitReportData; companyName?: string | null }) {
  return (
    <SectionBlock
      accent="#1d4ed8"
      kicker="Laporan Asesmen Terpadu"
      title={data.fullName}
      subtitle={[data.position, data.unitWork, companyName].filter((v) => v && v !== '-').join(' - ')}
      lead={
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 9, marginRight: 8, color: theme.softText }}>Hasil akhir:</Text>
          <StatusPill status={data.status} big />
        </View>
      }
    />
  );
}

export function JobFitSummaryBlock({ data }: { data: JobFitReportData }) {
  const tests = data.breakdown?.tests || {};
  const thresholds = data.breakdown?.thresholds;
  return (
    <SectionBlock
      accent="#0f172a"
      kicker="Hasil Akhir"
      title="Ringkasan Kecocokan Jabatan"
      subtitle={`Level jabatan: ${data.breakdown?.level_name || '-'}`}
      lead={
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', marginRight: 10, color: theme.ink }}>
            {data.composite != null ? data.composite.toFixed(1) : '-'}
          </Text>
          <StatusPill status={data.status} big />
        </View>
      }
    >
      {thresholds ? (
        <Text style={[cardStyles.body, { marginBottom: 6, color: theme.softText }]}>
          Batas Direkomendasikan: {thresholds.recommended} - Batas Dipertimbangkan: {thresholds.considered} (skala 0-100)
        </Text>
      ) : null}
      <View style={[styles.row, styles.head]}>
        <Text style={[styles.cellHead, { width: '46%' }]}>Instrumen</Text>
        <Text style={[styles.cellHead, { width: '18%' }]}>Skor (0-100)</Text>
        <Text style={[styles.cellHead, { width: '16%' }]}>Bobot</Text>
        <Text style={[styles.cellHead, { width: '20%' }]}>Batas Minimum</Text>
      </View>
      {BUNDLE_TEST_CODES.map((code) => {
        const t = tests[code];
        return (
          <View key={code} style={styles.row} wrap={false}>
            <Text style={[styles.cell, { width: '46%' }]}>{TEST_LABELS[code]}</Text>
            <Text style={[styles.cell, { width: '18%', fontWeight: 'bold', color: t?.below_min ? '#b91c1c' : theme.ink }]}>
              {t ? Number(t.score).toFixed(1) : '-'}
            </Text>
            <Text style={[styles.cell, { width: '16%' }]}>{t ? `${Math.round(t.weight * 100)}%` : '-'}</Text>
            <Text style={[styles.cell, { width: '20%' }]}>{t ? t.min_score : '-'}</Text>
          </View>
        );
      })}
      {data.breakdown?.gated ? (
        <Text style={[cardStyles.body, { marginTop: 6, color: '#b45309' }]}>
          Skor gabungan memenuhi batas rekomendasi, namun terdapat instrumen di bawah batas minimum sehingga status diturunkan menjadi Dipertimbangkan.
        </Text>
      ) : null}
    </SectionBlock>
  );
}

export function JobFitConclusionBlock({ data }: { data: JobFitReportData }) {
  return (
    <SectionBlock accent="#0f172a" kicker="Kesimpulan" title="Kesimpulan Akhir Asesmen">
      <View wrap={false} style={[cardStyles.card, cardStyles.plain, { borderTopColor: '#0f172a' }]}>
        <IconHeading accent="#0f172a" icon="S" title="Status akhir kandidat" />
        <Text style={[cardStyles.body, { marginBottom: 6 }]}>
          {data.fullName} - {data.position} - {data.unitWork}
        </Text>
        <StatusPill status={data.status} big />
        {data.overridden && data.systemStatus && data.systemStatus !== data.status ? (
          <Text style={[cardStyles.body, { marginTop: 6, color: theme.softText }]}>
            Penilaian sistem: {RECOMMENDATION_LABELS[data.systemStatus]}. Status akhir ditetapkan oleh asesor.
          </Text>
        ) : null}
      </View>
      {data.assessorNotes ? (
        <View style={[cardStyles.card, cardStyles.plain, { borderTopColor: '#0f172a' }]}>
          <IconHeading accent="#0f172a" icon="A" title="Catatan asesor" />
          <Text style={cardStyles.body}>{data.assessorNotes}</Text>
        </View>
      ) : null}
    </SectionBlock>
  );
}
