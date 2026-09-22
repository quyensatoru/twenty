import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  PROSPECT_OBJECT_UID,
  PROSPECT_RECORD_PAGE_LAYOUT_UID,
  PROSPECT_RECORD_PAGE_TABS,
  PROSPECT_RECORD_PAGE_WIDGETS,
} from '../constants/universal-identifiers';

// The default record page keeps notes behind a tab. BD writes and reads notes
// on every call, so the Home tab carries them next to the fields, with the
// deals reachable from the relation card in the same tab.
export default definePageLayout({
  universalIdentifier: PROSPECT_RECORD_PAGE_LAYOUT_UID,
  name: 'Prospect record page',
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: PROSPECT_OBJECT_UID,
  tabs: [
    {
      universalIdentifier: PROSPECT_RECORD_PAGE_TABS.home,
      title: 'Home',
      position: 10,
      icon: 'IconHome',
      layoutMode: PageLayoutTabLayoutMode.GRID,
      widgets: [
        {
          universalIdentifier: PROSPECT_RECORD_PAGE_WIDGETS.fields,
          title: 'Fields',
          type: 'FIELDS',
          gridPosition: { row: 0, column: 0, rowSpan: 6, columnSpan: 12 },
          // Explicit null rather than omitted: the server stores the key, so
          // leaving it out makes every plan show a phantom change.
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier: null,
          },
        },
        {
          universalIdentifier: PROSPECT_RECORD_PAGE_WIDGETS.homeNotes,
          title: 'BD notes',
          type: 'NOTES',
          gridPosition: { row: 6, column: 0, rowSpan: 6, columnSpan: 12 },
          configuration: { configurationType: 'NOTES' },
        },
      ],
    },
    {
      universalIdentifier: PROSPECT_RECORD_PAGE_TABS.notes,
      title: 'Notes',
      position: 20,
      icon: 'IconNotes',
      layoutMode: PageLayoutTabLayoutMode.GRID,
      widgets: [
        {
          universalIdentifier: PROSPECT_RECORD_PAGE_WIDGETS.notes,
          title: 'Notes',
          type: 'NOTES',
          gridPosition: { row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
          configuration: { configurationType: 'NOTES' },
        },
      ],
    },
    {
      universalIdentifier: PROSPECT_RECORD_PAGE_TABS.tasks,
      title: 'Tasks',
      position: 30,
      icon: 'IconCheckbox',
      layoutMode: PageLayoutTabLayoutMode.GRID,
      widgets: [
        {
          universalIdentifier: PROSPECT_RECORD_PAGE_WIDGETS.tasks,
          title: 'Tasks',
          type: 'TASKS',
          gridPosition: { row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
          configuration: { configurationType: 'TASKS' },
        },
      ],
    },
    {
      universalIdentifier: PROSPECT_RECORD_PAGE_TABS.timeline,
      title: 'Timeline',
      position: 40,
      icon: 'IconTimelineEvent',
      layoutMode: PageLayoutTabLayoutMode.GRID,
      widgets: [
        {
          universalIdentifier: PROSPECT_RECORD_PAGE_WIDGETS.timeline,
          title: 'Timeline',
          type: 'TIMELINE',
          gridPosition: { row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
          configuration: { configurationType: 'TIMELINE' },
        },
      ],
    },
    {
      universalIdentifier: PROSPECT_RECORD_PAGE_TABS.files,
      title: 'Files',
      position: 50,
      icon: 'IconPaperclip',
      layoutMode: PageLayoutTabLayoutMode.GRID,
      widgets: [
        {
          universalIdentifier: PROSPECT_RECORD_PAGE_WIDGETS.files,
          title: 'Files',
          type: 'FILES',
          gridPosition: { row: 0, column: 0, rowSpan: 12, columnSpan: 12 },
          configuration: { configurationType: 'FILES' },
        },
      ],
    },
  ],
});
