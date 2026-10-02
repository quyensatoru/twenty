import {
  defineLogicFunction,
  type ObjectRecordUpdateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { ON_MERCHANT_UPDATED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type MerchantRow } from '../types/merchant-row';
import { detectMerchantEventNames } from '../utils/detect-merchant-event-names.util';
import { scheduleEventEmails } from './utils/schedule-event-emails.util';
import { createAppClient } from './utils/create-app-client.util';

const handler = async (
  event: DatabaseEventPayload<ObjectRecordUpdateEvent<MerchantRow>>,
) => {
  const merchant = { ...event.properties.after, id: event.recordId };
  const eventNames = detectMerchantEventNames({
    before: event.properties.before,
    after: merchant,
  });

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
  universalIdentifier: ON_MERCHANT_UPDATED_LOGIC_FUNCTION_UID,
  name: 'queue-emails-on-merchant-updated',
  description:
    'Queues the automations bound to merchant.uninstalled, merchant.installed and the plan-change events when a merchant row changes.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'merchant.updated',
    // MIDA flips only `using` on uninstall, so it has to be listed; the sync
    // rewrites many other columns and those must not wake this function up.
    updatedFields: ['using', 'shopifyPlan', 'pricingPlan'],
  },
  handler,
});
