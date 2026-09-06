'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  Users,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  Building2,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ParticipantItem {
  id: number;
  full_name: string;
  email: string;
  gender: string | null;
  phone: string | null;
  birth_date: string | null;
  status: string;
  created_at: string;
  company_name: string | null;
  company_email: string | null;
  campaign_title: string | null;
  completed_tests_count: number | string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ParticipantsAdminPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/admin/participants', fetcher, {
    refreshInterval: 15000,
  });

  const participants: ParticipantItem[] = data?.data || [];

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Extract unique companies for filter dropdown
  const companies = Array.from(
    new Set(participants.map((p) => p.company_name).filter(Boolean))
  ) as string[];

  // Advanced Filtering
  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.campaign_title && p.campaign_title.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesCompany = companyFilter === 'ALL' || p.company_name === companyFilter;

    return matchesSearch && matchesStatus && matchesCompany;
  });

  // Pagination Calculation
  const totalPages = Math.ceil(filteredParticipants.length / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedData = filteredParticipants.slice(startIndex, startIndex + pageSize);

  // Export XLSX Handler
  const handleExportExcel = () => {
    if (filteredParticipants.length === 0) {
      toast.error('Tidak ada data peserta yang cocok untuk diexport.');
      return;
    }

    const exportData = filteredParticipants.map((p, index) => ({
      No: index + 1,
      'Nama Lengkap': p.full_name,
      'Email Peserta': p.email,
      'No. Telepon': p.phone || '-',
      Gender: p.gender || '-',
      'Perusahaan (Klien HR)': p.company_name || '-',
      'Sesi Ujian (Campaign)': p.campaign_title || '-',
      'Jumlah Tes Selesai': Number(p.completed_tests_count || 0),
      Status: p.status,
      'Tanggal Terdaftar': new Date(p.created_at).toLocaleDateString('id-ID'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Peserta Asesmen');
    XLSX.writeFile(workbook, `Laporan_Peserta_Asesmen_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('File Excel laporan peserta asesmen berhasil diunduh!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-500/30 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold text-indigo-200 mb-2">
            <Users className="w-3.5 h-3.5" /> Candidate Talent Pool Directory
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Master Daftar Peserta Asesmen</h1>
          <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
            Direktori pusat seluruh kandidat/peserta tes yang terdaftar dari berbagai perusahaan Klien HR, sesi ujian campaign, dan status penyelesaian tes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
          >
            <Download className="w-4 h-4" /> Export XLSX
          </button>
          <button
            onClick={() => mutate()}
            className="px-4 py-2 bg-indigo-900/60 hover:bg-indigo-900 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border border-indigo-500/40 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
          </button>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari Nama Peserta, Email, Campaign..."
              className="pl-9 w-full py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Multi Advanced Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filter:
            </span>

            {/* Filter Perusahaan */}
            <select
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="py-1.5 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="ALL">Semua Perusahaan</option>
              {companies.map((comp) => (
                <option key={comp} value={comp}>
                  {comp}
                </option>
              ))}
            </select>

            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="py-1.5 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="REGISTERED">REGISTERED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
            Memuat direktori data peserta asesmen...
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Tidak ada data peserta yang cocok dengan filter.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Nama Peserta & Contact</th>
                    <th className="py-3 px-4">Perusahaan Klien</th>
                    <th className="py-3 px-4">Sesi Ujian (Campaign)</th>
                    <th className="py-3 px-4">Progres Tes</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Tanggal Daftar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((p, idx) => {
                    const rowNumber = startIndex + idx + 1;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-all">
                        {/* Row Number */}
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">
                          {rowNumber}
                        </td>

                        {/* Name & Contact */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{p.full_name}</div>
                          <div className="text-[11px] text-slate-500">{p.email}</div>
                          {p.phone && <div className="text-[10px] text-slate-400 font-mono">{p.phone}</div>}
                        </td>

                        {/* Company */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-indigo-950 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-indigo-600 shrink-0" />
                            {p.company_name || 'Tidak ada'}
                          </div>
                        </td>

                        {/* Campaign */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                            {p.campaign_title || 'Direct Test'}
                          </div>
                        </td>

                        {/* Completed Tests Count */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {Number(p.completed_tests_count || 0)} Tes Selesai
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {p.status === 'COMPLETED' ? (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-extrabold text-[10px] inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> SELESAI
                            </span>
                          ) : p.status === 'IN_PROGRESS' ? (
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full font-extrabold text-[10px] inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-blue-600" /> BERLANGSUNG
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-extrabold text-[10px]">
                              TERDAFTAR
                            </span>
                          )}
                        </td>

                        {/* Created At */}
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(p.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Menampilkan <strong className="text-slate-900">{filteredParticipants.length > 0 ? startIndex + 1 : 0}</strong> -{' '}
                <strong className="text-slate-900">{Math.min(startIndex + pageSize, filteredParticipants.length)}</strong> dari{' '}
                <strong className="text-slate-900">{filteredParticipants.length}</strong> peserta
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={safePage === 1}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 font-bold text-slate-800">
                  Halaman {safePage} dari {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={safePage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
