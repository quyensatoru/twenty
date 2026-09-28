import { CAMPAIGN_SELECTION } from '../../constants/campaign-selection';
import { type ApiClient } from '../../types/api-client';
import { type CampaignRow } from '../../types/campaign-row';
import { type Connection } from '../../types/connection';
import { executeWithRetry } from '../../utils/execute-with-retry.util';

export const fetchCampaign = async (
  client: ApiClient,
  campaignId: string,
): Promise<CampaignRow | null> => {
  const { emailCampaigns } = await executeWithRetry<{
    emailCampaigns: Connection<CampaignRow>;
  }>(() =>
    client.query({
      emailCampaigns: {
        __args: { filter: { id: { eq: campaignId } }, first: 1 },
        edges: { node: CAMPAIGN_SELECTION },
      },
    }),
  );

  return emailCampaigns?.edges?.[0]?.node ?? null;
};
