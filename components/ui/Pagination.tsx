import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  pageSizes?: readonly number[];
  itemLabel?: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function Pagination({
  page,
  limit,
  total,
  pageSizes = [10, 25, 50, 100],
  itemLabel = 'peserta',
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/60 text-xs text-slate-600">
      <div className="font-medium">
        Menampilkan <strong className="text-slate-900">{from}-{to}</strong> dari{' '}
        <strong className="text-slate-900">{total}</strong> {itemLabel}
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5">
          <span>Baris per halaman</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-2 py-1 bg-white text-xs font-semibold"
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-2 font-semibold">
            Halaman {page} / {totalPages}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
