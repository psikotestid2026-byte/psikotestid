'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  Clock,
  Copy,
  Building2,
  Upload,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Send,
  FileCheck,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Check,
  CreditCard,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { compressPaymentProof } from '@/lib/imageCompressor';

interface PaymentInstructionViewProps {
  orderId: string;
  initialOrder?: any;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function PaymentInstructionView({ orderId, initialOrder }: PaymentInstructionViewProps) {
  const router = useRouter();

  const { data: orderRes, mutate } = useSWR(
    `/api/client/orders/${orderId}`,
    fetcher,
    {
      fallbackData: initialOrder ? { success: true, data: initialOrder } : undefined,
      refreshInterval: 6000,
    }
  );

  const order = orderRes?.data || initialOrder;

  // File Upload State for Payment Proof (Vercel Blob)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);

  // Countdown timer calculation for 24h expiration
  const [countdownStr, setCountdownStr] = useState<string>('23:59:59');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (order?.created_at) {
      const calculateRemaining = () => {
        const createdTime = new Date(order.created_at).getTime();
        const expiryTime = createdTime + 24 * 60 * 60 * 1000;
        const now = Date.now();
        const diff = expiryTime - now;

        if (diff <= 0) {
          setCountdownStr('Waktu Habis (Kadaluarsa)');
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setCountdownStr(
          `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      };

      calculateRemaining();
      interval = setInterval(calculateRemaining, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [order]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin!`);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];
      try {
        const { compressedFile, originalSizeKB, compressedSizeKB } = await compressPaymentProof(originalFile);
        setSelectedFile(compressedFile);
        setPreviewUrl(URL.createObjectURL(compressedFile));

        if (originalSizeKB > compressedSizeKB) {
          setCompressionInfo(`Dicompress: ${originalSizeKB} KB ➔ ${compressedSizeKB} KB (HD Tajam)`);
          toast.success(`Foto dicompress dari ${originalSizeKB} KB ke ${compressedSizeKB} KB.`);
        } else {
          setCompressionInfo(`Ukuran optimal: ${compressedSizeKB} KB`);
        }
      } catch (err) {
        setSelectedFile(originalFile);
        setPreviewUrl(URL.createObjectURL(originalFile));
      }
    }
  };

  const handleUploadPaymentProof = async () => {
    if (!selectedFile || !order?.id) {
      toast.error('Pilih file foto bukti transfer terlebih dahulu sebelum mengonfirmasi.');
      return;
    }

    setIsUploadingProof(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('order_id', order.id.toString());

      const res = await fetch('/api/client/orders/proof', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        toast.error(result.error || 'Gagal mengunggah bukti transfer.');
        return;
      }

      toast.success('Bukti transfer berhasil diunggah & notifikasi verifikasi dikirim ke Superadmin!');
      mutate();
      setSelectedFile(null);
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan saat mengunggah.');
    } finally {
      setIsUploadingProof(false);
    }
  };

  const openMidtransSnap = (token: string, redirectFallbackUrl?: string) => {
    if (typeof window !== 'undefined' && (window as any).snap && typeof (window as any).snap.pay === 'function') {
      (window as any).snap.pay(token, {
        onSuccess: function () {
          toast.success('Pembayaran Midtrans berhasil!');
          mutate();
        },
        onPending: function () {
          toast.info('Menunggu penyelesaian pembayaran.');
          mutate();
        },
        onError: function () {
          toast.error('Pembayaran gagal atau dibatalkan.');
        },
      });
    } else if (redirectFallbackUrl) {
      window.open(redirectFallbackUrl, '_blank');
    } else {
      toast.error('Script Snap Midtrans sedang dimuat, silakan coba sesaat lagi.');
    }
  };

  if (!order) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm font-semibold text-slate-600">Memuat petunjuk instruksi pembayaran...</p>
      </div>
    );
  }

  const isPaid = order.status === 'PAID';
  const isPending = order.status === 'PENDING';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fadeUp pb-12">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/clients/transactions"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Riwayat Transaksi & Tagihan
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Invoice:</span>
          <span className="text-xs font-mono font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
            {order.invoice_code}
          </span>
        </div>
      </div>

      {/* Main Payment Container Card */}
      <div className="bg-white rounded-3xl border-2 border-indigo-500 shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            {order.payment_method_logo ? (
              <div className="w-14 h-10 rounded-xl bg-white border border-white/20 flex items-center justify-center p-1.5 shrink-0 shadow-sm">
                <img
                  src={order.payment_method_logo}
                  alt={order.payment_method || 'Payment Logo'}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-indigo-300" />
              </div>
            )}
            <div>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  isPaid
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : 'bg-amber-500/30 text-amber-300 border border-amber-400/30'
                }`}
              >
                {isPaid ? '✓ Pembayaran Lunas (PAID)' : 'Tagihan PENDING — Menunggu Pembayaran'}
              </span>
              <h1 className="text-xl font-extrabold tracking-tight mt-1 text-white">
                {order.payment_method || 'Instruksi Pembayaran Tagihan'}
              </h1>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] text-indigo-200/80 block">Status Transaksi:</span>
            <span
              className={`text-sm font-extrabold uppercase tracking-wider ${
                isPaid ? 'text-emerald-400' : 'text-amber-300'
              }`}
            >
              {order.status}
            </span>
          </div>
        </div>

        {/* If PAID, Show Success Banner */}
        {isPaid && (
          <div className="p-6 bg-emerald-50 border-b border-emerald-200 flex items-center gap-3 text-emerald-900">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <strong className="block text-sm font-bold text-emerald-950">
                Tagihan Ini Telah Berhasil Diverifikasi Lunas!
              </strong>
              <p className="text-xs text-emerald-800 mt-0.5">
                Saldo wallet atau kuota tes psikotes Anda telah dikreditkan. Anda dapat langsung menggunakan kuota untuk sesi ujian kandidat.
              </p>
            </div>
            <Link
              href="/clients/billing"
              className="ml-auto shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              Lihat Saldo Wallet
            </Link>
          </div>
        )}

        {/* Body Content Grid */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50/50">
          {/* Left Column: Expiry & Payment Codes */}
          <div className="space-y-4">
            {!isPaid && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-900 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-semibold">Batas Waktu Transfer (24 Jam):</span>
                </div>
                <span className="font-mono font-extrabold text-sm text-amber-700 bg-amber-100 px-3 py-1 rounded-xl border border-amber-300">
                  {countdownStr}
                </span>
              </div>
            )}

            <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-medium block">Total Nominal Tagihan:</span>
              <div className="text-3xl font-extrabold font-mono text-indigo-900 tracking-tight flex items-center gap-3">
                Rp {Number(order.total_amount).toLocaleString('id-ID')}
                {!isPaid && (
                  <button
                    onClick={() => copyToClipboard(order.total_amount.toString(), 'Nominal transfer')}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-xs text-indigo-700 font-bold flex items-center gap-1.5 transition-all border border-indigo-200"
                    title="Salin Nominal Presisi"
                  >
                    <Copy className="w-3.5 h-3.5" /> Salin Nominal
                  </button>
                )}
              </div>
              {order.fee_amount > 0 && order.payment_provider?.toLowerCase() === 'manual' && (
                <p className="text-xs text-amber-800 font-semibold bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-3 leading-relaxed">
                  ⚠️ Transfer HARUS persis sama hingga 3 digit terakhir untuk otomatisasi verifikasi Superadmin.
                </p>
              )}
            </div>

            {/* Xendit Core API Direct Display: Virtual Account Number or Retail Payment Code */}
            {order.payment_provider?.toLowerCase() === 'xendit' && order.payment_token && !order.payment_url && (
              <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-500/40 rounded-2xl p-5 shadow-lg text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {order.payment_method_logo ? (
                      <div className="w-9 h-6 rounded-md bg-white p-0.5 flex items-center justify-center shrink-0">
                        <img
                          src={order.payment_method_logo}
                          alt={order.payment_method}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <Building2 className="w-4 h-4 text-indigo-400" />
                    )}
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300">
                      {order.payment_type?.toLowerCase() === 'retail_outlet'
                        ? 'Kode Pembayaran Kasir'
                        : order.payment_type?.toLowerCase() === 'qr_code'
                        ? 'QRIS Dinamis'
                        : 'Nomor Virtual Account'}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Otomatis Lunas
                  </span>
                </div>

                {order.payment_type?.toLowerCase() === 'qr_code' ? (
                  <div className="bg-white p-4 rounded-xl text-center flex flex-col items-center justify-center space-y-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                        order.payment_token
                      )}`}
                      alt="QRIS Xendit"
                      className="w-48 h-48 object-contain rounded-lg border border-slate-200"
                    />
                    <span className="text-[11px] font-bold text-slate-700">
                      Scan menggunakan GoPay, OVO, DANA, BCA Mobile, atau aplikasi QRIS lainnya
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-black/30 border border-white/10 p-3.5 rounded-xl">
                    <div>
                      <span className="text-[10px] text-indigo-200 block uppercase tracking-wider font-semibold">
                        {order.payment_method}
                      </span>
                      <span className="text-2xl font-extrabold font-mono text-emerald-400 tracking-wider">
                        {order.payment_token}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(order.payment_token, 'Nomor pembayaran')}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" /> Salin
                    </button>
                  </div>
                )}

                <p className="text-[11px] text-indigo-200/90 leading-relaxed">
                  Lakukan pembayaran sebesar <strong>Rp {Number(order.total_amount).toLocaleString('id-ID')}</strong> ke{' '}
                  {order.payment_type?.toLowerCase() === 'retail_outlet' ? 'kasir minimarket' : 'nomor di atas'}.
                  Sistem akan mendeteksi dan mengonfirmasi lunas secara otomatis tanpa perlu konfirmasi struk.
                </p>
              </div>
            )}

            {/* Midtrans Snap Popup or Redirect Button */}
            {order.payment_url && (
              <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-300 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                    Gateway Otomatis ({order.payment_provider || 'Online'})
                  </span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-600 text-white">
                    Instant Lunas
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {order.payment_provider?.toLowerCase() === 'midtrans'
                    ? 'Klik tombol di bawah untuk membuka pop-up pembayaran instan Snap Midtrans:'
                    : 'Klik tombol di bawah untuk membuka halaman pembayaran resmi:'}
                </p>

                {order.payment_provider?.toLowerCase() === 'midtrans' && order.payment_token ? (
                  <button
                    type="button"
                    onClick={() => openMidtransSnap(order.payment_token, order.payment_url)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01]"
                  >
                    <Sparkles className="w-4 h-4" /> Buka Pop-up Pembayaran Midtrans (Snap)
                  </button>
                ) : (
                  <a
                    href={order.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01]"
                  >
                    <ExternalLink className="w-4 h-4" /> Buka Halaman Pembayaran ({order.payment_provider || 'Online'})
                  </a>
                )}
              </div>
            )}

            {/* Step-by-Step Instructions List from DB with OL/UL styling */}
            {order.instructions && order.instructions.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <span className="text-xs font-bold text-slate-800 block border-b border-slate-100 pb-2">
                  Petunjuk Langkah Pembayaran:
                </span>
                <div className="space-y-3 text-xs text-slate-600 instruction-container">
                  {order.instructions.map((ins: any, idx: number) => (
                    <div key={idx} className="border-b border-slate-100 last:border-0 pb-3">
                      <strong className="text-slate-900 block mb-1 font-bold">{ins.title}</strong>
                      <div
                        dangerouslySetInnerHTML={{ __html: ins.content }}
                        className="leading-relaxed text-slate-600 prose-instruction"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bank Details for Manual Transfer */}
            {order.bank_details && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-bold text-slate-500">Bank Tujuan Transfer:</span>
                  <span className="text-xs font-extrabold text-indigo-900 font-mono">
                    {order.bank_details?.bank_name || 'BCA (Bank Central Asia)'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block">Nomor Rekening:</span>
                    <span className="text-lg font-extrabold text-slate-900 font-mono tracking-wider">
                      {order.bank_details?.account_number || '1234567890'}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        order.bank_details?.account_number || '1234567890',
                        'Nomor rekening'
                      )
                    }
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" /> Salin Rekening
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                  <span className="text-slate-500">Atas Nama Rekening:</span>
                  <strong className="text-slate-800 font-bold">
                    {order.bank_details?.account_name || 'PT PsikoTest Solusi Indonesia'}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Vercel Blob Payment Proof Uploader (Active for manual/optional for online) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-600" /> Bukti Pembayaran & Konfirmasi
                </h4>
                {order.proof_url && (
                  <a
                    href={order.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Bukti Ter-unggah
                  </a>
                )}
              </div>

              {order.payment_provider?.toLowerCase() === 'manual' ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1 mb-3">
                  <strong className="flex items-center gap-1.5 text-amber-800 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> PENTING — PERATURAN KONFIRMASI:
                  </strong>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Transaksi transfer manual <strong>TIDAK AKAN dicek/diproses</strong> Superadmin sampai Anda menekan tombol <strong>"KONFIRMASI & UNGGAH BUKTI TRANSFER SEKARANG"</strong> di bawah.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-900 space-y-1 mb-3">
                  <strong className="flex items-center gap-1.5 text-indigo-800 font-bold">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Verifikasi Otomatis
                  </strong>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    Kanal ini menggunakan verifikasi otomatis real-time. Anda tidak diwajibkan mengunggah struk. Namun Anda dapat mengunggah bukti jika memerlukan arsip tambahan.
                  </p>
                </div>
              )}

              {!isPaid && (
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer border border-slate-300 rounded-xl"
                  />

                  {compressionInfo && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{compressionInfo}</span>
                    </div>
                  )}

                  {order.payment_provider?.toLowerCase() === 'manual' && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-[11px] font-extrabold text-red-900 flex items-center gap-1.5 mt-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>⚠️ PENTING: Tekan tombol MERAH di bawah ini untuk mengirim bukti transfer ke Superadmin!</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleUploadPaymentProof}
                    disabled={isUploadingProof || !selectedFile}
                    className={`w-full text-white font-extrabold text-xs py-3.5 rounded-xl shadow-xl border-2 uppercase tracking-wide flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] disabled:opacity-50 ${
                      order.payment_provider?.toLowerCase() === 'manual'
                        ? 'bg-red-600 hover:bg-red-700 border-red-400'
                        : 'bg-indigo-600 hover:bg-indigo-700 border-indigo-400'
                    }`}
                  >
                    {isUploadingProof ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-white" />
                    )}
                    {isUploadingProof ? 'Mengunggah & Mengirim...' : 'KONFIRMASI & UNGGAH BUKTI TRANSFER SEKARANG'}
                  </button>
                </div>
              )}

              {previewUrl && (
                <div className="mt-4 p-3 bg-indigo-50/60 border border-indigo-200 rounded-2xl flex items-center gap-3">
                  <img
                    src={previewUrl}
                    alt="Preview Bukti Transfer"
                    className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-sm"
                  />
                  <div className="text-xs overflow-hidden">
                    <span className="font-bold text-slate-900 block truncate">Struk Transfer Siap Diunggah</span>
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Teks Tajam & Jelas (HD)
                    </span>
                  </div>
                </div>
              )}

              {order.proof_url && (
                <div className="mt-4 p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-3">
                  <img
                    src={order.proof_url}
                    alt="Bukti Transfer Tersimpan"
                    className="w-16 h-16 object-cover rounded-xl border border-emerald-300 shadow-sm"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-emerald-950 block">Bukti Transfer Berhasil Terunggah</span>
                    <span className="text-[11px] text-emerald-700 block mt-0.5">
                      Tersimpan di Cloud Storage Vercel Blob & telah dinotifikasikan ke Superadmin.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/clients/transactions"
                className="text-xs font-bold text-slate-600 hover:text-indigo-600"
              >
                Ke Riwayat Transaksi
              </Link>
              <Button
                onClick={() => router.push('/clients/transactions')}
                variant="outline"
                className="text-xs font-bold text-slate-700"
              >
                Selesai / Tutup Halaman
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
