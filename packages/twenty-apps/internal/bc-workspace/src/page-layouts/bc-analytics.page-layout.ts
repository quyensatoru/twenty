import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  ANALYTICS_FRONT_COMPONENT_UID,
  ANALYTICS_PAGE_LAYOUT_UID,
  ANALYTICS_TAB_UID,
  ANALYTICS_WIDGET_UID,
} from '../constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: ANALYTICS_PAGE_LAYOUT_UID,
  name: 'BC Analytics',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: ANALYTICS_TAB_UID,
      title: 'BC Analytics',
      position: 0,
      icon: 'IconChartBar',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: ANALYTICS_WIDGET_UID,
          title: 'BC Analytics',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: ANALYTICS_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
