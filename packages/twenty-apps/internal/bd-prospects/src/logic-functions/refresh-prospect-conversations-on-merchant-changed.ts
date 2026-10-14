import { defineLogicFunction } from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { MERCHANT_CONVERSATIONS_CHANGED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { createConversationAppClient } from '../utils/create-conversation-app-client';
import { refreshProspectOnMerchantChanged } from './sync-crisp-conversations';

type MerchantChangeEvent = Parameters<
  typeof refreshProspectOnMerchantChanged
>[1];

const handler = (event: DatabaseEventPayload<MerchantChangeEvent>) =>
  refreshProspectOnMerchantChanged(createConversationAppClient(), event);

export default defineLogicFunction({
  universalIdentifier: MERCHANT_CONVERSATIONS_CHANGED_LOGIC_FUNCTION_UID,
  name: 'refresh-prospect-conversations-on-merchant-changed',
  description:
    'Rebuilds BD conversation fields when a merchant is linked, moved, deleted or restored.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'merchant.*',
    updatedFields: ['prospectId'],
  },
  handler,
});
