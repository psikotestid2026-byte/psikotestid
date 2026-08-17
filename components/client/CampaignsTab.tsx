'use client';

import { useState } from 'react';
import { mutate } from 'swr';
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
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Brain,
  X,
  Send,
  Loader2,
  Check,
} from 'lucide-react';
import {
  createCampaign,
  closeCampaign,
  addCandidateToCampaign,
  bulkImportCandidates,
} from '@/app/(client)/clients/actions';
import { downloadCandidateExcelTemplate, parseCandidateExcelFile } from '@/lib/excelTemplate';

interface CampaignsTabProps {
  data: any;
}

export function CampaignsTab({ data }: CampaignsTabProps) {
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);
  const [closeId, setCloseId] = useState<number | null>(null);

  // Candidate Management Drawer State
  const [activeCandidateCampaign, setActiveCandidateCampaign] = useState<any | null>(null);
  const [candidateTab, setCandidateTab] = useState<'manual' | 'excel'>('manual');

  // Single Manual Candidate Form State
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);

  // Bulk Excel Candidate Import State
  const [parsedCandidates, setParsedCandidates] = useState<
    Array<{ full_name: string; email: string; phone_number: string; position: string }>
  >([]);
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const masterTests = data?.tests || [];
  const quotas = data?.quotas || [];
  const campaigns = data?.campaigns || [];
  const allParticipants = data?.participants || [];

  const toggleTestSelection = (testId: number) => {
    if (selectedTestIds.includes(testId)) {
      setSelectedTestIds(selectedTestIds.filter((id) => id !== testId));
    } else {
      setSelectedTestIds([...selectedTestIds, testId]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignTitle || !data.customer?.id) return;

    if (selectedTestIds.length === 0) {
      toast.error('Pilih setidaknya 1 instrumen tes untuk dimasukkan ke dalam Campaign.');
      return;
    }

    setLoading(true);
    try {
      await createCampaign(data.customer.id, campaignTitle, selectedTestIds);
      await mutate('/api/client/data');
      toast.success('Campaign Asesmen baru berhasil dibuat!');
      setIsCreateOpen(false);
      setCampaignTitle('');
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

  const handleAddSingleCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidateCampaign || !candidateName || !candidateEmail) return;

    setIsAddingCandidate(true);
    try {
      const createdCandidate = await addCandidateToCampaign(activeCandidateCampaign.id, {
        full_name: candidateName,
        email: candidateEmail,
        phone_number: candidatePhone,
      });

      // Force SWR cache refresh immediately
      await mutate('/api/client/data');

      toast.success(`Kandidat ${candidateName} berhasil didaftarkan!`);
      setCandidateName('');
      setCandidateEmail('');
      setCandidatePhone('');
    } catch (err: any) {
      toast.error('Gagal memproses pendaftaran kandidat: ' + err.message);
    } finally {
      setIsAddingCandidate(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (evt) => {
        const buffer = evt.target?.result as ArrayBuffer;
        if (buffer) {
          const parsed = parseCandidateExcelFile(buffer);
          if (parsed.length === 0) {
            toast.error('Format file Excel/CSV tidak valid atau tidak ada baris kandidat terdeteksi.');
          } else {
            setParsedCandidates(parsed);
            toast.success(`Berhasil membaca ${parsed.length} baris kandidat dari file Excel (${file.name}).`);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleBulkImport = async () => {
    if (!activeCandidateCampaign || parsedCandidates.length === 0) return;

    setIsImporting(true);
    try {
      const res = await bulkImportCandidates(activeCandidateCampaign.id, parsedCandidates);
      await mutate('/api/client/data');
      toast.success(`Berhasil mengimpor ${res.importedCount} kandidat secara massal!`);
      setParsedCandidates([]);
      setFileName(null);
    } catch (err: any) {
      toast.error('Gagal mengimpor daftar kandidat: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin!`);
  };

  const getWhatsAppLink = (phone: string, candidateName: string, campaignTitle: string, accessLink: string) => {
    if (!phone) return '#';
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);

    const message = `Halo ${candidateName},\n\nAnda diundang untuk mengikuti Sesi Tes Asesmen Psikotes "${campaignTitle}".\n\nSilakan klik Link Akses Ujian Anda di bawah ini untuk memulai pengerjaan:\n${accessLink}\n\nTerima kasih,\n${data?.customer?.company_name || 'HR Department'}`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Get campaign candidates with robust string conversion
  const campaignCandidates = activeCandidateCampaign
    ? allParticipants.filter((p: any) => String(p.campaign_id) === String(activeCandidateCampaign.id))
    : [];

  return (
    <div className="w-full space-y-6 animate-fadeUp">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-900">Sesi Tes (Campaign) Asesmen</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Buat sesi tes rekrutmen, pilih tes psikotes, dan daftarkan kandidat secara manual atau via Excel.
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
          headers={['Nama Campaign', 'Alat Tes Terpilih', 'Jumlah Peserta', 'Link Akses Utama', 'Status', 'Aksi']}
          isEmpty={campaigns.length === 0}
        >
          {campaigns.map((c: any) => {
            const countCandidates = allParticipants.filter((p: any) => String(p.campaign_id) === String(c.id)).length;
            const selectedTests = c.selected_tests || [];
            const campaignLink = typeof window !== 'undefined' ? `${window.location.origin}/clients/test/${c.id}` : '';

            return (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-4 font-bold text-slate-900 text-xs">
                  <div>{c.title}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: CMP-{c.id}</div>
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
                  <button
                    onClick={() => setActiveCandidateCampaign(c)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200"
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-600" /> {countCandidates} Peserta Terdaftar
                  </button>
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
                    <Button
                      size="sm"
                      onClick={() => setActiveCandidateCampaign(c)}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200"
                    >
                      <Users className="w-3.5 h-3.5 mr-1" /> Kelola Peserta ({countCandidates})
                    </Button>

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
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Pilih Kombinasi Alat Tes Psikotes yang Wajib Dikerjakan Peserta
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
              {masterTests.map((t: any) => {
                const quotaObj = quotas.find((q: any) => q.test_id === t.id);
                const currentQuota = quotaObj?.quota || 0;
                const isSelected = selectedTestIds.includes(t.id);

                return (
                  <label
                    key={t.id}
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
                        <span className="text-[11px] text-slate-500 block font-mono">{t.code.toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg border ${
                          currentQuota > 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {currentQuota} Kuota Tersedia
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="mt-2 text-right">
              <Link
                href="/clients/billing"
                className="text-[11px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-1"
              >
                <PlusCircle className="w-3 h-3" /> Tambah / Beli Kuota Tes di Sini ➔
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

      {/* Modal 2: Kelola Kandidat & Pendaftaran */}
      {activeCandidateCampaign && (
        <Modal
          isOpen={!!activeCandidateCampaign}
          onClose={() => setActiveCandidateCampaign(null)}
          title={`Kelola Peserta & Pendaftaran: ${activeCandidateCampaign.title}`}
        >
          <div className="space-y-5">
            {/* Header Tabs: Entry Manual vs Excel Upload */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setCandidateTab('manual')}
                className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 ${
                  candidateTab === 'manual'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                + Entry Manual Single Candidate
              </button>
              <button
                onClick={() => setCandidateTab('excel')}
                className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 ${
                  candidateTab === 'excel'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                📁 Bulk Import File Excel (.xlsx)
              </button>
            </div>

            {/* TAB A: Entry Manual Single Candidate */}
            {candidateTab === 'manual' && (
              <form onSubmit={handleAddSingleCandidate} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Lengkap Kandidat</label>
                    <input
                      type="text"
                      required
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl font-medium"
                      placeholder="Contoh: Budi Santoso"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Kandidat</label>
                    <input
                      type="email"
                      required
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl font-medium"
                      placeholder="budi.santoso@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">No WhatsApp / HP (Opsional)</label>
                  <input
                    type="text"
                    value={candidatePhone}
                    onChange={(e) => setCandidatePhone(e.target.value)}
                    className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl font-medium"
                    placeholder="081234567890"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isAddingCandidate || !candidateName || !candidateEmail}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5"
                  >
                    {isAddingCandidate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                    {isAddingCandidate ? 'Daftarkan...' : 'Daftarkan Kandidat Ini'}
                  </Button>
                </div>
              </form>
            )}

            {/* TAB B: Bulk Import via File Excel (.xlsx) */}
            {candidateTab === 'excel' && (
              <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 block">Template Excel Asli (.xlsx)</span>
                    <span className="text-[11px] text-slate-500 block">Unduh format Excel asli untuk diisi nama kandidat.</span>
                  </div>
                  <button
                    type="button"
                    onClick={downloadCandidateExcelTemplate}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh Template Excel (.xlsx)
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Unggah File Excel Terisi (.xlsx / .xls / .csv)</label>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer border border-slate-300 rounded-xl bg-white"
                  />
                </div>

                {/* Preview Parsed Candidates Table */}
                {parsedCandidates.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">
                        Preview Terdeteksi ({parsedCandidates.length} Baris Kandidat):
                      </span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Siap Di-impor
                      </span>
                    </div>

                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-white text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                          <tr>
                            <th className="p-2">Nama</th>
                            <th className="p-2">Email</th>
                            <th className="p-2">No HP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedCandidates.map((cand, idx) => (
                            <tr key={idx} className="border-b border-slate-100">
                              <td className="p-2 font-medium">{cand.full_name}</td>
                              <td className="p-2 font-mono text-slate-600">{cand.email}</td>
                              <td className="p-2 text-slate-500">{cand.phone_number || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <Button
                      onClick={handleBulkImport}
                      disabled={isImporting}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2"
                    >
                      {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {isImporting ? 'Mengimpor...' : `Impor ${parsedCandidates.length} Kandidat Sekarang`}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* List of Registered Candidates in Campaign */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" /> Daftar Kandidat Terdaftar ({campaignCandidates.length} Peserta)
                </h4>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-2xl bg-white">
                {campaignCandidates.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-6">Belum ada kandidat terdaftar di campaign ini.</div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold sticky top-0">
                      <tr>
                        <th className="p-3">Nama Kandidat</th>
                        <th className="p-3">Email & WhatsApp</th>
                        <th className="p-3">Link Akses Ujian Personal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaignCandidates.map((cand: any) => {
                        const personalLink =
                          typeof window !== 'undefined'
                            ? `${window.location.origin}/clients/test/${cand.campaign_id}?token=${cand.access_token}`
                            : '';
                        const waUrl = getWhatsAppLink(
                          cand.phone_number,
                          cand.full_name,
                          activeCandidateCampaign.title,
                          personalLink
                        );

                        return (
                          <tr key={cand.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-bold text-slate-900">{cand.full_name}</td>
                            <td className="p-3">
                              <div className="font-mono text-[11px] text-slate-600">{cand.email}</div>
                              {cand.phone_number && (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline mt-0.5"
                                >
                                  <MessageSquare className="w-3 h-3 text-emerald-500" /> Kirim WA ({cand.phone_number})
                                </a>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <code className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded truncate max-w-[150px] font-mono">
                                  {personalLink}
                                </code>
                                <button
                                  onClick={() => copyToClipboard(personalLink, 'Link Ujian Personal Kandidat')}
                                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                  title="Salin Link Ujian Personal"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setActiveCandidateCampaign(null)} variant="outline" className="text-xs font-bold">
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 3: Confirmation Modal for Closing Campaign */}
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
