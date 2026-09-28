# Migration: shift từ standard object sang app

Tài liệu này chỉ nói phần riêng của Shift Management. **Thứ tự tổng thể, lý do không dùng
dump/restore, và quy trình 7 bước nằm ở `../CUTOVER.md`** — đọc file đó trước, file này không lặp
lại.

Shift độc lập với hai app còn lại (không chia sẻ object nào với `task-manager` hay
`merchant-email-campaigns`), nên cài lúc nào trong cửa sổ bảo trì cũng được.

## Cái gì được chuyển

| Loại | Chi tiết |
| --- | --- |
| Object | `shift`, `shiftTemplate`, `specialDay` |
| Bảng vật lý | `shift` → `_shift`, `shiftTemplate` → `_shiftTemplate`, `specialDay` → `_specialDay` |
| Field | Toàn bộ field của ba object (gồm cả field hệ thống: `id`, `createdAt`, `position`, `searchVector`…) **cộng** field `shifts` app này thêm lên standard object `workspaceMember` |
| Index | 6 index: `shift.date`, `shift.memberId`, `shift.shiftTemplateId`, `shiftTemplate.code`, `shiftTemplate.isActive`, `specialDay.(kind, isActive)` |
| View | 3 INDEX view: `All Shifts`, `All Shift Templates`, `All Special Days`, cùng view field của chúng |

Standard object duy nhất app này đụng vào là `workspaceMember`, và chỉ thêm một field quan hệ.

## Vì sao universalIdentifier trong `src/constants/universal-identifiers.ts` là giá trị của fork

Danh tính metadata là `(workspaceId, universalIdentifier)`; `applicationId` không nằm trong khoá.
Vì thế mọi identifier của object / field / index / view / view field trong file đó **không phải giá
trị mới** — chúng là đúng giá trị bản fork đã ship khi ba object còn là standard
(`standard-object.constant.ts`, `standard-object-fields.constant.ts` trên nhánh
`task-manager-sae-backup`), và identifier của view được tính lại từ đúng scheme tất định của fork
(`getSystemViewUniversalIdentifier` / `getSystemViewFieldUniversalIdentifier` seed bằng
universalIdentifier của twenty-standard application) rồi đóng băng lại trong file.

Nhờ vậy `twenty apply` ở bước 5 thấy metadata đã tồn tại và thuộc về mình → sinh UPDATE/no-op.
**Đổi bất kỳ giá trị nào trong nhóm đó sẽ biến cutover thành rebuild:** apply tạo object mới, bảng
mới rỗng, và `_shift` cũ thành bảng mồ côi.

Ba nhóm identifier trong file đó **là giá trị mới** và không tham gia re-parent:

- `SHIFT_*_INDEX_FIELD_UID` — `core."indexFieldMetadata"` không có cột `universalIdentifier` lẫn
  `applicationId`; đây chỉ là id ở tầng SDK.
- Nav item, page layout, page layout tab, page layout widget, front component — bản fork không có
  dòng nào trong DB cho những thứ này (4 trang shift là React route hardcode). `apply` tạo mới.
- Logic function và role của app — hoàn toàn mới.

## Script

Chạy theo đúng thứ tự, khớp với bước 0 → 3 của `CUTOVER.md`:

```bash
export DATABASE_URL=...
SCHEMA=workspace_xxxxxxxx      # schema của workspace
WORKSPACE_ID=...               # uuid của workspace

psql "$DATABASE_URL" -v schema="$SCHEMA" -f scripts/00-row-counts.sql | tee before.txt
psql "$DATABASE_URL" -v workspace_id="$WORKSPACE_ID" -f scripts/01-create-applications.sql
psql "$DATABASE_URL" -v workspace_id="$WORKSPACE_ID" --single-transaction \
     -f scripts/02-reparent-metadata.sql
psql "$DATABASE_URL" -v schema="$SCHEMA" --single-transaction -f scripts/03-rename-tables.sql
```

`02` và `03` chạy trong một transaction: re-parent nửa chừng để lại object thuộc app nhưng field
vẫn thuộc standard, và standard sync ở bước 4 sẽ xoá đúng những field còn sót đó.

Nhiều workspace thì lặp `01`–`03` cho từng workspace (mỗi workspace có dòng `application` riêng —
unique index là `("universalIdentifier", "workspaceId")`).

`00` chạy lại sau bước 4 và sau bước 5, đối chiếu với `before.txt`. Ba lần phải ra cùng số dòng.

## Điểm riêng của shift cần để ý

**`navigationMenuItem` cố ý không re-parent.** Mục sidebar của bản fork thuộc twenty-standard
application và không còn trong manifest của nó, nên standard sync ở bước 4 sẽ xoá. Đó là kết quả
mong muốn: app khai báo bộ nav item riêng và `apply` tạo lại. Xoá nav item không đụng tới `view` nó
trỏ vào — khoá ngoại đi một chiều.

