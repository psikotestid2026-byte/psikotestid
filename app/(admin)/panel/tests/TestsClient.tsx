'use client';

import useSWR from 'swr';
import { TestsTab } from '@/components/admin/TestsTab';
import { updateTestParams, saveQuestion } from '../actions';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TestsClient({ initialData }: { initialData: any }) {
  const { data, mutate } = useSWR('/api/admin/data', fetcher, {
    fallbackData: initialData,
    refreshInterval: 15000,
  });

  const handleSaveParams = async (id: number, params: any) => {
    await updateTestParams(id, params);
    await mutate(); // Refresh the test list in data
  };

  const handleSaveQuestion = async (id: number | null, testId: number, order: number, json: string, type: string) => {
    await saveQuestion(id, testId, order, json, type);
  };

  return <TestsTab data={data} onSaveParams={handleSaveParams} onSaveQuestion={handleSaveQuestion} />;
}
