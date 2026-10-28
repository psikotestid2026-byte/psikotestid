import { Check } from 'lucide-react';

interface BundleProgressProps {
  tests: Array<{ id: number; name: string; code?: string }>;
  activeIdx: number;
  completedTestIds: number[];
  brandColor: string;
}

const SHORT_NAMES: Record<string, string> = {
  wpt: 'WPT',
  disc: 'DISC',
  bigfive: 'Big Five',
  papi: 'PAPI',
  msdt: 'MSDT',
};

/** Step tracker for the mandatory test bundle: shows done / current / upcoming tests. */
export function BundleProgress({ tests, activeIdx, completedTestIds, brandColor }: BundleProgressProps) {
  const completed = new Set(completedTestIds);
  const doneCount = tests.filter((t) => completed.has(t.id)).length;

  return (
    <div className="bg-white border-b border-slate-100 px-4 py-2.5">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
          <span>Paket Asesmen</span>
          <span>
            {doneCount}/{tests.length} tes selesai
          </span>
        </div>
        <ol className="flex items-center gap-1.5">
          {tests.map((t, idx) => {
            const isDone = completed.has(t.id);
            const isCurrent = idx === activeIdx && !isDone;
            return (
              <li key={t.id} className="flex-1 min-w-0">
                <div
                  className={`h-1.5 rounded-full mb-1.5 transition-colors ${isDone ? 'bg-emerald-500' : isCurrent ? '' : 'bg-slate-200'}`}
                  style={isCurrent ? { backgroundColor: brandColor } : undefined}
                />
                <div
                  className={`flex items-center gap-1 text-[10px] font-bold truncate ${
                    isDone ? 'text-emerald-600' : isCurrent ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3 shrink-0" /> : <span className="shrink-0">{idx + 1}.</span>}
                  <span className="truncate">{SHORT_NAMES[String(t.code || '').toLowerCase()] || t.name}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
