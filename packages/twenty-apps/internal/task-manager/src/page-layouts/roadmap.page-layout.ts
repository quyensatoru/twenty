import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  ROADMAP_FRONT_COMPONENT_UID,
  ROADMAP_PAGE_LAYOUT_UID,
  ROADMAP_PAGE_LAYOUT_TAB_UID,
  ROADMAP_PAGE_LAYOUT_WIDGET_UID,
} from '../constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: ROADMAP_PAGE_LAYOUT_UID,
  name: 'Roadmap',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: ROADMAP_PAGE_LAYOUT_TAB_UID,
      title: 'Roadmap',
      position: 0,
      icon: 'IconRoad',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: ROADMAP_PAGE_LAYOUT_WIDGET_UID,
          title: 'Roadmap',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: ROADMAP_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
