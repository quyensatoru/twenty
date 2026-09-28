import { SHIFT_SELECTION } from '../../constants/record-selections';
import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { type ShiftRow } from '../../types/shift-row';

export const fetchShift = async (
  client: ApiClient,
  shiftId: string,
): Promise<ShiftRow | null> => {
  const { shifts } = (await client.query({
    shifts: {
      __args: { filter: { id: { eq: shiftId } }, first: 1 },
      edges: { node: SHIFT_SELECTION },
    },
  })) as { shifts: Connection<ShiftRow> };

  return shifts?.edges?.[0]?.node ?? null;
};
