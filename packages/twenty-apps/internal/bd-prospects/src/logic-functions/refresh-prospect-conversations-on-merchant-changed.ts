import { defineLogicFunction } from 'twenty-sdk/define';
import { type DatabaseEventBatchPayload } from 'twenty-sdk/logic-function';

import { MERCHANT_CONVERSATIONS_CHANGED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { createConversationAppClient } from '../utils/create-conversation-app-client';
import { refreshProspectOnMerchantChanged } from './sync-crisp-conversations';

type MerchantChangeEvent = Parameters<
  typeof refreshProspectOnMerchantChanged
>[1][number];

const handler = (batch: DatabaseEventBatchPayload<MerchantChangeEvent>) =>
  refreshProspectOnMerchantChanged(createConversationAppClient(), batch.events);

export default defineLogicFunction({
  universalIdentifier: MERCHANT_CONVERSATIONS_CHANGED_LOGIC_FUNCTION_UID,
  name: 'refresh-prospect-conversations-on-merchant-changed',
  description:
    'Rebuilds BD conversation fields when a merchant is linked, moved, deleted or restored.',
  timeoutSeconds: 300,
  databaseEventTriggerSettings: {
    eventName: 'merchant.*',
    updatedFields: ['prospectId'],
    batchMode: true,
  },
  handler,
});
