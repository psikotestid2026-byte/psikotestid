import { getSuperAdminData } from '../actions';
import AdminsClient from './AdminsClient';

export default async function AdminsPage() {
  const initialData = await getSuperAdminData();
  return <AdminsClient initialData={initialData} />;
}
