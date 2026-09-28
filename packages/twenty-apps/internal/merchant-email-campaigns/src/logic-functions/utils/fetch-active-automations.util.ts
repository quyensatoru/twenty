import { CAMPAIGN_SELECTION } from '../../constants/campaign-selection';
import { type ApiClient } from '../../types/api-client';
import { type CampaignRow } from '../../types/campaign-row';
import { type Connection } from '../../types/connection';
import { type MerchantTrigger } from '../../types/merchant-trigger';
import { executeWithRetry } from '../../utils/execute-with-retry.util';

export const fetchActiveAutomations = async (
  client: ApiClient,
  triggers: MerchantTrigger[],
): Promise<CampaignRow[]> => {
  const { emailCampaigns } = await executeWithRetry<{
    emailCampaigns: Connection<CampaignRow>;
  }>(() =>
    client.query({
      emailCampaigns: {
        __args: {
          filter: {
            campaignType: { eq: 'AUTOMATION' },
            status: { eq: 'ACTIVE' },
            trigger: { in: triggers },
          },
          first: 100,
        },
        edges: { node: CAMPAIGN_SELECTION },
      },
    }),
  );

  return (emailCampaigns?.edges ?? []).map((edge) => edge.node);
};
