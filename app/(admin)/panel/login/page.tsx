"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";
import { ShieldAlert, Fingerprint, Loader2 } from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "AccessDenied") {
      toast.error("Akses ditolak: Akun tidak terdaftar sebagai Super Admin.", {
        description: "Pastikan Anda menggunakan email yang benar."
      });
    }
  }, [searchParams]);

  const handleLogin = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/panel" });
  };

  return (
    <div className="space-y-6">
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 transition-all disabled:opacity-70"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <Fingerprint className="w-5 h-5 mr-2" />
        )}
        {isLoading ? "Mengautentikasi..." : "Login with Google"}
      </button>
    </div>
  );
}

export default function SuperadminLogin() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="h-16 w-16 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center mb-4 ring-1 ring-blue-500/50">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-white">
          PsikoTest.id Enterprise
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Secured Superadmin Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 border border-slate-800">
          <Suspense fallback={<div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>}>
            <LoginContent />
          </Suspense>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-900 text-slate-500">Secure Access Only</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
