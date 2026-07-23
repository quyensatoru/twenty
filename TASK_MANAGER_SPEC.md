# Task Manager (Jira-style) — Spec & Implementation Plan

> Module quản lý công việc kiểu Jira, tích hợp trong Twenty CRM. Branch `task-manager-sae`.
> Đọc kèm [ARCHITECTURE.md](ARCHITECTURE.md) — §6 metadata engine, §7.B playbook thêm standard object.

## Context

Xây module quản lý công việc kiểu Jira bên trong Twenty CRM (fork `mida-crm`). Mục tiêu: product spec và quy trình giống Jira (Project → Epic/Story/Task/Bug/Subtask, Sprint/Backlog/Board, Comment, log time, issue links...) nhưng chạy trên nền metadata-driven của Twenty.

Hai ràng buộc chốt từ user:
1. **Data model đầy đủ, chuẩn Jira** — gồm Epic, comment thread, time-tracking, issue links, components, versions, watchers.
2. **UI custom kiểu Jira** (Board/Backlog/Issue-detail/Roadmap riêng, KHÔNG dùng RecordTable list mặc định), NHƯNG vẫn giữ cơ chế customization của Twenty: show/hide field, drag reorder field, layout field.

Quyết định đã chốt:
- Object chính: tạo `issue` **riêng** (không mở rộng `task` dùng chung toàn CRM).
- Comment: object `issueComment` **riêng** (thread kiểu Jira), không dùng Notes.
- Scope entity v1: **đầy đủ** — Issue Links, Components, Versions/Releases, Watchers.
- Màn UI v1: **cả 4** — Kanban Board, Backlog, Issue detail, Epic/Roadmap.
- Workflow status: **tự do + Kanban** (không ép state-machine transition).

## Ràng buộc kỹ thuật đã verify

- Twenty **không có MANY_TO_MANY** (chỉ MANY_TO_ONE / ONE_TO_MANY). ⇒ mọi quan hệ nhiều-nhiều dùng **join object** (pattern `noteTarget`).
- **Mọi object tự động** được `noteTargets` / `taskTargets` / `attachments` / `timelineActivities` (side-effect handler khi tạo object) + `isAuditLogged` mặc định `true`. ⇒ **attachment và activity-history/timeline có sẵn 0 code** cho `issue`.
- `task` đã có `status` SELECT (TODO/IN_PROGRESS/DONE), `assignee`, `dueAt`, rich-text `bodyV2` — dùng làm mẫu clone cho `issue`.
- Field show/hide + reorder là Jotai component-state scope theo instance context; render field theo type qua `FieldContext` + `FieldDisplay`/`FieldInput`. ⇒ **tái dùng, không dựng lại**.

---

## Phần 1 — Data model (backend, standard objects code-level)

Mỗi object theo playbook §7.B: thêm key vào `STANDARD_OBJECTS` (twenty-shared) + object builder + field builder + đăng ký 2 map `satisfies` + index + view + (issue) nav/page-layout/search. TypeScript `satisfies` sẽ ép thêm đủ builder.

### Nhóm A — Core (Phase B1)

**`project`** — name(TEXT, labelId), `key`(TEXT, mã viết hoa), `nextIssueNumber`(NUMBER, system, default 1 — counter sinh issue key), description(RICH_TEXT), category(SELECT: Software/Business), lead(M-1→workspaceMember). Reverse: issues, sprints, components, versions (ONE_TO_MANY).

