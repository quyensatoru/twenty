# Migration: task-manager từ standard object sang app

Thứ tự tổng thể, lý do không dump-restore, và nền tảng kỹ thuật (danh tính object
là `(workspaceId, universalIdentifier)`, tên bảng phụ thuộc chủ sở hữu, sync lọc
theo chủ sở hữu) nằm ở **`packages/twenty-apps/internal/CUTOVER.md`**. Đọc file
đó trước. File này chỉ mô tả phần riêng của task-manager.

App này có nhiều dữ liệu production nhất trong ba app, và là app duy nhất sở hữu
object mà app khác đang gắn field vào. Đọc hết trước khi mở cửa sổ bảo trì.

## 1. Phạm vi

App sở hữu 11 object. Đổi tên bảng ở Bước 3:

| Object (`nameSingular`) | Bảng trước | Bảng sau | universalIdentifier |
| --- | --- | --- | --- |
| `app` | `app` | `_app` | `4d71d304-ea37-457c-9422-48812659d75e` |
| `appAccess` | `appAccess` | `_appAccess` | `467cc684-c385-4536-bd9a-dfdf80c2d60f` |
| `merchant` | `merchant` | `_merchant` | `5d9a58bd-983c-4ca4-9f0a-b53cdec4cfca` |
| `project` | `project` | `_project` | `bf773e17-d100-40b8-9e8d-ef476c1d2fb8` |
| `sprint` | `sprint` | `_sprint` | `6acc95fa-4a04-49f1-ac53-50efe1032cbf` |
| `epic` | `epic` | `_epic` | `4aef1443-d2b0-42a9-9ce9-f08891b93430` |
| `issueStatus` | `issueStatus` | `_issueStatus` | `3439277b-2995-4a5c-b497-1b75396533a4` |
| `issue` | `issue` | `_issue` | `e14a5928-2bbe-4e20-b766-ea8975ee819f` |
| `issueMerchant` | `issueMerchant` | `_issueMerchant` | `a469cd28-a0f7-4132-8f5d-d89fa044f516` |
| `issueComment` | `issueComment` | `_issueComment` | `860287e4-e447-4e1b-85e4-4952c02f57dd` |
| `worklog` | `worklog` | `_worklog` | `8e4d81e8-6ab8-42c4-9e61-16b98bab83fa` |

Không có app `bss-core`. `app`, `appAccess` và `merchant` thuộc về app này.

Ngoài ra còn 8 field trên standard object `workspaceMember` (`ledProjects`,
`assignedIssues`, `reportedIssues`, `assignedEpics`, `ownedSprints`,
`issueComments`, `worklogs`, `appAccesses`). `workspaceMember` **không** đổi chủ
và **không** đổi tên bảng — chỉ 8 dòng `fieldMetadata` đổi `applicationId`. Bỏ
sót là standard sync xoá chúng và kéo theo cả vế MANY_TO_ONE bên kia.

## 2. Ranh giới với merchant-email-campaigns

`merchant-email-campaigns` đang chạy production và **sở hữu field riêng trên
`merchant`**: `email`, `contactName`, `emailUnsubscribed`, `emailUnsubscribedAt`,
cùng các quan hệ `sends`, `events` trỏ vào `merchant` và `app`.

**Những field đó vẫn thuộc về nó. Không sao chép, không khai lại trong app này.**
`src/objects/merchant.object.ts` chỉ khai `name` và `customSettings`.

Điều này chạy được vì `applicationId` nằm trên từng dòng `fieldMetadata`, không
phải trên object: một object có thể mang field của nhiều application. Sau cutover
`merchant` thuộc Task Manager, còn 4 field kia vẫn thuộc Merchant Email
Campaigns, trên cùng bảng `_merchant`.

Hai hệ quả bắt buộc:

1. **`02-reparent-metadata.sql` chỉ đụng vào dòng đang thuộc standard
   application** (`WHERE fm."applicationId" = <standard>`). Bỏ điều kiện đó là
   kéo luôn field của merchant-email-campaigns sang Task Manager, và lần `apply`
   kế tiếp của app kia sẽ tạo lại chúng thành cột mới, bỏ lại cột cũ mồ côi —
   mất dữ liệu email và trạng thái unsubscribe.
