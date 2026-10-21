import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  HEALTH_DASHBOARD_FRONT_COMPONENT_UID,
  HEALTH_DASHBOARD_PAGE_LAYOUT_UID,
  HEALTH_DASHBOARD_TAB_UID,
  HEALTH_DASHBOARD_WIDGET_UID,
} from '../constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: HEALTH_DASHBOARD_PAGE_LAYOUT_UID,
  name: 'Health Monitor',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: HEALTH_DASHBOARD_TAB_UID,
      title: 'Health',
      position: 0,
      icon: 'IconHeartRateMonitor',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: HEALTH_DASHBOARD_WIDGET_UID,
          title: 'Health Monitor',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              HEALTH_DASHBOARD_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
