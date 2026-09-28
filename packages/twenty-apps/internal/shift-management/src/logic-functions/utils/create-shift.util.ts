import { SHIFT_SELECTION } from '../../constants/record-selections';
import { type ApiClient } from '../../types/api-client';
import { type ShiftRow } from '../../types/shift-row';

export const createShift = async (
  client: ApiClient,
  data: Record<string, unknown>,
): Promise<ShiftRow> => {
  const { createShift: created } = (await client.mutation({
    createShift: {
      __args: { data },
      ...SHIFT_SELECTION,
    },
  })) as { createShift: ShiftRow };

  return created;
};
