import {
  defineLogicFunction,
  type ObjectRecordUpdateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { MERCHANT_CHANGED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  type MerchantChange,
  refreshProspectFromMerchants,
  type RefreshResult,
} from '../utils/refresh-prospect-from-merchants';

// Covers the other shape an uninstall can take: the row staying put with its
// app or plan rewritten instead of being deleted.
const handler = async (
  event: DatabaseEventPayload<ObjectRecordUpdateEvent<MerchantChange>>,
): Promise<RefreshResult> =>
  refreshProspectFromMerchants({
    client: new CoreApiClient(),
    merchantStillExists: true,
    merchant: event.properties.after,
  });

export default defineLogicFunction({
  universalIdentifier: MERCHANT_CHANGED_LOGIC_FUNCTION_UID,
  name: 'refresh-prospect-on-merchant-updated',
  description:
    'Rebuilds a shop when its merchant row changes app, plan or domain.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'merchant.updated',
    // Narrow on purpose: a merchant row is written often, and only these three
    // fields change what the BD area shows.
    updatedFields: ['appId', 'shopifyPlan', 'name'],
  },
  handler,
});
