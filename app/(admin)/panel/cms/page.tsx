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
  Gift,
  Coins,
  Save,
  Upload,
  Image as ImageIcon,
  Plus,
  Trash2,
  Code,
  Sliders,
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  List,
  Sparkle
} from 'lucide-react';
import dynamic from 'next/dynamic';

const TiptapEditor = dynamic(() => import('@/components/ui/TiptapEditor'), {
  ssr: false,
  loading: () => <div className="p-4 border rounded-xl text-xs text-slate-400">Memuat Rich Text Editor...</div>,
});

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
  const { data, isLoading, mutate } = useSWR('/api/admin/cms', fetcher);
  const cmsContents: CmsItem[] = data?.data || [];

  // Welcome Bonus Settings state
  const bonusCmsItem = cmsContents.find((item) => item.section_key === 'hr_welcome_bonus');
  const [bonusEnabled, setBonusEnabled] = useState<boolean>(
    bonusCmsItem ? bonusCmsItem.content?.is_enabled !== false : true
  );
  const [bonusAmount, setBonusAmount] = useState<string>(
    bonusCmsItem ? (bonusCmsItem.content?.bonus_amount ?? 25000).toString() : '25000'
  );
  const [isSavingBonus, setIsSavingBonus] = useState(false);

  // Favicon Control state
  const faviconCmsItem = cmsContents.find((item) => item.section_key === 'site_favicon');
  const [faviconUrl, setFaviconUrl] = useState<string>(
    faviconCmsItem?.content?.favicon_url || '/favicon.ico'
  );
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);

  // Modal Editing States
  const [selectedCms, setSelectedCms] = useState<CmsItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState<'VISUAL' | 'JSON'>('VISUAL');

  // Form Fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [jsonContentStr, setJsonContentStr] = useState('');

  // Structured Field States for Visual Editor
  const [ctaPrimaryText, setCtaPrimaryText] = useState('');
  const [ctaPrimaryUrl, setCtaPrimaryUrl] = useState('');
  const [ctaSecondaryText, setCtaSecondaryText] = useState('');
  const [ctaSecondaryUrl, setCtaSecondaryUrl] = useState('');
  const [trustMetrics, setTrustMetrics] = useState<Array<{ label: string; value: string }>>([]);
  const [featureItems, setFeatureItems] = useState<Array<{ icon: string; title: string; description: string }>>([]);
  const [pricingHighlights, setPricingHighlights] = useState<string[]>([]);
  const [faqItems, setFaqItems] = useState<Array<{ q: string; a: string }>>([]);
  const [contactInfo, setContactInfo] = useState({ email: '', phone: '', whatsapp: '', address: '' });

  const handleOpenEdit = (cms: CmsItem) => {
    setSelectedCms(cms);
    setTitle(cms.title || '');
    setSubtitle(cms.subtitle || '');
    setIsActive(cms.is_active);
    setJsonContentStr(JSON.stringify(cms.content || {}, null, 2));

    const content = cms.content || {};

    // Populate structured visual states based on section_key
    if (cms.section_key === 'hero') {
      setCtaPrimaryText(content.cta_primary_text || '');
      setCtaPrimaryUrl(content.cta_primary_url || '');
      setCtaSecondaryText(content.cta_secondary_text || '');
      setCtaSecondaryUrl(content.cta_secondary_url || '');
      setTrustMetrics(content.trust_metrics || []);
    } else if (cms.section_key === 'features') {
      setFeatureItems(content.items || []);
    } else if (cms.section_key === 'pricing_banner') {
      setPricingHighlights(content.highlights || []);
    } else if (cms.section_key === 'faq') {
      setFaqItems(content.items || []);
    } else if (cms.section_key === 'contact_info') {
      setContactInfo({
        email: content.email || '',
        phone: content.phone || '',
        whatsapp: content.whatsapp || '',
        address: content.address || '',
      });
    }

    setEditMode('VISUAL');
    setIsEditing(true);
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingFavicon(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/admin/cms/favicon', {
          method: 'POST',
          body: formData,
        });
        const result = await res.json();

        if (!res.ok || !result.success) {
          toast.error(result.error || 'Gagal mengunggah favicon.');
          return;
        }

        setFaviconUrl(result.favicon_url);
        toast.success('Favicon official website berhasil diperbarui!');
        mutate();
      } catch (err: any) {
        toast.error('Gagal mengunggah file favicon: ' + err.message);
      } finally {
        setIsUploadingFavicon(false);
      }
    }
  };

  const handleSaveBonus = async () => {
    const amount = Number(bonusAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Nominal bonus saldo pendaftaran harus berupa angka positif.');
      return;
    }

    setIsSavingBonus(true);
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_key: 'hr_welcome_bonus',
          title: 'Bonus Saldo Pendaftaran HR Client Baru',
          subtitle: 'Konfigurasi bonus saldo pendaftaran gratis untuk akun HR baru',
          content: {
            is_enabled: bonusEnabled,
            bonus_amount: amount,
          },
          is_active: bonusEnabled,
        }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        toast.error(result.error || 'Gagal menyimpan konfigurasi bonus saldo.');
        return;
      }

      toast.success('Pengaturan Bonus Saldo HR Client Baru berhasil disimpan!');
      mutate();
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setIsSavingBonus(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCms || !title) {
      toast.error('Judul section CMS harus diisi.');
      return;
    }

    let finalContent: any = {};

    if (editMode === 'JSON') {
      try {
        finalContent = JSON.parse(jsonContentStr);
      } catch (e) {
        toast.error('Format JSON tidak valid.');
        return;
      }
    } else {
      // Build object from visual form
      if (selectedCms.section_key === 'hero') {
        finalContent = {
          cta_primary_text: ctaPrimaryText,
          cta_primary_url: ctaPrimaryUrl,
          cta_secondary_text: ctaSecondaryText,
          cta_secondary_url: ctaSecondaryUrl,
          trust_metrics: trustMetrics,
        };
      } else if (selectedCms.section_key === 'features') {
        finalContent = { items: featureItems };
      } else if (selectedCms.section_key === 'pricing_banner') {
        finalContent = { highlights: pricingHighlights };
      } else if (selectedCms.section_key === 'faq') {
        finalContent = { items: faqItems };
      } else if (selectedCms.section_key === 'contact_info') {
        finalContent = contactInfo;
      } else {
        try {
          finalContent = JSON.parse(jsonContentStr);
        } catch (e) {
          finalContent = selectedCms.content;
        }
      }
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
          content: finalContent,
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
            <Globe className="w-3.5 h-3.5" /> Landing Page Content & Visual CMS Manager
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Konten & Tampilan Landing Page</h1>
          <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
            Ubah teks headline, fitur unggulan, FAQ, dan poin promosi landing page publik secara visual dengan mudah tanpa perlu mengetik sintaks JSON.
          </p>
        </div>

        <button
          onClick={() => mutate()}
          className="px-4 py-2 bg-indigo-700/80 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border border-indigo-500/50 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Konten
        </button>
      </div>

      {/* Website Favicon Control Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <img src={faviconUrl} alt="Favicon" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" /> Website Branding Favicon
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" /> Favicon Official Website (Browser Tab Icon)
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ganti ikon tab browser bawaan Next.js/Vercel dengan ikon Favicon resmi RuangTes Enterprise via Vercel Blob Storage.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md">
            {isUploadingFavicon ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isUploadingFavicon ? 'Mengunggah...' : 'Upload Favicon Baru (.svg/.png/.ico)'}
            <input type="file" accept="image/*" onChange={handleFaviconUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Welcome Bonus Card */}
      <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Bonus Saldo Pendaftaran HR Client Baru</h3>
              <p className="text-xs text-slate-500">Atur besaran deposit saldo gratis yang diberikan secara otomatis saat perusahaan baru mendaftar.</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={bonusEnabled}
              onChange={(e) => setBonusEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            <span className="ml-3 text-xs font-bold text-slate-700">{bonusEnabled ? 'Bonus Aktif' : 'Nonaktif'}</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Bonus Saldo Wallet (Rp)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Coins className="w-4 h-4 text-emerald-600" />
              </div>
              <input
                type="number"
                disabled={!bonusEnabled}
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
                className="pl-10 w-full py-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                placeholder="25000"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveBonus}
              disabled={isSavingBonus}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {isSavingBonus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSavingBonus ? 'Memuat...' : 'Simpan Pengaturan Bonus Saldo'}
            </button>
          </div>
        </div>
      </div>

      {/* Grid CMS Cards (User Friendly Preview) */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
          Memuat bagian-bagian konten CMS...
        </div>
      ) : cmsContents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 shadow-sm">
          Belum ada section CMS terdaftar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cmsContents.map((cms) => {
            const content = cms.content || {};
            return (
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

                  {/* Human-Readable Content Summary */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2 mb-4">
                    {cms.section_key === 'hero' && (
                      <div className="space-y-1">
                        <div className="font-semibold text-indigo-900">Tombol Utama: <span className="text-slate-700 font-normal">{content.cta_primary_text || '-'}</span></div>
                        <div className="font-semibold text-indigo-900">Metrics Kepercayaan: <span className="text-slate-700 font-normal">{(content.trust_metrics || []).map((m: any) => `${m.label} (${m.value})`).join(', ')}</span></div>
                      </div>
                    )}

                    {cms.section_key === 'features' && (
                      <div className="space-y-1">
                        <div className="font-bold text-slate-800">Item Fitur ({content.items?.length || 0}):</div>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                          {(content.items || []).slice(0, 3).map((item: any, idx: number) => (
                            <li key={idx}><strong className="text-slate-900">{item.title}:</strong> {item.description}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {cms.section_key === 'pricing_banner' && (
                      <div className="space-y-1">
                        <div className="font-bold text-slate-800">Poin Keunggulan:</div>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                          {(content.highlights || []).map((h: string, idx: number) => (
                            <li key={idx}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {cms.section_key === 'faq' && (
                      <div className="space-y-1">
                        <div className="font-bold text-slate-800">Daftar FAQ ({content.items?.length || 0} Pertanyaan):</div>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600">
                          {(content.items || []).slice(0, 2).map((item: any, idx: number) => (
                            <li key={idx}><strong className="text-slate-900">Q: {item.q}</strong></li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {cms.section_key === 'contact_info' && (
                      <div className="grid grid-cols-2 gap-2 text-slate-700">
                        <div><strong className="text-slate-900">Email:</strong> {content.email}</div>
                        <div><strong className="text-slate-900">Telepon:</strong> {content.phone}</div>
                        <div className="col-span-2"><strong className="text-slate-900">Alamat:</strong> {content.address}</div>
                      </div>
                    )}

                    {!['hero', 'features', 'pricing_banner', 'faq', 'contact_info'].includes(cms.section_key) && (
                      <pre className="whitespace-pre-wrap font-mono text-[11px]">
                        {JSON.stringify(content, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Diperbarui: {new Date(cms.updated_at).toLocaleDateString('id-ID')}
                  </span>
                  <button
                    onClick={() => handleOpenEdit(cms)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Section
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit CMS Section Modal */}
      {isEditing && selectedCms && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" /> Edit Content: {selectedCms.section_key}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Ubah judul, teks, dan struktur visual section landing page.</p>
              </div>

              {/* Mode Toggle: Visual vs JSON */}
              <div className="flex items-center gap-2">
                <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setEditMode('VISUAL')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      editMode === 'VISUAL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Visual Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode('JSON')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      editMode === 'JSON' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    JSON Mode
                  </button>
                </div>

                <button
                  onClick={() => setIsEditing(false)}
                  className="text-slate-400 hover:text-white text-sm font-bold p-1 rounded-lg ml-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Common Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Utama Section *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subjudul / Deskripsi Singkat</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Visual Form Elements */}
              {editMode === 'VISUAL' ? (
                <div className="border-t border-slate-200 pt-4 space-y-4">
                  {/* HERO SECTION VISUAL EDITOR */}
                  {selectedCms.section_key === 'hero' && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-indigo-900 text-sm">Pengaturan Tombol & Metric Kepercayaan</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Teks Tombol Utama</label>
                          <input
                            type="text"
                            value={ctaPrimaryText}
                            onChange={(e) => setCtaPrimaryText(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Link Tombol Utama</label>
                          <input
                            type="text"
                            value={ctaPrimaryUrl}
                            onChange={(e) => setCtaPrimaryUrl(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="font-bold text-slate-700">Metrics Angka Kepercayaan</label>
                          <button
                            type="button"
                            onClick={() => setTrustMetrics([...trustMetrics, { label: 'Metric Baru', value: '100+' }])}
                            className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Tambah Metric
                          </button>
                        </div>

                        {trustMetrics.map((m, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <input
                              type="text"
                              placeholder="Label (mis: Asesmen Terproses)"
                              value={m.label}
                              onChange={(e) => {
                                const next = [...trustMetrics];
                                next[idx].label = e.target.value;
                                setTrustMetrics(next);
                              }}
                              className="w-1/2 p-2 border border-slate-300 rounded-lg text-xs bg-white"
                            />
                            <input
                              type="text"
                              placeholder="Nilai (mis: 150.000+)"
                              value={m.value}
                              onChange={(e) => {
                                const next = [...trustMetrics];
                                next[idx].value = e.target.value;
                                setTrustMetrics(next);
                              }}
                              className="w-1/2 p-2 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setTrustMetrics(trustMetrics.filter((_, i) => i !== idx))}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FEATURES SECTION VISUAL EDITOR */}
                  {selectedCms.section_key === 'features' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-indigo-900 text-sm">Daftar Fitur Unggulan Platform</h4>
                        <button
                          type="button"
                          onClick={() => setFeatureItems([...featureItems, { icon: 'ShieldCheck', title: 'Fitur Baru', description: 'Deskripsi fitur baru.' }])}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Tambah Item Fitur
                        </button>
                      </div>

                      {featureItems.map((item, idx) => (
                        <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800">Fitur #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => setFeatureItems(featureItems.filter((_, i) => i !== idx))}
                              className="text-rose-600 hover:bg-rose-50 p-1 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              placeholder="Judul Fitur"
                              value={item.title}
                              onChange={(e) => {
                                const next = [...featureItems];
                                next[idx].title = e.target.value;
                                setFeatureItems(next);
                              }}
                              className="col-span-2 p-2 border border-slate-300 rounded-lg bg-white"
                            />
                            <input
                              type="text"
                              placeholder="Icon Lucide (mis: Zap)"
                              value={item.icon}
                              onChange={(e) => {
                                const next = [...featureItems];
                                next[idx].icon = e.target.value;
                                setFeatureItems(next);
                              }}
                              className="p-2 border border-slate-300 rounded-lg bg-white font-mono text-[11px]"
                            />
                          </div>
                          <textarea
                            rows={2}
                            placeholder="Deskripsi Fitur..."
                            value={item.description}
                            onChange={(e) => {
                              const next = [...featureItems];
                              next[idx].description = e.target.value;
                              setFeatureItems(next);
                            }}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* PRICING BANNER VISUAL EDITOR */}
                  {selectedCms.section_key === 'pricing_banner' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-indigo-900 text-sm">Poin-poin Keunggulan Lisensi</h4>
                        <button
                          type="button"
                          onClick={() => setPricingHighlights([...pricingHighlights, 'Poin baru'])}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Tambah Poin
                        </button>
                      </div>

                      {pricingHighlights.map((hl, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={hl}
                            onChange={(e) => {
                              const next = [...pricingHighlights];
                              next[idx] = e.target.value;
                              setPricingHighlights(next);
                            }}
                            className="w-full p-2.5 border border-slate-300 rounded-xl"
                          />
                          <button
                            type="button"
                            onClick={() => setPricingHighlights(pricingHighlights.filter((_, i) => i !== idx))}
                            className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* FAQ SECTION VISUAL EDITOR */}
                  {selectedCms.section_key === 'faq' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-indigo-900 text-sm">Daftar Pertanyaan FAQ</h4>
                        <button
                          type="button"
                          onClick={() => setFaqItems([...faqItems, { q: 'Pertanyaan baru?', a: 'Jawaban FAQ.' }])}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Tambah FAQ
                        </button>
                      </div>

                      {faqItems.map((item, idx) => (
                        <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800">FAQ #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => setFaqItems(faqItems.filter((_, i) => i !== idx))}
                              className="text-rose-600 hover:bg-rose-50 p-1 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Pertanyaan (Q)..."
                            value={item.q}
                            onChange={(e) => {
                              const next = [...faqItems];
                              next[idx].q = e.target.value;
                              setFaqItems(next);
                            }}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold text-indigo-900"
                          />
                          <textarea
                            rows={2}
                            placeholder="Jawaban (A)..."
                            value={item.a}
                            onChange={(e) => {
                              const next = [...faqItems];
                              next[idx].a = e.target.value;
                              setFaqItems(next);
                            }}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CONTACT INFO VISUAL EDITOR */}
                  {selectedCms.section_key === 'contact_info' && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-indigo-900 text-sm">Informasi Kontak & Layanan</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Email Support</label>
                          <input
                            type="email"
                            value={contactInfo.email}
                            onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                            className="w-full p-2.5 border border-slate-300 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Telepon / WhatsApp</label>
                          <input
                            type="text"
                            value={contactInfo.phone}
                            onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value, whatsapp: e.target.value })}
                            className="w-full p-2.5 border border-slate-300 rounded-xl"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block font-bold text-slate-700 mb-1">Alamat Kantor</label>
                          <textarea
                            rows={2}
                            value={contactInfo.address}
                            onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                            className="w-full p-2.5 border border-slate-300 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* JSON EDITOR MODE */
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Konfigurasi Payload Raw JSON *</label>
                  <textarea
                    rows={12}
                    value={jsonContentStr}
                    onChange={(e) => setJsonContentStr(e.target.value)}
                    className="w-full p-3 font-mono text-xs text-slate-900 border border-slate-300 rounded-xl bg-slate-50 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
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

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isSaving ? 'Memuat...' : 'Simpan Perubahan Section'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
