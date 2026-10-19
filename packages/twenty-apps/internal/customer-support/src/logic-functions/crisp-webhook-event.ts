import { defineLogicFunction } from 'twenty-sdk/define';
import { enqueueJobs } from 'twenty-sdk/logic-function';

import {
  CRISP_WEBHOOK_EVENT_LOGIC_FUNCTION_UID,
  SYNC_SESSION_PLAN_DATA_LOGIC_FUNCTION_UID,
} from '../constants/universal-identifiers';
import { type CrispWebhookBody } from '../types/crisp-api';
import { createAppClient } from './utils/create-app-client.util';
import { processCrispEvent } from './utils/process-crisp-event.util';
import { readErrorMessage } from './utils/read-error-message.util';
import {
  canWritePlanData,
  findCrispWebsite,
  readCrispSettings,
} from './utils/read-crisp-settings.util';

// The product app sets the shop's session data a moment after the chat opens;
// reading it straight away would find no shop to match.
const NEW_SESSION_PLAN_DATA_DELAY_MS = 2 * 60 * 1000;

// Queued by crisp-webhook-resolver. A thrown error makes the queue retry the
// job, which is what a transient Crisp or CRM failure should get.
const handler = async (payload: CrispWebhookBody) => {
  const settings = readCrispSettings();
  const website = findCrispWebsite(settings, payload.website_id);

  if (!settings.enabled || website === undefined) {
    return { outcome: 'ignored' };
  }

  const outcome = await processCrispEvent({
    client: createAppClient(),
    settings,
    website,
    event: payload.event ?? '',
    data: payload.data ?? {},
  });

  if (
    payload.event === 'session:request:initiated' &&
    canWritePlanData(settings) &&
    typeof payload.data?.session_id === 'string'
  ) {
    // Queued, not run here: a failure must not make the queue replay the
    // event above, and the daily sweep catches a chat this misses.
    try {
      await enqueueJobs({
        logicFunctionUniversalIdentifier:
          SYNC_SESSION_PLAN_DATA_LOGIC_FUNCTION_UID,
        payloads: [
          { websiteId: website.websiteId, sessionId: payload.data.session_id },
        ],
        retryLimit: 2,
        delayMs: NEW_SESSION_PLAN_DATA_DELAY_MS,
      });
    } catch (error) {
      return { outcome, planDataError: readErrorMessage(error) };
    }
  }

  return { outcome };
};

export default defineLogicFunction({
  universalIdentifier: CRISP_WEBHOOK_EVENT_LOGIC_FUNCTION_UID,
  name: 'crisp-webhook-event',
  description:
    'Job: writes one Crisp web hook event (message or session change) into the CRM.',
  timeoutSeconds: 120,
  handler,
});