**`issue`** — object cốt lõi:
- title(TEXT, labelId), `issueKey`(TEXT, system, `PROJ-123`), description(RICH_TEXT)
- issueType(SELECT: Epic/Story/Task/Bug/Subtask, default Task)
- status(SELECT: Backlog/Todo/InProgress/InReview/Done, default Todo) — **group-by của board**
- priority(SELECT: Lowest/Low/Medium/High/Highest, default Medium)
- resolution(SELECT: Done/WontDo/Duplicate/CannotReproduce, nullable)
- storyPoints(NUMBER), labels(MULTI_SELECT), dueDate(DATE_TIME)
- originalEstimateMinutes / remainingEstimateMinutes / timeSpentMinutes (NUMBER) — time tracking
- position(POSITION, system) — rank backlog/board
- assignee(M-1→workspaceMember), reporter(M-1→workspaceMember)
- project(M-1→project, CASCADE), sprint(M-1→sprint, SET_NULL, null=backlog)
- parent(M-1→issue self) — epic link (Story→Epic) và subtask (Subtask→Story). Reverse: children
- `isSearchable: true` (title + issueKey)
- (auto) noteTargets/taskTargets/attachments/timelineActivities

**`sprint`** — name(TEXT, labelId), state(SELECT: Future/Active/Closed, default Future), goal(TEXT), startDate/endDate/completeDate(DATE_TIME), project(M-1→project, CASCADE). Reverse: issues.

**`issueComment`** — bodyV2(RICH_TEXT), issue(M-1→issue, CASCADE), author(M-1→workspaceMember). createdAt system = timestamp comment. (thread = list sort theo createdAt)

**`worklog`** — description(TEXT), timeSpentMinutes(NUMBER), startedAt(DATE_TIME), issue(M-1→issue, CASCADE), member(M-1→workspaceMember).

### Nhóm B — Extended (Phase B2)

**`component`** — name(TEXT, labelId), description(TEXT), lead(M-1→workspaceMember), project(M-1→project, CASCADE).

**`version`** — name(TEXT, labelId), description(TEXT), released(BOOLEAN, default false), releaseDate(DATE_TIME), project(M-1→project, CASCADE).

**Join objects (do không có M-M):**
- **`issueLink`** — sourceIssue(M-1→issue), targetIssue(M-1→issue), linkType(SELECT: Blocks/RelatesTo/Duplicates/Clones).
- **`issueWatcher`** — issue(M-1→issue, CASCADE), member(M-1→workspaceMember).
- **`issueComponentLink`** — issue(M-1→issue, CASCADE), component(M-1→component, CASCADE).
- **`issueVersionLink`** — issue(M-1→issue, CASCADE), version(M-1→version, CASCADE), linkKind(SELECT: Fix/Affects).

Tổng: 5 core + 2 lookup + 4 join = **11 object**.

### File pattern (lặp cho mỗi object) — theo §7.B
- `packages/twenty-shared/src/metadata/constants/standard-object.constant.ts` (+ `standard-object-universal-identifiers.constant.ts`) — UUID registry (object + mọi field/view/index; system field qua `buildStandardObjectSystemFields`).
- `packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/object-metadata/create-standard-flat-object-metadata.util.ts` — entry object builder (clone entry `note`, dòng ~501).
- `.../utils/field-metadata/compute-<object>-standard-flat-field-metadata.util.ts` — clone `compute-task-...` / `compute-note-...`.
- `.../utils/field-metadata/build-standard-flat-field-metadata-maps.util.ts` — đăng ký builder.
- `.../utils/index/compute-<object>-standard-flat-index-metadata.util.ts` — index (searchVector GIN cho issue; FK index).
- `.../utils/view/...` — view `allXxx` (+ KANBAN view group-by `status` cho issue).
- issue thêm: `.../constants/search-fields-by-standard-object-name.constant.ts`, `.../constants/standard-navigation-menu-item.constant.ts`, `.../utils/page-layout-config/standard-issue-page-layout.config.ts`.
- `packages/twenty-server/src/modules/<object>/standard-objects/<object>.workspace-entity.ts` — class typing (không decorator).

---

## Phần 2 — Backend logic (chỉ code phần Twenty không có)

