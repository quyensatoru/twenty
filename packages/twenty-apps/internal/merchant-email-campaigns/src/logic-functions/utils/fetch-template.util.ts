import { TEMPLATE_SELECTION } from '../../constants/template-selection';
import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { type TemplateRow } from '../../types/template-row';
import { executeWithRetry } from '../../utils/execute-with-retry.util';

export const fetchTemplate = async (
  client: ApiClient,
  templateId: string,
): Promise<TemplateRow | null> => {
  const { emailTemplates } = await executeWithRetry<{
    emailTemplates: Connection<TemplateRow>;
  }>(() =>
    client.query({
      emailTemplates: {
        __args: { filter: { id: { eq: templateId } }, first: 1 },
        edges: { node: TEMPLATE_SELECTION },
      },
    }),
  );

  return emailTemplates?.edges?.[0]?.node ?? null;
};
