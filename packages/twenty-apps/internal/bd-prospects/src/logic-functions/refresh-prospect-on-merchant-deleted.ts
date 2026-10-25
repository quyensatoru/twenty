import {
  defineLogicFunction,
  type ObjectRecordDeleteEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventBatchPayload } from 'twenty-sdk/logic-function';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { MERCHANT_UNINSTALL_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  type MerchantChange,
  refreshProspectsFromMerchants,
  type RefreshResult,
} from '../utils/refresh-prospect-from-merchants';

// The uninstall path: the merchant row goes away, the app leaves ourApps, and
// the shop is an upsell candidate again the same minute.
const handler = async (
  batch: DatabaseEventBatchPayload<ObjectRecordDeleteEvent<MerchantChange>>,
): Promise<RefreshResult[]> =>
  refreshProspectsFromMerchants({
    client: new CoreApiClient(),
    merchantStillExists: false,
    merchants: batch.events.map((event) => event.properties.before),
  });

export default defineLogicFunction({
  universalIdentifier: MERCHANT_UNINSTALL_LOGIC_FUNCTION_UID,
  name: 'refresh-prospect-on-merchant-deleted',
  description:
    'Rebuilds a shop the moment one of our apps reports an uninstall.',
  timeoutSeconds: 300,
  databaseEventTriggerSettings: {
    eventName: 'merchant.deleted',
    batchMode: true,
  },
  handler,
});
