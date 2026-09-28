import {
  defineLogicFunction,
  type ObjectRecordCreateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { ON_MERCHANT_CREATED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type MerchantRow } from '../types/merchant-row';
import { detectMerchantTriggers } from '../utils/detect-merchant-triggers.util';
import { scheduleAutomationEmails } from './utils/schedule-automation-emails.util';
import { createAppClient } from './utils/create-app-client.util';

const handler = async (
  event: DatabaseEventPayload<ObjectRecordCreateEvent<MerchantRow>>,
) => {
  const merchant = { ...event.properties.after, id: event.recordId };

  return scheduleAutomationEmails({
    client: createAppClient(),
    merchant,
    triggers: detectMerchantTriggers({ after: merchant }),
  });
};

export default defineLogicFunction({
  universalIdentifier: ON_MERCHANT_CREATED_LOGIC_FUNCTION_UID,
  name: 'queue-emails-on-merchant-created',
  description:
    'Queues "App installed" automations when a merchant row is created.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: { eventName: 'merchant.created' },
  handler,
});
