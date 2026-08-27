'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Copy,
  Users,
  PlusCircle,
  Zap,
  Loader2,
  AlertTriangle,
  Wallet,
} from 'lucide-react';
import { createCampaign, closeCampaign } from '@/app/(client)/clients/actions';

interface CampaignsTabProps {
  data: any;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function CampaignsTab({ data }: CampaignsTabProps) {
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const { data: clientData } = useSWR('/api/client/data', fetcher, {
    fallbackData: data,
    refreshInterval: 10000,
  });

  const activeData = clientData || data;

  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [registrationType, setRegistrationType] = useState('OPEN_LINK');
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);
  const [closeId, setCloseId] = useState<number | null>(null);
  const [isPurchasingQuota, setIsPurchasingQuota] = useState<number | null>(null);

  const masterTests = activeData?.tests || [];
  const quotas = activeData?.quotas || [];
  const campaigns = activeData?.campaigns || [];
  const allParticipants = activeData?.participants || [];
  const walletBalance = Number(activeData?.customer?.balance || 0);

  const toggleTestSelection = (testId: number) => {
    if (selectedTestIds.includes(testId)) {
      setSelectedTestIds(selectedTestIds.filter((id) => id !== testId));
    } else {
      setSelectedTestIds([...selectedTestIds, testId]);
    }
  };