**Sidebar trống giữa bước 4 và bước 5.** Sau khi deploy server mới nhưng trước khi `apply`, mục
Shifts biến mất khỏi sidebar. Dữ liệu vẫn nguyên trong `_shift`; đừng hoảng và đừng rollback vì
triệu chứng này. Kiểm tra bằng `00-row-counts.sql` (phần "sau khi đổi tên bảng").

**Bước 6 của `CUTOVER.md` là bắt buộc với shift, không phải tuỳ chọn.** Xem `DEPLOY.md` mục 4.1:
bản fork chặn IDOR bằng query hook `shift.findMany` / `shift.findOne`; app không cài được query
hook nên việc đó chuyển vào route, và route chỉ là đường duy nhất khi member **không còn** quyền
đọc/ghi thẳng ba object.

## Điều không giữ được nguyên vẹn

Ghi ở đây để không ai bất ngờ sau golive.

1. **Đăng ký ca không còn nguyên tử giữa các request.** App không có transaction và không có raw
   SQL. Bản fork kiểm tra trùng và kiểm tra slot `HOLIDAY_OT` độc quyền bên trong pre-query hook,
   cùng transaction với INSERT. Route `/shift/register` phải đọc rồi mới ghi, nên hai người bấm
   cùng lúc vào một slot OT có thể cùng lọt. Trong một request các template được xử lý tuần tự (chứ
   không `Promise.all`) nên tự-trùng trong một lần bấm vẫn bị chặn. Rủi ro còn lại hẹp: một khung
   vài trăm mili-giây, ảnh hưởng đúng slot OT, và Leader phát hiện ngay trên lịch đăng ký vì cả hai
   tên cùng hiện trên một ô. Chấp nhận thay vì dựng khoá phân tán.

2. **Quyền Leader/PO khai báo bằng biến thay vì đọc cờ role.** Bản fork gọi `shouldBypassAppScope`
   để đọc `canUpdateAllObjectRecords`. App không đọc được cờ role, nên dùng biến
   `SHIFT_LEADER_EMAILS` cộng permission flag `WORKSPACE_MEMBERS` (workspace admin). **Sau cutover
   phải điền biến này**, nếu không mọi Leader/PO tụt xuống quyền member thường và trang Report mất
   bộ chọn Member. Xem `DEPLOY.md` mục 3.

3. **`shift.updateMany` không còn được chặn ở tầng resolver, mà biến mất.** Bản fork có hook chặn
   bulk update của member. App không có route bulk nào, nên đường đó không tồn tại — chặt hơn bản
   cũ, nhưng cũng nghĩa là Leader muốn sửa hàng loạt phải dùng record index của host (chỉ Leader/PO
   có quyền sau bước 6).

4. **Không còn `upsert` để phải từ chối.** Bản fork phải chặn `upsert` vì nó là đường ghi đè ca của
   người khác. Route `/shift/register` không nhận id từ client, nên create luôn là INSERT thuần.

5. **Post-hook recompute chạy trong route, không chạy trên mọi `shift.updateOne`.** Bản fork
   recompute sau mọi update, kể cả update từ record index của host. App chỉ recompute bên trong
   `/shift/update`. Leader sửa `checkInAt` trực tiếp trên grid `All Shifts` sẽ **không** kích hoạt
   recompute; sửa qua trang shift thì có. Nếu số liệu lệch, chạy lại `/shift/update` với cùng giá
   trị là đủ — `getAttendanceRecomputePatch` idempotent.

6. **Query hook đọc (`findMany` / `findOne`) không có bản thay thế ở tầng GraphQL.** Thay thế duy
   nhất là bước 6 của `CUTOVER.md`. Đây là lý do bước đó không được bỏ qua.

## Rollback

Trước bước 4, đảo ngược đúng ba script:

```sql
ALTER TABLE "<schema>"."_shift" RENAME TO "shift";
ALTER TABLE "<schema>"."_shiftTemplate" RENAME TO "shiftTemplate";
ALTER TABLE "<schema>"."_specialDay" RENAME TO "specialDay";

-- applicationId về twenty-standard application của workspace
UPDATE core."objectMetadata" SET "applicationId" = '<twenty_standard_application_id>' WHERE ...;
-- ... lặp cho 7 bảng còn lại trong 02-reparent-metadata.sql

DELETE FROM core."application"
WHERE "universalIdentifier" = 'f933e505-1fbd-425d-8906-5a9d2e3c73a8';
```

rồi deploy lại nhánh fork.

**Thứ tự trong khối trên là bắt buộc.** `SyncableEntity.application` khai báo
`onDelete: 'CASCADE'`, nên xoá dòng `application` khi metadata vẫn còn trỏ vào nó sẽ **xoá luôn
toàn bộ objectMetadata / fieldMetadata / view của shift**, và mất metadata thì bảng `_shift` thành
mồ côi. Re-parent về standard trước, xoá application sau cùng.

Từ bước 4 trở đi, rollback là khôi phục dump của bước 0 — xem `CUTOVER.md`.
