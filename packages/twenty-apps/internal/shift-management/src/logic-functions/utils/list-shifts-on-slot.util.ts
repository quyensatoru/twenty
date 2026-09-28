import { SHIFT_QUERY_LIMIT } from '../../constants/query-limits';
import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';

type SlotShift = { id: string; memberId: string | null; status: string };

// Everyone already registered on one (date, template) slot — the duplicate and
// OT-exclusivity checks read this.
export const listShiftsOnSlot = async ({
  client,
  date,
  shiftTemplateId,
}: {
  client: ApiClient;
  date: string;
  shiftTemplateId: string;
}): Promise<SlotShift[]> => {
  const { shifts } = (await client.query({
    shifts: {
      __args: {
        filter: {
          and: [
            { date: { eq: date } },
            { shiftTemplateId: { eq: shiftTemplateId } },
          ],
        },
        first: SHIFT_QUERY_LIMIT,
      },
      edges: { node: { id: true, memberId: true, status: true } },
    },
  })) as { shifts: Connection<SlotShift> };

  return (shifts?.edges ?? []).map((edge) => edge.node);
};
