# Task Manager refinement plan

## Context

Task Manager (branch `task-manager-sae`) is a Jira-like feature already wired into Twenty's generic object-metadata system: `Issue` is a real standard object (`packages/twenty-server/src/modules/issue/standard-objects/issue.workspace-entity.ts`), and the frontend pages (`Board`, `Backlog`, `Roadmap`, `Issue detail`) run through the same `RecordIndexContextProvider`/`RecordComponentInstanceContextsWrapper` stack used by standard CRM object pages (via `TaskManagerPageShell.tsx`). That's good news: most of the polish wanted here can come from *reusing* generic Twenty mechanisms that already exist, rather than inventing new ones — which also keeps it consistent with Twenty's own design patterns.

Four things need fixing before this feels like a real, finished Jira-style tool:
1. Issue comments only support create+read today — no edit/reply/delete in the UI, even though generic update/delete GraphQL mutations already exist for the `issueComment` object.
2. There's no permanent nav entry to Task Manager, and its route (`/task-manager`) is longer than necessary.
3. The board is hand-rolled (duplicates rather than reuses Twenty's generic Kanban engine) and pages lack the consistent header/action-button treatment standard object pages have.
4. Clicking an issue does a full page navigation to a separate route — breaking the "everything happens on one page" feel Jira has. Twenty already has a full side-panel/slide-over system used for this exact purpose on other records; issues aren't using it yet.

Decisions already confirmed: comment replies should be **true threaded replies** (schema change), not a lightweight quote/mention; the shortened route should be `/task` (umbrella section covering Board/Backlog/Roadmap/Issue, not just `/board` which is only the kanban view).

---

## Part 1 — Comment actions: edit, reply, delete

**Backend** (`packages/twenty-server/src/modules/issue-comment/`)
- `standard-objects/issue-comment.workspace-entity.ts`: add a self-referential parent/children relation, mirroring the exact pattern already used on `Issue` itself (`issue.workspace-entity.ts:35-37`):
  ```ts
  parentComment: EntityRelation<IssueCommentWorkspaceEntity> | null;
  parentCommentId: string | null;
  replies: EntityRelation<IssueCommentWorkspaceEntity[]>;
  ```
  Register the new field metadata the same way other IssueComment fields are (see `compute-issue-comment-standard-flat-field-metadata.util.ts`), then generate an instance command: `npx nx run twenty-server:database:migrate:generate --name add-issue-comment-parent --type fast`.
- `query-hooks/`: today `issue-comment-update-one.pre-query.hook.ts` only checks `issueId` reassignment scope, and there is **no delete hook at all** — so any workspace member with write access to the issue can currently edit or delete *anyone's* comment. Add:
  - An `issue-comment-delete-one.pre-query.hook.ts`, mirroring the create/update hooks' shape.
  - An author-ownership check in both update and delete hooks (only the comment's `authorId` — or a workspace admin — may edit/delete it), registered in `issue-comment-query-hook.module.ts` alongside the existing two.

**Frontend** (`packages/twenty-front/src/modules/task-manager/issue-detail/`)
- `hooks/useIssueComments.ts`: extend beyond `useFindManyRecords` + `useCreateOneRecord` to also use the generic `useUpdateOneRecord` and `useDeleteOneRecord` hooks (already used elsewhere for record deletion, e.g. `RecordDetailRelationRecordsListItem.tsx`) — add `updateComment`, `deleteComment`, and `postReply(parentCommentId, body)`. Include `parentCommentId` in `recordGqlFields`, and group the flat list into top-level comments + nested replies client-side (one level of nesting, matching Jira's own UX — it doesn't do deep threads either).
- `components/IssueCommentThread.tsx`: add a hover/kebab action menu per comment (reuse the `Dropdown` + icon-button pattern from `RecordDetailRelationRecordsListItem.tsx`), showing Edit/Delete only when `comment.authorId === currentWorkspaceMember.id`, and Reply always. Edit swaps the read-only `CommentBody` `BlockEditor` for an editable one on click, following the inline-edit pattern in `packages/twenty-front/src/modules/activities/components/ActivityRichTextEditor.tsx`. Delete should confirm before calling `deleteComment` — check for an existing confirmation-modal component in the codebase to reuse rather than building a new one. Replies render indented under their parent with their own small composer.

---

## Part 2 — Navigation entry + shorter path

- `packages/twenty-shared/src/types/AppPath.ts:29-32`: rename the four `TaskManager*` paths from `/task-manager...` to `/task...`:
  ```
  TaskManagerBoardPage = '/task',
  TaskManagerBacklogPage = '/task/backlog',
  TaskManagerRoadmapPage = '/task/roadmap',
  TaskManagerIssuePage = '/task/issue/:issueId',
  ```
- Fix the hardcoded literal at `packages/twenty-front/src/modules/task-manager/components/TaskManagerPageShell.tsx:117` (`` `/task-manager/issue/${recordId}` ``) and the one in `TaskManagerBoardCard.tsx:71` (`goToIssuePage(\`/task-manager/issue/${issue.id}\`)`) — these bypass the `AppPath` enum and won't follow a simple rename. Then grep the whole repo for the literal string `/task-manager` (route tabs in `TaskManagerTopBar.tsx`, `TaskManagerRoadmap.tsx`'s navigate handler, any e2e/tests) and update every remaining occurrence — this is a repeated mechanical fix, not something to enumerate file-by-file up front.
- Add a permanent nav entry: there is currently **none** (zero matches for "task-manager"/"TaskManager" in the nav modules). Add a static `NavigationDrawerItem` following the exact pattern already used for Settings/Documentation in `packages/twenty-front/src/modules/navigation/components/NavigationDrawerOtherSection.tsx:50-61`, linking to `AppPath.TaskManagerBoardPage`, with a fitting icon (e.g. `IconLayoutKanban`).

---

## Part 3 & 4 — Design polish + single-page interactions (Jira feel, Twenty patterns)

**Single-page issue interaction (the biggest UX gap).** Today every entry point (`TaskManagerBoardCard.tsx`, `TaskManagerRoadmap.tsx`'s `handleNavigateToIssue`, Backlog list items) does a full `useNavigate()` to `TaskManagerIssuePage`. Twenty already has a complete side-panel system for exactly this ("view/edit a record without leaving the page"): `useOpenRecordInSidePanel` → `SidePanelRecordPage` → `PageLayoutRecordPageRenderer`, with its own navigation stack (`sidePanelNavigationStackState`) and a "pop out to full page" link.

The one wrinkle: `SidePanelRecordPage` renders records through the generic `PageLayoutRecordPageRenderer`, but Issue's detail view (`TaskManagerIssueDetail.tsx`) is a bespoke component (needs `RecordIndexContext`, has custom sections for title/description/comments/activity/files/field-panel) — it isn't driven by that generic renderer. So:
- Branch `SidePanelRecordPage.tsx`: when `viewableRecordNameSingular === 'issue'`, render `TaskManagerIssueDetail` (wrapped in the same context providers `TaskManagerPageShell` sets up) instead of `PageLayoutRecordPageRenderer` — the same special-casing style already used there for `CoreObjectNameSingular.WorkflowRun`.
- Update the three entry points above to call `openRecordInSidePanel({ recordId: issue.id, objectNameSingular: 'issue' })` instead of `useNavigate()`.
- Keep the `TaskManagerIssuePage` route alive for deep-linking/shareable links/browser back-forward — same relationship the side panel already has with `RecordShowPage` (open full page from the panel).

**Board redesign.** `TaskManagerBoard.tsx` hand-rolls its own `@hello-pangea/dnd` board instead of reusing `packages/twenty-front/src/modules/object-record/record-board/components/RecordBoard.tsx` — the same generic kanban engine that already powers the Opportunities pipeline (grouping, card styling, per-column "+ New" button via `RecordBoardColumnNewRecordButton.tsx`, drag interactions). Migrating to `RecordBoard` is the single highest-leverage change for visual/interaction polish and instantly satisfies "follow Twenty's design pattern," but it's also the riskiest piece (current hand-rolled grouping-by-status logic needs reconciling with `RecordBoard`'s grouping mechanism) — treat as its own careful phase, not a quick swap.

**Persistent action buttons + header consistency.** Standardize Board/Backlog/Roadmap with the same header treatment standard object index pages use (icon + title + primary action on the right, matching `RecordIndexPageHeader` conventions), with a "New Issue" button always present. Since Issue already runs through the same `RecordIndexContextProvider`/`useCreateNewIndexRecord` stack as real objects, check in-browser first whether the header/per-column "+ New" affordance already works once the board reuses `RecordBoard` — it may need no bespoke button code at all, only wiring.

**Visual consistency.** Status/priority badges already use `Tag`/`Chip` from `twenty-ui/data-display` — keep using them everywhere (Board cards, Backlog rows, Roadmap, Issue detail's field panel) with one consistent priority→color mapping, and keep consuming `themeCssVariables` (spacing/font/border/boxShadow) as the existing Task Manager components already do — no new design tokens needed.

---

## Suggested rollout order

1. **Comment actions** (Part 1) — self-contained in `issue-comment` module + one small migration, no cross-cutting risk.
2. **Nav entry + path rename** (Part 2) — mechanical, well-scoped, easy to verify.
3. **Side panel for issue detail** (Part 4, single-page interaction) — reuses existing infra, moderate risk (one new branch in `SidePanelRecordPage.tsx`).
4. **Board reuse of `RecordBoard` + header/action-button consistency** (Part 3/4) — largest visual overhaul, do last with careful review since it touches the most existing behavior.

---

## Verification

- Backend: `npx nx test twenty-server` for the `issue-comment` module (new hooks + entity field), plus run the generated instance command against a local DB (`npx nx run twenty-server:database:migrate:prod` after `--type fast` generation) and confirm via the Postgres MCP that `parentCommentId` exists with the right FK.
- Frontend: `npx nx test twenty-front` for `IssueCommentThread`/`useIssueComments`; manually test in the browser — create a comment, edit it, delete it, reply to it as a different workspace member and confirm edit/delete controls are hidden for non-authors.
- Manually click through Board → issue (side panel opens, no full navigation), "pop out" to full page, browser back/forward, then Backlog and Roadmap issue clicks too.
- Confirm the new nav entry appears and old `/task-manager/*` links no longer 404 silently (rename should be exhaustive — recheck via repo-wide grep for `/task-manager` after the change, expect zero remaining hits).
- `npx nx lint:diff-with-main twenty-front` / `twenty-server` and `npx nx typecheck twenty-front` / `twenty-server` before considering any phase done.