2. **Thứ tự cài: task-manager trước, merchant-email-campaigns sau cùng**
   (CUTOVER.md Bước 5). App kia phải `apply` lại sau khi `merchant` đã đổi chủ và
   bảng đã đổi tên, để field của nó gắn vào đúng `_merchant`.

Câu SELECT cuối trong `02-reparent-metadata.sql` kiểm tra đúng ranh giới này:
sau khi chạy, các field của merchant-email-campaigns phải vẫn hiện ra với owner
là application của nó.

## 3. Các script

Chạy theo thứ tự, trên server **fork**, trước khi deploy `apps/zero-core`.

| Script | Phạm vi | Ghi chú |
| --- | --- | --- |
| `scripts/00-row-counts.sql` | mỗi workspace schema | Chỉ đọc. Tự nhận ra tên bảng ở cả hai phía cutover, nên chạy lại nguyên văn sau Bước 4 và Bước 7 để đối chiếu |
| `scripts/01-create-applications.sql` | toàn database | Idempotent. Tạo dòng `core.application` cho mọi workspace |
| `scripts/02-reparent-metadata.sql` | toàn database | Idempotent, một transaction. Dừng nếu thiếu dòng application |
| `scripts/03-rename-tables.sql` | mỗi workspace schema | Idempotent. `ALTER TABLE ... RENAME` |
| `scripts/04-preserve-cross-object-links.sql` | mỗi workspace schema | Chỉ đọc + tạo bảng sao lưu. Xem mục 5 |

Cả năm script đã được chạy thật trên một fixture dựng lại `core.objectMetadata`,
`core.fieldMetadata`, `core.indexMetadata`, `core.searchFieldMetadata`,
`core.application` cùng một schema workspace hai project — gồm cả trường hợp
hai workspace, trường hợp merchant-email-campaigns đã cài, và chạy lại lần hai
để kiểm tính idempotent. Vẫn phải diễn tập lại trên bản sao của production
trước khi đụng vào dữ liệu thật.

`00`, `03` và `04` nhận schema qua `-v schema=workspace_xxxxxxxx`. Tên schema là
`workspace_` + base36 của workspaceId (`getWorkspaceSchemaName`); lấy danh sách
bằng:

```sql
SELECT nspname FROM pg_namespace WHERE nspname LIKE 'workspace\_%';
```

## 4. Vì sao chỉ re-parent bốn bảng metadata

`CUTOVER.md` liệt kê mọi bảng core có cột `applicationId`. Với app này chỉ bốn
bảng cần đổi chủ:

| Bảng | Đổi chủ? | Lý do |
| --- | --- | --- |
| `objectMetadata` | **có** | Bước quyết định: object nằm ngoài tầm nhìn standard sync thì bảng vật lý không bị DROP |
| `fieldMetadata` | **có** | Bỏ sót là mất cột (và dữ liệu trong cột) |
| `indexMetadata` | **có** | Bỏ sót là mất index, gồm cả unique index trên `issue.issueKey` mà vòng retry cấp key dựa vào |
| `searchFieldMetadata` | **có** | Cột `searchVector` của `app`, `issue`, `merchant`, `appAccess` |
| `indexFieldMetadata` | không | Không có cột `applicationId`, đi theo `indexMetadata` qua `indexMetadataId` |
| `viewFilter`, `viewFilterGroup`, `viewSort`, `objectPermission`, `fieldPermission` | không | **Không có cột `applicationId`** trong repo hiện tại, dù `CUTOVER.md` có nhắc tên |
| `view`, `viewField`, `viewGroup`, `viewFieldGroup` | không | Xem mục 4.1 |
| `pageLayout`, `pageLayoutTab`, `pageLayoutWidget`, `navigationMenuItem` | không | Chỉ là trình bày; app ship lại bằng universalIdentifier mới. Bản standard cũ bị standard sync dọn |

### 4.1 View: cái gì mất, cái gì còn

- **View `INDEX` do engine sinh ra** cho `issue`, `project`, `sprint`… thuộc
  standard application → standard sync xoá ở Bước 4. Tuỳ biến người dùng lưu
  trên chúng (ẩn/hiện cột, sort, độ rộng) **mất**. App ship view thay thế tên
  "Issues", "Projects", "Sprints"… và engine cũng sinh lại view `INDEX` mới cho
  object đã thuộc app.
