import {
  defineLogicFunction,
  type ObjectRecordDestroyEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { MERCHANT_DESTROYED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  type MerchantChange,
  refreshProspectFromMerchants,
  type RefreshResult,
} from '../utils/refresh-prospect-from-merchants';

// Same as the soft-delete path, for a hard delete.
const handler = async (
  event: DatabaseEventPayload<ObjectRecordDestroyEvent<MerchantChange>>,
): Promise<RefreshResult> =>
  refreshProspectFromMerchants({
    client: new CoreApiClient(),
    merchantStillExists: false,
    merchant: event.properties.before,
  });

export default defineLogicFunction({
  universalIdentifier: MERCHANT_DESTROYED_LOGIC_FUNCTION_UID,
  name: 'refresh-prospect-on-merchant-destroyed',
  description: 'Rebuilds a shop when a merchant row is deleted for good.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'merchant.destroyed',
  },
  handler,
});
