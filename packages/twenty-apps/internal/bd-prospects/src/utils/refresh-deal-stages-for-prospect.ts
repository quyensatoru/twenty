import { type Connection, type UpsellDealRow } from './api-types';
import { buildDealStageColumns } from './deal-stage-columns';
import { executeWithRetry } from './execute-with-retry';

const DEALS_PAGE_SIZE = 100;

type ApiClient = any;

// Reads the prospect's deals back rather than patching the single changed deal
// into the stored list: the event only carries one deal, and a rebuild keeps
// the column correct even if an earlier event was lost.
export const refreshDealStagesForProspect = async ({
  client,
  prospectId,
}: {
  client: ApiClient;
  prospectId: string;
}): Promise<{
  prospectId: string;
  stageColumns: Record<string, string | null>;
}> => {
  const { upsellDeals } = await executeWithRetry<{
    upsellDeals: Connection<UpsellDealRow>;
  }>(() =>
    client.query({
      upsellDeals: {
        __args: {
          filter: { prospectId: { eq: prospectId } },
          first: DEALS_PAGE_SIZE,
        },
        edges: {
          node: {
            id: true,
            stage: true,
            targetApp: { id: true, name: true },
          },
        },
      },
    }),
  );

  const stageColumns = buildDealStageColumns(
    (upsellDeals?.edges ?? []).map((edge) => edge.node),
  );

  await executeWithRetry(() =>
    client.mutation({
      updateProspect: {
        __args: { id: prospectId, data: stageColumns },
        id: true,
      },
    }),
  );

  return { prospectId, stageColumns };
};
