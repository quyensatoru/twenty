import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  PRODUCT_BACKLOG_FRONT_COMPONENT_UID,
  PRODUCT_BACKLOG_PAGE_LAYOUT_TAB_UID,
  PRODUCT_BACKLOG_PAGE_LAYOUT_UID,
  PRODUCT_BACKLOG_PAGE_LAYOUT_WIDGET_UID,
} from '../constants/product-backlog';

// A standalone page for the same reason as the Board: one app-drawn surface
// whose tabs, drag and drop and modal read through the app's scoped routes.
export default definePageLayout({
  universalIdentifier: PRODUCT_BACKLOG_PAGE_LAYOUT_UID,
  name: 'Product Backlog',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: PRODUCT_BACKLOG_PAGE_LAYOUT_TAB_UID,
      title: 'Product Backlog',
      position: 0,
      icon: 'IconListDetails',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: PRODUCT_BACKLOG_PAGE_LAYOUT_WIDGET_UID,
          title: 'Product Backlog',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              PRODUCT_BACKLOG_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
