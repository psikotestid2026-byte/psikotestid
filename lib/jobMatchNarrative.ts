/**
 * Automatic, neutral narrative for the "Kecocokan Jabatan" report page.
 * Pure functions: input is the stored score_breakdown, output is plain Indonesian text.
 */
import { PAPI_ASPECT_DETAILS, type PapiAspect } from '@/lib/scoring/papi';
import { MSDT_TYPE_DETAILS, type MsdtDimension } from '@/lib/scoring/msdt';
import { BUNDLE_TEST_CODES, RECOMMENDATION_LABELS, type BundleTestCode, type FitDetails, type RecommendationStatus } from '@/lib/jobFit';

export const TEST_LABELS: Record<BundleTestCode, string> = {
  wpt: 'WPT (kemampuan kognitif)',
  disc: 'DISC (gaya perilaku)',
  bigfive: 'Big Five (kepribadian)',
  papi: 'PAPI Kostick (preferensi kerja)',
  msdt: 'MSDT (gaya kepemimpinan)',
};

const STRENGTH_PHRASE: Record<BundleTestCode, string> = {
  wpt: 'kemampuan kognitif yang selaras dengan tuntutan jabatan',
  disc: 'gaya perilaku yang selaras dengan karakter jabatan',
  bigfive: 'profil kepribadian yang mendukung tuntutan jabatan',
  papi: 'preferensi dan gaya kerja yang sejalan dengan kebutuhan jabatan',
  msdt: 'gaya kepemimpinan yang sejalan dengan harapan jabatan',
};

const DEVELOPMENT_PHRASE: Record<BundleTestCode, string> = {
  wpt: 'kemampuan kognitif, yang dapat didukung dengan pelatihan analisis dan pemecahan masalah',
  disc: 'kesesuaian gaya perilaku, yang dapat dikembangkan melalui penyesuaian cara berkomunikasi dan bekerja sama',
  bigfive: 'kesesuaian profil kepribadian, yang dapat diperkuat melalui pendampingan dan umpan balik berkala',
  papi: 'kesesuaian preferensi kerja, yang dapat dikembangkan melalui penugasan terarah',
  msdt: 'kesesuaian gaya kepemimpinan, yang dapat dikembangkan melalui pelatihan kepemimpinan situasional',
};

export type MatchVerdict = 'Sangat sesuai' | 'Sesuai' | 'Cukup sesuai' | 'Perlu pengembangan';

export function verdictForScore(score: number): MatchVerdict {
  if (score >= 75) return 'Sangat sesuai';
  if (score >= 60) return 'Sesuai';
  if (score >= 45) return 'Cukup sesuai';
  return 'Perlu pengembangan';
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));

export interface MatchRow {
  code: BundleTestCode;
  label: string;
  score: number;
  verdict: MatchVerdict;
  below_min: boolean;
  ideal: string;
  actual: string;
}

export interface JobMatchNarrative {
  levelName: string;
  intro: string;
  rows: MatchRow[];
  strengths: string[];
  development: string[];
  statusReason: string;
  conclusion: string;
  caveat: string;
}

function describeIdealActual(code: BundleTestCode, d: FitDetails | undefined): { ideal: string; actual: string } {
  switch (code) {
    case 'wpt': {
      const w = d?.wpt;
      return w
        ? { ideal: `Rentang acuan ${fmt(w.floor)} sampai ${fmt(w.ceil)}`, actual: `Skor kognitif ${fmt(w.iq)}` }
        : { ideal: '-', actual: '-' };
    }
    case 'disc': {
      const x = d?.disc;
      return x
        ? { ideal: x.ideal.length ? x.ideal.join(', ') : '-', actual: x.dominant }
        : { ideal: '-', actual: '-' };
    }
    case 'bigfive': {
      const entries = Object.entries(d?.bigfive || {}) as Array<[string, { percent: number; weight: number }]>;
      if (entries.length === 0) return { ideal: '-', actual: '-' };
      const names: Record<string, string> = { E: 'Ekstraversi', A: 'Keramahan', C: 'Kehati-hatian', N: 'Neurotisisme', O: 'Keterbukaan' };
      return {
        ideal: entries.map(([k, v]) => `${names[k]} ${v.weight < 0 ? 'rendah' : 'tinggi'}`).join(', '),
        actual: entries.map(([k, v]) => `${names[k]} ${fmt(v.percent)}%`).join(', '),
      };
    }
    case 'papi': {
      const p = d?.papi;
      if (!p) return { ideal: '-', actual: '-' };
      const part = (list: Array<{ aspect: string; value: number }>) => list.map((x) => `${x.aspect} ${fmt(x.value)}/9`).join(', ');
      return {
        ideal: [p.high.length ? `Tinggi: ${p.high.map((x) => x.aspect).join(', ')}` : '', p.low.length ? `Rendah: ${p.low.map((x) => x.aspect).join(', ')}` : '']
          .filter(Boolean)
          .join(' | ') || '-',
        actual: [p.high.length ? part(p.high) : '', p.low.length ? part(p.low) : ''].filter(Boolean).join(' | ') || '-',
      };
    }
    case 'msdt': {
      const m = d?.msdt;
      if (!m) return { ideal: '-', actual: '-' };
      const name = MSDT_TYPE_DETAILS[m.type as MsdtDimension]?.name || m.type;
      return { ideal: 'Gaya efektif (Executive, Developer, Benevolent Autocrat)', actual: `${name} (kecocokan ${fmt(m.fit)})` };
    }
  }
}

