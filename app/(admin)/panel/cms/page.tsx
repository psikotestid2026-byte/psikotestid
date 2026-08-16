'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  Globe,
  Edit2,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Layout,
  Layers,
} from 'lucide-react';
import TiptapEditor from '@/components/editor/TiptapEditor';

interface CmsItem {
  id: number;
  section_key: string;
  title: string;
  subtitle: string | null;
  content: any;
  is_active: boolean;
  updated_at: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CmsAdminPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/admin/cms', fetcher);
  const cmsContents: CmsItem[] = data?.data || [];

  const [selectedCms, setSelectedCms] = useState<CmsItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit States
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [jsonContentStr, setJsonContentStr] = useState('');
  const [richTextDesc, setRichTextDesc] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleOpenEdit = (cms: CmsItem) => {
    setSelectedCms(cms);
    setTitle(cms.title);
    setSubtitle(cms.subtitle || '');
    setJsonContentStr(JSON.stringify(cms.content, null, 2));
    setRichTextDesc(typeof cms.content === 'object' && cms.content.description ? cms.content.description : '');
    setIsActive(cms.is_active);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedCms || !title) {
      toast.error('Judul section CMS harus diisi.');
      return;
    }

    let parsedContent: any = {};
    try {
      parsedContent = JSON.parse(jsonContentStr);
      if (richTextDesc) {
        parsedContent.description = richTextDesc;
      }
    } catch (e) {
      toast.error('Format JSON pada konten tidak valid.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_key: selectedCms.section_key,
          title,
          subtitle,
          content: parsedContent,
          is_active: isActive,
        }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        toast.error(result.error || 'Gagal menyimpan konten CMS.');
        return;
      }

      toast.success(result.message || 'Konten Landing Page berhasil diperbarui!');
      setIsEditing(false);
      mutate();
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan saat menyimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-500/30 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold text-indigo-200 mb-2">
            <Globe className="w-3.5 h-3.5" /> Landing Page Content Management (CMS)
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Konten Landing Page (Public Front-End)</h1>
          <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
            Atur judul, subjudul, poin keunggulan, FAQ, dan deskripsi promo pada Landing Page publik (`/`) secara langsung dan fleksibel.
          </p>
        </div>
        <button
          onClick={() => mutate()}
          className="px-4 py-2 bg-indigo-700/80 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border border-indigo-500/50"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data CMS
        </button>
      </div>

      {/* Grid CMS Cards */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
          Memuat bagian-bagian konten CMS...
        </div>
      ) : cmsContents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 shadow-sm">
          Belum ada section CMS terdaftar. Silakan jalankan seed data `db/seed.ts`.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cmsContents.map((cms) => (
            <div
              key={cms.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full uppercase border border-indigo-100">
                    Section: {cms.section_key}
                  </span>
                  <span className={`flex items-center gap-1 text-xs font-semibold ${cms.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {cms.is_active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {cms.is_active ? 'Tampil Publik' : 'Disembunyikan'}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 mb-1">{cms.title}</h3>
                {cms.subtitle && <p className="text-xs text-slate-500 mb-3">{cms.subtitle}</p>}

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono overflow-hidden max-h-32 text-ellipsis mb-4">
                  <pre className="whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(cms.content, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Diperbarui: {new Date(cms.updated_at).toLocaleDateString('id-ID')}
                </span>
                <button
                  onClick={() => handleOpenEdit(cms)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Section
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit CMS Section Modal */}
      {isEditing && selectedCms && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Edit Section CMS: {selectedCms.section_key}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Ubah judul, subjudul, dan konfigurasi JSON section ini.</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white text-sm font-bold p-1 rounded-lg">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Utama Section *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subjudul / Deskripsi Singkat</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Tambahan (Tiptap Rich Text)</label>
                <TiptapEditor
                  content={richTextDesc}
                  onChange={(html) => setRichTextDesc(html)}
                  placeholder="Ketik deskripsi rich text section di sini..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Konfigurasi Payload JSON *</label>
                <textarea
                  rows={8}
                  value={jsonContentStr}
                  onChange={(e) => setJsonContentStr(e.target.value)}
                  className="w-full p-3 font-mono text-xs text-slate-900 border border-slate-300 rounded-xl bg-slate-50 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="cms_active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                />
                <label htmlFor="cms_active" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Tampilkan Section Ini Di Landing Page Publik (`/`)
                </label>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isSaving ? 'Simpan...' : 'Simpan Perubahan CMS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
