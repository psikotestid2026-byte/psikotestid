import { getSuperAdminData } from '../actions';
import NormsClient from './NormsClient';

export default async function NormsPage() {
  const initialData = await getSuperAdminData();
  return <NormsClient initialData={initialData} />;
}
