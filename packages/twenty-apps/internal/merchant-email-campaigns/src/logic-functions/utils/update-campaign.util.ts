import { type ApiClient } from '../../types/api-client';
import { type CampaignRow } from '../../types/campaign-row';
import { executeWithRetry } from '../../utils/execute-with-retry.util';

export const updateCampaign = async (
  client: ApiClient,
  campaignId: string,
  data: Partial<Omit<CampaignRow, 'id'>>,
): Promise<void> => {
  await executeWithRetry(() =>
    client.mutation({
      updateEmailCampaign: { __args: { id: campaignId, data }, id: true },
    }),
  );
};
