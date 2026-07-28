# Tách Epic thành standard object riêng (thay vì issueType + self-reference)

## Context
Hiện tại "Epic" chỉ là 1 giá trị (`'EPIC'`) của select field `issueType` trên `Issue`, và quan hệ epic↔issue con dùng chung field self-reference `parent`/`children` với quan hệ Story↔Subtask (`packages/twenty-server/src/modules/issue/standard-objects/issue.workspace-entity.ts:35-37`). Việc này gây nhầm lẫn ngữ nghĩa (`parent` mang 2 nghĩa khác nhau tùy type) và là nguyên nhân của các gap đã verify thực tế trước đó: field epic không hiện được trong issue detail UI, và search trong filter picker bị lỗi (`Object issue doesn't have any "name" field` — vì Issue dùng `title` làm label field, không phải `name`).

Mục tiêu: tách Epic ra thành 1 standard object riêng, với quan hệ tường minh:
- 1 Epic → nhiều Issue (`Issue.epic` MANY_TO_ONE, `Epic.issues` ONE_TO_MANY)
- 1 Epic → 1 Project (`Epic.project` MANY_TO_ONE, `Project.epics` ONE_TO_MANY) — field `project` này Epic vốn đã "ngầm" có được nếu coi Epic là Issue (Issue đã có `project`), giờ tách hẳn ra làm field riêng của Epic.
- Story vẫn giữ nguyên là 1 giá trị `issueType` (không tách), field `parent`/`children` self-reference trên Issue được giữ lại nhưng giờ chỉ còn đúng 1 vai trò: parent của Subtask là Story.
- Epic dùng `name` làm label identifier field (theo convention của Project/Sprint/Company, tránh lặp lại đúng loại bug "name field" đã gặp).

## Backend — thêm standard object `Epic`

Follow đúng pattern của `Project` (đối tượng gần nhất có cả field đơn giản + 1 relation ONE_TO_MANY tới Issue):

1. **Entity**: `packages/twenty-server/src/modules/epic/standard-objects/epic.workspace-entity.ts` — class thuần, không decorator, mirror `packages/twenty-server/src/modules/project/standard-objects/project.workspace-entity.ts`. Field: `name` (text), `project: EntityRelation<ProjectWorkspaceEntity>` + `projectId`, `issues: EntityRelation<IssueWorkspaceEntity>[]`.

2. **Field metadata builder**: file mới `compute-epic-standard-flat-field-metadata.util.ts` (cùng thư mục `compute-project-standard-flat-field-metadata.util.ts`), hàm `buildEpicStandardFlatFieldMetadatas`:
   - `name` (label identifier)
   - `project` — MANY_TO_ONE, mirror field `project` trên Issue (`compute-issue-standard-flat-field-metadata.util.ts:628-651`): `targetObjectName: 'project'`, `targetFieldName: 'epics'`, `joinColumnName: 'projectId'`
   - `issues` — ONE_TO_MANY, mirror field `issues` trên Project (`compute-project-standard-flat-field-metadata.util.ts:351-373`): `targetObjectName: 'issue'`, `targetFieldName: 'epic'`

3. **Object metadata builder**: entry mới trong `create-standard-flat-object-metadata.util.ts` (mirror Project ở dòng ~608-...): `nameSingular: 'epic'`, `namePlural: 'epics'`, `labelIdentifierFieldMetadataName: 'name'`, icon phù hợp (vd `IconStack2`). Đăng ký vào `STANDARD_FLAT_OBJECT_METADATA_BUILDERS_BY_OBJECT_NAME` và `STANDARD_FLAT_FIELD_METADATA_BUILDERS_BY_OBJECT_NAME` (`build-standard-flat-field-metadata-maps.util.ts:49+`).

4. **Type registries** cần thêm `epic`: `AllStandardObjectName` (`types/all-standard-object-name.type.ts`), `AllStandardObjectFieldName`, và entry mới trong `STANDARD_OBJECTS` (`packages/twenty-shared/src/metadata/constants/standard-object.constant.ts`) với universal identifier cho object + từng field/index/view — copy cấu trúc entry `project`/`sprint` (dòng 2089/2156).

