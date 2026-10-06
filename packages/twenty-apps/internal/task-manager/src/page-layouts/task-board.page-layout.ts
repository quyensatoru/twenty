import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  TASK_BOARD_FRONT_COMPONENT_UID,
  TASK_BOARD_PAGE_LAYOUT_TAB_UID,
  TASK_BOARD_PAGE_LAYOUT_UID,
  TASK_BOARD_PAGE_LAYOUT_WIDGET_UID,
} from '../constants/universal-identifiers';

// A standalone page rather than host widgets: the columns, the drag-and-drop,
// the inline composer and the issue drawer are one interaction surface no VIEW
// or RECORD_TABLE widget can express. The widget takes the tab's viewport
// height, so the header stays pinned while the columns scroll inside it.
export default definePageLayout({
  universalIdentifier: TASK_BOARD_PAGE_LAYOUT_UID,
  name: 'Task Board',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: TASK_BOARD_PAGE_LAYOUT_TAB_UID,
      title: 'Task Board',
      position: 0,
      icon: 'IconLayoutKanban',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: TASK_BOARD_PAGE_LAYOUT_WIDGET_UID,
          title: 'Task Board',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              TASK_BOARD_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
