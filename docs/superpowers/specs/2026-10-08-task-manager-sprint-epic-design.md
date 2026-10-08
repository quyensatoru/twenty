# Task Manager: Jira-style sprint and epic management (Phase 1)

Date: 2026-10-08
App: `packages/twenty-apps/internal/task-manager`
Status: draft, awaiting review

## Goal

Turn the task-manager Board into a Jira-like planning surface: plan work in a
Backlog grouped by sprint, run one active sprint at a time from the Board, and
manage epics from a side panel. Today sprints and epics exist as data (objects,
create/update/complete routes) but the board only uses them as a filter and as
card tags; nothing in the UI creates, starts or completes a sprint or manages
an epic.

Phase 2 (separate spec) adds a Timeline view of epics over time, which needs
start/due dates on Epic.

## Decisions taken

| Topic | Decision |
|---|---|
| Phasing | Phase 1 = active sprint on Board + Backlog + Epic panel. Phase 2 = Timeline. |
| Layout | One standalone page, `Board \| Backlog` switch inside the front component (not page-layout tabs, not a separate nav page). |
| Active sprints | At most one ACTIVE sprint per project, enforced on the server. |
| Board without active sprint | Shows all issues as today, plus a "No active sprint" banner. |
| Backlog ranking | Drag to move between sprints and to rank within a section. Rank is the issue `position`, which the Board already sorts by. |
| Epic schema | Add `color` only. Progress is computed from issue statuses. |
| Subtasks | Follow their parent, as in Jira. Backlog lists top-level issues only. |
| Permissions | Every sprint/epic mutation requires `canWrite` on the project. Read-only callers see everything without controls. |

## Front end

### Structure

`task-board.front-component.tsx` (1734 lines today) becomes a shell:

```
task-board.front-component.tsx   shell
 ├─ header: project picker · [Board | Backlog] · Epics toggle · search · Create issue
 ├─ TaskEpicPanel        collapsible left column, shared by both views
 ├─ view 'board'   → TaskBoardView    (current columns / drag / composer, moved out)
 ├─ view 'backlog' → TaskBacklogView  (new)
 └─ TaskBoardDetail      issue drawer, unchanged, shared
```

Shell state: project, view, search, assignee/type filters, selected epic,
epic panel open, selected issue. Board-only state (column drag, resize,
composer, column paging) moves into `TaskBoardView`.

The view is persisted in localStorage and readable from the location anchor
(`#backlog`), extending `parse-board-anchor.util`, so a pasted link opens the
right view. An issue anchor keeps working in both views.

New files under `src/front-components/components/`:

- `task-board-view.tsx`: the current board body, moved
- `task-backlog-view.tsx`: sections list, drag and drop, paging
- `task-backlog-section.tsx`: one sprint or the backlog section
- `task-backlog-row.tsx`: one compact issue row
- `task-sprint-header.tsx`: active sprint strip on the Board
- `task-sprint-dialog.tsx`: create/edit/start form
- `task-complete-sprint-dialog.tsx`
- `task-epic-panel.tsx`

New pure utils under `src/front-components/utils/` (or `src/utils/` when the
server also needs them), each with a unit test:

- `compute-sprint-remaining-days.util.ts`
- `build-default-sprint-name.util.ts`
- `pick-next-epic-color.util.ts`

### Board view

- Initial load sends `sprintId: 'ACTIVE'`. When the project has an ACTIVE
  sprint, the board shows that sprint and the Sprint dropdown is replaced by
  the sprint header:
  - name and goal
  - `Oct 1 – Oct 14 · 6 days left`, in danger color once past the end date
  - `Complete sprint` (write access only)
  - `View all issues` link, which switches back to the existing sprint
    dropdown (All / Backlog / each sprint).
- When there is no ACTIVE sprint, the board behaves exactly as today with a
  banner: "No active sprint. Plan one in Backlog." The banner links to the
  Backlog view.
- Epic tags on cards use the epic's color instead of the shared purple.
- Selecting an epic in the panel filters the board on the server (adds
  `epicId` to the board query).

### Backlog view

Sections, top to bottom:

1. The ACTIVE sprint, if any.
2. FUTURE sprints, ordered by `position`.
3. Backlog: issues with no sprint, excluding issues whose status is in the
   DONE category.

CLOSED sprints never appear.

Section header:

- collapse chevron, name, date range (when set)
- issue count and story point total for the whole section, with
  "showing X of Y" when a filter is active
- primary action:
  - `Start sprint` on FUTURE sprints. Disabled with a tooltip while another
    sprint is ACTIVE or when the sprint has no issues.
  - `Complete sprint` on the ACTIVE sprint.
- `...` menu: Edit, plus Delete on FUTURE sprints only.

Row: type icon, issue key, title, epic tag (epic color), status pill, story
points, assignee avatar, and a "N subtasks" badge on parents. Only top-level
issues (`parentId` null) are listed. Clicking a row opens the shared drawer.

Footer: `+ Create issue` in each section, which creates the issue in that
section's sprint (or no sprint) at the end. `Create sprint` sits below the
last sprint section.

Paging: each section loads its first page with the view and loads more on
scroll, the same as board columns. It uses `BOARD_COLUMN_PAGE_SIZE`.

Drag and drop:

- dropping a row between two rows ranks it there, in the same or another
  section
- dropping on a section header (including a collapsed one) moves the issue to
  the end of that section
- dropping on an epic row in the panel assigns the epic
- every drop is optimistic: the row moves at once and snaps back with an error
  message if the route fails, matching board column moves
- read-only callers get no drag handle

### Epic panel

- `Epics` toggle in the header. Open state is stored in localStorage. Width
  about 260px.
