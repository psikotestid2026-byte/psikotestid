'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { OverviewTab } from '@/components/admin/OverviewTab';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { approveOrder } from './actions';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function OverviewClient({ initialData }: { initialData: any }) {
  const [approveOrderId, setApproveOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { data, mutate } = useSWR('/api/admin/data', fetcher, {
    fallbackData: initialData,
    refreshInterval: 15000,
  });

  const handleApproveOrder = async () => {
    if (!approveOrderId) return;
    setLoading(true);
    try {
      await approveOrder(approveOrderId);
      await mutate();
      toast.success('Pesanan berhasil disetujui!');
      setApproveOrderId(null);
    } catch (err: any) {
      toast.error('Gagal menyetujui pesanan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <OverviewTab data={data} onApproveOrder={(id) => setApproveOrderId(id)} />
      <Modal isOpen={approveOrderId !== null} onClose={() => setApproveOrderId(null)} title="Konfirmasi Persetujuan">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Approve pesanan ini? Kuota tes akan otomatis ditambahkan setelah disetujui.</p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setApproveOrderId(null)}>Batal</Button>
            <Button onClick={handleApproveOrder} disabled={loading}>{loading ? 'Memproses...' : 'Setujui Pesanan'}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
