import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  ISSUE_ACTIVITY_FRONT_COMPONENT_UID,
  ISSUE_ACTIVITY_WIDGET_UID,
  ISSUE_DESCRIPTION_FRONT_COMPONENT_UID,
  ISSUE_OBJECT_UID,
  ISSUE_RECORD_PAGE_DESCRIPTION_WIDGET_UID,
  ISSUE_RECORD_PAGE_FIELDS_TAB_UID,
  ISSUE_RECORD_PAGE_FIELDS_WIDGET_UID,
  ISSUE_RECORD_PAGE_LAYOUT_UID,
} from '../constants/universal-identifiers';

// One GRID tab, laid out the way Jira lays an issue out: the description in the
// wide reading column, the field table narrow beside it, the activity feed
// under the description rather than behind a tab of its own.
//
// GRID is twelve columns wide and each row is a fixed 55px plus an 8px gutter
// (PAGE_LAYOUT_CONFIG and PAGE_LAYOUT_GRID_ROW_HEIGHT in twenty-front) — there
// is no content-driven height, so every span below is a deliberate pixel
// budget and the two front components scroll inside it.
//
// The declared rows are the READING order, not the desktop geometry. React
// Grid Layout compacts vertically, so Fields rises to the top of its own
// columns and Activity rises to just under the description. That ordering is
// what survives the collapse: the grid switches to a single column whenever its
// CONTAINER is under 768px, which the record side panel (320-600px) and the
// pinned left panel (348px) always are, and there every widget keeps its row
// and drops to full width — description first, exactly as asked.
//
// heightBehavior is not usable here: it only exists on a VERTICAL_LIST position
// and normalizePageLayoutTabManifest rejects the manifest outright if a GRID
// tab carries one. The activity panel already sizes itself to its slot
// (height 100% + overflowY auto), so the fixed row budget is what bounds it.
//
// The field table is host-rendered: FIELDS replaces the fork's hand-rolled
// IssueFieldPanel.
//
// Description is NOT the host's FIELD_RICH_TEXT widget. That widget's
// configuration carries no field reference (FieldRichTextConfiguration is
// `{ configurationType }` and nothing else) and its card reads a field named
// `bodyV2` off the target record, so on `issue` — whose rich text field is
// `description` — it stays on its loading skeleton forever and shows an empty
// grey bar. Renaming the field would not be enough either: the host editor
// persists with the VIEWER's token, which Member no longer has here, and it
// lists attachments through the deleted `attachment.targetIssueId` branch.
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
const DESCRIPTION_ROW_SPAN = 7;
const FIELDS_ROW_SPAN = 13;
const ACTIVITY_ROW_SPAN = 12;

const MAIN_COLUMN_SPAN = 8;
const SIDE_COLUMN_SPAN = 4;

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
      layoutMode: PageLayoutTabLayoutMode.GRID,
      widgets: [
        {
          universalIdentifier: ISSUE_RECORD_PAGE_DESCRIPTION_WIDGET_UID,
          title: 'Description',
          type: 'FRONT_COMPONENT',
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row: 0,
            column: 0,
            rowSpan: DESCRIPTION_ROW_SPAN,
            columnSpan: MAIN_COLUMN_SPAN,
          },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              ISSUE_DESCRIPTION_FRONT_COMPONENT_UID,
          },
        },
        {
          universalIdentifier: ISSUE_RECORD_PAGE_FIELDS_WIDGET_UID,
          title: 'Details',
          type: 'FIELDS',
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row: DESCRIPTION_ROW_SPAN,
            column: MAIN_COLUMN_SPAN,
            rowSpan: FIELDS_ROW_SPAN,
            columnSpan: SIDE_COLUMN_SPAN,
          },
          configuration: { configurationType: 'FIELDS' },
        },
        {
          universalIdentifier: ISSUE_ACTIVITY_WIDGET_UID,
          title: 'Activity',
          type: 'FRONT_COMPONENT',
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row: DESCRIPTION_ROW_SPAN + FIELDS_ROW_SPAN,
            column: 0,
            rowSpan: ACTIVITY_ROW_SPAN,
            columnSpan: MAIN_COLUMN_SPAN,
          },
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