- **View Kanban per-project** mà post-hook `project.createOne` của fork tạo lúc
  runtime **vẫn còn nguyên**: `ViewService.createOne` gán chúng cho
  *workspace Custom application*, không phải standard, nên cả hai vòng sync đều
  không đụng tới. Chúng vẫn trỏ đúng field `status` và `project` vì id field
  không đổi khi re-parent. Điều mất đi là **đồng bộ ViewGroup**: tạo hoặc xoá
  `issueStatus` từ nay không thêm/bớt cột trên các view đó nữa (app không tạo
  view lúc runtime được). Dùng màn **Board** của app, đã có sẵn ô chọn project.
- **View người dùng tự tạo** cũng thuộc Custom application → còn nguyên.
- Nếu Bước 4 chết khi standard sync dọn view cũ, xoá tay các view standard trỏ
  vào 11 object rồi chạy lại — chúng không chứa dữ liệu bản ghi nào.

## 5. Cái KHÔNG giữ được: liên kết morph từ object upstream

Đây là mất mát duy nhất chạm tới dữ liệu. Đọc kỹ.

Fork thêm nhánh morph trỏ vào object task-manager trên bốn object của upstream:

| Object upstream | Nhánh fork thêm | Cột |
| --- | --- | --- |
| `attachment` | targetIssue, targetIssueComment, targetProject, targetMerchant | `targetIssueId`, `targetIssueCommentId`, `targetProjectId`, `targetMerchantId` |
| `noteTarget` | targetMerchant | `targetMerchantId` |
| `taskTarget` | targetMerchant | `targetMerchantId` |
| `timelineActivity` | targetIssue, targetEpic, targetMerchant | `targetIssueId`, `targetEpicId`, `targetMerchantId` |

Các field này thuộc standard application, không có trong manifest upstream →
**standard sync xoá ở Bước 4 và DROP các cột đó**. App không khai lại được: SDK
chưa cho app thêm nhánh vào một field MORPH của standard object, và nhánh cũ mang
`morphId` nên một field quan hệ thường không thể mượn danh tính của nó.

Hậu quả cụ thể:

- File đính kèm trên issue / project / merchant / comment: **dòng
  `attachment` vẫn còn, mất liên kết**. File trong storage không bị xoá.
- Note và Task gắn vào merchant: **mất liên kết**.
- Timeline activity của issue / epic / merchant: **mất liên kết**, nên tab
  Timeline của những bản ghi đó trống lại từ đầu.

`scripts/04-preserve-cross-object-links.sql` chép các cặp `(id nguồn, id đích)`
sang bảng `_cutover_link_<bảng>_<cột>` trong chính schema workspace trước khi
deploy. Standard sync không biết các bảng đó nên không đụng tới. Dữ liệu vì thế
**không mất, chỉ mất liên kết** — nối lại được khi SDK hỗ trợ morph cho app.

Chạy `04` **sau** `03` và **trước** khi deploy. Ghi lại số dòng nó in ra.

Nếu con số quá lớn để chấp nhận, dừng cutover và giải quyết trước; đừng chạy tiếp
rồi tính sau.

## 6. `issue.merchant` thành nhiều-nhiều

Entity của fork có `issue.merchantId` (một merchant cho một issue), nhưng
`STANDARD_OBJECT_FIELDS.issue` khai `merchants` trỏ qua object nối
`issueMerchant`. App giữ mô hình nối: `issueMerchant` với unique index
`(merchantId, issueId)`, universalIdentifier giữ nguyên của fork.

Nếu production **vẫn còn** cột `issue."merchantId"` có dữ liệu mà bảng
`issueMerchant` chưa có dòng tương ứng, chuyển dữ liệu trước khi deploy:

```sql
-- Chạy trước 03-rename-tables.sql, trên từng workspace schema.
INSERT INTO "<workspace_schema>"."issueMerchant" ("id", "issueId", "merchantId", "position")
SELECT gen_random_uuid(), i."id", i."merchantId", 0
FROM "<workspace_schema>"."issue" i
WHERE i."merchantId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "<workspace_schema>"."issueMerchant" im
    WHERE im."issueId" = i."id" AND im."merchantId" = i."merchantId"
  );
```

Kiểm tra trước bằng:

```sql
SELECT count(*) FROM "<workspace_schema>"."issue" WHERE "merchantId" IS NOT NULL;
```

Ra 0 thì bỏ qua — cột đó đã được dọn từ trước.

## 7. Bộ đếm `issueKey`

