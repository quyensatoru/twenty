import { type TemplateRow } from '../../types/template-row';
import { getCoreClient } from './get-core-client.util';

export const createTemplate = async (
  data: Omit<TemplateRow, 'id'>,
): Promise<string> => {
  const { createEmailTemplate } = (await getCoreClient().mutation({
    createEmailTemplate: { __args: { data }, id: true },
  })) as { createEmailTemplate: { id: string } };

  return createEmailTemplate.id;
};
