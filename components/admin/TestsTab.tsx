import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { getTestQuestions } from '@/app/(admin)/panel/actions';
import { Plus, Settings2 } from 'lucide-react';

interface TestsTabProps {
  data: any;
  onSaveParams?: (id: number, params: any) => Promise<void>;
  onSaveQuestion?: (id: number | null, testId: number, order: number, json: string, type: string) => Promise<void>;
}

export function TestsTab({ data, onSaveParams, onSaveQuestion }: TestsTabProps) {
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [paramsForm, setParamsForm] = useState({ price: 0, duration_sec: 0, is_active: 'true', instructions: '' });
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loading, setLoading] = useState(false);

  const [isQModalOpen, setIsQModalOpen] = useState(false);
  const [qForm, setQForm] = useState({ id: null as number | null, order: 1, json: '', type: 'multiple' });

  const handleSelectTest = async (test: any) => {
    setSelectedTest(test);
    setParamsForm({
      price: Number(test.price),
      duration_sec: test.duration_sec,
      is_active: test.is_active ? 'true' : 'false',
      instructions: test.instructions || ''
    });
    await loadQuestions(test.id);
  };

  const loadQuestions = async (testId: number) => {
    setLoadingQuestions(true);
    try {
      const q = await getTestQuestions(testId);
      setQuestions(q);
    } catch (err: any) {
      toast.error('Gagal memuat soal: ' + err.message);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSaveParams = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveParams || !selectedTest) return;
    setLoading(true);
    try {
      await onSaveParams(selectedTest.id, {
        price: paramsForm.price,
        duration_sec: paramsForm.duration_sec,
        is_active: paramsForm.is_active === 'true',
        instructions: paramsForm.instructions
      });
      toast.success('Parameter master berhasil disimpan!');
    } catch (err: any) {
      toast.error('Gagal menyimpan parameter: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQModal = (q: any = null) => {
    if (q) {
      setQForm({ id: q.id, order: q.order_number, json: JSON.stringify(q.question_data, null, 2), type: q.question_type });
    } else {
      const nextOrder = questions.length > 0 ? Math.max(...questions.map(qu => qu.order_number)) + 1 : 1;
      setQForm({ id: null, order: nextOrder, json: '{\n  "items": []\n}', type: 'multiple' });
    }
    setIsQModalOpen(true);
  };

  const handleSaveQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveQuestion || !selectedTest) return;
    setLoading(true);
    try {
      // Validate JSON
      JSON.parse(qForm.json);
      await onSaveQuestion(qForm.id, selectedTest.id, qForm.order, qForm.json, qForm.type);
      toast.success('Soal berhasil disimpan!');
      setIsQModalOpen(false);
      await loadQuestions(selectedTest.id);
    } catch (err: any) {
      toast.error('JSON tidak valid atau gagal menyimpan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full animate-fadeUp">
      <h2 className="font-display font-bold text-lg text-slate-900 mb-6">Konfigurasi Alat Tes & Bank Soal</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {data.tests?.map((t: any) => (
          <button 
            key={t.id} 
            onClick={() => handleSelectTest(t)}
            className={`bg-white hover:bg-slate-50 border p-5 rounded-2xl text-left shadow-sm transition-all outline-none ${selectedTest?.id === t.id ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200'}`}
          >
            <span className="bg-brand-50 text-brand-700 border border-brand-100 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{t.code}</span>
            <h3 className="font-display font-extrabold text-slate-900 mt-2">{t.name}</h3>
            <p className="text-xs text-brand-700 font-bold mt-1">Rp {Number(t.price).toLocaleString('id-ID')}</p>
            <p className="text-[10px] text-slate-400 mt-1">{Math.round(t.duration_sec/60)} Menit · {t.is_active ? 'Aktif' : 'Nonaktif'}</p>
          </button>
        ))}
      </div>

      {selectedTest && (
        <Card noPadding className="p-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
            <div>
              <h3 className="font-display font-bold text-xl text-slate-900">{selectedTest.name}</h3>
              <p className="text-xs text-slate-400">Penyuntingan parameter master dan butir soal ujian.</p>
            </div>
            <Button onClick={handleSaveParams} disabled={loading} className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Simpan Parameter
            </Button>
          </div>

          <form className="grid sm:grid-cols-3 gap-6 mb-8 border-b border-slate-100 pb-8">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Harga Per Kuota (Rp)</label>
              <input 
                type="number" 
                value={paramsForm.price} 
                onChange={(e) => setParamsForm({...paramsForm, price: Number(e.target.value)})}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Durasi (Detik, 0 = tanpa batas)</label>
              <input 
                type="number" 
                value={paramsForm.duration_sec} 
                onChange={(e) => setParamsForm({...paramsForm, duration_sec: Number(e.target.value)})}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status Aktif</label>
              <select 
                value={paramsForm.is_active} 
                onChange={(e) => setParamsForm({...paramsForm, is_active: e.target.value})}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Instruksi Tes</label>
              <textarea 
                rows={3} 
                value={paramsForm.instructions} 
                onChange={(e) => setParamsForm({...paramsForm, instructions: e.target.value})}
                className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none"
              ></textarea>
            </div>
          </form>

          <div className="flex justify-between items-center mb-4">
            <h4 className="font-display font-bold text-base text-slate-800">Daftar Butir Soal</h4>
            <Button onClick={() => handleOpenQModal()} variant="outline" size="sm" className="flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Tambah Soal
            </Button>
          </div>

          <div className="space-y-3">
            {loadingQuestions ? (
              <p className="text-xs text-slate-400">Memuat soal...</p>
            ) : questions.length === 0 ? (
              <p className="text-xs text-slate-400">Belum ada butir soal.</p>
            ) : questions.map((q) => (
              <div key={q.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-slate-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-xs bg-slate-200 px-2 py-0.5 rounded">#{q.order_number}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{q.question_type}</span>
                  </div>
                  <pre className="text-[10px] text-slate-600 truncate font-mono">{JSON.stringify(q.question_data)}</pre>
                </div>
                <Button onClick={() => handleOpenQModal(q)} variant="outline" size="sm" className="ml-4 text-[10px] px-2 py-1 h-auto">Edit</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal isOpen={isQModalOpen} onClose={() => setIsQModalOpen(false)} title={qForm.id ? "Edit Soal" : "Tambah Soal"}>
        <form onSubmit={handleSaveQ} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nomor Urut</label>
              <input 
                type="number" required 
                value={qForm.order} onChange={e => setQForm({...qForm, order: Number(e.target.value)})}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipe Soal</label>
              <input 
                type="text" required 
                value={qForm.type} onChange={e => setQForm({...qForm, type: e.target.value})}
                placeholder="multiple, disc, dll"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Struktur Data Soal (JSON)</label>
            <p className="text-[10px] text-slate-400 mb-2">Contoh DISC: {"{\"items\": [\"Ramah\", \"Jujur\"]}"} </p>
            <textarea 
              rows={6} required 
              value={qForm.json} onChange={e => setQForm({...qForm, json: e.target.value})}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm font-mono outline-none"
            ></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsQModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Soal'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
