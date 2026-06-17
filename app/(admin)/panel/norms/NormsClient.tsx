'use client';

import useSWR from 'swr';
import { NormsTab } from '@/components/admin/NormsTab';
import { getTestConfigAndNorms, saveScoringConfig, saveNorm, batchInsertNorms } from '../actions';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function NormsClient({ initialData }: { initialData: any }) {
  const { data } = useSWR('/api/admin/data', fetcher, {
    fallbackData: initialData,
    refreshInterval: 15000,
  });

  return (
    <NormsTab 
      data={data} 
      getTestConfigAndNorms={getTestConfigAndNorms}
      saveScoringConfig={saveScoringConfig}
      saveNorm={saveNorm}
      batchInsertNorms={batchInsertNorms}
    />
  );
}
