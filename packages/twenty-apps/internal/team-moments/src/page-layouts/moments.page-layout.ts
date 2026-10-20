import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  MOMENTS_FRONT_COMPONENT_UID,
  MOMENTS_PAGE_LAYOUT_TAB_UID,
  MOMENTS_PAGE_LAYOUT_UID,
  MOMENTS_PAGE_LAYOUT_WIDGET_UID,
} from '../constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: MOMENTS_PAGE_LAYOUT_UID,
  name: 'Team Moments',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: MOMENTS_PAGE_LAYOUT_TAB_UID,
      title: 'Moments',
      position: 0,
      icon: 'IconStar',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: MOMENTS_PAGE_LAYOUT_WIDGET_UID,
          title: 'Moments',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: MOMENTS_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
