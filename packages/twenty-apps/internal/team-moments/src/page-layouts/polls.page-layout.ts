import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  POLLS_FRONT_COMPONENT_UID,
  POLLS_PAGE_LAYOUT_TAB_UID,
  POLLS_PAGE_LAYOUT_UID,
  POLLS_PAGE_LAYOUT_WIDGET_UID,
} from '../constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: POLLS_PAGE_LAYOUT_UID,
  name: 'Polls',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: POLLS_PAGE_LAYOUT_TAB_UID,
      title: 'Polls',
      position: 0,
      icon: 'IconChartBar',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: POLLS_PAGE_LAYOUT_WIDGET_UID,
          title: 'Polls',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: POLLS_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
