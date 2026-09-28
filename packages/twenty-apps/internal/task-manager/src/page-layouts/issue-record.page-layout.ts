import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  ISSUE_COMMENTS_ON_ISSUE_VIEW_UID,
  ISSUE_OBJECT_UID,
  ISSUE_RECORD_PAGE_ACTIVITY_TAB_UID,
  ISSUE_RECORD_PAGE_COMMENTS_WIDGET_UID,
  ISSUE_RECORD_PAGE_DESCRIPTION_WIDGET_UID,
  ISSUE_RECORD_PAGE_FIELDS_TAB_UID,
  ISSUE_RECORD_PAGE_FIELDS_WIDGET_UID,
  ISSUE_RECORD_PAGE_FILES_TAB_UID,
  ISSUE_RECORD_PAGE_FILES_WIDGET_UID,
  ISSUE_RECORD_PAGE_LAYOUT_UID,
  ISSUE_RECORD_PAGE_TIMELINE_TAB_UID,
  ISSUE_RECORD_PAGE_TIMELINE_WIDGET_UID,
  ISSUE_RECORD_PAGE_WORKLOGS_WIDGET_UID,
  WORKLOGS_ON_ISSUE_VIEW_UID,
} from '../constants/universal-identifiers';

// Every widget here is host-rendered. The fork shipped this screen as custom
// React (IssueFieldPanel, IssueCommentThread, IssueWorklogList) because it had
// the whole front at its disposal; inside an app sandbox that same code would
// lose the BlockNote editor entirely — there is no contentEditable and no
// Selection API — so the FIELD_RICH_TEXT widget renders `description` with the
// host's real editor instead, and FIELDS replaces the hand-rolled panel.
export default definePageLayout({
  universalIdentifier: ISSUE_RECORD_PAGE_LAYOUT_UID,
  name: 'Issue Record Page',
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  tabs: [
    {
      universalIdentifier: ISSUE_RECORD_PAGE_FIELDS_TAB_UID,
      title: 'Issue',
      position: 0,
      icon: 'IconLayoutKanban',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: ISSUE_RECORD_PAGE_FIELDS_WIDGET_UID,
          title: 'Fields',
          type: 'FIELDS',
          configuration: { configurationType: 'FIELDS' },
        },
        {
          universalIdentifier: ISSUE_RECORD_PAGE_DESCRIPTION_WIDGET_UID,
          title: 'Description',
          type: 'FIELD_RICH_TEXT',
          configuration: { configurationType: 'FIELD_RICH_TEXT' },
        },
      ],
    },
    {
      universalIdentifier: ISSUE_RECORD_PAGE_ACTIVITY_TAB_UID,
      title: 'Activity',
      position: 10,
      icon: 'IconMessage',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: ISSUE_RECORD_PAGE_COMMENTS_WIDGET_UID,
          title: 'Comments',
          type: 'RECORD_TABLE',
          configuration: {
            configurationType: 'RECORD_TABLE',
            viewUniversalIdentifier: ISSUE_COMMENTS_ON_ISSUE_VIEW_UID,
          },
        },
        {
          universalIdentifier: ISSUE_RECORD_PAGE_WORKLOGS_WIDGET_UID,
          title: 'Worklogs',
          type: 'RECORD_TABLE',
          configuration: {
            configurationType: 'RECORD_TABLE',
            viewUniversalIdentifier: WORKLOGS_ON_ISSUE_VIEW_UID,
          },
        },
      ],
    },
    {
      universalIdentifier: ISSUE_RECORD_PAGE_FILES_TAB_UID,
      title: 'Files',
      position: 20,
      icon: 'IconPaperclip',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: ISSUE_RECORD_PAGE_FILES_WIDGET_UID,
          title: 'Files',
          type: 'FILES',
          configuration: { configurationType: 'FILES' },
        },
      ],
    },
    {
      universalIdentifier: ISSUE_RECORD_PAGE_TIMELINE_TAB_UID,
      title: 'Timeline',
      position: 30,
      icon: 'IconTimelineEvent',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: ISSUE_RECORD_PAGE_TIMELINE_WIDGET_UID,
          title: 'Timeline',
          type: 'TIMELINE',
          configuration: { configurationType: 'TIMELINE' },
        },
      ],
    },
  ],
});
