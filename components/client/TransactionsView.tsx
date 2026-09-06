'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  CreditCard,
  Image as ImageIcon,
  Sparkles,
  History,
  FileText,
  Search,
  Wallet,
  ShoppingBag,
  PlusCircle,
} from 'lucide-react';

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

interface TransactionsViewProps {
  initialData: any;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TransactionsView({ initialData }: TransactionsViewProps) {
  const { data: orderData, mutate: mutateOrders } = useSWR('/api/client/orders', fetcher, {
    fallbackData: initialData ? { success: true, data: initialData } : undefined,
    refreshInterval: 10000,
  });

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'WALLET'>('ORDERS');

  const orders = orderData?.data?.orders || initialData?.orders || [];
  const walletHistory = orderData?.data?.walletHistory || initialData?.walletHistory || [];
  const balance = orderData?.data?.balance ?? initialData?.customer?.balance ?? 0;

  const openMidtransSnap = (token: string, redirectFallbackUrl?: string) => {
    if (typeof window !== 'undefined' && window.snap && typeof window.snap.pay === 'function') {
      window.snap.pay(token, {
        onSuccess: function () {
          toast.success('Pembayaran Midtrans berhasil!');
          mutateOrders();
        },
        onPending: function () {
          toast.info('Menunggu penyelesaian pembayaran.');
          mutateOrders();
        },
        onError: function () {
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

  const filteredOrders = orders.filter((o: any) => {
    const matchesStatus = filterStatus === 'ALL' || o.status === filterStatus;
    const matchesSearch =
      searchTerm.trim() === '' ||
      o.invoice_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.payment_method_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingOrdersCount = orders.filter((o: any) => o.status === 'PENDING').length;
  const paidOrdersCount = orders.filter((o: any) => o.status === 'PAID').length;

  return (
    <div className="w-full space-y-6 animate-fadeUp">
      {/* Header Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold text-indigo-300 mb-1">
            <History className="w-3.5 h-3.5 text-indigo-400" /> Riwayat Keuangan HR
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Riwayat Transaksi & Tagihan Invoice
          </h1>
          <p className="text-xs text-indigo-200/80 leading-relaxed max-w-xl">
            Pantau status verifikasi pembayaran tagihan invoice, invoice PDF, riwayat mutasi saldo wallet, dan link instruksi transfer.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/clients/billing?topup=true">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Top-Up Saldo
            </Button>
          </Link>
          <Link href="/clients/billing">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Beli Kuota Tes
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs & Stats Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Toggle View: Tagihan Invoice vs Mutasi Wallet */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'ORDERS'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Tagihan & Invoice ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('WALLET')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'WALLET'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-4 h-4" /> Mutasi Saldo Wallet ({walletHistory.length})
          </button>
        </div>

        {/* Quick Filter Pill for Orders */}
        {activeTab === 'ORDERS' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                filterStatus === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Semua ({orders.length})
            </button>
            <button
              onClick={() => setFilterStatus('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                filterStatus === 'PENDING'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
              }`}
            >
              Menunggu ({pendingOrdersCount})
            </button>
            <button
              onClick={() => setFilterStatus('PAID')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                filterStatus === 'PAID'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              Lunas ({paidOrdersCount})
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'ORDERS' ? (
        <Card noPadding className="overflow-hidden border border-slate-200 shadow-sm">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" /> Daftar Tagihan & Status Pembayaran
            </h3>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode invoice / metode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <Table
            headers={[
              'Invoice Code',
              'Jenis Transaksi',
              'Tanggal',
              'Total Tagihan',
              'Metode Bayar',
              'Status',
              'Bukti Transfer',
              'Aksi',
            ]}
            isEmpty={filteredOrders.length === 0}
          >
            {filteredOrders.map((o: any) => (
              <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-indigo-900 text-xs">{o.invoice_code}</td>
                <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                  {o.order_type === 'TOPUP_BALANCE' ? (
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                      Top-Up Saldo Wallet
                    </span>
                  ) : o.order_type === 'BALANCE_PURCHASE' ? (
                    <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full font-bold text-[10px]">
                      Beli Kuota Saldo Wallet
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold text-[10px]">
                      Beli Kuota Direct
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
                  <div className="flex items-center gap-2">
                    {o.payment_method_logo && (
                      <div className="w-8 h-5.5 rounded bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
                        <img
                          src={o.payment_method_logo}
                          alt={o.payment_method_name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )}
                    <span>{o.payment_method_name || 'Saldo Wallet / Transfer BCA'}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  {o.status === 'PAID' ? (
                    <Badge variant="success">LUNAS (PAID)</Badge>
                  ) : o.status === 'PENDING' ? (
                    <Badge variant="warning">MENUNGGU PEMBAYARAN</Badge>
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
                    <span className="text-[11px] text-slate-400">
                      {o.order_type === 'BALANCE_PURCHASE' ? 'Potong Saldo' : 'Belum diunggah'}
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {o.status === 'PENDING' ? (
                    <div className="flex items-center justify-end gap-1.5">
                      {o.payment_provider?.toLowerCase() === 'midtrans' && o.payment_token && (
                        <Button
                          size="sm"
                          onClick={() => openMidtransSnap(o.payment_token, o.payment_url)}
                          className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1" /> Bayar Snap
                        </Button>
                      )}
                      <Link
                        href={`/clients/payments/${o.id}`}
                        className="inline-flex items-center text-xs font-bold text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Petunjuk / Detail
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href={`/clients/payments/${o.id}`}
                      className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-indigo-600"
                    >
                      Lihat Invoice ➔
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : (
        /* WALLET MUTATION LEDGER */
        <Card noPadding className="overflow-hidden border border-slate-200 shadow-sm">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-indigo-600" /> Catatan Transaksi Buku Besar Wallet
            </h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Saldo Sekarang: Rp {Number(balance).toLocaleString('id-ID')}
            </span>
          </div>

          <Table
            headers={['ID', 'Jenis', 'Deskripsi Transaksi', 'Waktu', 'Nominal', 'Saldo Sebelum', 'Saldo Sesudah']}
            isEmpty={walletHistory.length === 0}
          >
            {walletHistory.map((w: any) => {
              const isCredit = Number(w.amount) >= 0;
              return (
                <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-slate-400">#{w.id}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isCredit
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {w.type || (isCredit ? 'CREDIT' : 'DEBIT')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs font-semibold text-slate-800">{w.description}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {new Date(w.created_at).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td
                    className={`py-3 px-4 font-mono font-bold text-xs ${
                      isCredit ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isCredit ? '+' : ''}
                    {Number(w.amount).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">
                    Rp {Number(w.balance_before).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs font-bold text-slate-800">
                    Rp {Number(w.balance_after).toLocaleString('id-ID')}
                  </td>
                </tr>
              );
            })}
          </Table>
        </Card>
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
