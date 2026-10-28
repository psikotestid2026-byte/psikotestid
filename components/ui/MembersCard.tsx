'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/** Manages the HR logins (Google accounts) of one company. Pass customerId only from the admin panel. */
export function MembersCard({ customerId }: { customerId?: number | string }) {
  const url = `/api/client/members${customerId ? `?customer_id=${customerId}` : ''}`;
  const { data, mutate } = useSWR(url, fetcher);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const call = async (method: string, body: unknown, okMessage: string) => {
    setBusy(true);
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) throw new Error(json.error || 'Permintaan gagal.');
      toast.success(okMessage);
      await mutate();
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async () => {
    if (await call('POST', { email, full_name: name }, 'Akun HR ditambahkan.')) {
      setEmail('');
      setName('');
    }
  };

  const members: any[] = data?.members || [];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="font-bold text-slate-900">Akun HR</h3>
        <p className="text-xs text-slate-500">Setiap akun masuk dengan Google menggunakan email yang didaftarkan di sini.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px]"
          placeholder="Nama HR"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[220px]"
          placeholder="email.google@perusahaan.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button size="sm" onClick={add} disabled={busy || !email.trim()}>Tambah HR</Button>
      </div>
      <ul className="divide-y divide-slate-100">
        {members.map((m) => (
          <li key={m.id} className="py-2 flex items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-medium text-slate-900">{m.full_name || '-'}</p>
              <p className="text-xs text-slate-500">{m.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={m.status === 'ACTIVE' ? 'success' : 'default'}>{m.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}</Badge>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => call('PATCH', { id: m.id, status: m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }, 'Status akun HR diperbarui.')}
              >
                {m.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
              </Button>
            </div>
          </li>
        ))}
        {members.length === 0 && <li className="py-3 text-xs text-slate-500">Belum ada akun HR.</li>}
      </ul>
    </div>
  );
}
