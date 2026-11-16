import { defineLogicFunction } from 'twenty-sdk/define';
import { enqueueJobs } from 'twenty-sdk/logic-function';

import { CLASSIFY_MESSAGE_JOB_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { classifyClientMessageLocked } from './utils/ai-classify-message.util';
import { createAppClient } from './utils/create-app-client.util';

type ClassifyPayload = { messageId?: string; vipClientId?: string; deferrals?: number };

const DEFER_DELAY_MS = 30_000;
const MAX_DEFERRALS = 10;

const handler = async (payload: ClassifyPayload) => {
  if (typeof payload?.messageId !== 'string' || typeof payload?.vipClientId !== 'string') {
    return { outcome: 'skipped' };
  }

  const result = await classifyClientMessageLocked({
    client: createAppClient(),
    messageId: payload.messageId,
    vipClientId: payload.vipClientId,
  });

  // Another message of the same client is being classified; try again once
  // it is done so this one can see the issue the other may open.
  if (result.outcome === 'deferred') {
    const deferrals = (payload.deferrals ?? 0) + 1;

    if (deferrals > MAX_DEFERRALS) {
      return { outcome: 'skipped', reason: 'client lock stayed busy' };
    }

    await enqueueJobs({
      logicFunctionUniversalIdentifier: CLASSIFY_MESSAGE_JOB_LOGIC_FUNCTION_UID,
      payloads: [{ ...payload, deferrals }],
      retryLimit: 2,
      delayMs: DEFER_DELAY_MS,
    });
  }

  return result;
};

export default defineLogicFunction({
  universalIdentifier: CLASSIFY_MESSAGE_JOB_LOGIC_FUNCTION_UID,
  name: 'classify-message-job',
  description:
    "Queued: asks AI whether a VIP client's message reports a new issue or an open one, and opens or updates the issue and its BC task.",
  timeoutSeconds: 120,
  handler,
});
