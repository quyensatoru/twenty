import { defineLogicFunction } from 'twenty-sdk/define';

import { SYNC_SESSION_PLAN_DATA_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { syncSessionPlanData } from './utils/sync-conversation-plan-data.util';

type SyncSessionPlanDataPayload = {
  websiteId?: string;
  sessionId?: string;
};

const handler = async (payload: SyncSessionPlanDataPayload | undefined) =>
  payload?.websiteId === undefined || payload.sessionId === undefined
    ? { skipped: 'websiteId and sessionId are required' }
    : syncSessionPlanData({
        websiteId: payload.websiteId,
        sessionId: payload.sessionId,
      });

export default defineLogicFunction({
  universalIdentifier: SYNC_SESSION_PLAN_DATA_LOGIC_FUNCTION_UID,
  name: 'sync-session-plan-data',
  description:
    "Job: writes the shop's plans and plan starts into the session data of a chat just opened in Crisp.",
  timeoutSeconds: 120,
  handler,
});
