import { useState, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Upload, Plus, Download } from 'lucide-react';

interface NormsTabProps {
  data: any;
  getTestConfigAndNorms?: (testId: number) => Promise<{ config: any; norms: any[] }>;
  saveScoringConfig?: (testId: number, type: string) => Promise<void>;
  saveNorm?: (id: number | null, testId: number, raw: string, norm: string, label: string, desc: string) => Promise<void>;
  batchInsertNorms?: (testId: number, norms: any[]) => Promise<void>;
}

export function NormsTab({ data, getTestConfigAndNorms, saveScoringConfig, saveNorm, batchInsertNorms }: NormsTabProps) {
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [formulaType, setFormulaType] = useState('matching_key');
  const [normsList, setNormsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [normForm, setNormForm] = useState({ id: null as number | null, raw_score: '', norm_score: '', label: '', description: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async (testIdStr: string) => {
    setSelectedTest(testIdStr);
    if (!testIdStr || !getTestConfigAndNorms) return;
    setLoading(true);
    try {
      const { config, norms } = await getTestConfigAndNorms(Number(testIdStr));
      setFormulaType(config?.formula_type || 'matching_key');
      setNormsList(norms || []);
    } catch (e: any) {
      toast.error('Gagal memuat konfigurasi: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedTest || !saveScoringConfig) return;
    setLoading(true);
    try {
      await saveScoringConfig(Number(selectedTest), formulaType);
      toast.success('Konfigurasi scoring berhasil disimpan');
    } catch (e: any) {
      toast.error('Gagal menyimpan: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (n: any = null) => {
    if (n) {
      setNormForm({ id: n.id, raw_score: n.raw_score, norm_score: n.norm_score, label: n.label || '', description: n.description || '' });
    } else {
      setNormForm({ id: null, raw_score: '', norm_score: '', label: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveNorm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest || !saveNorm) return;
    setLoading(true);
    try {
      await saveNorm(normForm.id, Number(selectedTest), normForm.raw_score, normForm.norm_score, normForm.label, normForm.description);
      toast.success('Norma berhasil disimpan');
      setIsModalOpen(false);
      await loadData(selectedTest);
    } catch (e: any) {
      toast.error('Gagal menyimpan: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTest || !batchInsertNorms) return;
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      
      const parsedNorms = rows.map((r: any) => ({
        raw_score: String(r['Skor Mentah (Raw)'] || r['raw_score'] || ''),
        norm_score: String(r['Skor Standar'] || r['norm_score'] || ''),
        label: String(r['Kategori Label'] || r['label'] || ''),
        description: String(r['Deskripsi'] || r['description'] || '')
      })).filter(r => r.raw_score && r.norm_score);

      if (parsedNorms.length === 0) throw new Error('Format file tidak sesuai atau kosong');

      await batchInsertNorms(Number(selectedTest), parsedNorms);
      toast.success(`Berhasil impor ${parsedNorms.length} baris norma`);
      await loadData(selectedTest);
    } catch (err: any) {
      toast.error('Gagal impor: ' + err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "Skor Mentah (Raw)": "10-15", "Skor Standar": "100", "Kategori Label": "Average", "Deskripsi": "Kapasitas rata-rata" },
      { "Skor Mentah (Raw)": "16-20", "Skor Standar": "110", "Kategori Label": "Bright", "Deskripsi": "Kapasitas di atas rata-rata" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Norma.xlsx");
  };

  return (
    <div className="w-full animate-fadeUp">
      <Card noPadding className="p-6 mb-8">
        <h2 className="font-display font-bold text-lg text-slate-900 mb-2">Pengaturan Norma & Scoring Konfigurasi</h2>
        <p className="text-xs text-slate-400 mb-6">Unggah XLSX rujukan norma atau atur formula scoring untuk setiap alat tes.</p>

        <div className="grid sm:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pilih Alat Tes</label>
            <select 
              value={selectedTest} 
              onChange={(e) => loadData(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none bg-white"
            >
              <option value="" disabled>-- Pilih Tes --</option>
              {data.tests?.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipe Formula Kalkulasi</label>
            <select 
              value={formulaType}
              onChange={(e) => setFormulaType(e.target.value)}
              disabled={!selectedTest}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none bg-white disabled:bg-slate-50"
            >
              <option value="matching_key">Matching Key (Pencocokan Kunci Jawaban)</option>
              <option value="disc_matrix">DISC Matrix (Paling/Kurang D-I-S-C)</option>
              <option value="papi_vector">PAPI Vector (Penjumlahan Dimensi Arah Diagonal)</option>
              <option value="riasec_score">Holland RIASEC Score (Penjumlahan Kategori)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Aksi Pengaturan</label>
            <Button onClick={handleSaveConfig} disabled={!selectedTest || loading} className="w-full">Simpan Konfigurasi</Button>
          </div>
        </div>

        {selectedTest && (
          <div className="border-t border-slate-100 pt-6 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="font-display font-bold text-base text-slate-800">Daftar Rujukan Norma</h3>
              <div className="flex flex-wrap gap-2">
                <Button onClick={downloadTemplate} variant="outline" size="sm" className="flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" /> Template XLSX
                </Button>
                <input type="file" accept=".xlsx,.xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" className="flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" /> Impor XLSX
                </Button>
                <Button onClick={() => handleOpenModal()} size="sm" className="flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Tambah Manual
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <Table headers={["Skor Mentah (Raw)", "Skor Standar", "Kategori Label", "Deskripsi", "Aksi"]} isEmpty={normsList.length === 0}>
                {normsList.map(n => (
                  <tr key={n.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-700">{n.raw_score}</td>
                    <td className="py-3 px-4 font-bold text-brand-700">{n.norm_score}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-600">{n.label || '-'}</td>
                    <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate" title={n.description}>{n.description || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <Button onClick={() => handleOpenModal(n)} size="sm" variant="outline" className="text-[10px] px-2 py-1 h-auto">Edit</Button>
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={normForm.id ? "Edit Norma" : "Tambah Norma"}>
        <form onSubmit={handleSaveNorm} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Skor Mentah (Raw)</label>
            <input type="text" required value={normForm.raw_score} onChange={e => setNormForm({...normForm, raw_score: e.target.value})} placeholder="e.g. 10 atau DI atau 12-15" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Skor Norma / Konversi</label>
            <input type="text" required value={normForm.norm_score} onChange={e => setNormForm({...normForm, norm_score: e.target.value})} placeholder="e.g. 100 atau R atau Sanguinis" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kategori Label</label>
            <input type="text" value={normForm.label} onChange={e => setNormForm({...normForm, label: e.target.value})} placeholder="e.g. Average, Bright Normal" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Deskripsi Interpretasi</label>
            <textarea rows={3} value={normForm.description} onChange={e => setNormForm({...normForm, description: e.target.value})} placeholder="Deskripsi psikologis..." className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none"></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Norma'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
