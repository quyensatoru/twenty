import { type CampaignRow } from '../../types/campaign-row';
import { getCoreClient } from './get-core-client.util';

// Status is never written from the studio: it only moves through the launch
// route, which checks the member is allowed to send.
export const updateCampaignDraft = async (
  id: string,
  data: Partial<
    Omit<
      CampaignRow,
      'id' | 'status' | 'startedAt' | 'completedAt' | 'lastError'
    >
  >,
): Promise<void> => {
  await getCoreClient().mutation({
    updateEmailCampaign: { __args: { id, data }, id: true },
  });
};
