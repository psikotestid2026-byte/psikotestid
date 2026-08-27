import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/neon';
import Link from 'next/link';
import { Building2, ClipboardList, ArrowRight, ShieldCheck } from 'lucide-react';

export default async function TestIndexPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/clients/test/login');
  }

  const cleanEmail = session.user.email.trim().toLowerCase();

  // Fetch all campaigns this candidate is registered for
  const enrolledCampaigns = await sql`
    SELECT p.id as participant_id, p.status as participant_status,
           c.id as campaign_id, c.title as campaign_title, c.is_active,
           cust.company_name, cust.logo_url
    FROM participants p
    JOIN campaigns c ON p.campaign_id = c.id
    JOIN customers cust ON c.customer_id = cust.id
    WHERE LOWER(p.email) = ${cleanEmail}
    ORDER BY p.created_at DESC
  `;

  // If candidate is enrolled in exactly 1 campaign, redirect directly to that campaign
  if (enrolledCampaigns.length === 1) {
    redirect(`/clients/test/${enrolledCampaigns[0].campaign_id}`);
  }

  // If candidate is enrolled in multiple campaigns, render Candidate Portal Selector
  if (enrolledCampaigns.length > 1) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
          <div className="mx-auto h-16 w-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">Pilih Sesi Asesmen Anda</h2>
          <p className="text-xs text-slate-500 mt-1">
            Email Anda (<strong>{cleanEmail}</strong>) terdaftar pada beberapa sesi tes perusahaan berikut:
          </p>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-3">
          {enrolledCampaigns.map((item: any) => (
            <Link key={item.participant_id} href={`/clients/test/${item.campaign_id}`}>
              <div className="bg-white border border-slate-200 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/20 rounded-2xl p-4 transition-all shadow-sm flex items-center justify-between group cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{item.company_name}</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{item.campaign_title}</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-1">
                    Status: <span className="font-bold text-slate-700">{item.participant_status}</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // If candidate is not enrolled in any campaign yet (Opening root /clients/test directly)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xl space-y-4">
        <div className="w-16 h-16 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto text-2xl font-bold">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 font-display">Portal Asesmen Peserta</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Halo <strong>{session.user.email}</strong>, Anda telah berhasil masuk menggunakan Google SSO.
        </p>
        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-900 font-extrabold leading-snug">
          Silakan buka <strong>Link Sesi Ujian Spesifik</strong> yang diberikan oleh Tim HR perusahaan Anda (contoh: <code className="bg-sky-100 px-1 py-0.5 rounded font-mono">/clients/test/1</code>).
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Setiap sesi ujian memiliki link unik perusahaan untuk menjamin isolasi data dan keamanan tes Anda.
        </p>
      </div>
    </div>
  );
}
