import { Card } from '@/components/ui/Card';

interface BiodataStageProps {
  userName: string;
  setUserName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  brandColor: string;
}

export function BiodataStage({ userName, setUserName, email, setEmail, onSubmit, brandColor }: BiodataStageProps) {
  return (
    <div className="flex flex-col max-w-md w-full animate-fadeUp">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">Data Peserta</h2>
        <p className="text-slate-500 text-sm mt-1">Harap isi data berikut untuk memulai sesi tes.</p>
      </div>
      <Card>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nama Lengkap</label>
            <input 
              type="text" 
              required 
              value={userName} 
              onChange={e => setUserName(e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:ring-2 transition-all" 
              style={{ '--tw-ring-color': brandColor } as any} 
              placeholder="Nama Lengkap" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Aktif</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:ring-2 transition-all" 
              style={{ '--tw-ring-color': brandColor } as any} 
              placeholder="nama@email.com" 
            />
          </div>
          <button 
            type="submit" 
            className="w-full text-white font-bold py-4 rounded-2xl shadow-md mt-4 transition-all hover:opacity-90" 
            style={{ backgroundColor: brandColor }}
          >
            Lanjut
          </button>
        </form>
      </Card>
    </div>
  );
}