function papiHighlights(d: FitDetails | undefined): string | null {
  const p = d?.papi;
  if (!p) return null;
  const strong = p.high.filter((x) => x.value >= 7).map((x) => PAPI_ASPECT_DETAILS[x.aspect as PapiAspect]?.name).filter(Boolean);
  return strong.length ? `Aspek kerja yang menonjol: ${strong.slice(0, 3).join(', ')}.` : null;
}

export function buildJobMatchNarrative(input: {
  fullName: string;
  position: string;
  breakdown: any;
  fitDetails?: FitDetails | null;
  status: RecommendationStatus | null;
  systemStatus: RecommendationStatus | null;
  overridden: boolean;
  composite: number | null;
}): JobMatchNarrative | null {
  const tests = input.breakdown?.tests;
  if (!tests) return null;

  const levelName: string = input.breakdown?.level_name || 'jabatan ini';
  const details = input.fitDetails || input.breakdown?.fit_details || undefined;

  const rows: MatchRow[] = BUNDLE_TEST_CODES.filter((c) => tests[c]).map((code) => {
    const score = Number(tests[code].score);
    return {
      code,
      label: TEST_LABELS[code],
      score,
      verdict: verdictForScore(score),
      below_min: Boolean(tests[code].below_min),
      ...describeIdealActual(code, details),
    };
  });

  const ranked = [...rows].sort((a, b) => b.score - a.score);
  const strengths = ranked
    .filter((r) => r.score >= 60)
    .slice(0, 3)
    .map((r) => `${r.label}: menunjukkan ${STRENGTH_PHRASE[r.code]} (skor ${fmt(r.score)}).`);
  const extra = papiHighlights(details);
  if (extra && strengths.length < 4) strengths.push(extra);

  const development = [...ranked]
    .reverse()
    .filter((r) => r.score < 75 || r.below_min)
    .slice(0, 3)
    .map((r) =>
      r.below_min
        ? `${r.label}: skor ${fmt(r.score)} berada di bawah batas minimum jabatan, sehingga perlu perhatian pada ${DEVELOPMENT_PHRASE[r.code]}.`
        : `${r.label}: skor ${fmt(r.score)}, area untuk memperkuat ${DEVELOPMENT_PHRASE[r.code]}.`
    );

  const composite = input.composite != null ? fmt(input.composite) : '-';
  const thresholds = input.breakdown?.thresholds;
  const label = input.status ? RECOMMENDATION_LABELS[input.status] : 'belum ditentukan';

  const intro = `${input.fullName} diasesmen untuk jabatan ${input.position} yang dinilai pada level ${levelName}. Skor kecocokan gabungan dari lima instrumen adalah ${composite} dari 100.`;

  let statusReason = '';
  if (input.breakdown?.gated) {
    statusReason = `Skor gabungan sebenarnya telah mencapai batas rekomendasi${thresholds ? ` (${fmt(thresholds.recommended)})` : ''}, namun terdapat instrumen yang berada di bawah batas minimum jabatan, sehingga status ditetapkan sebagai Dipertimbangkan.`;
  } else if (thresholds && input.composite != null && input.status) {
    if (input.systemStatus === 'DIREKOMENDASIKAN') {
      statusReason = `Skor gabungan ${composite} mencapai atau melampaui batas rekomendasi level ini (${fmt(thresholds.recommended)}).`;
    } else if (input.systemStatus === 'DIPERTIMBANGKAN') {
      statusReason = `Skor gabungan ${composite} berada di antara batas Dipertimbangkan (${fmt(thresholds.considered)}) dan batas rekomendasi (${fmt(thresholds.recommended)}).`;
    } else {
      statusReason = `Skor gabungan ${composite} berada di bawah batas Dipertimbangkan level ini (${fmt(thresholds.considered)}).`;
    }
  }
  if (input.overridden && input.systemStatus && input.systemStatus !== input.status) {
    statusReason += ` Penilaian sistem adalah ${RECOMMENDATION_LABELS[input.systemStatus]}; status akhir ditetapkan oleh asesor.`;
  }

  const conclusionByStatus: Record<RecommendationStatus, string> = {
    DIREKOMENDASIKAN: `Secara keseluruhan, profil ${input.fullName} menunjukkan kecocokan yang baik dengan tuntutan ${levelName}. Hasil ini dapat menjadi dasar pertimbangan yang positif, disertai pemantauan pada area yang masih dapat diperkuat.`,
    DIPERTIMBANGKAN: `Profil ${input.fullName} menunjukkan kecocokan sebagian dengan tuntutan ${levelName}. Disarankan pertimbangan lebih lanjut, misalnya melalui wawancara atau observasi kinerja, serta rencana pengembangan pada area yang disebutkan.`,
    TIDAK_DIREKOMENDASIKAN: `Pada saat tes dilakukan, profil ${input.fullName} belum menunjukkan kecocokan yang memadai dengan tuntutan ${levelName}. Hasil ini menggambarkan kesesuaian dengan profil jabatan, bukan nilai pribadi, dan dapat ditinjau kembali setelah proses pengembangan.`,
  };
  const conclusion = input.status
    ? conclusionByStatus[input.status]
    : `Status akhir ${input.fullName} (${label}) belum dapat disimpulkan.`;

  return {
    levelName,
    intro,
    rows,
    strengths,
    development,
    statusReason,
    conclusion,
    caveat:
      'Narasi ini dihasilkan otomatis dari hasil tes dan profil jabatan, menggambarkan kecenderungan pada saat tes dilakukan, dan sebaiknya digunakan bersama informasi lain seperti kinerja, wawancara, dan observasi.',
  };
}
