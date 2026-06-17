import { getSuperAdminData } from '../actions';
import TestsClient from './TestsClient';

export default async function TestsPage() {
  const initialData = await getSuperAdminData();
  return <TestsClient initialData={initialData} />;
}
