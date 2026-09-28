import { TEMPLATE_SELECTION } from '../../constants/template-selection';
import { type Connection } from '../../types/connection';
import { type TemplateRow } from '../../types/template-row';
import { getCoreClient } from './get-core-client.util';

export const listTemplates = async (): Promise<TemplateRow[]> => {
  const { emailTemplates } = (await getCoreClient().query({
    emailTemplates: {
      __args: { first: 200, orderBy: [{ updatedAt: 'DescNullsLast' }] },
      edges: { node: TEMPLATE_SELECTION },
    },
  })) as { emailTemplates: Connection<TemplateRow> };

  return (emailTemplates?.edges ?? []).map((edge) => edge.node);
};
