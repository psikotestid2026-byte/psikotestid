'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
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
} from 'lucide-react';

interface BillingTabProps {
  data: any;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function BillingTab({ data }: BillingTabProps) {
  const { data: orderData, mutate: mutateOrders } = useSWR('/api/client/orders', fetcher, {
    refreshInterval: 10000,
  });

  const walletBalance = orderData?.data?.balance ?? Number(data?.customer?.balance || 0);
  const orders = orderData?.data?.orders || data?.orders || [];

  // Modals & Active Order States
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number>(500000);
  const [customAmount, setCustomAmount] = useState<string>('500000');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('MANUAL_BCA');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Inline Instruction Order State
  const [activeInstructionOrder, setActiveInstructionOrder] = useState<any | null>(null);

  // File Upload State for Payment Proof (Vercel Blob)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  // Countdown timer calculation for 24h expiration
  const [countdownStr, setCountdownStr] = useState<string>('23:59:59');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeInstructionOrder?.created_at) {
      const createdAt = new Date(activeInstructionOrder.created_at).getTime();
      const expiresAt = createdAt + 24 * 60 * 60 * 1000; // 24 hours

      interval = setInterval(() => {
        const now = Date.now();
        const diff = expiresAt - now;
        if (diff <= 0) {
          setCountdownStr('00:00:00 (Kadaluwarsa)');
          if (interval) clearInterval(interval);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdownStr(
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          );
        }
      }, 1000);
    }

