import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  COPY_ISSUE_LINK_COMMAND_MENU_ITEM_UID,
  ISSUE_ATTACHMENTS_FRONT_COMPONENT_UID,
  ISSUE_DEVELOPMENT_FRONT_COMPONENT_UID,
  ISSUE_FIELDS_FRONT_COMPONENT_UID,
  ISSUE_OBJECT_UID,
  ISSUE_RECORD_MAIN_FRONT_COMPONENT_UID,
  ISSUE_RECORD_PAGE_ATTACHMENTS_WIDGET_UID,
  ISSUE_RECORD_PAGE_DEVELOPMENT_WIDGET_UID,
  ISSUE_RECORD_PAGE_FIELDS_TAB_UID,
  ISSUE_RECORD_PAGE_LAYOUT_UID,
  ISSUE_RECORD_PAGE_MAIN_WIDGET_UID,
  ISSUE_RECORD_PAGE_RELATIONS_WIDGET_UID,
} from '../constants/universal-identifiers';

// One GRID tab, laid out the way Jira lays an issue out: one left panel
// carrying description, subtasks and the activity feed with a single shared
// scroll, the field widgets narrow beside it.
//
// GRID is twelve columns wide and each row is a fixed 55px plus an 8px gutter
// (PAGE_LAYOUT_CONFIG and PAGE_LAYOUT_GRID_ROW_HEIGHT in twenty-front) — there
// is no content-driven height, so every span below is a deliberate pixel
// budget and the left panel scrolls inside it.
//
// Twelve columns split eight and four. That two-thirds/one-third split is the
// reference's, and three columns for the field table would put a relation
// chip and its label on separate lines in every Details row.
//
// The declared rows are the READING order, not the desktop geometry. React
// Grid Layout compacts vertically, so everything in the side column rises to
// the top of its own columns. That ordering is what survives the collapse:
// the grid switches to a single column whenever its CONTAINER is under 768px,
// which the record side panel (320-600px) and the pinned left panel (348px)
// always are, and there every widget keeps its row and drops to full width —
// the main panel first, then Details, the field table, Attachments and
// Development, exactly as asked.
//
// heightBehavior is not usable here: it only exists on a VERTICAL_LIST position
// and normalizePageLayoutTabManifest rejects the manifest outright if a GRID
// tab carries one. The activity panel already sizes itself to its slot
// (height 100% + overflowY auto), so the fixed row budget is what bounds it.
//
// The Details column is the app's own panel (issue-fields), not the host's
// FIELDS widget: it shows every field of the issue, follows the project's
// choice of rows (issueViewSettings, edited by a role with Manage Views), and
// narrows its relation pickers to the issue's project. The host widget could
// do none of that, so it is gone rather than kept under the panel.
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
//
// The widget titles are the design's section labels, and blanks where the
// panel carries its own Jira-style headings inside (the main panel's
// Description / Subtasks / Activity, and Details with its show/hide gear). The host
// draws titles verbatim through WidgetCardHeader -> OverflowingTextWithTooltip,
// with no text-transform of its own, so the casing is the whole of what an app
// can say about them.
// The main panel keeps the old budgets added together: nine rows of writing
// surface, three for the subtask box and seventeen for the thread. One scroll
// for the three of them, the way the board modal draws it, instead of three
// boxes each scrolling on its own.
const MAIN_ROW_SPAN = 9 + 3 + 17;
// Twelve rows: every Details row at its 24px height plus the time tracking
// card. The panel scrolls inside its slot when a project shows everything,
// rather than pushing Attachments down the page, where nobody scrolls to.
const DETAILS_ROW_SPAN = 12;
// Two rows is two or three files before the inner scroll starts.
const ATTACHMENTS_ROW_SPAN = 2;
// Six rows: the counts, one group of rows and the key helpers before the
// inner scroll starts. The repository setup lives collapsed inside.
const DEVELOPMENT_ROW_SPAN = 6;

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
          universalIdentifier: ISSUE_RECORD_PAGE_MAIN_WIDGET_UID,
          // Blank, because the panel carries its own section headings inside.
          // A widget always draws its header bar and the manifest validator
          // rejects an empty string, so a space is how a widget says it has
          // no title of its own.
          title: ' ',
          type: 'FRONT_COMPONENT',
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row: 0,
            column: 0,
            rowSpan: MAIN_ROW_SPAN,
            columnSpan: MAIN_COLUMN_SPAN,
          },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              ISSUE_RECORD_MAIN_FRONT_COMPONENT_UID,
            // The one slot a front component gets in the row the host draws its
            // title in. Everything else an app renders is inside the content
            // frame, which is why the copy-link button lives here rather than
            // beside the task code.
            headerCommandMenuItemUniversalIdentifiers: [
              COPY_ISSUE_LINK_COMMAND_MENU_ITEM_UID,
            ],
          },
        },
        {
          universalIdentifier: ISSUE_RECORD_PAGE_RELATIONS_WIDGET_UID,
          // Blank, because the panel carries its own Details heading, with the
          // show/hide gear beside it.
          title: ' ',
          type: 'FRONT_COMPONENT',
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row: 0,
            column: MAIN_COLUMN_SPAN,
            rowSpan: DETAILS_ROW_SPAN,
            columnSpan: SIDE_COLUMN_SPAN,
          },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: ISSUE_FIELDS_FRONT_COMPONENT_UID,
          },
        },
        {
          universalIdentifier: ISSUE_RECORD_PAGE_ATTACHMENTS_WIDGET_UID,
          title: 'Attachments',
          type: 'FRONT_COMPONENT',
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row: DETAILS_ROW_SPAN,
            column: MAIN_COLUMN_SPAN,
            rowSpan: ATTACHMENTS_ROW_SPAN,
            columnSpan: SIDE_COLUMN_SPAN,
          },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              ISSUE_ATTACHMENTS_FRONT_COMPONENT_UID,
          },
        },
        {
          universalIdentifier: ISSUE_RECORD_PAGE_DEVELOPMENT_WIDGET_UID,
          title: 'Development',
          type: 'FRONT_COMPONENT',
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row: DETAILS_ROW_SPAN + ATTACHMENTS_ROW_SPAN,
            column: MAIN_COLUMN_SPAN,
            rowSpan: DEVELOPMENT_ROW_SPAN,
            columnSpan: SIDE_COLUMN_SPAN,
          },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              ISSUE_DEVELOPMENT_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
