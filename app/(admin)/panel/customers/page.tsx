import { getSuperAdminData } from '../actions';
import CustomersClient from './CustomersClient';

export default async function CustomersPage() {
  const initialData = await getSuperAdminData();
  
  return <CustomersClient initialData={initialData} />;
}