1. **Issue key auto-increment** (`packages/twenty-server/src/modules/issue/listeners/`): listener trước-tạo issue → atomic `UPDATE project SET "nextIssueNumber" = "nextIssueNumber" + 1 WHERE id = :projectId RETURNING "nextIssueNumber"` (qua `WorkspaceRepository`), set `issueKey = project.key + '-' + n`. Tham khảo pattern listener DB event: `packages/twenty-server/src/engine/api/graphql/workspace-query-runner/listeners/entity-events-to-db.listener.ts` và các listener trong `modules/*/listeners/`.
   - `// ponytail: atomic UPDATE...RETURNING đủ chống race; dùng Postgres sequence per-project nếu cần key tuyệt đối không tái sử dụng.`
2. **Time rollup** (`modules/worklog/listeners/`): trên create/update/delete worklog → cập nhật `issue.timeSpentMinutes` = SUM(worklog) và giảm `remainingEstimateMinutes`. (Có thể để phase sau, MVP nhập tay.)
3. **Sprint complete** (phase sau): action đẩy issue chưa Done về backlog/sprint kế — làm bằng workflow engine sẵn có hoặc custom mutation. Không bắt buộc v1.
4. **Seed** (optional): `dev-seeder/data/constants/<object>-data-seeds.constant.ts` + wire vào `dev-seeder-data.service.ts` theo batch thứ tự FK (project → sprint/component/version → issue → comment/worklog/links).

---

## Phần 3 — Frontend UI custom (tái dùng field-system, chỉ build layout shell)

Module mới: `packages/twenty-front/src/modules/task-manager/` (components/ hooks/ states/ theo convention §4.6). Route đăng ký ở `packages/twenty-front/src/modules/app/hooks/useCreateWorkspaceAppRouter.tsx` + path vào `packages/twenty-shared/src/types/AppPath.ts`. Thêm nav item vào app.

### TÁI DÙNG (không dựng lại) — nguồn: khảo sát đã verify
- **Field show/hide + order**: `visibleRecordFieldsComponentSelector` (visible+sorted), `currentRecordFieldsComponentState`, `useChangeRecordFieldVisibility`, `useSaveCurrentViewFields` (`packages/twenty-front/src/modules/object-record/record-field/...` + `.../views/...`).
- **UI toggle + drag reorder field**: `ObjectOptionsDropdownFieldsContent` + `ViewFieldsVisibleDropdownSection` / `ViewFieldsHiddenDropdownSection` (cần cấp `ObjectOptionsDropdownContext`).
- **Render field theo type**: `FieldContext` + `FieldDisplay`/`FieldInput`; hoặc `RecordInlineCell` (read+edit, cần 3 context — copy wiring từ `RecordFieldList` dòng ~176-234); hoặc `FieldWidget`/`FieldWidgetDisplay` (đơn giản, chỉ cần recordId + fieldMetadataId, không cần scope context). Build fieldDefinition bằng `formatFieldMetadataItemAsColumnDefinition`.
- **Kanban logic**: `RecordGroupDefinition` + `useSetRecordGroups` (cột từ options SELECT `status`), `useProcessBoardCardDrop` / `useUpdateDroppedRecordOnBoard` (kéo card = ghi SELECT field + position). KHÔNG tái dùng `RecordBoard` gốc (coupling chặt với RecordIndexContext) — chỉ tái dùng logic + pattern card body.
- **Rich text** (description, comment): `RichTextFieldEditor` / `BlockEditor` (`.../blocknote-editor/`), pattern `ActivityRichTextEditor`.
- **Activity history + attachments trên issue detail**: `TimelineCard` + `FilesCard` (target-record driven, có sẵn).
- **Provider stack cho trang custom** (bắt buộc, nếu thiếu instance context sẽ throw): `ContextStoreComponentInstanceContext` (set `contextStoreCurrentObjectMetadataItemId` + `contextStoreCurrentViewId`) → `RecordIndexContextProvider` (value từ `useRecordIndexFieldMetadataDerivedStates`) → `ViewComponentInstanceContext` → `RecordComponentInstanceContextsWrapper` → view-field loader (`ViewBarRecordFieldEffect` / `useLoadRecordIndexStates`) → tự load record vào store (`useFindManyRecords`). Trace mẫu: `packages/twenty-front/src/pages/object-record/RecordIndexPage.tsx` + `.../record-index/components/RecordIndexContainerGater.tsx`.

