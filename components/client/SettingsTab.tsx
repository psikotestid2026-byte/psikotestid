'use client';

import { useState } from 'react';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Upload, Building, Image as ImageIcon, CheckCircle2, Loader2 } from 'lucide-react';
import { updateCustomerBranding } from '@/app/(client)/clients/actions';
import { compressPaymentProof } from '@/lib/imageCompressor';

interface SettingsTabProps {
  data: any;
}

export function SettingsTab({ data }: SettingsTabProps) {
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState(data.customer?.company_name || '');
  const [logoUrl, setLogoUrl] = useState(data.customer?.logo_url || '');
  const [brandColor, setBrandColor] = useState(data.customer?.brand_color || '#2563eb');
  const [isCompressing, setIsCompressing] = useState(false);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsCompressing(true);
      try {
        const { compressedFile } = await compressPaymentProof(file, 800, 800, 0.85);
        const reader = new FileReader();
        reader.onload = (evt) => {
          const result = evt.target?.result as string;
          if (result) {
            setLogoUrl(result);
            toast.success(`Berhasil memproses gambar logo (${file.name})!`);
          }
        };
        reader.readAsDataURL(compressedFile);
      } catch (err: any) {
        toast.error('Gagal memproses file gambar logo.');
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!data.customer?.id) return;

    if (!companyName || companyName.trim().length === 0) {
      toast.error('Nama Perusahaan wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      await updateCustomerBranding(data.customer.id, {
        company_name: companyName,
        logo_url: logoUrl,
        brand_color: brandColor,
      });
      await mutate('/api/client/data');
      toast.success('Pengaturan Branding Corporate berhasil diperbarui!');
    } catch (err: any) {
      toast.error('Gagal menyimpan pengaturan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fadeUp">
      <div>
        <h2 className="font-display font-bold text-xl text-slate-900">Branding Portal Corporate</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Atur nama perusahaan, logo portal HR, dan warna utama sesuai brand perusahaan Anda.
        </p>
      </div>

      <Card className="border border-slate-200 shadow-sm p-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Company Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Perusahaan / Instansi *</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500"
              placeholder="Contoh: PT Lentera Hebat Indonesia"
            />
          </div>

          {/* Logo Upload & Live Preview Card */}
          <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700">Logo Perusahaan (Upload Gambar File / URL)</label>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Real-Time Live Preview Avatar */}
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
                {logoUrl ? (
                  <img src={logoUrl} alt="Preview Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-2">
                    <Building className="w-6 h-6 text-slate-400 mx-auto" />
                    <span className="text-[9px] text-slate-400 font-bold block mt-1">Logo HR</span>
                  </div>
                )}
              </div>

              {/* Upload Input & URL fallback */}
              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all">
                    {isCompressing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {isCompressing ? 'Memproses Logo...' : 'Upload File Logo (.png, .jpg, .svg)'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                  </label>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="text-xs text-red-600 font-bold hover:underline"
                    >
                      Hapus Logo
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Atau masukkan link/URL gambar logo langsung:</span>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-700 bg-white"
                    placeholder="https://example.com/logo-perusahaan.png"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Brand Color Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Warna Utama (Brand Color)</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-12 h-10 p-1 border border-slate-300 rounded-xl cursor-pointer bg-white"
              />
              <input
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-44 border border-slate-300 rounded-xl px-4 py-2 text-xs font-mono font-bold uppercase text-slate-900"
                placeholder="#2563EB"
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading || isCompressing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {loading ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Branding Portal'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
