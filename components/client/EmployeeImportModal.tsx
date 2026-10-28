'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Download, Upload, CheckCircle2, FileSpreadsheet, Loader2 } from 'lucide-react';
import {
  downloadEmployeeExcelTemplate,
  parseEmployeeExcelFile,
  type EmployeeImportRow,
} from '@/lib/excelTemplate';

interface EmployeeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: number;
  campaignTitle: string;
  onSuccess: () => void;
}

export function EmployeeImportModal({ isOpen, onClose, campaignId, campaignTitle, onSuccess }: EmployeeImportModalProps) {
  const [rows, setRows] = useState<EmployeeImportRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      const parsed = buffer ? parseEmployeeExcelFile(buffer) : [];
      if (parsed.length === 0) {
        toast.error('Format file tidak valid atau tidak ada baris karyawan yang terbaca.');
        setRows([]);
      } else {
        setRows(parsed);
        toast.success(`Berhasil membaca ${parsed.length} karyawan dari ${file.name}.`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (rows.length === 0 || isImporting) return;
    setIsImporting(true);
    try {
      const res = await fetch(`/api/client/campaigns/${campaignId}/participants/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Gagal mengimpor karyawan.');
        return;
      }
      toast.success(`${data.imported} karyawan berhasil diimpor. Unduh "Data Login" untuk username & password.`);
      setRows([]);
      onSuccess();
      onClose();
    } catch {
      toast.error('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Impor Karyawan: ${campaignTitle}`}>
      <div className="space-y-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Template Excel Karyawan
            </span>
            <span className="text-[11px] text-slate-500 block">
              Tanpa email. Username & password dibuat otomatis.
            </span>
          </div>
          <button
            type="button"
            onClick={downloadEmployeeExcelTemplate}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" /> Unduh Template
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih File Excel Terisi (.xlsx / .xls / .csv)</label>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="block w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer border border-slate-300 rounded-xl bg-white"
          />
        </div>

        {rows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <span className="font-bold text-emerald-900">{rows.length} karyawan terdeteksi</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 font-bold text-slate-700 sticky top-0">
                  <tr>
                    <th className="p-2">No</th>
                    <th className="p-2">Nama</th>
                    <th className="p-2">Jabatan</th>
                    <th className="p-2">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 200).map((r, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="p-2 text-slate-400 font-mono">{i + 1}</td>
                      <td className="p-2 font-bold text-slate-900">{r.full_name}</td>
                      <td className="p-2 text-slate-600">{r.position || '-'}</td>
                      <td className="p-2 text-slate-500">{r.unit_work || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={isImporting || rows.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isImporting ? 'Mengimpor...' : `Impor ${rows.length} Karyawan`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
