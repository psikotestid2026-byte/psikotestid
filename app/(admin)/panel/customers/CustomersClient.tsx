'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { CustomersTab } from '@/components/admin/CustomersTab';
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

  return <CustomersTab data={data} onAdjustQuota={handleAdjustQuota} loading={loading} />;
}
