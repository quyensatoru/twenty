import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  BACKLOG_FRONT_COMPONENT_UID,
  BACKLOG_PAGE_LAYOUT_UID,
  BACKLOG_PAGE_LAYOUT_TAB_UID,
  BACKLOG_PAGE_LAYOUT_WIDGET_UID,
} from '../constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: BACKLOG_PAGE_LAYOUT_UID,
  name: 'Backlog',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: BACKLOG_PAGE_LAYOUT_TAB_UID,
      title: 'Backlog',
      position: 0,
      icon: 'IconList',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: BACKLOG_PAGE_LAYOUT_WIDGET_UID,
          title: 'Backlog',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: BACKLOG_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
