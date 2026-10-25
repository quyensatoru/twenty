import {
  defineLogicFunction,
  type ObjectRecordCreateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventBatchPayload } from 'twenty-sdk/logic-function';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { MERCHANT_INSTALL_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  type MerchantChange,
  refreshProspectsFromMerchants,
  type RefreshResult,
} from '../utils/refresh-prospect-from-merchants';

// BLOY and MIDA report installs through their CRM sync endpoint, so a merchant
// row appearing means the shop just installed. Rebuilding here rather than
// waiting for the 03:00 job keeps the BD list honest within seconds.
const handler = async (
  batch: DatabaseEventBatchPayload<ObjectRecordCreateEvent<MerchantChange>>,
): Promise<RefreshResult[]> =>
  refreshProspectsFromMerchants({
    client: new CoreApiClient(),
    merchantStillExists: true,
    merchants: batch.events.map((event) => event.properties.after),
  });

export default defineLogicFunction({
  universalIdentifier: MERCHANT_INSTALL_LOGIC_FUNCTION_UID,
  name: 'refresh-prospect-on-merchant-created',
  description:
    'Rebuilds the app columns of a shop the moment one of our apps reports an install.',
  timeoutSeconds: 300,
  databaseEventTriggerSettings: {
    eventName: 'merchant.created',
    batchMode: true,
  },
  handler,
});