    if (activeInstructionOrder?.proof_url) {
      setPreviewUrl(activeInstructionOrder.proof_url);
    } else {
      setPreviewUrl(null);
    }
    setSelectedFile(null);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeInstructionOrder]);

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
        }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        toast.error(result.error || 'Gagal membuat invoice tagihan.');
        return;
      }

      toast.success('Invoice tagihan Top-Up berhasil dibuat & notifikasi Telegram dikirim!');
      setIsTopUpModalOpen(false);
      setActiveInstructionOrder(result.data);
      mutateOrders();
      mutate('/api/client/data');
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file gambar maksimal 5MB.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadPaymentProof = async () => {
    if (!selectedFile || !activeInstructionOrder?.id) {
      toast.error('Pilih file bukti transfer terlebih dahulu.');
      return;
    }

    setIsUploadingProof(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('order_id', activeInstructionOrder.id.toString());

      const res = await fetch('/api/client/orders/proof', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        toast.error(result.error || 'Gagal mengunggah bukti transfer.');
        return;
      }

      toast.success('Bukti transfer berhasil diunggah & notifikasi Telegram dikirim ke Superadmin!');
      setActiveInstructionOrder((prev: any) => ({
        ...prev,
        proof_url: result.proof_url,
      }));
      setSelectedFile(null);
      mutateOrders();
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan saat mengunggah.');
    } finally {
      setIsUploadingProof(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin!`);
  };

  return (
    <div className="w-full space-y-6 animate-fadeUp">
      {/* SECTION INLINE: Detail Instruksi Pembayaran Bank BCA & Upload Bukti Transfer (Menghilangkan Modal Cut-Off) */}
      {activeInstructionOrder && (
        <div className="bg-white rounded-3xl border-2 border-indigo-500 shadow-xl overflow-hidden animate-fadeIn">
          {/* Header Banner */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/30 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  Tagihan PENDING — Menunggu Transfer
                </span>
                <h3 className="text-lg font-extrabold tracking-tight mt-0.5">
                  Instruksi Transfer Bank BCA (Manual)
                </h3>
              </div>
            </div>

            <button
              onClick={() => setActiveInstructionOrder(null)}
              className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-all flex items-center gap-1 text-xs font-bold shrink-0"
            >
              <X className="w-4 h-4" /> Tutup Petunjuk
            </button>
          </div>

          {/* Body Content Inline Grid */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50/50">
            {/* Left Column: Expiry & Bank Details */}
            <div className="space-y-4">
              {/* Expiry Countdown Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-900 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-semibold">Batas Waktu Transfer (24 Jam):</span>
                </div>
                <span className="font-mono font-extrabold text-sm text-amber-700 bg-amber-100 px-3 py-1 rounded-xl border border-amber-300">
                  {countdownStr}
                </span>
              </div>

              {/* Exact Nominal Box */}
              <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm space-y-1">
                <span className="text-xs text-slate-500 font-medium block">Total Nominal yang Harus Ditransfer (Presisi):</span>
                <div className="text-3xl font-extrabold font-mono text-indigo-900 tracking-tight flex items-center gap-3">
                  Rp {Number(activeInstructionOrder.total_amount).toLocaleString('id-ID')}
                  <button
                    onClick={() => copyToClipboard(activeInstructionOrder.total_amount.toString(), 'Nominal transfer')}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-xs text-indigo-700 font-bold flex items-center gap-1.5 transition-all border border-indigo-200"
                    title="Salin Nominal Presisi"
                  >
                    <Copy className="w-3.5 h-3.5" /> Salin Nominal
                  </button>
                </div>
                <p className="text-xs text-amber-800 font-semibold bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-3 leading-relaxed">
                  ⚠️ Transfer HARUS persis sama hingga 3 digit terakhir untuk otomatisasi verifikasi Superadmin.
                </p>
              </div>

              {/* Destination Bank Account Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-bold text-slate-500">Bank Tujuan Transfer:</span>
                  <span className="text-xs font-extrabold text-indigo-900 font-mono">BCA (Bank Central Asia)</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block">Nomor Rekening:</span>
                    <span className="text-lg font-extrabold text-slate-900 font-mono tracking-wider">1234567890</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard('1234567890', 'Nomor rekening BCA')}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" /> Salin Rekening
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                  <span className="text-slate-500">Atas Nama Rekening:</span>
                  <strong className="text-slate-800 font-bold">PT PsikoTest Solusi Indonesia</strong>
                </div>
              </div>
            </div>

            {/* Right Column: Vercel Blob Payment Proof Uploader */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-indigo-600" /> Unggah Bukti Transfer (Vercel Blob)
                  </h4>
                  {activeInstructionOrder.proof_url && (
                    <a
                      href={activeInstructionOrder.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Bukti Ter-unggah
                    </a>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Unggah struk atau bukti transfer Anda di bawah ini. Notifikasi beserta foto bukti akan terkirim otomatis ke Telegram Superadmin untuk segera diverifikasi.
                </p>

                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer border border-slate-300 rounded-xl"
                  />

                  <button
                    type="button"
                    onClick={handleUploadPaymentProof}
                    disabled={isUploadingProof || !selectedFile}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 transition-all shadow-md"
                  >
                    {isUploadingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {isUploadingProof ? 'Mengunggah Bukti...' : 'Kirim Bukti Transfer ke Superadmin'}
                  </button>
                </div>

                {previewUrl && (
                  <div className="mt-4 p-3 bg-indigo-50/60 border border-indigo-200 rounded-2xl flex items-center gap-3">
                    <img src={previewUrl} alt="Preview Bukti Transfer" className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-sm" />
                    <div className="text-xs overflow-hidden">
                      <span className="font-bold text-slate-900 block truncate">Struk Transfer Tersimpan</span>
                      <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Vercel Blob Storage Ready
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <Button
                  onClick={() => setActiveInstructionOrder(null)}
                  variant="outline"
                  className="text-xs font-bold text-slate-700"
                >
                  Selesai / Sembunyikan Petunjuk
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Saldo Wallet Summary Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold text-indigo-300 mb-1">
            <Wallet className="w-3.5 h-3.5 text-indigo-400" /> Saldo Wallet Corporate HR
          </div>
          <div className="text-3xl md:text-4xl font-extrabold tracking-tight font-mono text-emerald-400">
            Rp {walletBalance.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-indigo-200/80 leading-relaxed max-w-xl">
            Saldo wallet dapat digunakan kapan saja untuk beli kuota tes secara serba instan tanpa potongan biaya payment gateway.
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

      {/* Main Content Grid: Order History & Wallet Ledger */}
      <div className="grid grid-cols-1 gap-6">
        <Card noPadding className="overflow-hidden border border-slate-200 shadow-sm">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" /> Riwayat Transaksi & Tagihan Invoice
            </h3>
            <span className="text-xs font-semibold text-slate-500">Total: {orders.length} Transaksi</span>
          </div>

          <Table headers={["Invoice Code", "Jenis Transaksi", "Tanggal", "Total Tagihan", "Metode Bayar", "Status", "Bukti Transfer", "Aksi"]} isEmpty={orders.length === 0}>
            {orders.map((o: any) => (
              <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-indigo-900 text-xs">{o.invoice_code}</td>
                <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                  {o.order_type === 'TOPUP_BALANCE' ? (
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                      Top-Up Saldo Wallet
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold text-[10px]">
                      Beli Kuota Langsung
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-500">
                  {new Date(o.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                  Rp {Number(o.total_amount).toLocaleString('id-ID')}
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                  {o.payment_method_name || 'Transfer Bank BCA (Manual)'}
                </td>
                <td className="py-3.5 px-4">
                  {o.status === 'PAID' ? (
                    <Badge variant="success">LUNAS (PAID)</Badge>
                  ) : o.status === 'PENDING' ? (
                    <Badge variant="warning">MENUNGGU VERIFIKASI</Badge>
                  ) : (
                    <Badge variant="danger">{o.status}</Badge>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  {o.proof_url ? (
                    <a
                      href={o.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Ter-unggah
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400">Belum diunggah</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {o.status === 'PENDING' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveInstructionOrder({
                          ...o,
                          bank_details: {
                            bank_name: 'Bank Central Asia (BCA)',
                            account_number: '1234567890',
                            account_name: 'PT PsikoTest Solusi Indonesia',
                          },
                        });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-xs font-bold text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
                    >
                      Petunjuk / Unggah Bukti
                    </Button>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Selesai</span>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>

      {/* Modal 1: Top-Up Saldo Form dengan Selector Metode Pembayaran & Preset Rupiah Rapi */}
      <Modal isOpen={isTopUpModalOpen} onClose={() => setIsTopUpModalOpen(false)} title="Top-Up Saldo Wallet Corporate">
        <form onSubmit={handleCreateTopUpOrder} className="space-y-5">
          {/* Preset Currency Selection */}
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

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Pilih Metode Pembayaran</label>
            <div className="space-y-2">
              {/* Option 1: Manual BCA Transfer (Active) */}
              <label
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                  selectedPaymentMethod === 'MANUAL_BCA'
                    ? 'bg-indigo-50/60 border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="payment_method"
                    value="MANUAL_BCA"
                    checked={selectedPaymentMethod === 'MANUAL_BCA'}
                    onChange={() => setSelectedPaymentMethod('MANUAL_BCA')}
                    className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Transfer Bank BCA (Manual)</span>
                    <span className="text-[11px] text-slate-500 block">Verifikasi instan via Telegram Superadmin & Vercel Blob</span>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Aktif
                </span>
              </label>

              {/* Option 2: Virtual Account (Disabled) */}
              <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/70 opacity-60 cursor-not-allowed">
                <div className="flex items-center space-x-3">
                  <input type="radio" disabled className="w-4 h-4 text-slate-300" />
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">BCA / Mandiri Virtual Account (VA)</span>
                    <span className="text-[11px] text-slate-400 block">Biaya admin VA Xendit automatik</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                  Segera Hadir
                </span>
              </div>

              {/* Option 3: QRIS (Disabled) */}
              <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/70 opacity-60 cursor-not-allowed">
                <div className="flex items-center space-x-3">
                  <input type="radio" disabled className="w-4 h-4 text-slate-300" />
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">QRIS (GoPay, OVO, Dana, ShopeePay)</span>
                    <span className="text-[11px] text-slate-400 block">Scan QR langsung dari m-Banking</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                  Segera Hadir
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsTopUpModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
              {isSubmitting ? 'Memuat...' : 'Buat Tagihan Top-Up'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
