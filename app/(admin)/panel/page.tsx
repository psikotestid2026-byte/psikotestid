import { getSuperAdminData } from './actions';
import OverviewClient from './OverviewClient';

export default async function SuperAdminPage() {
  const initialData = await getSuperAdminData();
  
  return (
    <OverviewClient initialData={initialData} />
  );
}
