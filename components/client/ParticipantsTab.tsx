'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { ActionPillLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { Eye, FileDown, Search, Users, X } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const participants = activeData?.participants || [];
  const campaigns = Array.isArray(activeData?.campaigns) ? activeData.campaigns : [];
  const customerId = Number(activeData?.customer?.id);
  const selectedCampaignId =
    campaignFilter === 'ALL' ? null : Number(campaignFilter) || null;

  const filteredParticipants = useMemo(() => {
    return participants.filter((p: any) => {
      const matchesCampaign = campaignFilter === 'ALL' || String(p.campaign_id) === campaignFilter;
      if (!matchesCampaign) return false;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'COMPLETED' ? p.status === 'COMPLETED' : p.status !== 'COMPLETED');
      if (!matchesStatus) return false;

      if (!searchQuery.trim()) return true;
      const terms = searchQuery.trim().toLowerCase().split(/\s+/);
      const targetStr = `${p.full_name || ''} ${p.email || ''} ${p.campaign_title || ''} ${p.id || ''}`.toLowerCase();
      return terms.every((term) => targetStr.includes(term));
    });
  }, [participants, campaignFilter, statusFilter, searchQuery]);

  const total = filteredParticipants.length;
  const paginatedParticipants = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredParticipants.slice(start, start + limit);
  }, [filteredParticipants, page, limit]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleCampaignFilterChange = (val: string) => {
    setCampaignFilter(val);
    setPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

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
            onChange={(event) => handleCampaignFilterChange(event.target.value)}
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
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="font-display font-bold text-sm text-slate-800">
              Daftar Hasil Kandidat ({total} Peserta)
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Filter Status Ujian */}
            <select
              aria-label="Filter status ujian"
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="py-1.5 px-3 text-xs border border-slate-300 rounded-xl bg-white font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="ALL">Semua Status Ujian</option>
              <option value="COMPLETED">Selesai</option>
              <option value="NOT_COMPLETED">Belum Mengerjakan</option>
            </select>

            {/* Search Filter Input by Terms */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari kata kunci (nama, email, sesi)..."
                className="pl-9 pr-8 w-full py-1.5 px-3 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <Table
          headers={['No', 'Nama Kandidat', 'Email', 'Sesi (Campaign)', 'Status Ujian', 'Aksi Laporan']}
          isEmpty={paginatedParticipants.length === 0}
          emptyMessage="Tidak ada data kandidat yang cocok dengan filter / pencarian."
        >
          {paginatedParticipants.map((p: any, idx: number) => {
            const rowNumber = (page - 1) * limit + idx + 1;

            return (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-4 font-semibold text-slate-500 text-xs w-12 text-center">
                  {rowNumber}
                </td>

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
                    <ActionPillLink
                      href={`/clients/participants/${p.id}`}
                      size="sm"
                      icon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Lihat Hasil ➔
                    </ActionPillLink>

                    <ActionPillLink
                      href={`/api/reports/participant/${p.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      icon={<FileDown className="w-3.5 h-3.5" />}
                    >
                      PDF
                    </ActionPillLink>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>

        <Pagination
          page={page}
          limit={limit}
          total={total}
          pageSizes={[10, 25, 50, 100]}
          onPageChange={(p) => setPage(Math.max(1, p))}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      </Card>
    </div>
  );
}
