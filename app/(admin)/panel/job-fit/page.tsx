import { loadJobFitAdminData } from '@/lib/jobFitAdmin';
import JobFitClient from './JobFitClient';

export const dynamic = 'force-dynamic';

export default async function JobFitPage() {
  const initialData = await loadJobFitAdminData();
  return <JobFitClient initialData={JSON.parse(JSON.stringify(initialData))} />;
}
