import { getSuperAdminData } from './actions';
import DashboardClient from './DashboardClient';

export default async function SuperAdminPage() {
  const initialData = await getSuperAdminData();
  
  return (
    <DashboardClient initialData={initialData} />
  );
}
