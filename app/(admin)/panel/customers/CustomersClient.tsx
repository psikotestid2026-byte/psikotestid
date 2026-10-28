'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { CustomersTab } from '@/components/admin/CustomersTab';
import { MembersCard } from '@/components/ui/MembersCard';
import { adjustQuotaManual } from '../actions';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CustomersClient({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false);
  
  const { data, mutate } = useSWR('/api/admin/data', fetcher, {
    fallbackData: initialData,
    refreshInterval: 15000,
  });

  const handleAdjustQuota = async (customerId: number, testId: number, diff: number) => {
    setLoading(true);
    try {
      await adjustQuotaManual(customerId, testId, diff);
      await mutate();
      toast.success('Kuota berhasil disesuaikan!');
    } catch (err: any) {
      toast.error('Gagal menyesuaikan kuota: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const [memberCustomerId, setMemberCustomerId] = useState<string>('');
  const customers: any[] = data?.customers || [];

  return (
    <div className="space-y-6">
      <CustomersTab data={data} onAdjustQuota={handleAdjustQuota} loading={loading} />
      <div className="space-y-3">
        <select
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          value={memberCustomerId}
          onChange={(e) => setMemberCustomerId(e.target.value)}
        >
          <option value="">Pilih perusahaan untuk kelola akun HR</option>
          {customers.map((c: any) => (
            <option key={c.id} value={c.id}>{c.company_name}</option>
          ))}
        </select>
        {memberCustomerId && <MembersCard key={memberCustomerId} customerId={memberCustomerId} />}
      </div>
    </div>
  );
}
