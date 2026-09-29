import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  ISSUE_ACTIVITY_FRONT_COMPONENT_UID,
  ISSUE_ACTIVITY_WIDGET_UID,
  ISSUE_OBJECT_UID,
  ISSUE_RECORD_PAGE_ACTIVITY_TAB_UID,
  ISSUE_RECORD_PAGE_DESCRIPTION_WIDGET_UID,
  ISSUE_RECORD_PAGE_FIELDS_TAB_UID,
  ISSUE_RECORD_PAGE_FIELDS_WIDGET_UID,
  ISSUE_RECORD_PAGE_LAYOUT_UID,
} from '../constants/universal-identifiers';

// Fields and description are host-rendered: FIELDS replaces the fork's
// hand-rolled IssueFieldPanel, and FIELD_RICH_TEXT gives `description` the
// host's real BlockNote editor, which cannot run inside the sandbox.
//
// There is no Files or Timeline tab. Both widgets resolve through morph
// branches on upstream objects — attachment.targetIssueId and
// timelineActivity.targetIssueId — that the cutover had to delete: they were
// twenty-standard-owned branches pointing into task-manager objects, and
// leaving them made the metadata graph invalid for the whole workspace.
// Declaring the widgets anyway renders
// `Invalid filter : timelineActivity object doesn't have any "targetIssueId" field`.
//
// Comments and worklogs are NOT host widgets. A host widget reads and writes
// with the viewer's own token, so it would go blank the moment the Member role
// loses direct access to these objects — the step that makes app-scope real
// (DEPLOY.md 4.1). They go through the app's routes instead, which is also
// what keeps worklog time-tracking recomputed and the comment author rule
// enforced. The cost is a plain markdown composer rather than BlockNote.
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
          universalIdentifier: ISSUE_ACTIVITY_WIDGET_UID,
          title: 'Activity',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              ISSUE_ACTIVITY_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
