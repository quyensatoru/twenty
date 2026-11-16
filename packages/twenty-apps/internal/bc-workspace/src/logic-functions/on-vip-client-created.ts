import {
  defineLogicFunction,
  type ObjectRecordCreateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { ON_VIP_CLIENT_CREATED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type VipClientRecord } from '../types/bc-records';
import { handlePicChange } from './utils/automation-pic.util';
import { readVipClient } from './utils/client-store.util';
import { createAppClient } from './utils/create-app-client.util';
import { recomputeClientStatus } from './utils/recompute-client-status.util';

const handler = async (
  event: DatabaseEventPayload<ObjectRecordCreateEvent<VipClientRecord>>,
) => {
  const client = createAppClient();
  const vipClient = await readVipClient(client, event.recordId);

  if (vipClient === null) {
    return { outcome: 'ignored' };
  }

  const result =
    vipClient.picId === null
      ? { reassignedTaskCount: 0, isNew: false }
      : await handlePicChange({
          client,
          vipClient,
          fromMemberId: null,
          toMemberId: vipClient.picId,
          fromTeamId: null,
          toTeamId: vipClient.teamId,
          actorMemberId: vipClient.picAssignedById ?? event.workspaceMemberId ?? null,
          effectiveAt: vipClient.createdAt,
        });

  await recomputeClientStatus({ client, vipClientId: vipClient.id });

  return result;
};

export default defineLogicFunction({
  universalIdentifier: ON_VIP_CLIENT_CREATED_LOGIC_FUNCTION_UID,
  name: 'on-vip-client-created',
  description:
    'Records the first PIC assignment of a new VIP client and opens its onboarding task.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'vipClient.created',
  },
  handler,
});
