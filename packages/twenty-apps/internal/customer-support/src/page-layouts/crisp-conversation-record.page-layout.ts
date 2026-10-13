import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  CRISP_CONVERSATION_OBJECT_UID,
  CRISP_CONVERSATION_RECORD_FRONT_COMPONENT_UID,
  CRISP_CONVERSATION_RECORD_PAGE_LAYOUT_UID,
  CRISP_CONVERSATION_RECORD_PAGE_TAB_UID,
  CRISP_CONVERSATION_RECORD_PAGE_WIDGET_UID,
} from '../constants/universal-identifiers';

// Replaces the engine's default field list: a conversation opened from an
// issue or a merchant should read like the chat it is. The host prefers a
// declared record page over its own side-effect one.
export default definePageLayout({
  universalIdentifier: CRISP_CONVERSATION_RECORD_PAGE_LAYOUT_UID,
  name: 'Crisp Conversation Record Page',
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: CRISP_CONVERSATION_OBJECT_UID,
  tabs: [
    {
      universalIdentifier: CRISP_CONVERSATION_RECORD_PAGE_TAB_UID,
      title: 'Conversation',
      position: 0,
      icon: 'IconMessage',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: CRISP_CONVERSATION_RECORD_PAGE_WIDGET_UID,
          title: ' ',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              CRISP_CONVERSATION_RECORD_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