5. **Index + page-layout config**: file mới mirror của Project's `compute-project-standard-flat-index-metadata.util.ts` và `standard-project-page-layout.config.ts` (tên tương ứng cho epic).

6. **Views**: file mới `compute-standard-epic-views.util.ts` + `compute-standard-epic-view-fields.util.ts`, mirror `compute-standard-project-views.util.ts`/`compute-standard-project-view-fields.util.ts` — 1 view `allEpics` (table: name, project, createdAt) + 1 view `epicRecordPageFields` (FIELDS_WIDGET).

7. **Sửa `Issue`**:
   - `compute-issue-standard-flat-field-metadata.util.ts:200` — xóa option `{ value: 'EPIC', ... }` khỏi `issueType` select (giữ STORY/TASK/BUG/SUBTASK).
   - Thêm field `epic` MANY_TO_ONE mirror field `project` (dòng 628-651): `targetObjectName: 'epic'`, `targetFieldName: 'issues'`, `joinColumnName: 'epicId'`, nullable.
   - Entity `issue.workspace-entity.ts` thêm `epic: EntityRelation<EpicWorkspaceEntity>` + `epicId`.
   - **Quan trọng — fix gap đã tìm ra**: thêm `epic` vào view fields của `issueRecordPageFields` trong `compute-standard-issue-view-fields.util.ts` để field Epic tự hiện trong issue detail panel (`IssueFieldPanel.tsx` không có allowlist, chỉ dựa vào view fields đã seed).

8. **Sửa `Project`**: thêm field `epics` ONE_TO_MANY mirror field `issues` (`compute-project-standard-flat-field-metadata.util.ts:351-373`): `targetObjectName: 'epic'`, `targetFieldName: 'project'`. Entity `project.workspace-entity.ts` thêm `epics: EntityRelation<EpicWorkspaceEntity>[]`.

## Backend — migration cho workspace đã tồn tại

Theo yêu cầu CLAUDE.md (đổi entity phải có instance/workspace command, giữ cả up/down). Viết **1 workspace command mới** dưới version folder tiếp theo (check version hiện tại — mới nhất là `2-25`, dùng `2-26` hoặc version kế tiếp phù hợp), đăng ký thủ công vào `<version>-upgrade-version-command.module.ts` (không có tool tự sinh cho workspace command, chỉ `migrate:generate` sinh instance command core-schema).

Trong `runOnWorkspace`, làm 2 phase tuần tự:
1. **Tạo metadata Epic object** cho workspace đã provisioned — theo đúng pattern `SyncCallRecordingStandardObjectsCommand` (`2-10-workspace-command-1799000055000-sync-call-recording-standard-objects.command.ts`): diff standard-application definition mới (đã có Epic) với flat maps hiện tại của workspace, build `flatEntityToCreate` cho objectMetadata/fieldMetadata/index/view/viewField, chạy qua `validateBuildAndRunWorkspaceMigration` (workspace này >=2.19 nên dùng bản có side-effect, không dùng legacy như ví dụ 2-10).
2. **Backfill data**: với mỗi workspace, convert các `Issue` row có `issueType = 'EPIC'` thành `Epic` row mới (copy `title` → `name`, `projectId` → `projectId`), sau đó tìm các Issue có `parentId` trỏ tới issue-epic cũ, set `epicId` = epic mới + xóa `parentId`, rồi xóa issue-epic cũ, cuối cùng xóa option `EPIC` khỏi metadata select `issueType`. Đây là backfill ở mức row data (không chỉ metadata) — follow pattern của 1 command backfill quan hệ dữ liệu đã có sẵn trong repo, ví dụ `BackfillWorkflowVersionCoreLinksCommand` (cùng `ProvisionedWorkspaceCommandRunner`), thay vì các ví dụ 2-23/2-10 (chỉ đụng metadata).

