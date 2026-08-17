'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Download, Upload, CheckCircle2, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import { downloadCandidateExcelTemplate, parseCandidateExcelFile } from '@/lib/excelTemplate';
import { bulkImportCandidates } from '@/app/(client)/clients/actions';

interface BulkImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: number;
  campaignTitle: string;
  onSuccess: () => void;
}

export function BulkImportExcelModal({
  isOpen,
  onClose,
  campaignId,
  campaignTitle,
  onSuccess,
}: BulkImportExcelModalProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedCandidates, setParsedCandidates] = useState<
    Array<{ full_name: string; email: string; phone_number: string; position: string }>
  >([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (evt) => {
        const buffer = evt.target?.result as ArrayBuffer;
        if (buffer) {
          const parsed = parseCandidateExcelFile(buffer);
          if (parsed.length === 0) {
            toast.error('Format file Excel/CSV tidak valid atau tidak ada baris kandidat terdeteksi.');
            setParsedCandidates([]);
          } else {
            setParsedCandidates(parsed);
            toast.success(`Berhasil membaca ${parsed.length} baris data kandidat dari ${file.name}.`);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleSubmitImport = async () => {
    if (!campaignId || parsedCandidates.length === 0) {
      toast.error('Pilih file Excel terisi terlebih dahulu.');
      return;
    }

    setIsImporting(true);
    try {
      const res = await bulkImportCandidates(campaignId, parsedCandidates);
      toast.success(`Berhasil mengimpor ${res.importedCount} kandidat ke dalam ${campaignTitle}!`);
      setParsedCandidates([]);
      setFileName(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Gagal menyimpan data kandidat: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Bulk Import Excel: ${campaignTitle}`}>
      <div className="space-y-5">
        {/* Step 1: Download Template */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Template Excel Asli (.xlsx)
            </span>
            <span className="text-[11px] text-slate-500 block">
              Unduh template Excel resmi untuk mengisi daftar kandidat.
            </span>
          </div>
          <button
            type="button"
            onClick={downloadCandidateExcelTemplate}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Unduh Template (.xlsx)
          </button>
        </div>

        {/* Step 2: Upload File Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Pilih File Excel Terisi (.xlsx / .xls / .csv)
          </label>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="block w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer border border-slate-300 rounded-xl bg-white"
          />
        </div>

        {/* Step 3: Live Data Preview Table */}
        {parsedCandidates.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <span className="font-bold text-emerald-900">
                Preview Data Terdeteksi: {parsedCandidates.length} Baris Kandidat
              </span>
              <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Format Valid
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-2.5">No</th>
                    <th className="p-2.5">Nama Lengkap</th>
                    <th className="p-2.5">Email</th>
                    <th className="p-2.5">No WhatsApp</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedCandidates.map((cand, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900">{cand.full_name}</td>
                      <td className="p-2.5 font-mono text-slate-600">{cand.email}</td>
                      <td className="p-2.5 text-slate-500 font-mono">{cand.phone_number || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSubmitImport}
            disabled={isImporting || parsedCandidates.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2"
          >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isImporting ? 'Mengimpor Data...' : `SUBMIT & IMPOR ${parsedCandidates.length} KANDIDAT KE DATABASE`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
