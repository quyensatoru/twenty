import {
  defineLogicFunction,
  type ObjectRecordDeleteEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { SYNC_DEAL_STAGES_ON_DELETE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { refreshDealStagesForProspect } from '../utils/refresh-deal-stages-for-prospect';

type UpsellDealChange = {
  id?: string | null;
  prospectId?: string | null;
};

const handler = async (
  event: DatabaseEventPayload<ObjectRecordDeleteEvent<UpsellDealChange>>,
): Promise<{
  prospectId: string | null;
  stageColumns: Record<string, string | null>;
}> => {
  const prospectId =
    event.properties.before?.prospectId ?? event.properties.after?.prospectId;

  if (!prospectId) {
    return { prospectId: null, stageColumns: {} };
  }

  return refreshDealStagesForProspect({
    client: new CoreApiClient(),
    prospectId,
  });
};

export default defineLogicFunction({
  universalIdentifier: SYNC_DEAL_STAGES_ON_DELETE_LOGIC_FUNCTION_UID,
  name: 'refresh-prospect-deal-stages-on-delete',
  description:
    'Rewrites the per-app stage columns on a prospect after one of its deals is deleted, so a removed deal stops showing in the list.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'upsellDeal.deleted',
  },
  handler,
});
