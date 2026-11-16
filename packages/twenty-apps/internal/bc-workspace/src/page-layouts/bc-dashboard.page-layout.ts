import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  DASHBOARD_FRONT_COMPONENT_UID,
  DASHBOARD_PAGE_LAYOUT_UID,
  DASHBOARD_TAB_UID,
  DASHBOARD_WIDGET_UID,
} from '../constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: DASHBOARD_PAGE_LAYOUT_UID,
  name: 'BC Dashboard',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: DASHBOARD_TAB_UID,
      title: 'BC Dashboard',
      position: 0,
      icon: 'IconLayoutDashboard',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: DASHBOARD_WIDGET_UID,
          title: 'BC Dashboard',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: DASHBOARD_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
