import {
  defineLogicFunction,
  type ObjectRecordUpdateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { SYNC_DEAL_STAGES_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { refreshDealStagesForProspect } from '../utils/refresh-deal-stages-for-prospect';

type UpsellDealChange = {
  id?: string | null;
  prospectId?: string | null;
};

const handler = async (
  event: DatabaseEventPayload<ObjectRecordUpdateEvent<UpsellDealChange>>,
): Promise<{
  prospectId: string | null;
  stageColumns: Record<string, string | null>;
}> => {
  const prospectId =
    event.properties.after?.prospectId ?? event.properties.before?.prospectId;

  if (!prospectId) {
    return { prospectId: null, stageColumns: {} };
  }

  return refreshDealStagesForProspect({
    client: new CoreApiClient(),
    prospectId,
  });
};

// Keeps prospect.dealStages in step with the deals, so the prospect list can
// carry a Stage column: a to-many relation column cannot show a field of the
// related records, and view filters cannot reach through it either.
export default defineLogicFunction({
  universalIdentifier: SYNC_DEAL_STAGES_LOGIC_FUNCTION_UID,
  name: 'refresh-prospect-deal-stages',
  description:
    'Rewrites the per-app stage columns on a prospect whenever one of its deals is updated.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'upsellDeal.updated',
  },
  handler,
});
