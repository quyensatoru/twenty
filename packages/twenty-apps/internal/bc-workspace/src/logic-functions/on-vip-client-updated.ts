import {
  defineLogicFunction,
  type ObjectRecordUpdateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { ON_VIP_CLIENT_UPDATED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type VipClientRecord } from '../types/bc-records';
import { handlePicChange } from './utils/automation-pic.util';
import { readVipClient } from './utils/client-store.util';
import { createAppClient } from './utils/create-app-client.util';

const handler = async (
  event: DatabaseEventPayload<ObjectRecordUpdateEvent<VipClientRecord>>,
) => {
  const fromMemberId = event.properties.before?.picId ?? null;
  const toMemberId = event.properties.after?.picId ?? null;

  if (fromMemberId === toMemberId) {
    return { outcome: 'unchanged' };
  }

  const client = createAppClient();
  const vipClient = await readVipClient(client, event.recordId);

  if (vipClient === null) {
    return { outcome: 'ignored' };
  }

  const after = event.properties.after;

  // Routes write as the application, so the event carries no member; the
  // dashboard records who made the change on the same write.
  return handlePicChange({
    client,
    vipClient,
    fromMemberId,
    toMemberId,
    fromTeamId: event.properties.before?.teamId ?? null,
    toTeamId: after?.teamId ?? vipClient.teamId,
    actorMemberId: after?.picAssignedById ?? event.workspaceMemberId ?? null,
    effectiveAt:
      (after as { updatedAt?: string } | undefined)?.updatedAt ?? new Date().toISOString(),
  });
};

export default defineLogicFunction({
  universalIdentifier: ON_VIP_CLIENT_UPDATED_LOGIC_FUNCTION_UID,
  name: 'on-vip-client-updated',
  description:
    'Audits a PIC change, hands the open tasks of the previous PIC to the new one and opens onboarding for a first assignment.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'vipClient.updated',
    updatedFields: ['picId'],
  },
  handler,
});
