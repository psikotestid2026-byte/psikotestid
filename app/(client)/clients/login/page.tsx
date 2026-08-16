"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";
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
      // Trigger OTP sending automatically for the unregistered email
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
    <div className="mt-6">
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

      {/* MODE 1: Standard Single-View Google SSO Login */}
      {mode === "login" && (
        <div className="space-y-5">
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-900 leading-relaxed flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold mb-0.5">Akses Single Sign-On (SSO):</strong>
              Masuk menggunakan akun Google SSO dengan email perusahaan yang telah terdaftar sebagai Klien HR.
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoginLoading}
            className="w-full flex justify-center items-center py-3.5 px-4 border border-slate-300 rounded-xl shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
          >
            {isLoginLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-600" />
            ) : (
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                className="w-5 h-5 mr-2.5"
                alt="Google SSO"
              />
            )}
            {isLoginLoading ? "Memproses Autentikasi..." : "Masuk dengan Google SSO"}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setMode("register_email")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-all"
            >
              Belum mendaftarkan perusahaan Anda? Klik di sini
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: Manual Registration Email Input */}
      {mode === "register_email" && (
        <form onSubmit={handleManualEmailSubmit} className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Pendaftaran Akun Corporate Baru:</strong> Masukkan email perusahaan Anda untuk menerima kode verifikasi OTP 6-digit.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Perusahaan / Corporate Email
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
                className="pl-9 w-full py-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setMode("login")}
              className="w-1/3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 flex justify-center items-center py-2.5 border border-transparent rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <ArrowRight className="w-4 h-4 mr-1.5" />}
              {isSubmitting ? "Mengirim OTP..." : "Kirim OTP Verifikasi"}
            </button>
          </div>
        </form>
      )}

      {/* MODE 3: Input OTP Code (Auto-Triggered on Unregistered Email) */}
      {mode === "register_otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed flex items-start space-x-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5">Email Belum Terdaftar:</strong>
              Email <span className="font-bold underline">{email}</span> belum memiliki akun corporate. Kode OTP 6-digit telah dikirimkan ke Gmail Anda untuk mendaftar.
            </div>
          </div>

          <div className="bg-slate-100/90 p-3 rounded-xl text-xs text-slate-700 flex justify-between items-center">
            <span className="truncate font-mono font-semibold">{email}</span>
            <button
              type="button"
              onClick={() => setMode("register_email")}
              className="text-indigo-600 font-semibold hover:underline text-[11px] shrink-0 ml-2"
            >
              Ubah Email
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Masukkan Kode OTP 6-Digit (Cek Inbox Gmail)
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
                className="pl-9 tracking-widest text-center font-mono font-extrabold text-lg w-full py-2 text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-[11px]">
              <span className="text-slate-500">
                Kadaluwarsa: <strong className="text-indigo-600 font-mono">{formatTimer(timer)}</strong>
              </span>
              <button
                type="button"
                onClick={() => triggerSendOtp(email)}
                disabled={isSubmitting || timer > 240}
                className="text-indigo-600 font-semibold hover:underline disabled:opacity-40 flex items-center"
              >
                <RefreshCw className="w-3 h-3 mr-1" /> Kirim Ulang
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || otpCode.length !== 6}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? "Memverifikasi OTP..." : "Verifikasi & Lanjutkan"}
          </button>
        </form>
      )}

      {/* MODE 4: Complete Profile Form */}
      {mode === "register_profile" && (
        <form onSubmit={handleCompleteRegistration} className="space-y-3.5">
          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-xs text-indigo-900 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            Email <strong className="font-mono">{email}</strong> terverifikasi. Lengkapi profil perusahaan:
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Perusahaan / Institusi *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Building2 className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="PT Telekomunikasi Indonesia"
                className="pl-9 w-full py-2 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Kontak HR / PIC *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Budi Santoso (HR Manager)"
                className="pl-9 w-full py-2 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor Telepon / WhatsApp *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="081234567890"
                className="pl-9 w-full py-2 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Warna Identitas Perusahaan (Brand Color)</span>
              <Palette className="w-3.5 h-3.5 text-slate-500" />
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="h-8 w-12 rounded border border-slate-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-28 py-1.5 px-2 text-xs border border-slate-300 rounded-lg text-slate-800 font-mono"
              />
              <div className="flex space-x-1.5 ml-auto">
                {["#2563eb", "#e11d48", "#059669", "#7c3aed", "#d97706"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBrandColor(c)}
                    style={{ backgroundColor: c }}
                    className="w-5 h-5 rounded-full border border-slate-300 focus:outline-none"
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? "Mendaftarkan Perusahaan..." : "Selesaikan Pendaftaran Corporate"}
          </button>
        </form>
      )}

      {/* MODE 5: Registration Success Screen */}
      {mode === "register_success" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-bold text-emerald-900">
              Akun Corporate Berhasil Terdaftar!
            </h3>
            <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
              Perusahaan <strong>{companyName}</strong> dengan email <strong>{email}</strong> telah aktif dan siap digunakan.
            </p>
          </div>

          <div className="bg-white border border-emerald-200 p-3.5 rounded-xl text-xs text-slate-700 text-left space-y-1.5">
            <strong className="text-slate-900 block font-semibold">Langkah Selanjutnya Untuk Masuk:</strong>
            <p className="text-slate-600 leading-relaxed">
              Tekan tombol di bawah untuk langsung masuk menggunakan <strong>Google SSO</strong> dengan email <strong>{email}</strong>.
            </p>
          </div>

          <button
            onClick={() => {
              setMode("login");
              handleGoogleLogin();
            }}
            className="w-full flex justify-center items-center py-3 px-4 border border-slate-300 rounded-xl shadow-sm text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 transition-all"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="w-4 h-4 mr-2"
              alt="Google SSO"
            />
            Masuk via Google SSO Sekarang
          </button>
        </div>
      )}
    </div>
  );
}

export default function ClientLogin() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="mt-6 text-2xl font-extrabold text-slate-900">
              Portal Klien HR
            </h2>
            <p className="mt-1.5 text-xs text-slate-600">
              Kelola asesmen, sisa kuota, dan laporan hasil tes kandidat perusahaan Anda.
            </p>
          </div>

          <Suspense fallback={<div className="mt-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>}>
            <LoginAndRegisterContent />
          </Suspense>
        </div>
      </div>
      <div className="hidden lg:block relative w-0 flex-1">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
          alt="Office dashboard background"
        />
        <div className="absolute inset-0 bg-indigo-900/85 mix-blend-multiply" />
        <div className="absolute inset-0 flex flex-col justify-center items-start p-16 text-white max-w-2xl">
          <div className="bg-indigo-500/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-indigo-200 mb-4 border border-indigo-400/30">
            Enterprise Psychological Assessment Platform
          </div>
          <h1 className="text-3xl font-bold mb-3 leading-tight">Solusi Asesmen Modern & Automated</h1>
          <p className="text-sm text-indigo-100 leading-relaxed">
            PsikoTest.id Enterprise mempermudah proses rekrutmen karyawan dengan instrumen tes psikologi terstandarisasi, pemeriksaan instan, serta laporan grafik hasil tes otomatis.
          </p>
        </div>
      </div>
    </div>
  );
}
