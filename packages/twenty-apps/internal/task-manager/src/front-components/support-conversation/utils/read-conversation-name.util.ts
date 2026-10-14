import { t } from 'twenty-sdk/front-component';

import { type SupportInboxConversation } from '../types/support-inbox';

export const readConversationName = (
  conversation: SupportInboxConversation,
): string =>
  conversation.visitorName ??
  conversation.visitorEmail ??
  conversation.shopDomain ??
  t('Visitor');
