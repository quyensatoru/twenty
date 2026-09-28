import { type TemplateRow } from '../../types/template-row';
import { getCoreClient } from './get-core-client.util';

export const updateTemplate = async (
  id: string,
  data: Partial<Omit<TemplateRow, 'id'>>,
): Promise<void> => {
  await getCoreClient().mutation({
    updateEmailTemplate: { __args: { id, data }, id: true },
  });
};
