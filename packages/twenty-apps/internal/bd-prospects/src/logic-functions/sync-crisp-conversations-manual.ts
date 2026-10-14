import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SYNC_CRISP_MANUAL_ROUTE_PATH } from '../constants/route-paths';
import { SYNC_CRISP_MANUAL_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { createConversationAppClient } from '../utils/create-conversation-app-client';
import {
  syncCrispConversations,
  type CrispSyncSummary,
} from './sync-crisp-conversations';

type SyncCrispManualBody = {
  prospectId?: string;
  limit?: number;
  after?: string;
};

// Existing prospects need one backfill when switching from Crisp API links
// to the conversations already stored in the CRM.
const handler = async (
  event: RoutePayload<SyncCrispManualBody>,
): Promise<{ success: true } & CrispSyncSummary> => {
  const client = createConversationAppClient();
  const prospectId =
    typeof event.body?.prospectId === 'string'
      ? event.body.prospectId
      : undefined;
  const rawLimit = event.body?.limit;
  const writeLimit =
    typeof rawLimit === 'number' && Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.floor(rawLimit)
      : undefined;

  const summary = await syncCrispConversations({
    client,
    prospectId,
    writeLimit,
    after: typeof event.body?.after === 'string' ? event.body.after : undefined,
  });

  return { success: true, ...summary };
};

export default defineLogicFunction({
  universalIdentifier: SYNC_CRISP_MANUAL_LOGIC_FUNCTION_UID,
  name: 'sync-crisp-conversations-manual',
  description:
    'Route: rebuilds BD chat links and Email PIC from stored CRM conversations.',
  timeoutSeconds: 600,
  httpRouteTriggerSettings: {
    path: SYNC_CRISP_MANUAL_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
