import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  BOARD_FRONT_COMPONENT_UID,
  BOARD_PAGE_LAYOUT_UID,
  BOARD_PAGE_LAYOUT_TAB_UID,
  BOARD_PAGE_LAYOUT_WIDGET_UID,
} from '../constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: BOARD_PAGE_LAYOUT_UID,
  name: 'Board',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: BOARD_PAGE_LAYOUT_TAB_UID,
      title: 'Board',
      position: 0,
      icon: 'IconLayoutKanban',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: BOARD_PAGE_LAYOUT_WIDGET_UID,
          title: 'Board',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: BOARD_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
