import {
  defineLogicFunction,
  type ObjectRecordUpdateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventBatchPayload } from 'twenty-sdk/logic-function';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { SYNC_DEAL_STAGES_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { refreshDealStagesForProspect } from '../utils/refresh-deal-stages-for-prospect';

type UpsellDealChange = {
  id?: string | null;
  prospectId?: string | null;
};

const handler = async (
  batch: DatabaseEventBatchPayload<ObjectRecordUpdateEvent<UpsellDealChange>>,
): Promise<
  { prospectId: string; stageColumns: Record<string, string | null> }[]
> => {
  // A deal moved to another prospect leaves a stale stage on the old one.
  const prospectIds = new Set(
    batch.events
      .flatMap((event) => [
        event.properties.before?.prospectId,
        event.properties.after?.prospectId,
      ])
      .filter((prospectId): prospectId is string => !!prospectId),
  );
  const client = new CoreApiClient();
  const results = [];

  for (const prospectId of prospectIds) {
    results.push(await refreshDealStagesForProspect({ client, prospectId }));
  }

  return results;
};

// Keeps prospect.dealStages in step with the deals, so the prospect list can
// carry a Stage column: a to-many relation column cannot show a field of the
// related records, and view filters cannot reach through it either.
export default defineLogicFunction({
  universalIdentifier: SYNC_DEAL_STAGES_LOGIC_FUNCTION_UID,
  name: 'refresh-prospect-deal-stages',
  description:
    'Rewrites the per-app stage columns on a prospect whenever one of its deals is updated.',
  timeoutSeconds: 300,
  databaseEventTriggerSettings: {
    eventName: 'upsellDeal.updated',
    // suggest-close-deals rewrites suggestedClose on every app change; those
    // writes must not rebuild the stage columns.
    updatedFields: ['stage', 'targetAppId', 'prospectId'],
    batchMode: true,
  },
  handler,
});
