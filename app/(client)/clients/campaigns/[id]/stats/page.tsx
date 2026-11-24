import { notFound } from 'next/navigation';
import { getCampaignDetails } from '../../../actions';
import { CampaignStatsTab } from '@/components/client/CampaignStatsTab';
import { ActionPillLink } from '@/components/ui/Button';
import { ArrowLeft, BarChart3 } from 'lucide-react';

export default async function CampaignStatsPage({
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

  return (
    <div className="w-full space-y-6 animate-fadeUp">
      <div className="flex items-center justify-between">
        <ActionPillLink
          href={`/clients/campaigns/${campaignId}`}
          size="sm"
          variant="outline"
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Kembali ke Rekap Sesi
        </ActionPillLink>
        <span className="text-xs text-slate-500 font-mono">
          Sesi: {campaignData.campaign?.title} (CMP-{campaignId})
        </span>
      </div>

      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 px-3 py-0.5 rounded-full border border-indigo-400/30">
            Halaman Statistik & Analitik
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1">
            Dashboard Statistik: {campaignData.campaign?.title}
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Perusahaan: {campaignData.customer?.company_name || 'PsikoTest Enterprise'}
          </p>
        </div>
      </div>

      <CampaignStatsTab campaignId={campaignId} />
    </div>
  );
}

