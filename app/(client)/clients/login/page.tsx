"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, LogIn, Loader2 } from "lucide-react";

export default function ClientLogin() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "AccessDenied") {
      toast.error("Akses ditolak: Email tidak terdaftar sebagai Klien HR.", {
        description: "Silakan hubungi administrator Anda."
      });
    }
  }, [searchParams]);

  const handleLogin = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/clients" });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-slate-900">
              Portal Klien HR
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Kelola asesmen dan laporan kandidat Anda dengan mudah.
            </p>
          </div>

          <div className="mt-8">
            <div className="mt-6">
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-slate-300 rounded-xl shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-600" />
                ) : (
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 mr-2" alt="Google" />
                )}
                {isLoading ? "Memproses..." : "Masuk dengan Google"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden lg:block relative w-0 flex-1">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
          alt="Office dashboard background"
        />
        <div className="absolute inset-0 bg-indigo-600/90 mix-blend-multiply" />
        <div className="absolute inset-0 flex flex-col justify-center items-start p-16 text-white max-w-2xl">
          <h1 className="text-4xl font-bold mb-4">Solusi Asesmen Modern</h1>
          <p className="text-lg text-indigo-100">PsikoTest.id Enterprise mempermudah proses rekrutmen dan evaluasi karyawan dengan teknologi terkini dan laporan instan.</p>
        </div>
      </div>
    </div>
  );
}
