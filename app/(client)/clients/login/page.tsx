"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Building2,
  Loader2,
  Mail,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
  User,
  Phone,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Palette,
  AlertCircle,
  UserCheck,
  GraduationCap,
} from "lucide-react";

function LoginAndRegisterContent() {
  const searchParams = useSearchParams();
  const paramError = searchParams.get("error");
  const paramEmail = searchParams.get("email");

  const [mode, setMode] = useState<"login" | "register_email" | "register_otp" | "register_profile" | "register_success">("login");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration Form States
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [verifiedToken, setVerifiedToken] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [brandColor, setBrandColor] = useState("#2563eb");
  const [botHoneypot, setBotHoneypot] = useState("");

  // OTP Countdown Timer (300s = 5 mins)
  const [timer, setTimer] = useState<number>(300);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timer]);

  // Handle Unregistered Email Detection from Google SSO Redirect
  useEffect(() => {
    if (paramError === "NotRegistered" && paramEmail) {
      const decodedEmail = decodeURIComponent(paramEmail);
      setEmail(decodedEmail);
      setMode("register_otp");
      toast.info(`Email ${decodedEmail} belum terdaftar.`, {
        description: "Mengirimkan kode OTP verifikasi ke Gmail Anda...",
      });
      triggerSendOtp(decodedEmail);
    } else if (paramError === "AccessDenied") {
      toast.error("Akses Ditolak: Email tidak memiliki wewenang portal HR.", {
        description: "Silakan daftarkan perusahaan Anda terlebih dahulu."
      });
    }
  }, [paramError, paramEmail]);

  const handleGoogleLogin = async () => {
    setIsLoginLoading(true);
    await signIn("google", { callbackUrl: "/clients" });
  };

  const triggerSendOtp = async (targetEmail: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register-hr/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, bot_honeypot: botHoneypot }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Gagal mengirim OTP.");
        return;
      }

      setOtpToken(data.otp_token);
      setTimer(300);
      setIsTimerActive(true);
      toast.success(data.message || "Kode OTP 6-digit dikirim ke Gmail Anda!");
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan saat mengirim OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Masukkan email perusahaan yang valid.");
      return;
    }
    setMode("register_otp");
    triggerSendOtp(email);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      toast.error("Masukkan 6 digit kode OTP.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register-hr/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: otpCode.trim(),
          otp_token: otpToken,
          bot_honeypot: botHoneypot,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Kode OTP salah atau kadaluwarsa.");
        return;
      }

      setVerifiedToken(data.verified_token);
      setMode("register_profile");
      toast.success("Email berhasil diverifikasi! Lengkapi profil perusahaan.");
    } catch (err) {
      toast.error("Gagal melakukan verifikasi OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !contactName || !phoneNumber) {
      toast.error("Lengkapi semua field pendaftaran yang diperlukan.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register-hr/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          verified_token: verifiedToken,
          company_name: companyName,
          contact_name: contactName,
          phone_number: phoneNumber,
          password,
          brand_color: brandColor,
          bot_honeypot: botHoneypot,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Gagal menyelesaikan pendaftaran.");
        return;
      }

      setMode("register_success");
      toast.success("Akun Corporate Berhasil Terdaftar!");
    } catch (err) {
      toast.error("Gagal mendaftarkan perusahaan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-3.5 space-y-3.5">
      {/* Bot Honeypot Trap Input */}
      <div className="hidden" aria-hidden="true">
        <input
          type="text"
          name="website_check_trap"
          tabIndex={-1}
          value={botHoneypot}
          onChange={(e) => setBotHoneypot(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Prominent Tab Switcher Header */}
      <div className="grid grid-cols-2 p-1 bg-slate-200/90 rounded-xl border border-slate-300/80">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
            mode === "login"
              ? "bg-white text-indigo-700 shadow border border-slate-200 font-display"
              : "text-slate-600 hover:text-slate-900 font-semibold"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" /> Masuk Portal HR
        </button>

        <button
          type="button"
          onClick={() => setMode("register_email")}
          className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
            mode !== "login"
              ? "bg-indigo-600 text-white shadow font-display"
              : "text-slate-600 hover:text-indigo-600 font-semibold"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Daftar Akun Baru
        </button>
      </div>

      {/* MODE 1: Standard Single-View Google SSO Login */}
      {mode === "login" && (
        <div className="space-y-3.5">
          <div className="bg-indigo-50 border border-indigo-200/80 rounded-2xl p-3.5 text-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-xs">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Akses Single Sign-On (SSO) Perusahaan</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Masuk aman menggunakan akun Google SSO dengan email perusahaan terdaftar.
            </p>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoginLoading}
            className="w-full flex justify-center items-center py-3 px-4 border-2 border-slate-300 rounded-xl shadow-sm text-xs font-extrabold text-slate-800 bg-white hover:bg-slate-50 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
          >
            {isLoginLoading ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin mr-2 text-indigo-600" />
            ) : (
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                className="w-4.5 h-4.5 mr-2.5"
                alt="Google SSO"
              />
            )}
            {isLoginLoading ? "Memproses Google SSO..." : "Masuk dengan Google SSO"}
          </button>

          {/* Prominent Narrative Banner for Unregistered Users */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-3.5 shadow space-y-2">
            <div className="flex items-center gap-1.5 text-indigo-300 font-extrabold text-[11px] tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Pendaftaran Akun Corporate Baru
            </div>
            <h3 className="text-xs font-bold text-white leading-snug">
              Belum Memiliki Akun HR Perusahaan Anda?
            </h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Daftarkan perusahaan Anda secara instan dan dapatkan instrumen psikotes terstandarisasi serta laporan PDF otomatis.
            </p>
            <button
              type="button"
              onClick={() => setMode("register_email")}
              className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-lg shadow flex items-center justify-center gap-1.5 transition-all"
            >
              Daftar Perusahaan Baru Sekarang <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: Manual Registration Email Input */}
      {mode === "register_email" && (
        <form onSubmit={handleManualEmailSubmit} className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              Langkah 1: Masukkan Email Perusahaan
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Masukkan email dinas perusahaan Anda. Kode OTP 6-digit akan dikirimkan ke Gmail Anda.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Email Perusahaan / Corporate Email *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh: hr@namaperusahaan.co.id"
                className="pl-9 w-full py-2 text-xs text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className="w-1/3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 bg-white hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 flex justify-center items-center py-2 border border-transparent rounded-lg text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <ArrowRight className="w-3.5 h-3.5 mr-1.5" />}
              {isSubmitting ? "Mengirim OTP..." : "Kirim OTP Verifikasi"}
            </button>
          </div>
        </form>
      )}

      {/* MODE 3: Input OTP Code */}
      {mode === "register_otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 space-y-1 leading-relaxed">
            <div className="flex items-center gap-1.5 font-extrabold text-amber-900 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              Email Belum Terdaftar — Pendaftaran Akun Baru
            </div>
            <p className="text-[11px] text-amber-800">
              Email <span className="font-bold underline">{email}</span> belum terdaftar. Kode OTP 6-digit dikirimkan ke Gmail Anda.
            </p>
          </div>

          <div className="bg-slate-100 p-2.5 rounded-lg text-xs text-slate-800 flex justify-between items-center border border-slate-200">
            <span className="truncate font-mono font-bold text-slate-900 text-[11px]">{email}</span>
            <button
              type="button"
              onClick={() => setMode("register_email")}
              className="text-indigo-600 font-bold hover:underline text-[10px] shrink-0 ml-2"
            >
              Ubah Email
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Masukkan Kode OTP 6-Digit (Cek Inbox Gmail) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="pl-9 tracking-widest text-center font-mono font-extrabold text-lg w-full py-2 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-[10px]">
              <span className="text-slate-500">
                Kadaluwarsa: <strong className="text-indigo-600 font-mono">{formatTimer(timer)}</strong>
              </span>
              <button
                type="button"
                onClick={() => triggerSendOtp(email)}
                disabled={isSubmitting || timer > 240}
                className="text-indigo-600 font-bold hover:underline disabled:opacity-40 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Kirim Ulang
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || otpCode.length !== 6}
            className="w-full flex justify-center items-center py-2.5 px-3 border border-transparent rounded-lg shadow text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            )}
            {isSubmitting ? "Verifikasi OTP..." : "Verifikasi OTP & Lanjutkan"}
          </button>
        </form>
      )}

      {/* MODE 4: Complete Profile Form */}
      {mode === "register_profile" && (
        <form onSubmit={handleCompleteRegistration} className="space-y-3">
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-950 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Email <strong className="font-mono">{email}</strong> terverifikasi! Lengkapi profil:</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-0.5">Nama Perusahaan / Institusi *</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="PT Nusantara Jaya Abadi"
              className="w-full py-1.5 px-3 text-xs text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-0.5">Nama Kontak HR / PIC Utama *</label>
            <input
              type="text"
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Budi Santoso (Head of HR)"
              className="w-full py-1.5 px-3 text-xs text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-0.5">Nomor WhatsApp / Telepon *</label>
            <input
              type="text"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="081234567890"
              className="w-full py-1.5 px-3 text-xs text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-2.5 px-3 border border-transparent rounded-lg shadow text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50 mt-1"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
            {isSubmitting ? "Mendaftarkan Perusahaan..." : "Selesaikan Pendaftaran Corporate"}
          </button>
        </form>
      )}

      {/* MODE 5: Registration Success Screen */}
      {mode === "register_success" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-3">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-sm font-extrabold text-emerald-900">Akun Corporate Berhasil Terdaftar!</h3>
            <p className="text-[11px] text-emerald-700 mt-0.5">Perusahaan <strong>{companyName}</strong> telah aktif.</p>
          </div>

          <button
            onClick={() => {
              setMode("login");
              handleGoogleLogin();
            }}
            className="w-full flex justify-center items-center py-2.5 px-3 border border-slate-300 rounded-xl shadow-sm text-xs font-extrabold text-slate-800 bg-white hover:bg-slate-50 transition-all"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4 mr-2" alt="Google SSO" />
            Masuk via Google SSO Sekarang
          </button>
        </div>
      )}

      {/* Prominent Footer Box for Candidates / Laypeople */}
      <div className="mt-4 pt-3 border-t border-slate-200 text-center">
        <div className="bg-slate-100/90 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-slate-900 font-bold">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Apakah Anda Peserta / Kandidat Ujian?</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-snug">
            Khusus Admin/HRD. Jika Anda kandidat yang akan tes:
          </p>
          <Link
            href="/clients/test/login"
            className="inline-flex items-center gap-1 text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 hover:underline pt-0.5 transition-all"
          >
            Masuk Portal Peserta Ujian Psikotes <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ClientLogin() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center">
      <div className="flex-1 flex flex-col justify-center py-4 px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-md lg:max-w-lg">
          <div>
            <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="mt-3 text-xl font-extrabold text-slate-900 font-display">
              Portal Akses HR Corporate
            </h2>
            <p className="mt-1 text-xs text-slate-600 leading-normal">
              Kelola asesmen psikotes massal, rekrutmen karyawan, dan laporan hasil tes tim perusahaan Anda.
            </p>
          </div>

          <Suspense fallback={<div className="mt-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-indigo-600" /></div>}>
            <LoginAndRegisterContent />
          </Suspense>
        </div>
      </div>
      <div className="hidden lg:block relative w-0 flex-1 h-screen">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
          alt="Office dashboard background"
        />
        <div className="absolute inset-0 bg-indigo-900/85 mix-blend-multiply" />
        <div className="absolute inset-0 flex flex-col justify-center items-start p-12 xl:p-16 text-white max-w-2xl">
          <div className="bg-indigo-500/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-indigo-100 mb-3 border border-indigo-400/30 tracking-wide uppercase">
            Enterprise Psychological Assessment Platform
          </div>
          <h1 className="text-3xl xl:text-4xl font-extrabold mb-3 leading-tight font-display">
            Solusi Asesmen Psikotes Modern & Automated
          </h1>
          <p className="text-xs xl:text-sm text-indigo-100 leading-relaxed">
            PsikoTest.id Enterprise mempermudah proses rekrutmen karyawan dengan instrumen tes psikologi terstandarisasi, skoring instan, serta laporan grafik hasil tes otomatis secara real-time.
          </p>
        </div>
      </div>
    </div>
  );
}
