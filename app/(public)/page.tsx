'use client';

import { Building, Brain, LayoutDashboard, PlayCircle, Hexagon, Triangle, CircleDot, Box, Aperture, Coins, Link as LinkIcon, FileCheck, Palette, BarChart3, Users, Check, Briefcase, GraduationCap, BrainCircuit, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

export default function PublicPage() {
  return (
    <div className="min-h-screen">
      {/* ===== NAVBAR ===== */}
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-800 text-brand-800 text-lg leading-tight tracking-tight">
              PsikoTest<span className="text-brand-500">.id</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#cara-kerja" className="hover:text-brand-600 transition-colors">Cara Kerja</a>
            <a href="#fitur" className="hover:text-brand-600 transition-colors">Fitur Platform</a>
            <a href="#untuk-siapa" className="hover:text-brand-600 transition-colors">Untuk Siapa</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/clients" className="hidden sm:flex text-brand-600 font-semibold text-sm hover:text-brand-800 transition-colors">
              Masuk
            </Link>
            <Link href="/clients" className="btn-primary text-white font-semibold text-sm px-4 py-2 rounded-full border border-brand-200 transition-all shadow-md">
              Daftar Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO BANNER ===== */}
      <section className="hero-mesh pt-28 pb-20 px-4">
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 badge-promo text-white text-xs font-bold px-3 py-1.5 rounded-full mb-5 shadow-md">
            <Building className="w-3.5 h-3.5" />
            SOLUSI UNTUK HR, SEKOLAH & KLIEN KORPORAT
          </div>

          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
              Kelola Asesmen Psikologi Tim Anda dalam <span className="text-brand-200">Satu Dashboard</span>
            </h1>
            <p className="text-brand-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Platform B2B SaaS untuk menyelenggarakan psikotes massal, rekrutmen, dan penjurusan sekolah. Generate link, kirim ke peserta, dan dapatkan laporan PDF secara otomatis.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <Link href="/clients" className="btn-primary text-white font-semibold px-8 py-3.5 rounded-xl flex items-center gap-2 text-base shadow-lg">
                <LayoutDashboard className="w-5 h-5" />
                Coba Dashboard Gratis
              </Link>
              <a href="#cara-kerja" className="bg-white/15 hover:bg-white/25 text-white border border-white/30 font-semibold px-8 py-3.5 rounded-xl flex items-center gap-2 text-base transition-all">
                <PlayCircle className="w-5 h-5" />
                Lihat Cara Kerja
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5">
              <div className="text-3xl font-extrabold text-white mb-1">500+</div>
              <div className="text-brand-200 text-sm font-medium">Perusahaan & Sekolah</div>
            </div>
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5">
              <div className="text-3xl font-extrabold text-white mb-1">10+</div>
              <div className="text-brand-200 text-sm font-medium">Alat Tes Terstandar</div>
            </div>
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5">
              <div className="text-3xl font-extrabold text-white mb-1">100K+</div>
              <div className="text-brand-200 text-sm font-medium">Laporan Dihasilkan</div>
            </div>
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5">
              <div className="text-3xl font-extrabold text-white mb-1">100%</div>
              <div className="text-brand-200 text-sm font-medium">Data Terenkripsi & Aman</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TRUST BAR ===== */}
      <section className="bg-white border-b border-slate-100 py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-slate-400 text-xs font-semibold tracking-widest uppercase mb-4">Dipercaya oleh institusi terkemuka</p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-slate-300">
            <div className="flex items-center gap-2"><Hexagon className="w-8 h-8"/><span className="font-display font-bold text-lg">TechCorp</span></div>
            <div className="flex items-center gap-2"><Triangle className="w-8 h-8"/><span className="font-display font-bold text-lg">EduGlobal</span></div>
            <div className="flex items-center gap-2"><CircleDot className="w-8 h-8"/><span className="font-display font-bold text-lg">Bank Nusa</span></div>
            <div className="flex items-center gap-2"><Box className="w-8 h-8"/><span className="font-display font-bold text-lg">Retailesia</span></div>
            <div className="flex items-center gap-2"><Aperture className="w-8 h-8"/><span className="font-display font-bold text-lg">MediaPlus</span></div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="cara-kerja" className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-brand-600 text-sm font-semibold tracking-widest uppercase">Alur Kerja Simpel</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-4">Bagaimana Platform Ini Bekerja?</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-base">Tidak perlu repot dengan kertas dan skoring manual. Semua otomatis, akurat, dan bisa diakses darimana saja.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-brand-200 via-brand-400 to-brand-200 z-0"></div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6 border border-slate-100 rotate-3 transition-transform hover:rotate-0">
                <Coins className="w-10 h-10 text-brand-500" />
              </div>
              <div className="bg-brand-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center mb-3">1</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Top Up Saldo</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Isi saldo akun Anda sesuai budget. Saldo ini bersifat universal dan bisa digunakan untuk membeli alat tes apa saja tanpa masa kadaluarsa.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6 border border-slate-100 -rotate-3 transition-transform hover:rotate-0">
                <LinkIcon className="w-10 h-10 text-brand-500" />
              </div>
              <div className="bg-brand-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center mb-3">2</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Kirim Link ke Peserta</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Pilih alat tes (DISC, WPT, dll) di dashboard, lalu dapatkan link unik untuk dibagikan ke peserta atau kandidat Anda.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6 border border-slate-100 rotate-3 transition-transform hover:rotate-0">
                <FileCheck className="w-10 h-10 text-brand-500" />
              </div>
              <div className="bg-brand-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center mb-3">3</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Terima Hasil Otomatis</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Peserta mengerjakan tes, dan laporannya (PDF) akan langsung muncul di dashboard Admin secara real-time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="fitur" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-brand-600 text-sm font-semibold tracking-widest uppercase">Fitur Unggulan</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-6">Dirancang Khusus untuk HR & Institusi</h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">Tinggalkan metode skoring manual yang memakan waktu. Gunakan platform kami untuk mempercepat proses seleksi dan asesmen.</p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <Palette className="w-6 h-6 text-brand-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">Custom Branding (White-label)</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">Pasang logo perusahaan Anda sendiri. Peserta akan melihat portal tes yang profesional dengan identitas brand Anda.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">Laporan Komprehensif (PDF)</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">Dapatkan hasil tes yang sudah diskoring otomatis lengkap dengan grafik, interpretasi psikologis, dan saran pengembangan.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">Manajemen Kandidat</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">Pantau progres peserta secara real-time. Ketahui siapa yang belum memulai, sedang mengerjakan, atau sudah selesai.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-100 to-brand-50 rounded-3xl transform rotate-3 scale-105"></div>
              <div className="relative bg-white border border-slate-100 rounded-3xl p-2 shadow-2xl">
                <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80" alt="Dashboard Preview" className="rounded-2xl w-full h-auto object-cover" />
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 animate-fadeUp">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 font-medium">Laporan Budi S.</div>
                    <div className="text-slate-900 font-bold">Skoring Selesai</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== UNTUK SIAPA ===== */}
      <section id="untuk-siapa" className="bg-slate-50 py-20 px-4 border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-brand-600 text-sm font-semibold tracking-widest uppercase">Target Pengguna</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-4">Siapa yang Membutuhkan Platform Ini?</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-base">Sistem asesmen yang fleksibel, dirancang untuk berbagai kebutuhan organisasi dan profesional.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-shadow text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-8 h-8 text-brand-600" />
              </div>
              <h3 className="font-display font-bold text-slate-900 text-xl mb-3">HRD & Rekrutmen</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">Saring ribuan kandidat dengan cepat, ketahui potensi leadership, dan pastikan kecocokan budaya kerja sebelum tahap wawancara.</p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-shadow text-center transform md:-translate-y-4">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-display font-bold text-slate-900 text-xl mb-3">Sekolah & Universitas</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">Bantu siswa menentukan jurusan yang tepat lewat tes minat bakat, penjurusan IPA/IPS, atau kesiapan karier mahasiswa tingkat akhir.</p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-shadow text-center">
              <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BrainCircuit className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-display font-bold text-slate-900 text-xl mb-3">Psikolog & Coach</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">Digitalisasikan alat tes Anda. Berikan laporan PDF yang instan dan terlihat sangat profesional kepada klien konseling atau coaching Anda.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="hero-mesh py-16 px-4">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Siap Memodernisasi Proses Asesmen Anda?</h2>
          <p className="text-brand-100 text-lg mb-8 max-w-2xl mx-auto">Bergabung dengan ratusan perusahaan dan institusi pendidikan yang telah mempercayakan asesmen psikologinya pada PsikoTest.id.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/clients" className="bg-white text-brand-700 font-bold px-8 py-4 rounded-xl text-base hover:bg-brand-50 transition-all shadow-xl flex items-center gap-2">
              Buat Akun Admin Sekarang
            </Link>
          </div>
          <p className="mt-6 text-brand-200 text-sm">Daftar sekarang untuk mencoba gratis!</p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-bold text-white text-base">PsikoTest<span className="text-brand-400">.id</span></span>
              </div>
              <p className="text-sm leading-relaxed text-slate-500 mb-6">Platform B2B SaaS Asesmen Psikologi. Kelola rekrutmen dan pemetaan talenta lebih cerdas dan otomatis.</p>
              <div className="flex gap-3">
                <a href="#" className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-brand-700 transition-colors">in</a>
                <a href="#" className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-brand-700 transition-colors">ig</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Produk & Layanan</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Platform Rekrutmen</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Asesmen Sekolah</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Katalog Alat Tes</a></li>
                <li><Link href="/clients" className="hover:text-white transition-colors">Daftar Akun Admin</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Sumber Daya</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Panduan Admin</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Validitas Psikometri</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog HR & Karier</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Hubungi Kami</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-400" />
                  <a href="mailto:b2b@psikotest.id" className="hover:text-white transition-colors">b2b@psikotest.id</a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-400" />
                  <span className="text-slate-400">0812-3456-7890</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <span>© 2026 PsikoTest.id Enterprise — Hak Cipta Dilindungi.</span>
            <div className="flex items-center gap-4">
              <Link href="/panel" className="hover:text-slate-400 transition-colors">Portal Super Admin</Link>
              <span>Syarat & Ketentuan</span>
              <span>Kebijakan Privasi</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
