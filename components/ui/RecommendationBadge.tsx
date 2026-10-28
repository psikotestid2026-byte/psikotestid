import { RECOMMENDATION_LABELS, isRecommendationStatus } from '@/lib/jobFit';

const STYLES: Record<string, string> = {
  DIREKOMENDASIKAN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DIPERTIMBANGKAN: 'bg-amber-50 text-amber-700 border-amber-200',
  TIDAK_DIREKOMENDASIKAN: 'bg-red-50 text-red-700 border-red-200',
};

interface RecommendationBadgeProps {
  status: string | null | undefined;
  scoringStatus?: string | null;
  overridden?: boolean;
}

export function RecommendationBadge({ status, scoringStatus, overridden }: RecommendationBadgeProps) {
  if (!isRecommendationStatus(status)) {
    const label =
      scoringStatus === 'PROCESSING'
        ? 'Sedang diproses...'
        : scoringStatus === 'FAILED'
          ? 'Gagal diproses'
          : 'Belum selesai';
    const style =
      scoringStatus === 'FAILED'
        ? 'bg-red-50 text-red-600 border-red-200'
        : 'bg-slate-100 text-slate-500 border-slate-200';
    return (
      <span className={`inline-flex px-2.5 py-0.5 rounded-md border text-[10px] font-bold ${style}`}>{label}</span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-[10px] font-extrabold ${STYLES[status]}`}
      title={overridden ? 'Status telah diubah oleh asesor' : undefined}
    >
      {RECOMMENDATION_LABELS[status]}
      {overridden && <span className="text-[9px] font-bold opacity-70">(asesor)</span>}
    </span>
  );
}
