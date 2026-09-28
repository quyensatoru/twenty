import { getCoreClient } from './get-core-client.util';

export const deleteTemplate = async (id: string): Promise<void> => {
  await getCoreClient().mutation({
    deleteEmailTemplate: { __args: { id }, id: true },
  });
};
