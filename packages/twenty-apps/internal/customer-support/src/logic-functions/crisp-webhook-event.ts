import { defineLogicFunction } from 'twenty-sdk/define';

import { CRISP_WEBHOOK_EVENT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type CrispWebhookBody } from '../types/crisp-api';
import { createAppClient } from './utils/create-app-client.util';
import { processCrispEvent } from './utils/process-crisp-event.util';
import {
  findCrispWebsite,
  readCrispSettings,
} from './utils/read-crisp-settings.util';

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
