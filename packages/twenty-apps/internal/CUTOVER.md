# Cutover: từ standard object của fork sang app

Tài liệu này là nguồn sự thật cho việc chuyển production từ nhánh fork (task-manager, shift,
merchant viết thẳng vào core) sang nhánh `apps/zero-core` (upstream/main + các app). `MIGRATION.md`
của từng app mô tả chi tiết riêng của app đó; thứ tự tổng thể thì theo file này.

## Vì sao không dùng dump rồi restore

Cách hiển nhiên là: dump dữ liệu, deploy server mới, `twenty apply` tạo bảng rỗng, đổ dữ liệu vào.
Cách đó **chạy được nhưng nguy hiểm không cần thiết**, vì nó có một cửa sổ mà dữ liệu production chỉ
tồn tại trong file dump.

Lý do nó xảy ra: trên server chạy `upstream/main`, `issue`/`shift`/`merchant`... không còn trong
`standard-object.constant.ts`. `TwentyStandardApplicationService.synchronizeTwentyStandardApplicationOrThrow`
chạy với `inferDeletionFromMissingEntities: true`, thấy chúng có trong DB mà không có trong manifest
→ sinh lệnh xoá → **DROP bảng kèm toàn bộ dữ liệu**.

Nhưng tập `from` mà nó so sánh được lọc theo chủ sở hữu:

```ts
const from = getSubFlatEntityMapsByApplicationIdsOrThrow({
  applicationIds: [twentyStandardFlatApplication.id],
  flatEntityMaps: fromFlatEntityMaps,
});
```

Nghĩa là **nếu object đã thuộc một application khác trước khi server mới khởi động, nó nằm ngoài tầm
nhìn của standard sync và không bị đụng tới.**

Đó là cách làm được chọn: re-parent trước, deploy sau. Không move một dòng dữ liệu nào.

## Nền tảng kỹ thuật

Ba dữ kiện đã kiểm chứng trong repo, mọi bước dưới đây dựa vào chúng:

1. **Danh tính object là `(workspaceId, universalIdentifier)`.** `core."objectMetadata"` có unique
   index `IDX_3a00d35710f4227ded320fd96d` trên đúng cặp đó. `applicationId` **không** nằm trong khoá.
   Vì vậy đổi chủ sở hữu là một lệnh `UPDATE`, không phải tạo lại.
2. **Tên bảng vật lý phụ thuộc chủ sở hữu.** `computeObjectTargetTable` gọi `computeTableName(nameSingular, isCustom)`
   với `isCustom = applicationUniversalIdentifier !== TWENTY_STANDARD_APPLICATION.universalIdentifier`,
   và `computeTableName` thêm tiền tố `_`. Nên `issue` (standard) → `_issue` (app). Đây là lệnh
   `ALTER TABLE ... RENAME`, dữ liệu giữ nguyên.
3. **App sync cũng lọc theo chủ sở hữu.** `application-manifest-migration.service.ts:109` dùng
   `applicationIds: [ownerFlatApplication.id]`. Nên sau khi re-parent, `twenty apply` thấy metadata
   đã tồn tại và thuộc về mình → sinh UPDATE/no-op, không sinh CREATE.

Cột `targetTableName` trong `objectMetadata` là cột legacy, giá trị `DEPRECATED` với mọi object —
không cần sửa.

## Thứ tự cài đặt

`merchant-email-campaigns` đang chạy production và có field riêng trên `merchant`. App `task-manager`
sở hữu chính object `merchant`. Vì vậy:

1. `task-manager` cài trước (sở hữu `app`, `appAccess`, `merchant`, và các object task).
2. `shift-management` độc lập, cài lúc nào cũng được.
3. `merchant-email-campaigns` cài lại sau cùng để field của nó gắn đúng vào `merchant` đã đổi chủ.

## Quy trình

Toàn bộ chạy trong một cửa sổ bảo trì. Chặn truy cập người dùng trước khi bắt đầu.

### Bước 0 — Backup

```bash
pg_dump -Fc -f pre-cutover-$(date +%F).dump "$DATABASE_URL"
```

Dump toàn bộ database, không chỉ schema workspace: bước re-parent ghi vào schema `core`, rollback
cần cả hai. Kiểm tra dump khôi phục được trên một instance khác **trước khi** đi tiếp. Đây là điểm
quay lui duy nhất.

Ghi lại số dòng để đối chiếu sau:

```sql
SELECT 'issue' t, count(*) FROM "<workspace_schema>"."issue"
UNION ALL SELECT 'project', count(*) FROM "<workspace_schema>"."project"
UNION ALL SELECT 'merchant', count(*) FROM "<workspace_schema>"."merchant"
UNION ALL SELECT 'shift', count(*) FROM "<workspace_schema>"."shift";
-- ... mọi bảng bị ảnh hưởng
```

### Bước 1 — Tạo dòng application (vẫn trên server fork)

