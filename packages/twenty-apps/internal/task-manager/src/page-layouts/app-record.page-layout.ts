import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  APP_OBJECT_UID,
  APP_RECORD_PAGE_FIELDS_VIEW_UID,
  APP_RECORD_PAGE_FIELDS_WIDGET_UID,
  APP_RECORD_PAGE_LAYOUT_UID,
  APP_RECORD_PAGE_TAB_UID,
} from '../constants/universal-identifiers';

// Without a RECORD_PAGE the host renders nothing when a row is clicked. The
// engine's backfill skipped this object because it was still a standard object
// of the fork when that command ran, and the standard branch only creates a
// page for objects upstream's own definitions know about.
export default definePageLayout({
  universalIdentifier: APP_RECORD_PAGE_LAYOUT_UID,
  name: 'App Record Page',
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: APP_OBJECT_UID,
  tabs: [
    {
      universalIdentifier: APP_RECORD_PAGE_TAB_UID,
      title: 'App',
      position: 0,
      icon: 'IconApps',
      layoutMode: PageLayoutTabLayoutMode.GRID,
      widgets: [
        {
          universalIdentifier: APP_RECORD_PAGE_FIELDS_WIDGET_UID,
          title: 'DETAILS',
          type: 'FIELDS',
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row: 0,
            column: 0,
            rowSpan: 12,
            columnSpan: 12,
          },
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier: APP_RECORD_PAGE_FIELDS_VIEW_UID,
            shouldAllowUserToSeeHiddenFields: true,
          },
        },
      ],
    },
  ],
});
