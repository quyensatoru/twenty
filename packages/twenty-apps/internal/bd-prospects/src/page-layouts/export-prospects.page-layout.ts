import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  EXPORT_PAGE_LAYOUT_TAB_UID,
  EXPORT_PAGE_LAYOUT_UID,
  EXPORT_PAGE_LAYOUT_WIDGET_UID,
  EXPORT_PROSPECTS_FRONT_COMPONENT_UID,
} from '../constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: EXPORT_PAGE_LAYOUT_UID,
  name: 'Export prospects',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: EXPORT_PAGE_LAYOUT_TAB_UID,
      title: 'Export',
      position: 0,
      icon: 'IconFileExport',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: EXPORT_PAGE_LAYOUT_WIDGET_UID,
          title: 'Export prospects',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              EXPORT_PROSPECTS_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