Route `create-issue` đọc `project."nextIssueNumber"`, cộng lên, rồi dựa vào
unique index trên `issue."issueKey"` để bắt va chạm, tối đa 5 lần retry
(`DEPLOY.md` mục 5.3). Nếu bộ đếm thấp hơn số lớn nhất đã phát ra, **mọi** issue
mới của project đó sẽ tiêu hết 5 lần retry rồi báo lỗi.

Câu truy vấn cuối trong `00-row-counts.sql` liệt kê đúng những project bị lệch.
Ra rỗng là xong. Ra dòng nào thì sửa trước khi deploy:

```sql
UPDATE "<workspace_schema>"."project" p
SET "nextIssueNumber" = sub.max_used
FROM (
  SELECT i."projectId" AS project_id,
         max(substring(i."issueKey" from '[0-9]+$')::bigint) AS max_used
  FROM "<workspace_schema>"."issue" i
  JOIN "<workspace_schema>"."project" pr ON pr."id" = i."projectId"
  WHERE pr."key" IS NOT NULL
    AND left(i."issueKey", length(pr."key") + 1) = pr."key" || '-'
    AND substring(i."issueKey" from '[0-9]+$') IS NOT NULL
  GROUP BY i."projectId"
) sub
WHERE p."id" = sub.project_id
  AND coalesce(p."nextIssueNumber", 0) < sub.max_used;
```

Chạy trước `03-rename-tables.sql` (lúc bảng còn tên `project`).

## 8. Danh sách đối chiếu sau deploy

Ngoài phần chung ở `CUTOVER.md` Bước 7:

1. `00-row-counts.sql` chạy lại **nguyên văn**, không sửa gì: nó tự nhận ra bảng
   đang mang tên `issue` hay `_issue`. Số dòng phải trùng tuyệt đối với Bước 0.
   Cột `row_count` ra NULL nghĩa là không tìm thấy bảng nào — dừng lại ngay.
2. Mọi bất biến trong `00-row-counts.sql` vẫn ra 0.
3. `yarn twenty plan --remote prod` trong `packages/twenty-apps/internal/task-manager`
   **không được có `will be created` cho bất kỳ object nào**. Có là re-parent
   sót — dừng lại, đừng `apply`.
4. Các bảng `_cutover_link_*` còn nguyên với đúng số dòng đã ghi ở Bước 3b.
5. Trong UI: mở một merchant bất kỳ, các field `Email`, `Contact name`,
   `Email unsubscribed` của merchant-email-campaigns **vẫn còn và còn giá trị**.
   Mất là ranh giới ở mục 2 đã hỏng — rollback.
6. Mở một issue cũ: có `issueKey`, có comment, có worklog, `Time spent` khớp
   tổng worklog.
7. Tạo issue mới trong project cũ nhất → key tiếp nối đúng, không nhảy số bất
   thường (mục 7).
8. Làm bước khoá quyền ở `DEPLOY.md` mục 4.1, rồi đăng nhập bằng một member
   không có `appAccess` và gọi thẳng GraphQL `issues`: phải rỗng.

## 9. Rollback

Trước Bước 4, hoàn tác theo chiều ngược:

```sql
-- 3' đổi tên bảng về
ALTER TABLE "<workspace_schema>"."_issue" RENAME TO "issue";   -- và 10 bảng còn lại

-- 2' trả applicationId về standard application
UPDATE core."objectMetadata" om
SET "applicationId" = s."id"
FROM core."application" t, core."application" s
WHERE t."universalIdentifier" = '819550d5-882b-4b96-8afd-b02e0d2b41c1'
  AND s."universalIdentifier" = '20202020-64aa-4b6f-b003-9c74b97cee20'
  AND s."workspaceId" = t."workspaceId"
  AND om."applicationId" = t."id";
-- lặp lại cho fieldMetadata, indexMetadata, searchFieldMetadata

-- 1' xoá dòng application
DELETE FROM core."application"
WHERE "universalIdentifier" = '819550d5-882b-4b96-8afd-b02e0d2b41c1';
```

Rồi deploy lại nhánh fork. Bảng `_cutover_link_*` để lại cũng vô hại.

Từ Bước 4 trở đi, rollback là khôi phục dump của Bước 0. Đó là lý do Bước 0 phải
dump toàn bộ database và phải kiểm tra khôi phục được **trước khi** đi tiếp.
