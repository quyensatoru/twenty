import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  DISCOUNTS_FRONT_COMPONENT_UID,
  DISCOUNTS_PAGE_LAYOUT_TAB_UID,
  DISCOUNTS_PAGE_LAYOUT_UID,
  DISCOUNTS_PAGE_LAYOUT_WIDGET_UID,
} from '../constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: DISCOUNTS_PAGE_LAYOUT_UID,
  name: 'Discounts',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: DISCOUNTS_PAGE_LAYOUT_TAB_UID,
      title: 'Discounts',
      position: 0,
      icon: 'IconDiscount',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: DISCOUNTS_PAGE_LAYOUT_WIDGET_UID,
          title: 'Discounts',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: DISCOUNTS_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
