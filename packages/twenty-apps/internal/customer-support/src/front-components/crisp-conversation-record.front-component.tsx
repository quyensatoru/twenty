import { defineFrontComponent } from 'twenty-sdk/define';

import { CRISP_CONVERSATION_RECORD_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { ConversationRecord } from './components/conversation-record';

export default defineFrontComponent({
  universalIdentifier: CRISP_CONVERSATION_RECORD_FRONT_COMPONENT_UID,
  name: 'crisp-conversation-record',
  description:
    'A Crisp conversation as a chat thread, with the customer, merchant and linked issues one click away.',
  component: ConversationRecord,
});