Viết đầy đủ `down()` đảo ngược (Epic → issue issueType=EPIC lại, repoint `parentId`, xóa Epic object, thêm lại option EPIC) — không sửa/xóa logic up/down đã commit trước đó của các command khác.

## Backend — seed data dev

`packages/twenty-server/src/engine/workspace-manager/dev-seeder/data/constants/`:
- File mới `epic-data-seeds.constant.ts` (mirror `project`/`sprint` seed constants) — tạo Epic thật (vd "Website Redesign" cho project WEB, "Mobile App Launch" cho project MOB).
- `issue-data-seeds.constant.ts`: xóa 2 row đang là `issueType: 'EPIC'` (WEB-1 dòng 111, MOB-1 dòng 253) khỏi issue seed, đổi các issue con đang set `parentId` trỏ tới chúng (WEB-2, WEB-3, ...) sang set `epicId` trỏ tới epic mới tương ứng.
- `dev-seeder-data.service.ts:234` — thêm `recordSeeds: EPIC_DATA_SEEDS`, đảm bảo epic seed chạy trước issue seed (vì issue seed cần epicId).

## Frontend

- Hook mới `packages/twenty-front/src/modules/task-manager/hooks/useTaskManagerEpics.ts`, mirror `useTaskManagerProjects.ts`/`useTaskManagerSprints.ts`.
- `useTaskManagerIssues.ts` — thêm `epicId` (và `epic { id, name }` nếu cần hiện tên) vào `ISSUE_BASE_RECORD_GQL_FIELDS`; giữ `parentId` (vẫn dùng cho Story→Subtask).
- `packages/twenty-front/src/modules/task-manager/roadmap/components/TaskManagerRoadmap.tsx` — bỏ logic `issues.filter(issue => issue.issueType === 'EPIC')` (dòng 143, 149), thay bằng fetch Epic thật qua `useTaskManagerEpics`, group issue theo `issue.epicId` (thay `parentId`). Đổi `StyledEpicCard`/`EpicGroup` dùng `epic.name` thay `epic.title`.
- Field `epic` trên issue detail: không cần code frontend riêng — vì đã thêm vào view fields ở bước backend §7, `IssueFieldPanel` (không có allowlist cứng, chỉ lọc theo `FIELD_PANEL_EXCLUDED_FIELD_NAMES`) và `TaskManagerFieldCell` sẽ tự render field quan hệ này giống `project`/`sprint` — đây chính là điểm fix cho gap "không set được epic trong issue detail" đã phát hiện lúc test trước.
- Sau khi đổi schema backend: chạy `npx nx run twenty-front:graphql:generate` và `--configuration=metadata`.

## Verification
1. `npx nx typecheck twenty-server twenty-front` + `npx nx lint:diff-with-main twenty-server twenty-front`.
2. `npx nx database:reset twenty-server` (dev, seed lại từ đầu) — xác nhận Epic object + issue seed mới không lỗi.
3. Chạy workspace command mới với `--dry-run` trước, xem log diff đúng ý, rồi chạy thật trên 1 workspace test đang có issueType=EPIC cũ (không dùng --dry-run), xác nhận: Epic record được tạo, issue con repoint đúng `epicId`, option EPIC biến mất khỏi issueType, không còn issue rác nào issueType=EPIC.
4. Test tay lại đúng flow đã verify trước đó (Playwright): mở issue detail trong Task Manager — field "Epic" giờ phải hiện sẵn và set được; vào view Issues chung, filter theo `Epic`, gõ tìm theo tên (search phải chạy được, không còn lỗi `Object issue doesn't have any "name" field` vì Epic dùng `name`).
5. Roadmap page: xác nhận vẫn group đúng issue theo epic thật (dữ liệu từ Epic entity, không phải suy ra từ issueType nữa).
6. Nếu có test hiện có cho task-manager/issue (`npx jest issue`, `npx jest task-manager`), chạy để bắt regression từ việc xóa option EPIC.
