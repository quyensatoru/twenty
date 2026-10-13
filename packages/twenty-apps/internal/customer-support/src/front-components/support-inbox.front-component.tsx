import { defineFrontComponent } from 'twenty-sdk/define';

import { SUPPORT_INBOX_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { SupportInbox } from './components/support-inbox';

export default defineFrontComponent({
  universalIdentifier: SUPPORT_INBOX_FRONT_COMPONENT_UID,
  name: 'support-inbox',
  description:
    'Crisp chats of every product in one inbox, with the merchant beside each conversation.',
  component: SupportInbox,
});
