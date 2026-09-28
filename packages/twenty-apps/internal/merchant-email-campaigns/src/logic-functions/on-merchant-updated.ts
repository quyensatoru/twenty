import {
  defineLogicFunction,
  type ObjectRecordUpdateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { ON_MERCHANT_UPDATED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type MerchantRow } from '../types/merchant-row';
import { detectMerchantTriggers } from '../utils/detect-merchant-triggers.util';
import { scheduleAutomationEmails } from './utils/schedule-automation-emails.util';
import { createAppClient } from './utils/create-app-client.util';

const handler = async (
  event: DatabaseEventPayload<ObjectRecordUpdateEvent<MerchantRow>>,
) => {
  const merchant = { ...event.properties.after, id: event.recordId };

  return scheduleAutomationEmails({
    client: createAppClient(),
    merchant,
    triggers: detectMerchantTriggers({
      before: event.properties.before,
      after: merchant,
    }),
  });
};

export default defineLogicFunction({
  universalIdentifier: ON_MERCHANT_UPDATED_LOGIC_FUNCTION_UID,
  name: 'queue-emails-on-merchant-updated',
  description:
    'Queues uninstall, reinstall and plan-change automations when a merchant row changes.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'merchant.updated',
    // MIDA flips only `using` on uninstall, so it has to be listed; the sync
    // rewrites many other columns and those must not wake this function up.
    updatedFields: ['using', 'shopifyPlan', 'pricingPlan'],
  },
  handler,
});
