import { SHIFT_QUERY_LIMIT } from '../../constants/query-limits';
import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';

// `date` is a TEXT column holding an ICT calendar day, so a lexicographic
// gte/lte pair is a valid inclusive date-range compare. Twenty filters allow
// exactly one operator per field, hence the `and` of two single-operator
// clauses rather than gte+lte on one field.
export const listShiftsInRange = async <TRow>({
  client,
  fromDate,
  toDate,
  memberId,
  selection,
  extraFilters = [],
}: {
  client: ApiClient;
  fromDate: string;
  toDate: string;
  memberId?: string | null;
  selection: Record<string, boolean>;
  extraFilters?: Record<string, unknown>[];
}): Promise<TRow[]> => {
  const { shifts } = (await client.query({
    shifts: {
      __args: {
        filter: {
          and: [
            { date: { gte: fromDate } },
            { date: { lte: toDate } },
            ...(memberId === undefined || memberId === null
              ? []
              : [{ memberId: { eq: memberId } }]),
            ...extraFilters,
          ],
        },
        orderBy: [{ date: 'AscNullsLast' }, { startTime: 'AscNullsLast' }],
        first: SHIFT_QUERY_LIMIT,
      },
      edges: { node: selection },
    },
  })) as { shifts: Connection<TRow> };

  return (shifts?.edges ?? []).map((edge) => edge.node);
};
