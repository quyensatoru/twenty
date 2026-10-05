import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  COPY_ISSUE_LINK_COMMAND_MENU_ITEM_UID,
  ISSUE_ACTIVITY_FRONT_COMPONENT_UID,
  ISSUE_FIELDS_FRONT_COMPONENT_UID,
  ISSUE_ACTIVITY_WIDGET_UID,
  ISSUE_ATTACHMENTS_FRONT_COMPONENT_UID,
  ISSUE_DESCRIPTION_FRONT_COMPONENT_UID,
  ISSUE_OBJECT_UID,
  ISSUE_RECORD_PAGE_ATTACHMENTS_WIDGET_UID,
  ISSUE_RECORD_PAGE_DESCRIPTION_WIDGET_UID,
  ISSUE_RECORD_PAGE_FIELDS_TAB_UID,
  ISSUE_RECORD_PAGE_FIELDS_VIEW_UID,
  ISSUE_RECORD_PAGE_FIELDS_WIDGET_UID,
  ISSUE_RECORD_PAGE_LAYOUT_UID,
  ISSUE_RECORD_PAGE_RELATIONS_WIDGET_UID,
  ISSUE_RECORD_PAGE_SUBTASKS_WIDGET_UID,
  ISSUE_SUBTASKS_FRONT_COMPONENT_UID,
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
// Twelve columns split eight and four. That two-thirds/one-third split is the
// reference's, and three columns for the field table would put a relation
// chip and its label on separate lines in every Details row.
//
// The declared rows are the READING order, not the desktop geometry. React
// Grid Layout compacts vertically, so everything in the side column rises to
// the top of its own columns and Activity rises to just under the
// description. That ordering is what survives the collapse: the grid switches
// to a single column whenever its CONTAINER is under 768px, which the record
// side panel (320-600px) and the pinned left panel (348px) always are, and
// there every widget keeps its row and drops to full width — description
// first, then Details, the field table, Subtasks, Attachments, and the feed,
// exactly as asked.
//
// heightBehavior is not usable here: it only exists on a VERTICAL_LIST position
// and normalizePageLayoutTabManifest rejects the manifest outright if a GRID
// tab carries one. The activity panel already sizes itself to its slot
// (height 100% + overflowY auto), so the fixed row budget is what bounds it.
//
// The field table is host-rendered: FIELDS replaces the fork's hand-rolled
// IssueFieldPanel. It points at a view of its own
// (src/views/issue-record-page-fields.view.ts) rather than being left to the
// host's fallback, because the fallback orders fields by whatever order
// metadata returns, hides every relation field with no way to reach it, and
// makes Twenty's own field editor fail on save — it writes view fields, and a
// widget with no view has none. With the view bound, show, hide, reorder and
// grouping are the host's own controls, on the same path a native object's
// record page uses: command menu → Edit Layout → click the widget → Layout.
// The host exposes no entry point outside that mode and offers an app no hook
// to add one — a widget header action is keyed by widget type in
// getWidgetHeaderActionDefinition and FIELDS has none, and an app-declared
// command menu item must point at a front component, so it cannot invoke the
// host's EDIT_RECORD_PAGE_LAYOUT.
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
// The widget titles are the design's section labels: Description, Activity,
// Details. The host draws them verbatim through WidgetCardHeader ->
// OverflowingTextWithTooltip, with no text-transform of its own, so the casing
// is the whole of what an app can say about them: the tertiary colour, the
// small size and the letter-spacing of the original are the host's. The
// Activity tabs (Comments, Worklogs, History) live inside the front component,
// under this title, the way the design stacks its section heading over them.
// The reference gives the description about a third of the reading column and
// the feed the rest. Ten rows was a writing surface sized for the longest issue
// anybody would write, which on the ordinary one is an empty box the height of
// the Details panel beside it; nine still fits five or six paragraphs before it
// scrolls, and every row it gives back to the feed below is one more comment
// visible without scrolling a second box inside the page.
const DESCRIPTION_ROW_SPAN = 9;
// Six rows of 24px, their gaps and the error line, with room to spare. Every
// row here is a fixed height whatever its data — the merchant chips are kept on
// one line for exactly that reason — and a picker opens OVER the rows rather
// than pushing them, so nothing the panel does can make it outgrow the widget.
// That is the whole point: a panel taller than its widget is answered with a
// scrollbar, and there is no way to ask the host not to.
const RELATIONS_ROW_SPAN = 4;
// Eight rows is the collapsed field table with headroom: nine visible fields
// at the host's 32px pitch plus the More line. Opening More no longer clears
// the full list the way seventeen rows did — the table scrolls inside its slot
// instead — and that is the price of keeping Subtasks and Attachments glued
// directly under it rather than a thousand pixels further down the page, where
// nobody scrolls to.
const FIELDS_ROW_SPAN = 8;
// Three rows is a parent plus three or four children before the inner scroll
// starts; two rows is two or three files.
const SUBTASKS_ROW_SPAN = 3;
const ATTACHMENTS_ROW_SPAN = 2;
// Sized for the thread, not the box: seventeen rows is five or six comments
// visible before the inner scroll starts, against three at fifteen, and the
// feed is the panel people live in once the description is written.
const ACTIVITY_ROW_SPAN = 17;

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
          // The heading for BOTH field widgets: this one and the host's
          // FIELDS widget under it are one list as far as the reader is
          // concerned, so only the first one is titled.
          title: 'Details',
          type: 'FRONT_COMPONENT',
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row: DESCRIPTION_ROW_SPAN,
            column: MAIN_COLUMN_SPAN,
            rowSpan: RELATIONS_ROW_SPAN,
            columnSpan: SIDE_COLUMN_SPAN,
          },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              ISSUE_FIELDS_FRONT_COMPONENT_UID,
          },
        },
        {
          universalIdentifier: ISSUE_RECORD_PAGE_FIELDS_WIDGET_UID,
          // Blank, because the panel above already carries the section's
          // heading. A widget always draws its header bar and the manifest
          // validator rejects an empty string, so a space is how a widget says
          // it has no title of its own.
          title: ' ',
          type: 'FIELDS',
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row: DESCRIPTION_ROW_SPAN + RELATIONS_ROW_SPAN,
            column: MAIN_COLUMN_SPAN,
            rowSpan: FIELDS_ROW_SPAN,
            columnSpan: SIDE_COLUMN_SPAN,
          },
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier: ISSUE_RECORD_PAGE_FIELDS_VIEW_UID,
            // Closed on purpose. "More" renders every field the view hides
            // AND every field it never listed, each with the host's own
            // editor — which for a relation means a picker scoped to the
            // caller's apps and nothing finer. That is the hole the app panel
            // above exists to close, and leaving the same pickers one click
            // further down would reopen it.
            //
            // The cost is that a field is reachable here only if the view
            // lists it as visible: a field added to `issue` later has to be
            // added there too.
            shouldAllowUserToSeeHiddenFields: false,
            newFieldDefaultVisibility: false,
          },
        },
        {
          universalIdentifier: ISSUE_RECORD_PAGE_SUBTASKS_WIDGET_UID,
          title: 'Subtasks',
          type: 'FRONT_COMPONENT',
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row:
              DESCRIPTION_ROW_SPAN + RELATIONS_ROW_SPAN + FIELDS_ROW_SPAN,
            column: MAIN_COLUMN_SPAN,
            rowSpan: SUBTASKS_ROW_SPAN,
            columnSpan: SIDE_COLUMN_SPAN,
          },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              ISSUE_SUBTASKS_FRONT_COMPONENT_UID,
          },
        },
        {
          universalIdentifier: ISSUE_RECORD_PAGE_ATTACHMENTS_WIDGET_UID,
          title: 'Attachments',
          type: 'FRONT_COMPONENT',
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row:
              DESCRIPTION_ROW_SPAN +
              RELATIONS_ROW_SPAN +
              FIELDS_ROW_SPAN +
              SUBTASKS_ROW_SPAN,
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
          universalIdentifier: ISSUE_ACTIVITY_WIDGET_UID,
          title: 'Activity',
          type: 'FRONT_COMPONENT',
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row:
              DESCRIPTION_ROW_SPAN +
              RELATIONS_ROW_SPAN +
              FIELDS_ROW_SPAN +
              SUBTASKS_ROW_SPAN +
              ATTACHMENTS_ROW_SPAN,
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