Application row phải tồn tại trước khi re-parent trỏ tới nó. `twenty apply` chưa chạy được ở giai
đoạn này vì object vẫn thuộc standard app và unique index sẽ chặn. Nên tạo bằng SQL, dùng đúng
`universalIdentifier` khai báo trong `src/application.config.ts` của từng app.

Script: `scripts/01-create-applications.sql` của từng app.

### Bước 2 — Re-parent metadata

Chuyển `applicationId` của mọi metadata row thuộc các object được chuyển. Các bảng core cần xử lý
(đã đối chiếu với danh sách bảng có cột `applicationId`):

```
objectMetadata, fieldMetadata, indexMetadata, searchFieldMetadata,
view, viewField, viewFieldGroup, viewFilter, viewFilterGroup, viewGroup, viewSort,
navigationMenuItem, pageLayout, pageLayoutTab, pageLayoutWidget,
objectPermission, fieldPermission
```

Lọc theo `universalIdentifier` của object, không theo tên — tên đổi được, universalIdentifier thì không.

Script: `scripts/02-reparent-metadata.sql` của từng app.

### Bước 2b — Tính lại universalIdentifier dẫn xuất

```bash
node packages/twenty-apps/internal/rewrite-derived-identifiers.mjs --dry-run
node packages/twenty-apps/internal/rewrite-derived-identifiers.mjs --apply
```

**Bỏ bước này thì `apply` chắc chắn hỏng.** universalIdentifier của field hệ thống
(`id`, `createdAt`, `updatedAt`, `deletedAt`, `position`, `createdBy`, `updatedBy`, `searchVector`)
và của relation hệ thống không phải hằng số — engine sinh chúng bằng

```ts
v5(`fieldMetadata:${objectUid}:${name}`, applicationUniversalIdentifier)
```

trong đó applicationUniversalIdentifier là **namespace** của UUIDv5 (`compute-deterministic-uuid.util.ts`).
Đổi chủ sở hữu object là đổi namespace, nên mọi UID dẫn xuất phải tính lại.

Kiểm chứng trên dữ liệu thật: `issue.createdAt` lưu `e2cec8e3-fb98-51f4-93fa-bad3de2540e2`, đúng
bằng dẫn xuất theo namespace twenty-standard; app Task Manager tính ra `193ea224-6a73-549d-a0b9-ce666fd4178c`.
Trong lần diễn tập có **106 field** lệch kiểu này.

Triệu chứng nếu bỏ qua: `apply` báo `INVALID_VIEW_DATA: Field metadata not found` và
`ENTITY_ALREADY_EXISTS: ... already exists in ... maps from application "20202020-…"`.

Script chỉ ghi đè dòng mà UID hiện tại khớp **đúng** giá trị dẫn xuất theo twenty-standard, nên
field có UID literal do người viết đặt thì không bị đụng.

### Bước 3 — Đổi tên bảng vật lý

```sql
ALTER TABLE "<workspace_schema>"."issue" RENAME TO "_issue";
-- ... mọi object được chuyển
```

Index và constraint đi theo bảng, không cần đổi tên (Postgres giữ nguyên tên index sau RENAME; tên
index không tham gia vào việc ORM dựng query).

Script: `scripts/03-rename-tables.sql` của từng app.

### Bước 3b — Gỡ liên kết chéo mồ côi

```bash
psql "$DATABASE_URL" -v schema=<workspace_schema> \
  -f packages/twenty-apps/internal/task-manager/scripts/04-preserve-cross-object-links.sql
```

Fork thêm nhánh morph trỏ vào object task-manager trên bốn object của upstream:
`attachment` (targetIssue, targetIssueComment, targetProject, targetMerchant), `noteTarget`
(targetMerchant), `taskTarget` (targetMerchant), `timelineActivity` (targetIssue, targetEpic,
targetMerchant). Chín field này thuộc twenty-standard nhưng upstream không khai báo chúng, và sau
re-parent thì đích của chúng đã thuộc app — metadata graph không còn hợp lệ.

Script trên chỉ **sao lưu** cặp id vào bảng `_cutover_link_*`. Sau đó phải xoá chính các field đó,
và phải gỡ tham chiếu phía nghịch trước vì `fieldMetadata` có khoá ngoại tự trỏ
(`relationTargetFieldMetadataId`, constraint `FK_47a6c57e1652b6475f8248cff78`):

```sql
BEGIN;
CREATE TEMP TABLE dangling AS
SELECT f.id FROM core."fieldMetadata" f
JOIN core.application a ON a.id = f."applicationId"
WHERE a.name = 'Standard'
  AND f.name ~ '^target(Issue|Project|Merchant|Epic|IssueComment)$';

UPDATE core."fieldMetadata" SET "relationTargetFieldMetadataId" = NULL
 WHERE "relationTargetFieldMetadataId" IN (SELECT id FROM dangling);

DELETE FROM core."fieldMetadata" WHERE id IN (SELECT id FROM dangling);
COMMIT;
```

