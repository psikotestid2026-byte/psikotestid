import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface SettingsTabProps {
  data: any;
}

export function SettingsTab({ data }: SettingsTabProps) {
  return (
    <div className="max-w-3xl mx-auto animate-fadeUp">
      <h2 className="font-display font-bold text-lg text-slate-900 mb-6">Pengaturan Branding</h2>
      <Card>
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Nama Perusahaan</label>
            <input 
              type="text" 
              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm" 
              defaultValue={data.customer?.company_name} 
              disabled 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Logo Perusahaan (URL)</label>
            <input 
              type="text" 
              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
              defaultValue={data.customer?.logo_url} 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Warna Utama (Brand Color)</label>
            <div className="flex items-center gap-4">
              <input 
                type="color" 
                className="w-12 h-12 p-1 border border-slate-200 rounded-xl cursor-pointer" 
                defaultValue={data.customer?.brand_color} 
              />
              <input 
                type="text" 
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none uppercase font-mono" 
                defaultValue={data.customer?.brand_color} 
              />
            </div>
          </div>
          <Button type="button" className="w-full">Simpan Perubahan</Button>
        </form>
      </Card>
    </div>
  );
}
