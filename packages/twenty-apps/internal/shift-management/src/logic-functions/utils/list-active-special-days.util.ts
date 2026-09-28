import { SPECIAL_DAY_QUERY_LIMIT } from '../../constants/query-limits';
import { SPECIAL_DAY_SELECTION } from '../../constants/record-selections';
import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { type SpecialDayRow } from '../../types/special-day-row';

export const listActiveSpecialDays = async (
  client: ApiClient,
): Promise<SpecialDayRow[]> => {
  const { specialDays } = (await client.query({
    specialDays: {
      __args: {
        filter: { isActive: { eq: true } },
        first: SPECIAL_DAY_QUERY_LIMIT,
      },
      edges: { node: SPECIAL_DAY_SELECTION },
    },
  })) as { specialDays: Connection<SpecialDayRow> };

  return (specialDays?.edges ?? []).map((edge) => edge.node);
};
