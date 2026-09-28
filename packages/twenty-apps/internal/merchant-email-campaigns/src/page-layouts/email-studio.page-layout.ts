import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  EMAIL_STUDIO_FRONT_COMPONENT_UID,
  EMAIL_STUDIO_PAGE_LAYOUT_TAB_UID,
  EMAIL_STUDIO_PAGE_LAYOUT_UID,
  EMAIL_STUDIO_PAGE_LAYOUT_WIDGET_UID,
} from '../constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: EMAIL_STUDIO_PAGE_LAYOUT_UID,
  name: 'Email Studio',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: EMAIL_STUDIO_PAGE_LAYOUT_TAB_UID,
      title: 'Email Studio',
      position: 0,
      icon: 'IconPalette',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: EMAIL_STUDIO_PAGE_LAYOUT_WIDGET_UID,
          title: 'Email Studio',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: EMAIL_STUDIO_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
