import { getCoreClient } from './get-core-client.util';

export const deleteCampaign = async (id: string): Promise<void> => {
  await getCoreClient().mutation({
    deleteEmailCampaign: { __args: { id }, id: true },
  });
};