**Bước này chặn cả những app không liên quan.** Trong lần diễn tập, bỏ qua nó làm
`shift-management` apply hỏng với `Field Metadata of type RELATION or MORPH_RELATION with id … has
no relation target object metadata`, dù shift không dính gì tới attachment hay timelineActivity.
Sync xác thực toàn bộ metadata graph của workspace, không chỉ phần của app đang apply.

### Bước 4 — Deploy server `apps/zero-core`

```bash
yarn install
npx nx build twenty-shared --skip-nx-cache
node dist/command/command.js upgrade
node dist/command/command.js cache:flush
```

`cache:flush` là bắt buộc: `CoreEntityCacheService` cache workspace entity đã serialize, migration
không tự invalidate, và bước re-parent vừa đổi metadata ngay dưới chân nó.

Kiểm tra `node dist/command/command.js upgrade:status` trước khi đi tiếp — mọi workspace phải
`Up to date`.

**Điểm kiểm tra quan trọng:** sau khi server lên, bảng `_issue`, `_shift`, `_merchant`... phải còn
nguyên và đủ số dòng đã ghi ở bước 0. Nếu thiếu, standard sync đã xoá — dừng lại và rollback, đừng
chạy tiếp.

### Bước 5 — Apply các app, đúng thứ tự

```bash
cd packages/twenty-apps/internal/task-manager
yarn install && yarn twenty plan --remote prod     # phải ra UPDATE/no-op, KHÔNG được có CREATE object
yarn twenty apply --remote prod

cd ../shift-management
yarn install && yarn twenty plan --remote prod
yarn twenty apply --remote prod

cd ../merchant-email-campaigns
yarn install && yarn twenty plan --remote prod
yarn twenty apply --remote prod
```

**Đọc kỹ output của `plan` trước mỗi `apply`.** Nếu plan hiện `will be created` cho một object đang
có dữ liệu, tức là re-parent sót — dừng lại. Apply lúc đó sẽ tạo bảng rỗng song song và bảng cũ
thành mồ côi.

Tuyệt đối không dùng `--force` ở bước này.

### Bước 6 — Khoá quyền truy cập trực tiếp

Kiến trúc zero-core dựa vào việc member **không** đọc/ghi thẳng object qua GraphQL — mọi truy cập đi
qua route của app. App không sửa được role có sẵn của workspace, nên phải làm tay:

Settings → Roles → role của member → gỡ `canReadObjectRecords` / `canUpdateObjectRecords` trên các
object của task-manager và shift.

Chưa làm bước này thì app-scope chưa có hiệu lực: member gọi thẳng API vẫn đọc được mọi dòng.

### Bước 7 — Đối chiếu

- So số dòng từng bảng với con số ghi ở bước 0.
- Mở UI từng app, kiểm tra vài bản ghi thật.
- `yarn twenty dev:function:logs --remote prod` xem có lỗi bị nuốt không.

## Rollback

Trước bước 4, rollback là hoàn tác bước 1–3 theo chiều ngược (đổi tên bảng về, re-parent về standard
application id, xoá dòng application), rồi deploy lại nhánh fork.

Từ bước 4 trở đi, rollback là khôi phục dump của bước 0 và deploy lại nhánh fork. Đó là lý do bước 0
phải dump toàn bộ database và phải kiểm tra khôi phục được trước khi đi tiếp.

## Quy ước bắt buộc của route app

Path trong `httpRouteTriggerSettings` **phải bắt đầu bằng `/`** và nên có namespace theo app
(`/task-manager/...`, `/shift/...`, `/email-campaigns/...`). Path trần như `board-data` đăng ký
được vào metadata nhưng router không khớp: gọi `/s/board-data` trả **404**, trong khi path đúng trả
500 khi thiếu auth. Triệu chứng phía người dùng là front component của app báo
`Request to http://localhost:3001/s/<path> failed with status 404 Not Found`.

## Điều chưa giữ được nguyên vẹn

Ghi ở đây để không ai bất ngờ sau golive. Chi tiết trong `DEPLOY.md` của từng app.

- **Kéo thả vẫn còn**, nhưng viết tay bằng HTML5 drag-and-drop thay vì `@hello-pangea/dnd`. Remote
  DOM forward đủ `dragstart`/`dragover`/`drop` cùng `clientX`/`clientY`, và `draggable` cross sang
  host DOM (có test assert ở `div-events.stories.tsx`, story `DragDrop`). Thư viện cũ không dùng
  được vì nó hit-test bằng `document.elementFromPoint`, mà sandbox không có `document`.
- **CSS chỉ có inline.** `style={{}}` dùng được mọi thuộc tính, nhưng không ship được stylesheet
  (SDK không export `remote-style`), nên `:hover`, media query và keyframes phải điều khiển bằng
  state qua event `mouseenter`/`mouseleave`/`focus`/`blur` — các event này đều được forward.
- **Editor rich text xuống cấp.** BlockNote không chạy trong sandbox; comment và worklog dùng editor
  đơn giản hơn.
- **Cấp `issueKey` không còn atomic bằng SQL.** App không có raw SQL và không có transaction; thay
  bằng unique index cộng vòng retry.
