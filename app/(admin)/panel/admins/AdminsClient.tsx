'use client';

import useSWR from 'swr';
import { AdminsTab } from '@/components/admin/AdminsTab';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminsClient({ initialData }: { initialData: any }) {
  const { data } = useSWR('/api/admin/data', fetcher, {
    fallbackData: initialData,
    refreshInterval: 15000,
  });

  return <AdminsTab data={data} />;
}
