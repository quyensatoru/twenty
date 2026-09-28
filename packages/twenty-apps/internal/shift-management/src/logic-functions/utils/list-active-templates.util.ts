import { TEMPLATE_QUERY_LIMIT } from '../../constants/query-limits';
import { SHIFT_TEMPLATE_SELECTION } from '../../constants/record-selections';
import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { type ShiftTemplateRow } from '../../types/shift-template-row';

export const listActiveTemplates = async (
  client: ApiClient,
): Promise<ShiftTemplateRow[]> => {
  const { shiftTemplates } = (await client.query({
    shiftTemplates: {
      __args: {
        filter: { isActive: { eq: true } },
        orderBy: [{ code: 'AscNullsLast' }],
        first: TEMPLATE_QUERY_LIMIT,
      },
      edges: { node: SHIFT_TEMPLATE_SELECTION },
    },
  })) as { shiftTemplates: Connection<ShiftTemplateRow> };

  return (shiftTemplates?.edges ?? []).map((edge) => edge.node);
};
