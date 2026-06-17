"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserCircle2, Loader2, ArrowRight } from "lucide-react";

export default function ParticipantLogin() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "AccessDenied") {
      toast.error("Akses ditolak: Email tidak terdaftar sebagai Peserta Tes.", {
        description: "Pastikan Anda menggunakan email yang didaftarkan oleh HR Anda."
      });
    }
  }, [searchParams]);

  const handleLogin = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/clients/test" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 text-center border border-emerald-100/50">
          <div className="mx-auto h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <UserCircle2 className="w-10 h-10" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Selamat Datang Peserta
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Silakan masuk untuk memulai sesi asesmen Anda hari ini. Fokus dan berikan yang terbaik.
          </p>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-70 group"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <ArrowRight className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
            )}
            {isLoading ? "Menyiapkan tes..." : "Mulai Asesmen (Login Google)"}
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} PsikoTest.id. All rights reserved.</p>
      </div>
    </div>
  );
}