- Pinned rows: "All issues", "Issues without epic".
- One row per epic, ordered by `position` (drag to reorder via
  `update-epic`): color dot, name, progress bar, `done/total`, assignee
  avatar.
- Clicking a row filters both views; clicking it again clears the filter.
- `+ Create epic`: inline input; Enter creates it with the next color from the
  palette rotation.
- `...` menu: Rename, Change color (same palette as status colors), Delete.
  Delete confirms with the number of issues that will lose their epic.
- While an issue is dragged from the Backlog, epic rows act as drop targets
  and highlight on hover. Dropping a subtask assigns the epic to its parent.
- Summaries load when the panel opens and refresh after an epic assignment,
  issue create, or sprint completion.

## Data model

One change: `epic.color`, a SELECT field reusing `ISSUE_STATUS_COLOR_OPTIONS`,
nullable, no default. An epic with no color falls back to
`stringToThemeColor(epic.id)` on the client, so existing epics need no
backfill. It ships through the usual app sync (`yarn twenty apply`), not a
core migration.

`EPIC_SELECTION` and `BoardEpic` gain `color`. `BoardSprint` gains `goal`,
`startDate`, `endDate`.

## Back end

### Reused unchanged

`create-sprint`, `update-sprint`, `create-epic`, `update-epic`,
`update-issue` (epic assignment only).

### New routes

All go through `runScopedRoute` and check scope with the existing app-scope
helpers. Each gets a route path constant and a logic function UID.

| Route | Body | Behavior |
|---|---|---|
| `backlog` | `projectId`, board filters, `epicId` | Visible projects (same fallback as `task-board`), non-closed sprints, first page of each section, `totalCount` and `sumStoryPoints` per section (connection aggregates), members for avatars, subtask counts for listed parents, `canWrite`. |
| `backlog-section-issues` | `projectId`, `sprintId` or null, filters, `after` | Next page of one section, same shape as `board-column-issues`. |
| `rank-issue` | `issueId`, `sprintId` or null, `afterIssueId` or `beforeIssueId` (optional) | Reads the real neighbor positions and writes the midpoint. With no neighbor, or a neighbor no longer in that section, appends after the section's max position. Moving to another sprint also moves every subtask of the issue. Rejects subtasks (callers rank the parent). |
| `start-sprint` | `sprintId`, `name`, `goal`, `startDate`, `endDate` | Requires a FUTURE sprint with at least one issue, `endDate` after `startDate`, and no other ACTIVE sprint in the project. Sets `state = ACTIVE` and the fields. |
| `delete-sprint` | `sprintId` | FUTURE only. Issues fall back to the backlog via the existing `SET_NULL`. |
| `delete-epic` | `epicId` | Issues keep everything but their epic (`SET_NULL`). |
| `epic-summaries` | `projectId` | Per epic: `doneCount` and `totalCount`, two count queries per epic in parallel, done meaning a status in the DONE category (`computeEpicProgress` semantics). |

### Changed routes

- `task-board` and `board-column-issues`:
  - accept `epicId` (string, or null for "no epic")
  - accept `sprintId: 'ACTIVE'`, resolved on the server to the project's
    ACTIVE sprint id, or to no sprint filter when none is active
  - return the resolved sprint id so the client knows which header to draw
- `build-board-issue-filters.util` / `read-board-issue-query.util`: carry
  `epicId` and the `'ACTIVE'` sentinel.
- `complete-sprint`:
  - add `createNewSprint: true` as a third destination; the server creates a
    FUTURE sprint with the default name and moves issues there
  - move by family: a top-level issue that is not done moves with all its
    subtasks; a done parent stays with its subtasks
  - extend `pick-unfinished-issue-ids` (or add a sibling util) for this
- `create-issue` and `update-issue`: guard that a given `sprintId` / `epicId`
  belongs to the issue's project. This gap exists today and drag and drop
  makes it easier to hit.

### Concurrency

- The one-active-sprint rule is checked inside `start-sprint`. Two
  simultaneous starts are unlikely enough that read-then-write is acceptable.
  The loser gets "Sprint X is already active" and the client reloads the
  backlog.
- `rank-issue` reads neighbors at write time, so ranking against a stale
  screen still lands in a sensible place.

## Error handling

- Route errors surface through the existing `TaskMessage` / `readErrorText`
  path. Optimistic moves roll back.
- Start sprint validation errors show inline in the dialog.
- A failed `epic-summaries` load leaves the panel usable without progress bars.

## i18n

Every new string goes through `t()`. Run `lingui extract` for the
task-manager app and fill vi-VN, the same as commit `824be1642f`. Do not touch
the twenty-server catalogs.

## Testing

Unit tests (jest, next to existing tests):

- rank position: midpoint, append, missing neighbor
- sprint remaining days, including overdue and same-day
- default sprint name
- complete-sprint family selection
- board filters with `epicId` and `'ACTIVE'`
- same-project guard for `sprintId` / `epicId`
- epic color rotation

Final browser pass (once, at the end):

1. Create and start a sprint.
2. Drag issues between sprints and rank them.
3. Complete the sprint into a new sprint.
4. Create an epic, assign by drop, filter both views, delete the epic.
5. Repeat with a read-only member.
6. Check a parent with a subtask: it moves with its children and stays
   visible. There is an older note of parents vanishing from GraphQL once
   they have a child; confirm it no longer reproduces.

Deploy is user-run: `yarn twenty apply --remote mida-dev`.

## Out of scope for Phase 1

- Timeline / roadmap (Phase 2)
- Epic status, description, dates
- Parallel active sprints
- Sprint reports, burndown, velocity
- Bulk select and multi-drag in the Backlog