  const handleQuickPurchaseQuota = async (testId: number, price: number) => {
    if (walletBalance < price) {
      toast.error(
        `Saldo Wallet tidak mencukupi (Rp ${walletBalance.toLocaleString('id-ID')}). Silakan top-up terlebih dahulu.`
      );
      return;
    }

    setIsPurchasingQuota(testId);
    try {
      const res = await fetch('/api/client/orders/purchase-quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_id: testId, quantity: 1 }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        toast.error(result.error || 'Gagal membeli kuota dengan Saldo Wallet.');
        return;
      }

      toast.success('Berhasil membeli 1 kuota menggunakan Saldo Wallet!');
      await Promise.all([
        mutate('/api/client/data'),
        mutate('/api/client/orders')
      ]);
      if (!selectedTestIds.includes(testId)) {
        setSelectedTestIds((prev) => [...prev, testId]);
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setIsPurchasingQuota(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignTitle || !activeData?.customer?.id) return;

    if (selectedTestIds.length === 0) {
      toast.error('Pilih setidaknya 1 instrumen tes untuk dimasukkan ke dalam Campaign.');
      return;
    }

    // Check if any selected test has 0 quota
    for (const testId of selectedTestIds) {
      const quotaObj = quotas.find((q: any) => String(q.test_id) === String(testId));
      const currentQuota = quotaObj?.quota || 0;
      if (currentQuota <= 0) {
        const testObj = masterTests.find((t: any) => String(t.id) === String(testId));
        toast.error(
          `Kuota tes ${testObj?.name || 'terpilih'} Anda habis (0 Kuota). Beli kuota 1-klik menggunakan Saldo Wallet sebelum menyimpan.`
        );
        return;
      }
    }

    setLoading(true);
    try {
      await createCampaign(activeData.customer.id, campaignTitle, selectedTestIds, registrationType);
      await Promise.all([
        mutate('/api/client/data'),
        mutate('/api/client/orders')
      ]);
      toast.success('Campaign Asesmen baru berhasil dibuat!');
      setIsCreateOpen(false);
      setCampaignTitle('');
      setRegistrationType('OPEN_LINK');
      setSelectedTestIds([]);
    } catch (err: any) {
      toast.error('Gagal membuat campaign: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (!closeId) return;
    setLoading(true);
    try {
      await closeCampaign(closeId);
      await mutate('/api/client/data');
      toast.success('Campaign berhasil ditutup!');
      setCloseId(null);
    } catch (err: any) {
      toast.error('Gagal menutup campaign: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin!`);
  };

  return (
    <div className="w-full space-y-6 animate-fadeUp">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-900">Sesi Tes (Campaign) Asesmen</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Buat sesi tes rekrutmen, pilih tes psikotes, dan kelola pendaftaran kandidat di halaman independen.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> Buat Campaign Sesi Tes Baru
        </Button>
      </div>

      {/* Main Campaign List Table */}
      <Card noPadding className="overflow-hidden border border-slate-200 shadow-sm">
        <Table
          headers={['Nama Campaign', 'Skema Akses', 'Alat Tes Terpilih', 'Jumlah Peserta', 'Link Akses Utama', 'Status', 'Aksi']}
          isEmpty={campaigns.length === 0}
        >
          {campaigns.map((c: any) => {
            const countCandidates = allParticipants.filter((p: any) => String(p.campaign_id) === String(c.id)).length;
            const selectedTests = c.selected_tests || [];
            const campaignLink = origin ? `${origin}/clients/test/${c.id}` : `/clients/test/${c.id}`;
            const regType = c.registration_type || 'OPEN_LINK';

            return (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-4 font-bold text-slate-900 text-xs">
                  <div>{c.title}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: CMP-{c.id}</div>
                </td>

                <td className="py-4 px-4">
                  {regType === 'OPEN_LINK' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-700 font-bold text-[10px] rounded-lg border border-sky-200">
                      🌐 Link Bebas (Google SSO)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 font-bold text-[10px] rounded-lg border border-amber-200">
                      🔒 Undangan Khusus (Pre-Registered)
                    </span>
                  )}
                </td>

                <td className="py-4 px-4">
                  <div className="flex flex-wrap gap-1 max-w-[220px]">
                    {selectedTests.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">Standar Asesmen</span>
                    ) : (
                      selectedTests.map((st: any) => (
                        <span
                          key={st.id || st.code}
                          className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-bold text-[10px] rounded border border-indigo-200"
                        >
                          {st.code?.toUpperCase()}
                        </span>
                      ))
                    )}
                  </div>
                </td>

                <td className="py-4 px-4">
                  <Link href={`/clients/campaigns/${c.id}`}>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg text-xs font-extrabold transition-all border border-indigo-200 cursor-pointer">
                      <Users className="w-3.5 h-3.5 text-indigo-600" /> {countCandidates} Peserta Terdaftar
                    </span>
                  </Link>
                </td>

                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg truncate max-w-[160px] font-mono">
                      {campaignLink}
                    </code>
                    <button
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                      title="Salin Link Sesi Ujian"
                      onClick={() => copyToClipboard(campaignLink, 'Link Sesi Ujian')}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>

                <td className="py-4 px-4">
                  <Badge variant={c.is_active ? 'success' : 'default'}>{c.is_active ? 'Aktif' : 'Selesai'}</Badge>
                </td>

                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/clients/campaigns/${c.id}`}>
                      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md">
                        <Users className="w-4 h-4 text-white" /> Kelola Peserta ({countCandidates}) ➔
                      </Button>
                    </Link>

                    {c.is_active && (
                      <Button variant="outline" size="sm" onClick={() => setCloseId(c.id)} disabled={loading}>
                        Tutup
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>

      {/* Modal 1: Buat Campaign Baru */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Buat Campaign Sesi Tes Baru">
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Sesi Campaign Tes</label>
            <input
              type="text"
              required
              value={campaignTitle}
              onChange={(e) => setCampaignTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-semibold"
              placeholder="Contoh: Rekrutmen Software Engineer - Batch 1 2026"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Mekanisme Akses & Pendaftaran Peserta</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setRegistrationType('OPEN_LINK')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  registrationType === 'OPEN_LINK'
                    ? 'bg-sky-50/80 border-sky-500 ring-2 ring-sky-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <input
                    type="radio"
                    name="regType"
                    checked={registrationType === 'OPEN_LINK'}
                    onChange={() => setRegistrationType('OPEN_LINK')}
                    className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-xs font-extrabold text-slate-900">🌐 Link Publik (Google SSO)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed ml-6">
                  HR cukup membagikan 1 Link Utama. Peserta mendaftar mandiri via Google SSO dan kuota terpotong otomatis saat peserta mendaftar.
                </p>
              </div>

              <div
                onClick={() => setRegistrationType('PRE_REGISTERED')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  registrationType === 'PRE_REGISTERED'
                    ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <input
                    type="radio"
                    name="regType"
                    checked={registrationType === 'PRE_REGISTERED'}
                    onChange={() => setRegistrationType('PRE_REGISTERED')}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-extrabold text-slate-900">🔒 Undangan Khusus</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed ml-6">
                  HR wajib memasukkan daftar email kandidat terlebih dahulu. Hanya kandidat terdaftar yang diizinkan mengakses tes.
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700">
                Pilih Kombinasi Alat Tes Psikotes yang Wajib Dikerjakan Peserta
              </label>
              <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                Saldo Wallet: Rp {walletBalance.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
              {masterTests.map((t: any) => {
                const quotaObj = quotas.find((q: any) => String(q.test_id) === String(t.id));
                const currentQuota = quotaObj?.quota || 0;
                const isSelected = selectedTestIds.includes(t.id);
                const testPrice = Number(t.price || 25000);

                return (
                  <div
                    key={t.id}
                    onClick={() => toggleTestSelection(t.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTestSelection(t.id)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{t.name}</span>
                        <span className="text-[11px] text-slate-500 block font-mono">
                          {t.code?.toUpperCase()} — Rp {testPrice.toLocaleString('id-ID')} / kuota
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {currentQuota > 0 ? (
                        <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200 inline-block">
                          ✓ {currentQuota} Kuota Tersedia
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          {walletBalance >= testPrice ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleQuickPurchaseQuota(t.id, testPrice);
                              }}
                              disabled={isPurchasingQuota === t.id}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] rounded-lg shadow-sm flex items-center gap-1 transition-all disabled:opacity-50"
                            >
                              {isPurchasingQuota === t.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Zap className="w-3 h-3 text-white" />
                              )}
                              {isPurchasingQuota === t.id
                                ? 'Membeli...'
                                : `⚡ Beli 1 Kuota (Rp ${testPrice.toLocaleString('id-ID')})`}
                            </button>
                          ) : (
                            <Link
                              href="/clients/billing?topup=true"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] font-bold text-red-600 hover:underline bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 inline-block"
                            >
                              Kuota 0 (Top-Up Saldo ➔)
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 text-right">
              <Link
                href="/clients/billing"
                className="text-[11px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-1"
              >
                <PlusCircle className="w-3 h-3" /> Katalog & Pembelian Kuota Banyak ➔
              </Link>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || !campaignTitle || selectedTestIds.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              {loading ? 'Menyimpan...' : 'Simpan & Buat Sesi Tes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Confirmation Modal for Closing Campaign */}
      <Modal isOpen={closeId !== null} onClose={() => setCloseId(null)} title="Tutup Campaign Sesi Tes">
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Yakin ingin menutup campaign sesi tes ini? Kandidat tidak akan bisa mengakses link ujian lagi setelah ditutup.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setCloseId(null)}>
              Batal
            </Button>
            <Button onClick={handleClose} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs">
              {loading ? 'Menutup...' : 'Ya, Tutup Campaign'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
