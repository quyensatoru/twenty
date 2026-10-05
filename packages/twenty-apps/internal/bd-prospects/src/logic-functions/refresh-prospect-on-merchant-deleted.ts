import {
  defineLogicFunction,
  type ObjectRecordDeleteEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { MERCHANT_UNINSTALL_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  type MerchantChange,
  refreshProspectFromMerchants,
  type RefreshResult,
} from '../utils/refresh-prospect-from-merchants';

// The uninstall path: the merchant row goes away, the app leaves ourApps, and
// the shop is an upsell candidate again the same minute.
const handler = async (
  event: DatabaseEventPayload<ObjectRecordDeleteEvent<MerchantChange>>,
): Promise<RefreshResult> =>
  refreshProspectFromMerchants({
    client: new CoreApiClient(),
    merchantStillExists: false,
    merchant: event.properties.before,
  });

export default defineLogicFunction({
  universalIdentifier: MERCHANT_UNINSTALL_LOGIC_FUNCTION_UID,
  name: 'refresh-prospect-on-merchant-deleted',
  description:
    'Rebuilds a shop the moment one of our apps reports an uninstall.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'merchant.deleted',
  },
  handler,
});
