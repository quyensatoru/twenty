import {
  defineLogicFunction,
  type ObjectRecordUpdateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { UPSELL_DEAL_CLOSED_STAGES } from '../constants/pipeline-stages';
import { SUGGEST_CLOSE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { toAppKey } from '../utils/app-key';
import { type Connection, type UpsellDealRow } from '../utils/api-types';
import { chunk } from '../utils/chunk';
import { executeWithRetry } from '../utils/execute-with-retry';

const OPEN_DEALS_PAGE_SIZE = 100;
const WRITE_BATCH_SIZE = 10;

type ProspectUpdate = {
  id?: string | null;
  ourApps?: string[] | null;
  otherApps?: string[] | null;
};

type ApiClient = any;

const handler = async (
  event: DatabaseEventPayload<ObjectRecordUpdateEvent<ProspectUpdate>>,
): Promise<{ suggested: number; withdrawn: number }> => {
  const prospect = event.properties.after;
  const prospectId = prospect.id;
  const appsUsed = [...(prospect.ourApps ?? []), ...(prospect.otherApps ?? [])];

  if (!prospectId) {
    return { suggested: 0, withdrawn: 0 };
  }

  const client: ApiClient = new CoreApiClient();

  const { upsellDeals } = await executeWithRetry<{
    upsellDeals: Connection<UpsellDealRow>;
  }>(() =>
    client.query({
      upsellDeals: {
        __args: {
          filter: { prospectId: { eq: prospectId } },
          first: OPEN_DEALS_PAGE_SIZE,
        },
        edges: {
          node: {
            id: true,
            stage: true,
            suggestedClose: true,
            targetApp: { id: true, name: true },
          },
        },
      },
    }),
  );

  const appsUsedKeys = appsUsed.flatMap((appKey) => {
    const normalizedKey = toAppKey(appKey);

    return normalizedKey === null ? [] : [normalizedKey];
  });

  const openDeals = (upsellDeals?.edges ?? [])
    .map((edge) => edge.node)
    .filter((deal) => !UPSELL_DEAL_CLOSED_STAGES.includes(deal.stage ?? ''));

  const isOnTargetApp = (deal: UpsellDealRow): boolean => {
    const targetAppKey = toAppKey(deal.targetApp?.name ?? '');

    return targetAppKey !== null && appsUsedKeys.includes(targetAppKey);
  };

  const dealsToFlag = openDeals.filter(
    (deal) => isOnTargetApp(deal) && deal.suggestedClose !== true,
  );

  // The other direction matters too: BLOY and MIDA report uninstalls, so a flag
  // raised last week can become wrong. Leaving it up would tell BD to close a
  // deal that is live again.
  const dealsToWithdraw = openDeals.filter(
    (deal) => !isOnTargetApp(deal) && deal.suggestedClose === true,
  );

  const suggestedAt = new Date().toISOString();

  for (const batch of chunk(dealsToFlag, WRITE_BATCH_SIZE)) {
    await Promise.all(
      batch.map((deal) =>
        executeWithRetry(() =>
          client.mutation({
            updateUpsellDeal: {
              __args: {
                id: deal.id,
                data: { suggestedClose: true, suggestedCloseAt: suggestedAt },
              },
              id: true,
            },
          }),
        ),
      ),
    );
  }

  for (const batch of chunk(dealsToWithdraw, WRITE_BATCH_SIZE)) {
    await Promise.all(
      batch.map((deal) =>
        executeWithRetry(() =>
          client.mutation({
            updateUpsellDeal: {
              __args: {
                id: deal.id,
                data: { suggestedClose: false, suggestedCloseAt: null },
              },
              id: true,
            },
          }),
        ),
      ),
    );
  }

  return { suggested: dealsToFlag.length, withdrawn: dealsToWithdraw.length };
};

// Flags and un-flags, never closes: the spec asks for a hint, and a stage
// change is BD's call. The flag is a column on the open-deals view so it is
// visible without opening each record.
export default defineLogicFunction({
  universalIdentifier: SUGGEST_CLOSE_LOGIC_FUNCTION_UID,
  name: 'suggest-close-deals',
  description:
    'Flags an open deal as "suggested close" once the shop is detected on its target app, and withdraws the flag if the shop later uninstalls.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'prospect.updated',
    updatedFields: ['ourApps', 'otherApps'],
  },
  handler,
});
