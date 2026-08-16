'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';

interface OrderItem {
  id: number;
  invoice_code: string;
  order_type: string;
  subtotal: string;
  fee_amount: string;
  total_amount: string;
  status: string;
  created_at: string;
  paid_at: string | null;
  company_name: string;
  customer_email: string;
  contact_name: string;
  payment_method_name: string | null;
  payment_method_code: string | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function OrdersAdminPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/admin/orders', fetcher, {
    refreshInterval: 10000,
  });

  const orders: OrderItem[] = data?.data || [];

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Confirmation Modal State
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filterStatus === 'ALL' || o.status === filterStatus;
    const matchesSearch =
      o.invoice_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleSetPaid = async () => {
    if (!selectedOrder) return;

    setIsConfirming(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: selectedOrder.id }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        toast.error(result.error || 'Gagal memverifikasi pembayaran.');
        return;
      }

      toast.success(result.message || 'Transaksi berhasil dikonfirmasi LUNAS!');
      setSelectedOrder(null);
      mutate();
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan saat verifikasi.');
    } finally {
      setIsConfirming(false);
    }
  };

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const paidCount = orders.filter((o) => o.status === 'PAID').length;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-500/30 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold text-indigo-200 mb-2">
            <Receipt className="w-3.5 h-3.5" /> Superadmin Financial Operations
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Transaksi & Verification Order</h1>
          <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
            Verifikasi transfer manual BCA dari Klien HR, setujui status invoice LUNAS, dan saldo wallet akan didepositkan secara otomatis ke akun Klien.
          </p>
        </div>

        <button
          onClick={() => mutate()}
          className="px-4 py-2 bg-indigo-700/80 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border border-indigo-500/50 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data Order
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Transaksi Order</span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono">{orders.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-700 font-semibold block">Menunggu Verifikasi (Pending)</span>
            <span className="text-2xl font-extrabold text-amber-600 font-mono">{pendingCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-700 font-semibold block">Transaksi Lunas (Paid)</span>
            <span className="text-2xl font-extrabold text-emerald-600 font-mono">{paidCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Status Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          {[
            { id: 'ALL', label: 'SEMUA' },
            { id: 'PENDING', label: `PENDING (${pendingCount})` },
            { id: 'PAID', label: `PAID (${paidCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterStatus === tab.id
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Invoice atau Perusahaan..."
            className="pl-9 w-full py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Orders Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
            Memuat daftar transaksi order Klien...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Tidak ada transaksi order yang cocok dengan filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Invoice Code</th>
                  <th className="py-3 px-4">Klien HR (Perusahaan)</th>
                  <th className="py-3 px-4">Jenis Order</th>
                  <th className="py-3 px-4">Total Tagihan</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4 text-right">Aksi Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 transition-all">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-900">{o.invoice_code}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{o.company_name}</div>
                      <div className="text-[11px] text-slate-500">{o.customer_email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {o.order_type === 'TOPUP_BALANCE' ? (
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                          Top-Up Wallet
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold text-[10px]">
                          Beli Kuota
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      Rp {Number(o.total_amount).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {o.payment_method_name || 'Transfer Bank BCA (Manual)'}
                    </td>
                    <td className="py-3.5 px-4">
                      {o.status === 'PAID' ? (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-extrabold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> LUNAS
                        </span>
                      ) : o.status === 'PENDING' ? (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-extrabold text-[10px] inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" /> PENDING
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-extrabold text-[10px]">
                          {o.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(o.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {o.status === 'PENDING' ? (
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1 shadow-sm transition-all"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Konfirmasi LUNAS
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">
                          Lunas {o.paid_at ? new Date(o.paid_at).toLocaleDateString('id-ID') : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Set Paid Action */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-emerald-950 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> Konfirmasi Pembayaran LUNAS
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Kode Invoice:</span>
                  <span className="font-mono font-bold text-indigo-900">{selectedOrder.invoice_code}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Klien HR:</span>
                  <strong className="text-slate-900">{selectedOrder.company_name}</strong>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-emerald-200/60 pt-2">
                  <span className="text-slate-600">Total Nominal Tagihan:</span>
                  <span className="font-mono font-extrabold text-base text-emerald-800">
                    Rp {Number(selectedOrder.total_amount).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5 leading-relaxed">
                <strong className="text-slate-900 block font-semibold">Dampak Aksi Konfirmasi:</strong>
                <p className="text-slate-600">
                  1. Status Invoice akan diubah menjadi <strong className="text-emerald-700">PAID (LUNAS)</strong>.
                </p>
                <p className="text-slate-600">
                  2. Saldo wallet <strong className="text-slate-900">{selectedOrder.company_name}</strong> akan otomatis bertambah sebesar <strong className="text-emerald-700">Rp {Number(selectedOrder.total_amount).toLocaleString('id-ID')}</strong>.
                </p>
                <p className="text-slate-600">
                  3. Riwayat pencatatan transaksi wallet ledger akan dibuat secara permanen.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSetPaid}
                disabled={isConfirming}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                {isConfirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isConfirming ? 'Memproses...' : 'Konfirmasi & Set LUNAS Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
