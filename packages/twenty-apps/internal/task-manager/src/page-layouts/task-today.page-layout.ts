import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  TASK_TODAY_FRONT_COMPONENT_UID,
  TASK_TODAY_PAGE_LAYOUT_TAB_UID,
  TASK_TODAY_PAGE_LAYOUT_UID,
  TASK_TODAY_PAGE_LAYOUT_WIDGET_UID,
} from '../constants/task-today';

export default definePageLayout({
  universalIdentifier: TASK_TODAY_PAGE_LAYOUT_UID,
  name: 'Today',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: TASK_TODAY_PAGE_LAYOUT_TAB_UID,
      title: 'Today',
      position: 0,
      icon: 'IconLayoutDashboard',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: TASK_TODAY_PAGE_LAYOUT_WIDGET_UID,
          title: 'Today',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: TASK_TODAY_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
