import {
  defineLogicFunction,
  type ObjectRecordCreateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { MERCHANT_INSTALL_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  type MerchantChange,
  refreshProspectFromMerchants,
  type RefreshResult,
} from '../utils/refresh-prospect-from-merchants';

// BLOY and MIDA report installs through their CRM sync endpoint, so a merchant
// row appearing means the shop just installed. Rebuilding here rather than
// waiting for the 03:00 job keeps the BD list honest within seconds.
const handler = async (
  event: DatabaseEventPayload<ObjectRecordCreateEvent<MerchantChange>>,
): Promise<RefreshResult> =>
  refreshProspectFromMerchants({
    client: new CoreApiClient(),
    merchantStillExists: true,
    merchant: event.properties.after,
  });

export default defineLogicFunction({
  universalIdentifier: MERCHANT_INSTALL_LOGIC_FUNCTION_UID,
  name: 'refresh-prospect-on-merchant-created',
  description:
    'Rebuilds the app columns of a shop the moment one of our apps reports an install.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'merchant.created',
  },
  handler,
});
