import { CAMPAIGN_SELECTION } from '../../constants/campaign-selection';
import { type CampaignRow } from '../../types/campaign-row';
import { type Connection } from '../../types/connection';
import { getCoreClient } from './get-core-client.util';

export const listCampaigns = async (): Promise<CampaignRow[]> => {
  const { emailCampaigns } = (await getCoreClient().query({
    emailCampaigns: {
      __args: { first: 200, orderBy: [{ updatedAt: 'DescNullsLast' }] },
      edges: { node: CAMPAIGN_SELECTION },
    },
  })) as { emailCampaigns: Connection<CampaignRow> };

  return (emailCampaigns?.edges ?? []).map((edge) => edge.node);
};
