import { SHIFT_TEMPLATE_SELECTION } from '../../constants/record-selections';
import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { type ShiftTemplateRow } from '../../types/shift-template-row';

export const fetchShiftTemplate = async (
  client: ApiClient,
  shiftTemplateId: string,
): Promise<ShiftTemplateRow | null> => {
  const { shiftTemplates } = (await client.query({
    shiftTemplates: {
      __args: { filter: { id: { eq: shiftTemplateId } }, first: 1 },
      edges: { node: SHIFT_TEMPLATE_SELECTION },
    },
  })) as { shiftTemplates: Connection<ShiftTemplateRow> };

  return shiftTemplates?.edges?.[0]?.node ?? null;
};
