import { type ApiClient } from '../../types/api-client';
import { type CampaignRow } from '../../types/campaign-row';
import { enqueueBroadcastBatch } from './enqueue-broadcast-batch.util';
import { updateCampaign } from './update-campaign.util';

// A resumed broadcast starts again from the first page with a fresh run id.
// Addresses already mailed by the campaign are skipped per page, so nobody
// receives it twice and the run picks up where the previous one stopped.
export const startBroadcast = async (
  client: ApiClient,
  campaign: CampaignRow,
): Promise<void> => {
  await updateCampaign(client, campaign.id, {
    status: 'SENDING',
    startedAt: campaign.startedAt ?? new Date().toISOString(),
    completedAt: null,
    lastError: '',
  });

  await enqueueBroadcastBatch({
    campaignId: campaign.id,
    runId: String(Date.now()),
    pageIndex: 0,
  });
};
