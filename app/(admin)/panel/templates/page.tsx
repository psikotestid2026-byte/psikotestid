'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  Mail,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  HelpCircle,
  FileCode,
  ShieldAlert,
  SendHorizontal,
} from 'lucide-react';
import TiptapEditor from '@/components/editor/TiptapEditor';

interface TemplateItem {
  id: number;
  event_trigger: string;
  channel: string;
  message_content: string;
  is_active: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TemplatesAdminPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/admin/templates', fetcher);
  const templates: TemplateItem[] = data?.data || [];

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit / Create Form States
  const [eventTrigger, setEventTrigger] = useState('');
  const [channel, setChannel] = useState('EMAIL');
  const [messageContent, setMessageContent] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Test Email Modal State
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleOpenEdit = (template: TemplateItem) => {
    setSelectedTemplate(template);
    setEventTrigger(template.event_trigger);
    setChannel(template.channel);
    setMessageContent(template.message_content);
    setIsActive(template.is_active);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleOpenCreate = () => {
    setSelectedTemplate(null);
    setEventTrigger('');
    setChannel('EMAIL');
    setMessageContent(
      '<!DOCTYPE html><html><body><h2>Judul Template Baru</h2><p>Pesan untuk {company_name}...</p></body></html>'
    );
    setIsActive(true);
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!eventTrigger || !messageContent) {
      toast.error('Trigger Event dan Konten Pesan harus diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const endpoint = '/api/admin/templates';
      const method = isCreating ? 'POST' : 'PUT';
      const payload = isCreating
        ? { event_trigger: eventTrigger, channel, message_content: messageContent, is_active: isActive }
        : { id: selectedTemplate?.id, event_trigger: eventTrigger, channel, message_content: messageContent, is_active: isActive };

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        toast.error(result.error || 'Gagal menyimpan template.');
        return;
      }

      toast.success(result.message || 'Template berhasil disimpan!');
      setIsEditing(false);
      mutate();
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan saat menyimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (template: TemplateItem) => {
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          is_active: !template.is_active,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        toast.success(
          `Status template ${template.event_trigger} diubah menjadi ${!template.is_active ? 'Aktif' : 'Non-Aktif'}.`
        );
        mutate();
      } else {
        toast.error(result.error || 'Gagal mengubah status.');
      }
    } catch (err) {
      toast.error('Gagal memperbarui status template.');
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient || !testEmailRecipient.includes('@')) {
      toast.error('Masukkan email penerima yang valid.');
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await fetch('/api/auth/register-hr/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmailRecipient }),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        toast.success(`Email tes preview dikirim ke ${testEmailRecipient}! Cek kotak masuk Gmail.`);
        setIsTestModalOpen(false);
      } else {
        toast.error(result.error || 'Gagal mengirim email tes.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat mengirim email tes.');
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-500/30 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold text-indigo-200 mb-2">
            <Mail className="w-3.5 h-3.5" /> Superadmin Content & Notification Center
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Template Email & Notifikasi</h1>
          <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
            Kelola template email OTP verifikasi, invoice pembayaran, notifikasi Telegram Bot, dan WhatsApp secara real-time dengan Tiptap Rich Text Editor.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsTestModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-700/80 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border border-indigo-500/50 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" /> Uji Kirim Email OTP
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" /> Tambah Template Baru
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Template Listing */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-600" /> Daftar Template Sistem ({templates.length})
            </h2>
            <button
              onClick={() => mutate()}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-all"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
              Memuat daftar template notifikasi...
            </div>
          ) : templates.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Belum ada template notifikasi di database. Klik "Tambah Template Baru" untuk membuat.
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Event Trigger</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {templates.map((tpl) => (
                    <tr
                      key={tpl.id}
                      className={`hover:bg-slate-50 transition-all ${
                        selectedTemplate?.id === tpl.id ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-indigo-900">
                        {tpl.event_trigger}
                        {tpl.event_trigger === 'OTP_VERIFICATION' && (
                          <span className="ml-2 px-2 py-0.5 text-[10px] font-sans font-bold bg-amber-100 text-amber-800 rounded-full">
                            Utama OTP
                          </span>
                        )}
                        {tpl.channel === 'TELEGRAM' && (
                          <span className="ml-2 px-2 py-0.5 text-[10px] font-sans font-bold bg-sky-100 text-sky-800 rounded-full">
                            Telegram Bot
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            tpl.channel === 'EMAIL'
                              ? 'bg-blue-100 text-blue-800'
                              : tpl.channel === 'TELEGRAM'
                              ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {tpl.channel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(tpl)}
                          className="flex items-center gap-1 text-xs font-semibold transition-all hover:opacity-80"
                        >
                          {tpl.is_active ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <span className="text-emerald-700">Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-500">Non-Aktif</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(tpl)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-all inline-flex items-center gap-1 text-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit Template
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cheat Sheet Widget */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> Variabel Dynamic Placeholder
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Gunakan variabel khusus di bawah ini di dalam template Tiptap untuk mengganti data secara otomatis saat dikirim ke pengguna/Telegram:
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <code className="text-indigo-700 font-bold font-mono text-xs">{'{invoice_code}'}</code>
              <p className="text-[11px] text-slate-500 mt-0.5">Kode Invoice pesanan (misal ORD-20260816-4892).</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <code className="text-indigo-700 font-bold font-mono text-xs">{'{company_name}'}</code>
              <p className="text-[11px] text-slate-500 mt-0.5">Nama Perusahaan / Institusi HR Client.</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <code className="text-indigo-700 font-bold font-mono text-xs">{'{customer_email}'}</code>
              <p className="text-[11px] text-slate-500 mt-0.5">Alamat Email Kontak HR Client.</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <code className="text-indigo-700 font-bold font-mono text-xs">{'{contact_name}'}</code>
              <p className="text-[11px] text-slate-500 mt-0.5">Nama PIC / Kontak HR Client.</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <code className="text-indigo-700 font-bold font-mono text-xs">{'{phone_number}'}</code>
              <p className="text-[11px] text-slate-500 mt-0.5">Nomor Telepon HP Kontak HR Client.</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <code className="text-indigo-700 font-bold font-mono text-xs">{'{whatsapp_link}'}</code>
              <p className="text-[11px] text-slate-500 mt-0.5">Tautan Direct Link Chat WhatsApp HR (https://wa.me/628...).</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <code className="text-indigo-700 font-bold font-mono text-xs">{'{total_amount}'}</code>
              <p className="text-[11px] text-slate-500 mt-0.5">Nominal presisi transfer yang diformat Rupiah.</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <code className="text-indigo-700 font-bold font-mono text-xs">{'{proof_url}'}</code>
              <p className="text-[11px] text-slate-500 mt-0.5">URL Tautan Foto Bukti Transfer Vercel Blob.</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <code className="text-indigo-700 font-bold font-mono text-xs">{'{otp_code}'}</code>
              <p className="text-[11px] text-slate-500 mt-0.5">Kode OTP 6-digit acak (Khusus OTP_VERIFICATION).</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit / Create Modal Drawer with Tiptap Editor */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {isCreating ? 'Tambah Template Baru' : `Edit Template: ${eventTrigger}`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gunakan Tiptap Rich Text Editor atau Source HTML Mode untuk menyesuaikan isi pesan.
                </p>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Event Trigger *</label>
                  <input
                    type="text"
                    required
                    value={eventTrigger}
                    onChange={(e) => setEventTrigger(e.target.value.toUpperCase())}
                    placeholder="TELEGRAM_NEW_ORDER"
                    disabled={!isCreating}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl font-mono uppercase font-bold text-indigo-900 bg-slate-50 disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Saluran / Channel *</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl text-slate-900 font-semibold"
                  >
                    <option value="EMAIL">EMAIL</option>
                    <option value="TELEGRAM">TELEGRAM BOT</option>
                    <option value="WHATSAPP">WHATSAPP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Keaktifan</label>
                  <div className="flex items-center space-x-3 mt-1.5">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        {isActive ? 'Aktif (Digunakan Sistem)' : 'Non-Aktif'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Konten Template (Tiptap Rich Text / Source HTML) *</span>
                  <span className="text-[11px] text-slate-500 font-normal">Gunakan tombol "Source HTML" untuk mengedit kode HTML/Telegram.</span>
                </label>
                <TiptapEditor
                  content={messageContent}
                  onChange={(html) => setMessageContent(html)}
                  placeholder="Ketik isi template di sini..."
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isSaving ? 'Simpan...' : 'Simpan Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Email Sender Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-indigo-950 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-400" /> Uji Kirim Email OTP Gmail
              </h3>
              <button onClick={() => setIsTestModalOpen(false)} className="text-slate-400 hover:text-white text-xs">
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Kirim email verifikasi OTP uji coba menggunakan Gmail SMTP (<code className="text-indigo-600 font-bold">irvan.freelance@gmail.com</code>) dan template terbaru dari database:
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Penerima Uji Coba</label>
                <input
                  type="email"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  placeholder="contoh: irvan.freelance@gmail.com"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl text-slate-900"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-300 text-xs font-semibold text-slate-700 rounded-xl bg-white"
              >
                Batal
              </button>
              <button
                onClick={handleSendTestEmail}
                disabled={isSendingTest}
                className="px-4 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {isSendingTest ? 'Mengirim...' : 'Kirim Email Uji Coba'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
