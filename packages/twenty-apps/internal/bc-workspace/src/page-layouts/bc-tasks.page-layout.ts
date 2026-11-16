import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  TASKS_FRONT_COMPONENT_UID,
  TASKS_PAGE_LAYOUT_UID,
  TASKS_TAB_UID,
  TASKS_WIDGET_UID,
} from '../constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: TASKS_PAGE_LAYOUT_UID,
  name: 'BC Tasks',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: TASKS_TAB_UID,
      title: 'BC Tasks',
      position: 0,
      icon: 'IconCheckbox',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: TASKS_WIDGET_UID,
          title: 'BC Tasks',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: TASKS_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
