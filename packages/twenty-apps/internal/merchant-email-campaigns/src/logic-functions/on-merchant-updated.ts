import {
  defineLogicFunction,
  type ObjectRecordUpdateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { ON_MERCHANT_UPDATED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type MerchantRow } from '../types/merchant-row';
import { buildMerchantChangeProperties } from '../utils/build-merchant-change-properties.util';
import { detectMerchantEventNames } from '../utils/detect-merchant-event-names.util';
import { scheduleEventEmails } from './utils/schedule-event-emails.util';
import { createAppClient } from './utils/create-app-client.util';

const handler = async (
  event: DatabaseEventPayload<ObjectRecordUpdateEvent<MerchantRow>>,
) => {
  const before = event.properties.before;
  const merchant = { ...event.properties.after, id: event.recordId };
  const eventNames = detectMerchantEventNames({
    before,
    after: merchant,
  });

  return {
    eventNames,
    queued: await scheduleEventEmails({
      client: createAppClient(),
      eventNames,
      merchants: [merchant],
      eventProperties: buildMerchantChangeProperties({ before, after: merchant }),
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
    // The contact/email/opt-out columns below only change on real human or
    // sender action, never on a routine sync rewrite.
    updatedFields: [
      'using',
      'shopifyPlan',
      'pricingPlan',
      'contactName',
      'email',
      'emailUnsubscribed',
    ],
  },
  handler,
});
