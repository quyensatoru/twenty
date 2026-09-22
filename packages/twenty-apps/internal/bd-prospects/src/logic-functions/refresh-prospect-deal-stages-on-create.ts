import {
  defineLogicFunction,
  type ObjectRecordCreateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { SYNC_DEAL_STAGES_ON_CREATE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { refreshDealStagesForProspect } from '../utils/refresh-deal-stages-for-prospect';

type UpsellDealChange = {
  id?: string | null;
  prospectId?: string | null;
};

const handler = async (
  event: DatabaseEventPayload<ObjectRecordCreateEvent<UpsellDealChange>>,
): Promise<{
  prospectId: string | null;
  stageColumns: Record<string, string | null>;
}> => {
  const prospectId = event.properties.after?.prospectId;

  if (!prospectId) {
    return { prospectId: null, stageColumns: {} };
  }

  return refreshDealStagesForProspect({
    client: new CoreApiClient(),
    prospectId,
  });
};

// Three thin triggers instead of one on `upsellDeal.upserted`: the server does
// emit UPSERTED, but the listener that dispatches logic functions
// (entity-events-to-db.listener.ts) only forwards created/updated/deleted/
// restored/destroyed, so an upserted trigger silently never fires.
export default defineLogicFunction({
  universalIdentifier: SYNC_DEAL_STAGES_ON_CREATE_LOGIC_FUNCTION_UID,
  name: 'refresh-prospect-deal-stages-on-create',
  description:
    'Rewrites the per-app stage columns on a prospect when a deal is created for that prospect.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'upsellDeal.created',
  },
  handler,
});
