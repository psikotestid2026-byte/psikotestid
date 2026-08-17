'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Users,
  PlusCircle,
  Upload,
  Copy,
  MessageSquare,
  Search,
  CheckCircle2,
  Brain,
  Link as LinkIcon,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { addCandidateToCampaign } from '@/app/(client)/clients/actions';
import { BulkImportExcelModal } from './BulkImportExcelModal';

interface CampaignDetailViewProps {
  initialCampaignData: any;
  campaignId: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function CampaignDetailView({ initialCampaignData, campaignId }: CampaignDetailViewProps) {
  // Use SWR for real-time candidate updates
  const { data: clientData, mutate: refreshData } = useSWR('/api/client/data', fetcher);

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Manual Candidate Form States
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');

  const campaign = initialCampaignData?.campaign || {};
  const selectedTests = initialCampaignData?.selected_tests || [];

  // Get participants from live SWR data if available, fallback to initial
  const allParticipants = clientData?.participants || initialCampaignData?.participants || [];
  const campaignCandidates = allParticipants.filter(
    (p: any) => String(p.campaign_id) === String(campaignId)
  );

  const filteredCandidates = campaignCandidates.filter((c: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone_number?.includes(q)
    );
  });

  const masterLink =
    typeof window !== 'undefined' ? `${window.location.origin}/clients/test/${campaignId}` : '';

  const handleAddManualCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName || !candidateEmail) return;

    setIsSubmittingManual(true);
    try {
      await addCandidateToCampaign(campaignId, {
        full_name: candidateName,
        email: candidateEmail,
        phone_number: candidatePhone,
      });

      await refreshData();
      toast.success(`Kandidat ${candidateName} berhasil didaftarkan!`);
      setCandidateName('');
      setCandidateEmail('');
      setCandidatePhone('');
    } catch (err: any) {
      toast.error('Gagal memproses pendaftaran kandidat: ' + err.message);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin!`);
  };

  const getWhatsAppUrl = (phone: string, name: string, token: string) => {
    if (!phone) return '#';
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);

    const personalLink =
      typeof window !== 'undefined'
        ? `${window.location.origin}/clients/test/${campaignId}?token=${token}`
        : '';

    const message = `Halo ${name},\n\nAnda diundang oleh ${
      initialCampaignData?.customer?.company_name || 'HR Department'
    } untuk mengikuti Sesi Tes Psikotes "${campaign.title}".\n\nSilakan klik Link Akses Ujian Anda di bawah ini untuk memulai pengerjaan:\n${personalLink}\n\nTerima kasih!`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="w-full space-y-6 animate-fadeUp">
      {/* Breadcrumb & Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/clients/campaigns"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Campaign
        </Link>
      </div>

      {/* Campaign Details Header Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/30 text-emerald-300 px-3 py-0.5 rounded-full border border-emerald-400/30">
              Sesi Tes Aktif (CMP-{campaignId})
            </span>
            <span className="text-xs text-indigo-300 font-mono">
              Total Peserta: {campaignCandidates.length} Terdaftar
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">{campaign.title}</h1>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-400 font-medium">Instrumen Tes Terpilih:</span>
            {selectedTests.length === 0 ? (
              <span className="text-xs text-slate-300 italic">Standar Asesmen</span>
            ) : (
              selectedTests.map((t: any) => (
                <span
                  key={t.id}
                  className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs rounded-lg border border-indigo-400/30"
                >
                  {t.code?.toUpperCase()} — {t.name}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons Header */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            onClick={() => setIsBulkModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> 📁 Bulk Import Excel (.xlsx)
          </Button>

          <button
            onClick={() => copyToClipboard(masterLink, 'Link Sesi Ujian Utama')}
            className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all border border-white/20"
          >
            <Copy className="w-4 h-4 text-indigo-300" /> Salin Link Utama Sesi
          </button>
        </div>
      </div>

      {/* SECTION 1: Form Entry Manual Candidate (Full Width Card) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-600" /> Entry Manual Pendaftaran Candidate Single
          </h3>
          <span className="text-xs text-slate-400 font-medium">Input langsung kandidat baru ke sesi tes ini</span>
        </div>

        <form onSubmit={handleAddManualCandidate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Kandidat *</label>
            <input
              type="text"
              required
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500"
              placeholder="Contoh: Budi Santoso"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Kandidat *</label>
            <input
              type="email"
              required
              value={candidateEmail}
              onChange={(e) => setCandidateEmail(e.target.value)}
              className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500"
              placeholder="budi.santoso@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">No WhatsApp / HP (Opsional)</label>
            <input
              type="text"
              value={candidatePhone}
              onChange={(e) => setCandidatePhone(e.target.value)}
              className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500"
              placeholder="081234567890"
            />
          </div>

          <div>
            <Button
              type="submit"
              disabled={isSubmittingManual || !candidateName || !candidateEmail}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md flex items-center justify-center gap-1.5"
            >
              {isSubmittingManual ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PlusCircle className="w-4 h-4" />
              )}
              {isSubmittingManual ? 'Daftarkan...' : 'Daftarkan Kandidat Ini'}
            </Button>
          </div>
        </form>
      </div>

      {/* SECTION 2: Registered Candidates List Table */}
      <Card noPadding className="overflow-hidden border border-slate-200 shadow-sm">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="font-display font-bold text-sm text-slate-800">
              Daftar Peserta Terdaftar ({filteredCandidates.length} Peserta)
            </h3>
          </div>

          {/* Search Filter Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, email, no HP..."
              className="pl-9 w-full py-1.5 px-3 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <Table
          headers={['Nama Kandidat', 'Email', 'No WhatsApp & Undangan', 'Link Akses Ujian Personal', 'Status Pengerjaan', 'Aksi']}
          isEmpty={filteredCandidates.length === 0}
        >
          {filteredCandidates.map((cand: any) => {
            const personalLink =
              typeof window !== 'undefined'
                ? `${window.location.origin}/clients/test/${campaignId}?token=${cand.access_token}`
                : '';
            const waUrl = getWhatsAppUrl(cand.phone_number, cand.full_name, cand.access_token);

            return (
              <tr key={cand.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900 text-xs">{cand.full_name}</td>

                <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{cand.email}</td>

                <td className="py-3.5 px-4">
                  {cand.phone_number ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Kirim WA ({cand.phone_number})
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Tanpa No HP</span>
                  )}
                </td>

                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] bg-slate-100 text-slate-700 font-mono px-2.5 py-1 rounded-lg truncate max-w-[200px]">
                      {personalLink}
                    </code>
                    <button
                      onClick={() => copyToClipboard(personalLink, 'Link Ujian Personal')}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Salin Link Personal"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  {cand.status === 'COMPLETED' ? (
                    <Badge variant="success">SELESAI</Badge>
                  ) : (
                    <Badge variant="warning">BELUM MENGERJAKAN</Badge>
                  )}
                </td>

                <td className="py-3.5 px-4 text-right">
                  <a
                    href={personalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center justify-end gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Buka Ujian
                  </a>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>

      {/* Bulk Import Excel Modal */}
      <BulkImportExcelModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        campaignId={campaignId}
        campaignTitle={campaign.title}
        onSuccess={() => refreshData()}
      />
    </div>
  );
}
