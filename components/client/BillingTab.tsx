'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks?: {
          onSuccess?: (result: any) => void;
          onPending?: (result: any) => void;
          onError?: (result: any) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { compressPaymentProof } from '@/lib/imageCompressor';
import {
  Wallet,
  PlusCircle,
  Clock,
  Copy,
  CheckCircle2,
  Building2,
  AlertCircle,
  CreditCard,
  History,
  Loader2,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  ChevronRight,
  QrCode,
  ShieldCheck,
  X,
  FileCheck,
  AlertTriangle,
  Send,
  Brain,
  ShoppingBag,
  Sparkles,
  Check,
  Store,
  ChevronDown,
} from 'lucide-react';

interface BillingTabProps {
  data: any;
  openTopUpOnMount?: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function BillingTab({ data, openTopUpOnMount = false }: BillingTabProps) {
  const router = useRouter();
  const { data: clientData, mutate: mutateClientData } = useSWR('/api/client/data', fetcher, {
    fallbackData: data,
  });

  const { data: orderData, mutate: mutateOrders } = useSWR('/api/client/orders', fetcher, {
    refreshInterval: 10000,
  });

  const { data: methodsData } = useSWR('/api/client/payment-methods', fetcher);
  const dbPaymentMethods = methodsData?.data || [];

  const walletBalance = orderData?.data?.balance ?? Number(clientData?.customer?.balance || 0);
  const orders = orderData?.data?.orders || clientData?.orders || [];
  const masterTests = clientData?.tests || [];
  const quotas = clientData?.quotas || [];

  // Modals & Active Order States
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(openTopUpOnMount);
  const [selectedPreset, setSelectedPreset] = useState<number>(500000);
  const [customAmount, setCustomAmount] = useState<string>('500000');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('MANUAL_BCA');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Purchase Quota Modal States
  const [selectedPurchaseTest, setSelectedPurchaseTest] = useState<any | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState<number>(10);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Accordion state for grouped payment methods in Top-Up Modal (default closed)
  const [openPaymentGroupKey, setOpenPaymentGroupKey] = useState<string | null>(null);

  useEffect(() => {
    if (openTopUpOnMount) {
      setIsTopUpModalOpen(true);
    }
  }, [openTopUpOnMount]);

  const handleSelectPreset = (val: number) => {
    setSelectedPreset(val);
    setCustomAmount(val.toString());
  };

  const handleCreateTopUpOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(customAmount);
    if (isNaN(amount) || amount < 50000) {
      toast.error('Minimal nominal top-up saldo wallet adalah Rp 50.000.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/client/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          order_type: 'TOPUP_BALANCE',
          payment_method_code: selectedPaymentMethod,
        }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        toast.error(result.error || 'Gagal membuat invoice tagihan.');
        return;
      }

      toast.success('Invoice tagihan Top-Up berhasil dibuat!');
      setIsTopUpModalOpen(false);

      const orderId = result.data?.id;

      // 1. Instantly seed SWR cache so PaymentInstructionView displays in 0ms without waiting for API refetch
      if (orderId && result.data) {
        mutate(`/api/client/orders/${orderId}`, { success: true, data: result.data }, false);
      }

      // 2. Refresh orders & client data in background (non-blocking)
      mutateOrders();
      mutateClientData();

      // 3. Trigger popup Snap Midtrans if applicable
      if (
        result.data?.payment_provider?.toLowerCase() === 'midtrans' &&
        result.data?.payment_token
      ) {
        openMidtransSnap(result.data.payment_token, result.data.payment_url);
      }

      // 4. Instant navigation to payment instructions
      if (orderId) {
        router.push(`/clients/payments/${orderId}`);
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePurchaseQuotaWithWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchaseTest || purchaseQuantity <= 0) return;

    setIsPurchasing(true);
    try {
      const res = await fetch('/api/client/orders/purchase-quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_id: selectedPurchaseTest.id,
          quantity: purchaseQuantity,
        }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        toast.error(result.error || 'Gagal memproses pembelian kuota.');
        return;
      }

      toast.success(result.message || 'Pembelian kuota tes berhasil!');
      setSelectedPurchaseTest(null);
      mutateOrders();
      mutateClientData();
    } catch (err) {
      toast.error('Terjadi kesalahan saat memproses transaksi.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const openMidtransSnap = (token: string, redirectFallbackUrl?: string) => {
    if (typeof window !== 'undefined' && window.snap && typeof window.snap.pay === 'function') {
      window.snap.pay(token, {
        onSuccess: function (result: any) {
          toast.success('Pembayaran Midtrans berhasil!');
          mutateOrders();
          mutateClientData();
        },
        onPending: function (result: any) {
          toast.info('Menunggu penyelesaian pembayaran.');
          mutateOrders();
        },
        onError: function (result: any) {
          toast.error('Pembayaran gagal atau dibatalkan.');
          mutateOrders();
        },
        onClose: function () {
          toast('Modal pembayaran ditutup.');
        },
      });
    } else if (redirectFallbackUrl) {
      window.open(redirectFallbackUrl, '_blank');
    } else {
      toast.error('Script Snap Midtrans sedang dimuat, silakan coba sesaat lagi.');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin!`);
  };

  return (
    <div className="w-full space-y-6 animate-fadeUp">
      {/* Banner Pemandu Setelah Beli Kuota */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-5 text-white shadow-md border border-emerald-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Panduan Langkah Selanjutnya
          </span>
          <h3 className="font-extrabold text-base text-white tracking-tight mt-1">
            Sudah Memiliki Kuota Tes? Daftarkan Kandidat & Buat Sesi Tes Ujian Sekarang
          </h3>
          <p className="text-xs text-emerald-100/80 leading-relaxed max-w-2xl">
            Setelah membeli kuota tes, masuk ke halaman <strong>Sesi Tes (Campaign)</strong> untuk membuat sesi ujian dan mendaftarkan peserta kandidat (secara manual atau via impor file Excel).
          </p>
        </div>

        <Link href="/clients/campaigns">
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 shrink-0">
            Ke Halaman Campaign & Peserta ➔
          </Button>
        </Link>
      </div>

      {/* Header Saldo Wallet Summary Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold text-indigo-300 mb-1">
            <Wallet className="w-3.5 h-3.5 text-indigo-400" /> Saldo Wallet Corporate HR
          </div>
          <div className="text-3xl md:text-4xl font-extrabold tracking-tight font-mono text-emerald-400">
            Rp {walletBalance.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-indigo-200/80 leading-relaxed max-w-xl">
            Saldo wallet digunakan untuk membeli kuota tes instan di katalog resmi bawah tanpa potongan fee.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Button
            onClick={() => setIsTopUpModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Top-Up Saldo Wallet
          </Button>
        </div>
      </div>

      {/* SECTION BARU: KATALOG ALAT TES & HARGA RESMI PLATFORM */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              Katalog Resmi
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600" /> Katalog Alat Tes Psikologi & Harga Kuota
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
            Tersedia {masterTests.length} Instrumen Tes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {masterTests.map((t: any) => {
            const currentQuotaObj = quotas.find((q: any) => q.test_id === t.id);
            const currentQuota = currentQuotaObj?.quota || 0;
            const priceNum = Number(t.price || 15000);

            return (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-bold text-[10px] rounded-lg border border-indigo-200">
                      {t.code.toUpperCase()}
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-full uppercase">
                      {t.category || 'ASMEN'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                    {t.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {t.description || 'Instrumen asesmen psikotes terintegrasi standar industri HR.'}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Harga Resmi:</span>
                    <span className="font-mono font-extrabold text-indigo-900 text-sm">
                      Rp {priceNum.toLocaleString('id-ID')} <span className="text-[10px] text-slate-400 font-normal">/ tes / orang</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-slate-600">Sisa Kuota Anda:</span>
                    <span className="font-mono font-extrabold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-lg">
                      {currentQuota} Kuota
                    </span>
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedPurchaseTest(t);
                      setPurchaseQuantity(10);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Beli Kuota Tes Ini
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Banner Menuju Halaman Riwayat Transaksi & Tagihan Invoice */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
            <History className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              Riwayat Transaksi, Tagihan Invoice & Mutasi Saldo
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Lihat seluruh daftar tagihan invoice, status pembayaran lunas, unggah bukti transfer, dan unduh invoice resmi di halaman terpisah.
            </p>
          </div>
        </div>

        <Link href="/clients/transactions">
          <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-sm flex items-center gap-2 shrink-0">
            <CreditCard className="w-4 h-4" /> Buka Riwayat Transaksi & Tagihan ➔
          </Button>
        </Link>
      </div>

      {/* Modal 1: Top-Up Saldo Form */}
      <Modal isOpen={isTopUpModalOpen} onClose={() => setIsTopUpModalOpen(false)} title="Top-Up Saldo Wallet Corporate">
        <form onSubmit={handleCreateTopUpOrder} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Pilih Nominal Top-Up Saldo</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-3">
              {[
                { label: 'Rp 100.000', value: 100000 },
                { label: 'Rp 250.000', value: 250000 },
                { label: 'Rp 500.000', value: 500000 },
                { label: 'Rp 1.000.000', value: 1000000 },
                { label: 'Rp 2.500.000', value: 2500000 },
                { label: 'Rp 5.000.000', value: 5000000 },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleSelectPreset(item.value)}
                  className={`py-2.5 px-3 text-xs font-mono font-bold rounded-xl border transition-all ${
                    selectedPreset === item.value && customAmount === item.value.toString()
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <label className="block text-xs font-semibold text-slate-600 mb-1">Nominal Kustom (Rp)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                required
                min="50000"
                step="10000"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedPreset(0);
                }}
                className="pl-10 w-full py-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                placeholder="50000"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Minimal top-up saldo wallet adalah Rp 50.000.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Pilih Metode Pembayaran</label>
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1.5 border border-slate-200/80 rounded-2xl p-2.5 bg-slate-50/50">
              {dbPaymentMethods.length === 0 ? (
                <label className="flex items-center justify-between p-3 rounded-2xl border border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <input type="radio" checked readOnly className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Transfer Bank BCA (Manual)</span>
                      <span className="text-[11px] text-slate-500 block">Verifikasi instan via Telegram Superadmin</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    Aktif
                  </span>
                </label>
              ) : (
                (() => {
                  const groups = [
                    {
                      key: 'va',
                      title: 'Virtual Account (VA Bank)',
                      icon: <Building2 className="w-4 h-4 text-indigo-600" />,
                      filter: (pm: any) => pm.type?.toLowerCase() === 'va',
                    },
                    {
                      key: 'ewallet',
                      title: 'E-Wallet & QRIS (Instant)',
                      icon: <QrCode className="w-4 h-4 text-emerald-600" />,
                      filter: (pm: any) => {
                        const t = pm.type?.toLowerCase();
                        return t === 'e-wallet' || t === 'qr_code' || t === 'credit_card';
                      },
                    },
                    {
                      key: 'retail',
                      title: 'Gerai Retail / Minimarket',
                      icon: <Store className="w-4 h-4 text-amber-600" />,
                      filter: (pm: any) => pm.type?.toLowerCase() === 'retail_outlet',
                    },
                    {
                      key: 'manual',
                      title: 'Transfer Bank Manual (Verifikasi Struk)',
                      icon: <CreditCard className="w-4 h-4 text-blue-600" />,
                      filter: (pm: any) => pm.type?.toLowerCase() === 'manual_transfer' || pm.provider?.toLowerCase() === 'manual',
                    },
                  ];

                  return groups.map((grp) => {
                    const methodsInGroup = dbPaymentMethods.filter(grp.filter);
                    if (methodsInGroup.length === 0) return null;
                    const isGroupOpen = openPaymentGroupKey === grp.key;
                    const hasSelectedMethod = methodsInGroup.some((pm: any) => pm.code === selectedPaymentMethod);

                    return (
                      <div key={grp.key} className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-2xs transition-all">
                        {/* Group Header / Accordion Trigger */}
                        <button
                          type="button"
                          onClick={() => setOpenPaymentGroupKey(isGroupOpen ? null : grp.key)}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors ${
                            isGroupOpen ? 'bg-slate-50 border-b border-slate-100' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {grp.icon}
                            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                              {grp.title}
                            </span>
                            {hasSelectedMethod && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Dipilih
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-medium">
                              {methodsInGroup.length} Saluran
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                                isGroupOpen ? 'rotate-180 text-indigo-600' : ''
                              }`}
                            />
                          </div>
                        </button>

                        {/* List Items (Accordion Body - Default Closed) */}
                        {isGroupOpen && (
                          <div className="p-2 space-y-1.5 bg-slate-50/40">
                            {methodsInGroup.map((pm: any) => (
                              <label
                                key={pm.id}
                                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                                  selectedPaymentMethod === pm.code
                                    ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                                    : 'bg-white border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="radio"
                                    name="payment_method"
                                    value={pm.code}
                                    checked={selectedPaymentMethod === pm.code}
                                    onChange={() => setSelectedPaymentMethod(pm.code)}
                                    className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                  />
                                  {pm.logo_url && (
                                    <div className="w-10 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0 shadow-2xs">
                                      <img src={pm.logo_url} alt={pm.name} className="max-h-full max-w-full object-contain" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-bold text-slate-900">{pm.name}</span>
                                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase border border-slate-200">
                                        {pm.provider}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 block">
                                      {pm.provider?.toLowerCase() === 'manual'
                                        ? 'Verifikasi instan via Telegram Superadmin & Vercel Blob'
                                        : Number(pm.admin_fee_flat || 0) > 0
                                        ? `Biaya Admin: Rp ${Number(pm.admin_fee_flat).toLocaleString('id-ID')}`
                                        : 'Bebas Biaya Admin (Rp 0)'}
                                    </span>
                                  </div>
                                </div>
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                    pm.is_active
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {pm.is_active ? 'Aktif' : 'Nonaktif'}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsTopUpModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all duration-150">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
              {isSubmitting ? 'Memproses Tagihan...' : 'Buat Tagihan Top-Up'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Beli Kuota Tes via Saldo Wallet Instant */}
      {selectedPurchaseTest && (
        <Modal
          isOpen={!!selectedPurchaseTest}
          onClose={() => setSelectedPurchaseTest(null)}
          title={`Beli Kuota Tes: ${selectedPurchaseTest.name}`}
        >
          <form onSubmit={handlePurchaseQuotaWithWallet} className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Nama Alat Tes:</span>
                <strong className="text-slate-900">{selectedPurchaseTest.name} ({selectedPurchaseTest.code.toUpperCase()})</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Harga per Peserta:</span>
                <strong className="text-indigo-900 font-mono">Rp {Number(selectedPurchaseTest.price).toLocaleString('id-ID')}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600 border-t border-slate-200 pt-2">
                <span>Saldo Wallet Anda:</span>
                <strong className="text-emerald-700 font-mono text-sm">Rp {walletBalance.toLocaleString('id-ID')}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Kuota yang Ingin Dibeli</label>
              <input
                type="number"
                required
                min="1"
                max="10000"
                value={purchaseQuantity}
                onChange={(e) => setPurchaseQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>

            {/* Subtotal Calculation Box */}
            <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 space-y-1">
              <span className="text-xs text-indigo-900 font-medium block">Total Pembayaran Saldo Wallet:</span>
              <div className="text-2xl font-extrabold font-mono text-indigo-900">
                Rp {(Number(selectedPurchaseTest.price) * purchaseQuantity).toLocaleString('id-ID')}
              </div>
              {walletBalance < Number(selectedPurchaseTest.price) * purchaseQuantity && (
                <p className="text-xs text-red-600 font-semibold mt-1">
                  ⚠️ Saldo wallet Anda kurang Rp {((Number(selectedPurchaseTest.price) * purchaseQuantity) - walletBalance).toLocaleString('id-ID')}. Lakukan Top-Up Saldo terlebih dahulu.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={() => setSelectedPurchaseTest(null)}>
                Batal
              </Button>
              {walletBalance >= Number(selectedPurchaseTest.price) * purchaseQuantity ? (
                <Button
                  type="submit"
                  disabled={isPurchasing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  {isPurchasing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShoppingBag className="w-4 h-4 mr-2" />}
                  {isPurchasing ? 'Memproses...' : 'Konfirmasi Pembelian via Saldo Wallet'}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    setSelectedPurchaseTest(null);
                    setIsTopUpModalOpen(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Top-Up Saldo Wallet Dulu
                </Button>
              )}
            </div>
          </form>
        </Modal>
      )}

      {/* Script Snap Midtrans Sandbox / Production */}
      <Script
        src={
          process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js'
        }
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-Bm9rvKq-RwzCAGJ5'}
        strategy="lazyOnload"
      />
    </div>
  );
}
