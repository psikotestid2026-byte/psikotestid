import { ReactNode } from 'react';

interface TableProps {
  headers: string[];
  children: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export function Table({ headers, children, emptyMessage = "Tidak ada data", isEmpty = false }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {headers.map((h, i) => (
              <th key={i} className={`py-3.5 px-4 ${i === headers.length - 1 && h.toLowerCase().includes('aksi') ? 'text-right' : ''}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isEmpty ? (
            <tr>
              <td colSpan={headers.length} className="p-8 text-center text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
