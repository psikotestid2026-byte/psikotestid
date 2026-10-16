/**
 * Builds the short "Skor / Ringkasan" text shown in the combined participant report
 * summary table. Never renders "undefined": scorers that only return a dominantLabel
 * (e.g. PAPI, Enneagram) fall back to a label derived from their own fields.
 */
export interface SummaryScoring {
  dominantLabel?: string | number | null;
  dominantType?: string | null;
  dominantInfo?: { name?: string } | null;
  wingCode?: string | null;
  score?: string | number;
  wptScore?: string | number;
  total_answers?: number;
}

export function getResultSummary(
  code: string | null | undefined,
  sc: SummaryScoring | null | undefined
): string {
  if (!sc) return 'Selesai';
  const c = (code || '').toLowerCase();

  if (c === 'enneagram' && sc.dominantLabel) {
    const label = /^\d+$/.test(String(sc.dominantLabel)) ? `Tipe ${sc.dominantLabel}` : String(sc.dominantLabel);
    const name = sc.dominantInfo?.name;
    const wing = sc.wingCode ? ` · Wing ${sc.wingCode}` : '';
    return name ? `${label} (${name})${wing}` : `${label}${wing}`;
  }

  if (sc.dominantLabel) {
    return sc.dominantType ? `${sc.dominantLabel} (${sc.dominantType})` : String(sc.dominantLabel);
  }
  if (sc.score !== undefined || sc.wptScore !== undefined) {
    return `Skor Kognitif: ${sc.score ?? sc.wptScore}`;
  }
  if (sc.total_answers) return `${sc.total_answers} Terjawab`;
  return 'Selesai';
}
