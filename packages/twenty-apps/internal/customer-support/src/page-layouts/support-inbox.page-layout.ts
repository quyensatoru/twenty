import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  SUPPORT_INBOX_FRONT_COMPONENT_UID,
  SUPPORT_INBOX_PAGE_LAYOUT_TAB_UID,
  SUPPORT_INBOX_PAGE_LAYOUT_UID,
  SUPPORT_INBOX_PAGE_LAYOUT_WIDGET_UID,
} from '../constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: SUPPORT_INBOX_PAGE_LAYOUT_UID,
  name: 'Support inbox',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: SUPPORT_INBOX_PAGE_LAYOUT_TAB_UID,
      title: 'Inbox',
      position: 0,
      icon: 'IconMessage',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: SUPPORT_INBOX_PAGE_LAYOUT_WIDGET_UID,
          title: 'Support inbox',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: SUPPORT_INBOX_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
