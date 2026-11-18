import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  RELEASE_NOTIFICATIONS_FRONT_COMPONENT_UID,
  RELEASE_NOTIFICATIONS_PAGE_LAYOUT_TAB_UID,
  RELEASE_NOTIFICATIONS_PAGE_LAYOUT_UID,
  RELEASE_NOTIFICATIONS_PAGE_LAYOUT_WIDGET_UID,
} from '../constants/release-notification';

// No navigation item on purpose: admins add this page to their own folder.
export default definePageLayout({
  universalIdentifier: RELEASE_NOTIFICATIONS_PAGE_LAYOUT_UID,
  name: 'Release Notes',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: RELEASE_NOTIFICATIONS_PAGE_LAYOUT_TAB_UID,
      title: 'Release Notes',
      position: 0,
      icon: 'IconSpeakerphone',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: RELEASE_NOTIFICATIONS_PAGE_LAYOUT_WIDGET_UID,
          title: 'Release Notes',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              RELEASE_NOTIFICATIONS_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
