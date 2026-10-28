"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { clearTabAssessmentBindings } from "@/lib/assessmentSession";
import { toast } from "sonner";
import { UserCircle2, Loader2, ArrowRight, Eye, EyeOff, LogIn } from "lucide-react";

function safeCallbackUrl(raw: string | null): string {
  // Only allow same-site relative paths to avoid open redirects.
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/clients/test";
}

function LoginContent() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    // This tab is explicitly logging in, so drop any participant bound earlier in it.
    // Other tabs keep their own sessionStorage and are not affected.
    clearTabAssessmentBindings();
  }, []);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "AccessDenied") {
      toast.error("Akses ditolak: Email tidak terdaftar sebagai Peserta Tes.", {
        description: "Pastikan Anda menggunakan email yang didaftarkan oleh HR Anda.",
      });
    }
  }, [searchParams]);

  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!username.trim() || !password) {
      toast.error("Username dan password wajib diisi.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await signIn("participant", {
        username: username.trim(),
        password,
        redirect: false,
        callbackUrl,
      });
      if (!res || res.error) {
        toast.error("Username atau password salah.", {
          description: "Periksa kembali data login yang diberikan oleh HR Anda.",
        });
        setIsLoading(false);
        return;
      }
      window.location.assign(callbackUrl);
    } catch {
      toast.error("Terjadi kesalahan jaringan. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    await signIn("google", { callbackUrl });
  };

  return (
    <div className="space-y-5 text-left">
      <form onSubmit={handleCredentialsLogin} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-xs font-bold text-slate-600 mb-1.5">
            Username
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Contoh: aziz"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs font-bold text-slate-600 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-md text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-70 group"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <LogIn className="w-5 h-5 mr-2" />
          )}
          {isLoading ? "Memeriksa data..." : "Masuk"}
        </button>
      </form>

      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
        <div className="h-px flex-1 bg-slate-200" />
        atau
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading}
        className="w-full flex justify-center items-center py-3 px-4 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all disabled:opacity-70 group"
      >
        {isGoogleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
        )}
        {isGoogleLoading ? "Menyiapkan tes..." : "Masuk dengan Google"}
      </button>
    </div>
  );
}

export default function ParticipantLogin() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 text-center border border-emerald-100/50">
          <div className="mx-auto h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <UserCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-2">Selamat Datang Peserta</h2>
          <p className="text-slate-500 text-sm mb-6">
            Masuk menggunakan username dan password yang diberikan oleh HR Anda untuk memulai asesmen. Fokus dan
            berikan yang terbaik.
          </p>

          <Suspense
            fallback={
              <div className="flex justify-center py-3.5">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            }
          >
            <LoginContent />
          </Suspense>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} ruangtes. All rights reserved.</p>
      </div>
    </div>
  );
}
