import { SHIFT_SELECTION } from '../../constants/record-selections';
import { type ApiClient } from '../../types/api-client';
import { type ShiftRow } from '../../types/shift-row';

export const updateShift = async (
  client: ApiClient,
  shiftId: string,
  data: Record<string, unknown>,
): Promise<ShiftRow> => {
  const { updateShift: updated } = (await client.mutation({
    updateShift: {
      __args: { id: shiftId, data },
      ...SHIFT_SELECTION,
    },
  })) as { updateShift: ShiftRow };

  return updated;
};
