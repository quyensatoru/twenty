import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  REGISTER_FRONT_COMPONENT_UID,
  REGISTER_PAGE_LAYOUT_TAB_UID,
  REGISTER_PAGE_LAYOUT_UID,
  REGISTER_PAGE_LAYOUT_WIDGET_UID,
} from '../constants/universal-identifiers';

// The registration month calendar is the app's one genuinely custom grid: it
// paints the whole team's coverage per day, flags special days, and opens a
// per-day template picker. A host CALENDAR widget cannot render that.
export default definePageLayout({
  universalIdentifier: REGISTER_PAGE_LAYOUT_UID,
  name: 'Register Shifts',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: REGISTER_PAGE_LAYOUT_TAB_UID,
      title: 'Register',
      position: 0,
      icon: 'IconCalendarPlus',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: REGISTER_PAGE_LAYOUT_WIDGET_UID,
          title: 'Register shifts',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: REGISTER_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
