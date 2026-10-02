import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  ISSUE_MERCHANT_OBJECT_UID,
  ISSUE_MERCHANT_RECORD_PAGE_FIELDS_VIEW_UID,
  ISSUE_MERCHANT_RECORD_PAGE_FIELDS_WIDGET_UID,
  ISSUE_MERCHANT_RECORD_PAGE_LAYOUT_UID,
  ISSUE_MERCHANT_RECORD_PAGE_TAB_UID,
} from '../constants/universal-identifiers';

// Without a RECORD_PAGE the host renders nothing when a row is clicked. The
// engine's backfill skipped this object because it was still a standard object
// of the fork when that command ran, and the standard branch only creates a
// page for objects upstream's own definitions know about.
export default definePageLayout({
  universalIdentifier: ISSUE_MERCHANT_RECORD_PAGE_LAYOUT_UID,
  name: 'Issue Merchant Record Page',
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: ISSUE_MERCHANT_OBJECT_UID,
  tabs: [
    {
      universalIdentifier: ISSUE_MERCHANT_RECORD_PAGE_TAB_UID,
      title: 'Issue Merchant',
      position: 0,
      icon: 'IconBuildingStore',
      layoutMode: PageLayoutTabLayoutMode.GRID,
      widgets: [
        {
          universalIdentifier: ISSUE_MERCHANT_RECORD_PAGE_FIELDS_WIDGET_UID,
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
            viewUniversalIdentifier: ISSUE_MERCHANT_RECORD_PAGE_FIELDS_VIEW_UID,
            shouldAllowUserToSeeHiddenFields: true,
          },
        },
      ],
    },
  ],
});
