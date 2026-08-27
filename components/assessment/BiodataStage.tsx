import { Card } from '@/components/ui/Card';
import { CheckCircle2, Lock } from 'lucide-react';

interface BiodataStageProps {
  userName: string;
  setUserName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phoneNumber: string;
  setPhoneNumber: (val: string) => void;
  nik: string;
  setNik: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  brandColor: string;
  isGoogleVerified?: boolean;
}

export function BiodataStage({
  userName,
  setUserName,
  email,
  setEmail,
  phoneNumber,
  setPhoneNumber,
  nik,
  setNik,
  onSubmit,
  brandColor,
  isGoogleVerified = true,
}: BiodataStageProps) {
  return (
    <div className="flex flex-col max-w-md w-full animate-fadeUp">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">Data Diri Peserta</h2>
        <p className="text-slate-500 text-sm mt-1">Lengkapi informasi data diri Anda sebelum memulai pengerjaan tes.</p>
      </div>
      <Card>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Email Terverifikasi</label>
              {isGoogleVerified && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Google SSO Verified
                </span>
              )}
            </div>
            <div className="relative">
              <input 
                type="email" 
                required 
                readOnly={isGoogleVerified}
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className={`w-full border rounded-xl px-4 py-3.5 text-sm outline-none transition-all ${
                  isGoogleVerified ? 'bg-slate-50 text-slate-600 border-slate-200 cursor-not-allowed' : 'border-slate-200'
                }`}
                placeholder="nama@email.com" 
              />
              {isGoogleVerified && (
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nama Lengkap</label>
            <input 
              type="text" 
              required 
              value={userName} 
              onChange={e => setUserName(e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:ring-2 transition-all" 
              style={{ '--tw-ring-color': brandColor } as any} 
              placeholder="Nama Lengkap Sesuai KTP" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nomor HP / WhatsApp Active</label>
            <input 
              type="tel" 
              required 
              value={phoneNumber} 
              onChange={e => setPhoneNumber(e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:ring-2 transition-all" 
              style={{ '--tw-ring-color': brandColor } as any} 
              placeholder="Contoh: 081234567890" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">No. Identitas / NIK / NIM (Opsional)</label>
            <input 
              type="text" 
              value={nik} 
              onChange={e => setNik(e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:ring-2 transition-all" 
              style={{ '--tw-ring-color': brandColor } as any} 
              placeholder="Nomor KTP / NIK / Kartu Pelajar" 
            />
          </div>

          <button 
            type="submit" 
            className="w-full text-white font-bold py-4 rounded-2xl shadow-md mt-4 transition-all hover:opacity-90" 
            style={{ backgroundColor: brandColor }}
          >
            Mulai Sesi Ujian Asesmen ➔
          </button>
        </form>
      </Card>
    </div>
  );
}
