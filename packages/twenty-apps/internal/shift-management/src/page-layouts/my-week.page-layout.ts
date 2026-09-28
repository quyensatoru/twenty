import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  MY_WEEK_FRONT_COMPONENT_UID,
  MY_WEEK_PAGE_LAYOUT_TAB_UID,
  MY_WEEK_PAGE_LAYOUT_UID,
  MY_WEEK_PAGE_LAYOUT_WIDGET_UID,
} from '../constants/universal-identifiers';

// A front component rather than host widgets: the card runs a live elapsed-time
// clock, gates check-in on the ICT window, and opens the check-out and cancel
// modals. None of that is expressible as a VIEW or RECORD_TABLE widget.
export default definePageLayout({
  universalIdentifier: MY_WEEK_PAGE_LAYOUT_UID,
  name: 'My Week',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: MY_WEEK_PAGE_LAYOUT_TAB_UID,
      title: 'My Week',
      position: 0,
      icon: 'IconCalendarWeek',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: MY_WEEK_PAGE_LAYOUT_WIDGET_UID,
          title: 'My Week',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: MY_WEEK_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
