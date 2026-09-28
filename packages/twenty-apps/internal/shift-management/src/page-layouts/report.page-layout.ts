import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  REPORT_FRONT_COMPONENT_UID,
  REPORT_PAGE_LAYOUT_TAB_UID,
  REPORT_PAGE_LAYOUT_UID,
  REPORT_PAGE_LAYOUT_WIDGET_UID,
} from '../constants/universal-identifiers';

// Not a RECORD_TABLE widget: the report groups a month into ICT Mon-Sun weeks
// with rolled-up registered/working hours, infers "Absent" from an elapsed
// window, and flags check-out deviation — all derived, none of it stored.
export default definePageLayout({
  universalIdentifier: REPORT_PAGE_LAYOUT_UID,
  name: 'Shift Report',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: REPORT_PAGE_LAYOUT_TAB_UID,
      title: 'Report',
      position: 0,
      icon: 'IconReportAnalytics',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: REPORT_PAGE_LAYOUT_WIDGET_UID,
          title: 'Monthly report',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: REPORT_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
