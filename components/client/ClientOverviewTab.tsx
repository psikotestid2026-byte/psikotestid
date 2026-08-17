'use client';

import Link from 'next/link';
import { Brain, Users, Building, Activity, Wallet, PlusCircle, ArrowRight, CheckCircle2, Ticket, Link as LinkIcon, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ClientOverviewTabProps {
  data: any;
}

export function ClientOverviewTab({ data }: ClientOverviewTabProps) {
  const walletBalance = Number(data.customer?.balance || 0);
  const totalQuotas = data.quotas.reduce((acc: any, q: any) => acc + (q.quota || 0), 0);
  const totalCompletedParticipants = data.participants.filter((p: any) => p.status === 'COMPLETED').length;
  const activeCampaignsCount = data.campaigns.length;

  const steps = [
    {
      step: 1,
      title: 'Top-Up Saldo Wallet',
      description: 'Isi saldo wallet akun HR via transfer bank manual/VA.',
      href: '/clients/billing?topup=true',
      buttonText: '+ Top-Up Saldo',
      icon: <Wallet className="w-4 h-4 text-emerald-400" />,
      isDone: walletBalance > 0,
    },
    {
      step: 2,
      title: 'Beli Kuota Alat Tes',
      description: 'Potong saldo wallet untuk membeli kuota tes (DISC, WPT, dll).',
      href: '/clients/billing',
      buttonText: 'Beli Kuota Tes',
      icon: <Ticket className="w-4 h-4 text-indigo-400" />,
      isDone: totalQuotas > 0,
    },
    {
      step: 3,
      title: 'Buat Campaign Sesi Ujian',
      description: 'Buat sesi tes baru untuk rekrutmen / promosi karyawan.',
      href: '/clients/campaigns',
      buttonText: 'Buat Campaign',
      icon: <Building className="w-4 h-4 text-purple-400" />,
      isDone: activeCampaignsCount > 0,
    },
    {
      step: 4,
      title: 'Daftarkan Peserta & Kirim Link WA',
      description: 'Input kandidat (manual/Excel) & kirim link ujian via WA.',
      href: '/clients/campaigns',
      buttonText: 'Daftarkan Peserta',
      icon: <LinkIcon className="w-4 h-4 text-blue-400" />,
      isDone: data.participants.length > 0,
    },
    {
      step: 5,
      title: 'Pantau Hasil & Unduh PDF',
      description: 'Lihat skor psikotes, grafik DISC, & unduh laporan PDF.',
      href: '/clients/participants',
      buttonText: 'Lihat Hasil Asesmen',
      icon: <FileText className="w-4 h-4 text-amber-400" />,
      isDone: totalCompletedParticipants > 0,
    },
  ];

  return (
    <div className="w-full animate-fadeUp space-y-6">
      {/* STEPPER WORKFLOW GUIDE CARD FOR HR CLIENTS */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full border border-indigo-400/30">
              🚀 ALUR KERJA HR: 5 LANGKAH MEMULAI ASESMEN
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white mt-1.5">
              Panduan Urutan Penggunaan Portal HR Client
            </h2>
            <p className="text-xs text-indigo-200 mt-0.5 max-w-2xl leading-relaxed">
              Ikuti urutan 5 langkah praktis di bawah ini untuk memulai sesi ujian psikotes dan menerima laporan kandidat.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/20 shrink-0">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-[10px] text-slate-300 block font-bold">Saldo Wallet HR</span>
              <span className="text-base font-extrabold font-mono text-emerald-400">
                Rp {Number(walletBalance).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* 5 Interactive Stepper Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {steps.map((st) => (
            <div
              key={st.step}
              className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                st.isDone
                  ? 'bg-slate-800/80 border-emerald-500/40'
                  : 'bg-white/5 border-white/10 hover:border-indigo-400/50'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center font-mono">
                    {st.step}
                  </span>
                  {st.isDone ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Selesai
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-indigo-300">Langkah {st.step}</span>
                  )}
                </div>

                <h3 className="font-bold text-xs text-white leading-snug">{st.title}</h3>
                <p className="text-[11px] text-slate-300 leading-relaxed">{st.description}</p>
              </div>

              <div className="pt-3 mt-2 border-t border-white/10">
                <Link href={st.href}>
                  <button className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 shadow-sm transition-all">
                    <span>{st.buttonText}</span> <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Total Kuota Tersedia</h3>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center"><Brain className="w-4 h-4 text-blue-600" /></div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{totalQuotas}</div>
          <p className="text-xs text-slate-400">Dari {data.quotas.length} jenis tes</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Total Peserta Selesai</h3>
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center"><Users className="w-4 h-4 text-green-600" /></div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{totalCompletedParticipants}</div>
          <p className="text-xs text-slate-400">Kandidat</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Campaign Aktif</h3>
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center"><Building className="w-4 h-4 text-purple-600" /></div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{activeCampaignsCount}</div>
          <p className="text-xs text-slate-400">Sesi ujian berjalan</p>
        </Card>
      </div>

      {/* Quota Breakdown & Last Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card noPadding>
          <div className="p-6">
            <h2 className="font-display font-bold text-lg text-slate-900 mb-4">Rincian Kuota</h2>
            <div className="space-y-4">
              {data.quotas.length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-4">Belum ada kuota. Beli kuota menggunakan Saldo Wallet di atas.</div>
              ) : data.quotas.map((q: any) => {
                const test = data.tests.find((t: any) => String(t.id) === String(q.test_id));
                const testName = q.test_name || test?.name || 'Instrumen Psikotes';
                const testCode = q.test_code || test?.code || 'TES';

                return (
                  <div key={q.id} className="flex items-center justify-between border-b border-slate-50 pb-3">
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{testName}</div>
                      <div className="text-xs font-mono text-indigo-600 font-bold">{testCode.toUpperCase()}</div>
                    </div>
                    <div className="font-mono font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-lg">{q.quota} Kuota</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
        
        <Card noPadding>
          <div className="p-6">
            <h2 className="font-display font-bold text-lg text-slate-900 mb-4">Riwayat Penggunaan Terakhir</h2>
            <div className="space-y-4">
              {data.transactions.length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-4">Belum ada transaksi</div>
              ) : data.transactions.slice(0, 5).map((t: any) => (
                <div key={t.id} className="flex items-start gap-3 border-b border-slate-50 pb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.type === 'DEBIT' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-800 truncate">{t.description}</div>
                    <div className="text-xs text-slate-400">{new Date(t.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className={`text-sm font-bold shrink-0 ${t.type === 'DEBIT' ? 'text-red-600' : 'text-green-600'}`}>
                    {t.type === 'DEBIT' ? '-' : '+'}{t.quantity}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
