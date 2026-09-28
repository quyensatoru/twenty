import { type CampaignRow } from '../../types/campaign-row';
import { getCoreClient } from './get-core-client.util';

export const createCampaign = async (
  data: Partial<Omit<CampaignRow, 'id'>>,
): Promise<string> => {
  const { createEmailCampaign } = (await getCoreClient().mutation({
    createEmailCampaign: { __args: { data }, id: true },
  })) as { createEmailCampaign: { id: string } };

  return createEmailCampaign.id;
};
