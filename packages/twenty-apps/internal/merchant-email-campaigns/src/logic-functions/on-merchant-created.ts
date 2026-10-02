import {
  defineLogicFunction,
  type ObjectRecordCreateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { ON_MERCHANT_CREATED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type MerchantRow } from '../types/merchant-row';
import { detectMerchantEventNames } from '../utils/detect-merchant-event-names.util';
import { scheduleEventEmails } from './utils/schedule-event-emails.util';
import { createAppClient } from './utils/create-app-client.util';

const handler = async (
  event: DatabaseEventPayload<ObjectRecordCreateEvent<MerchantRow>>,
) => {
  const merchant = { ...event.properties.after, id: event.recordId };
  const eventNames = detectMerchantEventNames({ after: merchant });

  return {
    eventNames,
    queued: await scheduleEventEmails({
      client: createAppClient(),
      eventNames,
      merchants: [merchant],
    }),
  };
};

export default defineLogicFunction({
  universalIdentifier: ON_MERCHANT_CREATED_LOGIC_FUNCTION_UID,
  name: 'queue-emails-on-merchant-created',
  description:
    'Queues the automations bound to merchant.installed when a merchant row is created.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: { eventName: 'merchant.created' },
  handler,
});
