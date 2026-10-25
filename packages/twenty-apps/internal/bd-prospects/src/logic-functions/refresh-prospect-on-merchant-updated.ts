import {
  defineLogicFunction,
  type ObjectRecordUpdateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventBatchPayload } from 'twenty-sdk/logic-function';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { MERCHANT_CHANGED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  type MerchantChange,
  refreshProspectsFromMerchants,
  type RefreshResult,
} from '../utils/refresh-prospect-from-merchants';

// Covers the other shape an uninstall can take: the row staying put with its
// app or plan rewritten instead of being deleted.
const handler = async (
  batch: DatabaseEventBatchPayload<ObjectRecordUpdateEvent<MerchantChange>>,
): Promise<RefreshResult[]> =>
  refreshProspectsFromMerchants({
    client: new CoreApiClient(),
    merchantStillExists: true,
    merchants: batch.events.map((event) => event.properties.after),
  });

export default defineLogicFunction({
  universalIdentifier: MERCHANT_CHANGED_LOGIC_FUNCTION_UID,
  name: 'refresh-prospect-on-merchant-updated',
  description:
    'Rebuilds a shop when its merchant row changes app, plan or domain.',
  timeoutSeconds: 300,
  databaseEventTriggerSettings: {
    eventName: 'merchant.updated',
    // Narrow on purpose: a merchant row is written often, and only these four
    // fields change what the BD area shows. `using` has to be here or an
    // uninstall is invisible until the next cron: MIDA flips only that flag and
    // leaves the plan alone, so filtering on the plan alone misses it.
    updatedFields: ['appId', 'shopifyPlan', 'name', 'using'],
    batchMode: true,
  },
  handler,
});
