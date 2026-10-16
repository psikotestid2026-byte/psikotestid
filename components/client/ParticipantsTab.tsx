'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Eye, FileDown, Search, Users } from 'lucide-react';
import { BulkPdfExportButton } from '@/components/reports/BulkPdfExportButton';

interface ParticipantsTabProps {
  data: any;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ParticipantsTab({ data }: ParticipantsTabProps) {
  const { data: clientData } = useSWR('/api/client/data', fetcher, {
    fallbackData: data,
    refreshInterval: 10000,
  });

  const activeData = clientData || data;
  const [searchQuery, setSearchQuery] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('ALL');

  const participants = activeData?.participants || [];
  const campaigns = Array.isArray(activeData?.campaigns) ? activeData.campaigns : [];
  const customerId = Number(activeData?.customer?.id);
  const selectedCampaignId =
    campaignFilter === 'ALL' ? null : Number(campaignFilter) || null;

  const filteredParticipants = participants.filter((p: any) => {
    const matchesCampaign = campaignFilter === 'ALL' || String(p.campaign_id) === campaignFilter;
    if (!matchesCampaign) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.campaign_title?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full space-y-6 animate-fadeUp">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-900">Hasil Kandidat & Laporan Asesmen</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lihat laporan individu kandidat, riwayat pengerjaan tes per orang, serta unduh PDF report.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <select
            aria-label="Sesi untuk unduhan ZIP"
            value={campaignFilter}
            onChange={(event) => setCampaignFilter(event.target.value)}
            className="py-2 px-3 text-xs border border-slate-300 rounded-xl bg-white font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="ALL">Semua sesi (batch)</option>
            {campaigns.map((campaign: { id: number | string; title?: string }) => (
              <option key={campaign.id} value={String(campaign.id)}>
                {campaign.title || `Sesi ${campaign.id}`}
              </option>
            ))}
          </select>
          <BulkPdfExportButton
            customerId={Number.isFinite(customerId) && customerId > 0 ? customerId : null}
            campaignId={selectedCampaignId}
            label="Unduh ZIP Laporan"
            title="Unduh ZIP laporan PDF peserta pada sesi yang dipilih"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm disabled:opacity-60"
          />
        </div>
      </div>

      {/* Main Participants List Table Card */}
      <Card noPadding className="overflow-hidden border border-slate-200 shadow-sm">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="font-display font-bold text-sm text-slate-800">
              Daftar Hasil Kandidat ({filteredParticipants.length} Peserta)
            </h3>
          </div>

          {/* Search Filter Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, email, campaign..."
              className="pl-9 w-full py-1.5 px-3 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <Table
          headers={['Nama Kandidat', 'Email', 'Sesi (Campaign)', 'Status Ujian', 'Aksi Laporan']}
          isEmpty={filteredParticipants.length === 0}
        >
          {filteredParticipants.map((p: any) => {
            const testResults = Array.isArray(p.test_results)
              ? p.test_results
              : typeof p.test_results === 'string'
              ? JSON.parse(p.test_results)
              : [];
            const discResult = testResults.find((r: any) => r.scoring_data);

            return (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-4 font-bold text-slate-900 text-xs">{p.full_name}</td>

                <td className="py-4 px-4 text-slate-600 font-mono text-xs">{p.email}</td>

                <td className="py-4 px-4 text-slate-700 font-semibold text-xs">
                  {p.campaign_title || '-'}
                </td>

                <td className="py-4 px-4">
                  <Badge variant={p.status === 'COMPLETED' ? 'success' : 'warning'}>
                    {p.status === 'COMPLETED' ? 'SELESAI' : 'BELUM MENGERJAKAN'}
                  </Badge>
                </td>

                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/clients/participants/${p.id}`}>
                      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-white" /> Lihat Hasil ➔
                      </Button>
                    </Link>

                    <a
                      href={`/api/reports/participant/${p.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                    >
                      <FileDown className="w-3.5 h-3.5" /> PDF
                    </a>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
}
