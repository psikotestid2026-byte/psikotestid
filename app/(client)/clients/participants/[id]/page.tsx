import { notFound } from 'next/navigation';
import { getParticipantFullDetails } from '../../actions';
import { ParticipantDetailView } from '@/components/client/ParticipantDetailView';

export default async function ParticipantDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;
  const participantId = parseInt(resolvedParams.id, 10);

  if (isNaN(participantId)) {
    notFound();
  }

  const participantData = await getParticipantFullDetails(participantId);

  if (!participantData) {
    notFound();
  }

  return <ParticipantDetailView participantData={participantData} participantId={participantId} />;
}