### BUILD MỚI (chỉ layout shell)

- **P-UI-1 Kanban Board** (`task-manager/board/`): shell cột CSS + DnD (`@hello-pangea/dnd`), card issue custom (issueKey, title, priority icon, assignee avatar, storyPoints) render field qua pattern card-body. Cột từ `status` groups. Drop → `useUpdateDroppedRecordOnBoard`. Nút cấu hình field trên card = reuse dropdown show/hide.
- **P-UI-2 Issue detail** (`task-manager/issue-detail/`): layout 2 panel kiểu Jira. Trái: title + description (rich text) + issueComment thread (component custom: list issueComment sort createdAt + editor BlockNote + `useCreateOneRecord`) + `TimelineCard`. Phải: field panel qua `PageLayoutRenderer` (đã có show/hide/reorder/resize) hoặc `RecordFieldList` + dropdown. Subtasks/links/worklog tabs.
- **P-UI-3 Backlog** (`task-manager/backlog/`): list issue nhóm theo sprint + section Backlog (sprint=null), kéo issue giữa sprint (update `sprint` relation + position), nút start/complete sprint (đổi `sprint.state`).
- **P-UI-4 Epic/Roadmap** (`task-manager/roadmap/`): nhóm issue theo epic (parent, issueType=Epic), timeline theo dueDate/sprint. Phase sau nếu cần cắt.

---

## Phasing

- **B1 — Core data**: project, issue, sprint, issueComment, worklog + issue-key listener. `database:reset`, verify tạo record ở `/objects/issues`.
- **UI-1 — Board + Issue detail**: 2 màn quan trọng nhất, dựng provider stack + reuse field-system.
- **B2 — Extended data**: component, version, issueLink, issueWatcher, issueComponentLink, issueVersionLink.
- **UI-2 — Backlog + sprint actions**.
- **UI-3 — Epic/Roadmap** + time rollup + seed demo (optional).

Khuyến nghị: làm trọn `project` (B1) + Board tối thiểu như spike để chốt chính xác signature builder (copy `note`/`task`) và provider stack, rồi nhân bản.

---

## Verification

- Backend: `npx nx typecheck twenty-server` (satisfies map sẽ báo thiếu builder), `npx nx lint:diff-with-main twenty-server`, `npx nx run twenty-server:lingui:extract` (nếu dùng i18nLabel).
- Materialize: `bash packages/twenty-utils/setup-dev-env.sh` (đảm bảo Postgres/Redis) rồi `npx nx run twenty-server:database:reset`. Kiểm tra bằng Postgres MCP: object trong `core.objectMetadata`, bảng `workspace_<hash>.issue` + cột.
- GraphQL: `npx nx run twenty-front:graphql:generate` sau khi objects tồn tại.
- Frontend: `npx nx start twenty-front` + `npx nx start twenty-server`. Đăng nhập (Continue with Email, credential prefilled), vào `/objects/issues` (generic, xác nhận metadata OK) rồi route custom `/task-manager` (Board). Kiểm show/hide + drag field vẫn hoạt động, kéo card đổi status persist, tạo comment, tạo worklog.
- E2E (optional): Playwright ở `twenty-e2e-testing`.

## Rủi ro / mở

- 11 object là module lớn; instance-context discipline ở frontend dễ sai (miss context → hook throw). Dùng một `recordIndexId` nhất quán per screen.
- `issueVersionLink.linkKind` gộp Fix/Affects trong 1 join để bớt object.
- Roadmap (UI-4) là phần nặng nhất, có thể cắt khỏi v1.
- Cần đọc kỹ signature `createStandardFieldFlatMetadata` / `createStandardRelationFieldFlatMetadata` và cách 1 view KANBAN được định nghĩa trong standard-application trước khi code (spike B1).
