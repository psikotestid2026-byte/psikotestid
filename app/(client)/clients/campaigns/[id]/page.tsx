import { notFound } from 'next/navigation';
import { getCampaignDetails } from '../../actions';
import { CampaignDetailView } from '@/components/client/CampaignDetailView';

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;
  const campaignId = parseInt(resolvedParams.id, 10);

  if (isNaN(campaignId)) {
    notFound();
  }

  const campaignData = await getCampaignDetails(campaignId);

  if (!campaignData) {
    notFound();
  }

  return <CampaignDetailView initialCampaignData={campaignData} campaignId={campaignId} />;
}
