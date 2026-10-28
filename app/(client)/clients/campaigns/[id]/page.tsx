import { notFound } from 'next/navigation';
import { getCampaignDetails } from '../../actions';
import { CampaignDetailView } from '@/components/client/CampaignDetailView';
import { BundleCampaignView } from '@/components/client/BundleCampaignView';
import { parseResultsQuery, queryCampaignResults } from '@/lib/campaignResults';

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

  // Mandatory 5-test bundle campaigns (employee assessment) use the results-first view.
  if (campaignData.campaign?.campaign_mode === 'MANDATORY_BUNDLE') {
    // SSR first page so the table paints instantly; SWR takes over on the client.
    const initial = await queryCampaignResults(campaignId, parseResultsQuery(new URLSearchParams()), true);
    const fallbackData = JSON.parse(JSON.stringify({ success: true, ...initial, page: 1, limit: 10 }));

    return (
      <BundleCampaignView
        campaignId={campaignId}
        campaignTitle={campaignData.campaign.title}
        companyName={campaignData.customer?.company_name}
        selectedTests={campaignData.selected_tests.map((t: any) => ({ id: t.id, code: t.code, name: t.name }))}
        fallbackData={fallbackData}
      />
    );
  }

  return <CampaignDetailView initialCampaignData={campaignData} campaignId={campaignId} />;
}
