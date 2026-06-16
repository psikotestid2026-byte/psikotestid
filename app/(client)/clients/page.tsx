import { getClientData } from './actions';
import ClientDashboard from './ClientDashboard';

export default async function ClientsPage() {
  // Using hardcoded customer_id 2 (PT Telekomunikasi Selular from seed data)
  // as per agreement since login is skipped.
  const initialData = await getClientData(2);

  return (
    <ClientDashboard initialData={initialData} />
  );
}
