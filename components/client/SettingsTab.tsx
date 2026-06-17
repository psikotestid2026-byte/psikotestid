import { useState } from 'react';
import { mutate } from 'swr';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { updateCustomerBranding } from '@/app/(client)/clients/actions';

interface SettingsTabProps {
  data: any;
}

export function SettingsTab({ data }: SettingsTabProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!data.customer?.id) return;
    
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await updateCustomerBranding(data.customer.id, {
        company_name: formData.get('company_name') as string,
        logo_url: formData.get('logo_url') as string,
        brand_color: formData.get('brand_color') as string,
      });
      await mutate('/api/client/data');
      alert('Pengaturan berhasil disimpan!');
    } catch (err: any) {
      alert('Gagal menyimpan pengaturan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fadeUp">
      <h2 className="font-display font-bold text-lg text-slate-900 mb-6">Pengaturan Branding</h2>
      <Card>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Nama Perusahaan</label>
            <input 
              name="company_name"
              type="text" 
              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm" 
              defaultValue={data.customer?.company_name} 
              disabled={false}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Logo Perusahaan (URL)</label>
            <input 
              name="logo_url"
              type="text" 
              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
              defaultValue={data.customer?.logo_url} 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Warna Utama (Brand Color)</label>
            <div className="flex items-center gap-4">
              <input 
                name="brand_color"
                type="color" 
                className="w-12 h-12 p-1 border border-slate-200 rounded-xl cursor-pointer" 
                defaultValue={data.customer?.brand_color} 
              />
              <input 
                type="text" 
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none uppercase font-mono" 
                defaultValue={data.customer?.brand_color} 
                onChange={(e) => {
                  const colorInput = e.currentTarget.previousElementSibling as HTMLInputElement;
                  if (colorInput) colorInput.value = e.currentTarget.value;
                }}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
