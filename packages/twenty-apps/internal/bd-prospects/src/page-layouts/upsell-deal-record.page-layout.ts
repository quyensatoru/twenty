import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  UPSELL_DEAL_FIELDS_VIEW_UID,
  UPSELL_DEAL_OBJECT_UID,
  UPSELL_DEAL_RECORD_PAGE_LAYOUT_UID,
  UPSELL_DEAL_RECORD_PAGE_TABS,
  UPSELL_DEAL_RECORD_PAGE_WIDGETS,
} from '../constants/universal-identifiers';

// Without a layout of its own a record page gets the default one: every tab and
// every field. Declaring the layout is what hides a tab — a tab left out of this
// list does not exist on the page. Tasks and Files are out because a deal is
// worked through notes and the pipeline, not attachments.
export default definePageLayout({
  universalIdentifier: UPSELL_DEAL_RECORD_PAGE_LAYOUT_UID,
  name: 'Upsell deal record page',
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: UPSELL_DEAL_OBJECT_UID,
  tabs: [
    {
      universalIdentifier: UPSELL_DEAL_RECORD_PAGE_TABS.home,
      title: 'Home',
      position: 10,
      icon: 'IconHome',
      layoutMode: PageLayoutTabLayoutMode.GRID,
      widgets: [
        {
          universalIdentifier: UPSELL_DEAL_RECORD_PAGE_WIDGETS.fields,
          title: 'Fields',
          type: 'FIELDS',
          gridPosition: { row: 0, column: 0, rowSpan: 4, columnSpan: 12 },
          configuration: {
            configurationType: 'FIELDS',
            // Which fields show, and in what order.
            viewUniversalIdentifier: UPSELL_DEAL_FIELDS_VIEW_UID,
            // A field added later stays hidden until it is put in the view
            // above, so the page cannot silently fill up again.
            newFieldDefaultVisibility: false,
          },
        },
        {
          universalIdentifier: UPSELL_DEAL_RECORD_PAGE_WIDGETS.notes,
          title: 'Deal notes',
          type: 'NOTES',
          // A note tile is a fixed 300px tall, so a 6-row box shows one note
          // and hides the rest behind a scrollbar.
          gridPosition: { row: 4, column: 0, rowSpan: 8, columnSpan: 12 },
          configuration: { configurationType: 'NOTES' },
        },
      ],
    },
    {
      universalIdentifier: UPSELL_DEAL_RECORD_PAGE_TABS.timeline,
      title: 'Timeline',
      position: 20,
      icon: 'IconTimelineEvent',
      layoutMode: PageLayoutTabLayoutMode.GRID,
      widgets: [
        {
          universalIdentifier: UPSELL_DEAL_RECORD_PAGE_WIDGETS.timeline,
          title: 'Timeline',
          type: 'TIMELINE',
          gridPosition: { row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
          configuration: { configurationType: 'TIMELINE' },
        },
      ],
    },
  ],
});
