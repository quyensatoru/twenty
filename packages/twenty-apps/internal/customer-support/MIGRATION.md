# Migration: đưa `merchant` về app Customer Support

App này nhận quyền sở hữu object `merchant`, vốn đang thuộc `task-manager`. Không có dòng dữ
liệu nào di chuyển: đổi chủ sở hữu là `UPDATE` trên metadata, giống hệt nguyên tắc ở
`../CUTOVER.md`.

Đọc `../CUTOVER.md` trước. File này chỉ mô tả phần khác biệt của lần dời này.

## Phạm vi: dời tối thiểu

Nguyên tắc: **app nào cần field gì trên `merchant` thì app đó tự sở hữu field ấy.** Đây đúng là
cách `merchant-email-campaigns` đang làm và nó đã chạy production, nên không cần phát minh gì mới.

Dời sang Customer Support:

| Thực thể | universalIdentifier |
|---|---|
| object `merchant` | `5d9a58bd-983c-4ca4-9f0a-b53cdec4cfca` |
| field `name` | `a9bc9790-aece-4df3-b22a-6bdf26f079a1` |
| field `customSettings` | `0ff00e57-a471-4cb7-baa5-f9f7b4a49418` |
| view `Merchants` | `7e113b9b-b798-4f1a-99d5-926869ae1e28` |
| navigation item `Merchants` | `7f0e425f-99ba-4782-ac92-23252d22cfdd` |
| 8 field hệ thống dẫn xuất | xem §"UID dẫn xuất" |

**Ở lại `task-manager`** (field của nó trên object của app khác):
`app` (`050c5e37-…`), `issues` (`bbdb64fd-…`), index `IDX_7cf4c06f06867b6d3fe0d713091`
(`dfae531a-…`, index trên `merchant.appId` mà chính task-manager sở hữu field), object
`issueMerchant` và toàn bộ junction, logic function `search-merchants`.

**Tuyệt đối không đụng** — 6 field của `merchant-email-campaigns`, app đang chạy production:

| field | universalIdentifier |
|---|---|
| `contactName` | `d43b3e9b-4b1f-432e-92b1-5e97269da88c` |
| `email` | `b6c7bf1f-f1c0-40a2-916d-2563550f9389` |
| `emailSends` | `d9703e2b-4ae3-487e-a690-0dd35d4c493a` |
| `emailUnsubscribed` | `99d4c986-e607-4bbd-9e70-f4ee755bba2c` |
| `emailUnsubscribedAt` | `9fa5342b-095f-47d1-a622-7b878909ff48` |
| `merchantEvents` | `003d5eb9-b311-45ee-9709-cd49556495bc` |

Mọi câu `UPDATE` re-parent **bắt buộc** có `WHERE "applicationId" = <Task Manager>`. Thiếu mệnh đề
đó là kéo nhầm 6 dòng trên và mất dữ liệu email + trạng thái unsubscribe.

## Tên bảng KHÔNG đổi

`computeObjectTargetTable` (`packages/twenty-server/src/engine/utils/compute-object-target-table.util.ts`)
tính `isCustom = applicationUniversalIdentifier !== TWENTY_STANDARD_APPLICATION.universalIdentifier`.
Task Manager và Customer Support đều không phải Standard, nên `_merchant` vẫn là `_merchant`.
**Không có bước `ALTER TABLE ... RENAME`** — khác với lần cutover đầu.

## UID dẫn xuất

Engine dẫn xuất UID bằng `v5(\`${entityNamespace}:${value}\`, applicationUniversalIdentifier)`
(`packages/twenty-shared/src/application/deterministic-identifier/compute-deterministic-uuid.util.ts`),
với application UID làm **namespace**. Đổi chủ object là đổi namespace, nên mọi UID dẫn xuất của
`merchant` phải tính lại.

8 field hệ thống cần viết lại, công thức
`v5('fieldMetadata:' + objectUid + ':' + name, applicationUid)` — **đã kiểm chứng bằng số** khớp
đúng giá trị đang có trong DB:

| field | UID hiện tại (namespace Task Manager) |
|---|---|
| `id` | `dc8665e7-4177-5b67-bd3a-a34692c8ba89` |
| `createdAt` | `a28d0e78-cb7a-5358-bc2b-c6c88729a633` |
| `updatedAt` | `2266ea76-52e9-5b86-96da-6e89d073683e` |
| `deletedAt` | `ea602f33-88c2-5f6e-9e9d-9ddbb5a73d98` |
| `position` | `0939c025-5196-5cdf-bbf8-ff806538520d` |
| `createdBy` | `8fc3fcb6-04c6-5af8-8829-1e1849a9ff4f` |
| `updatedBy` | `f33eee6f-e636-5060-9a93-27549471707b` |
| `searchVector` | `1e2ffa49-ffd6-5140-9836-63cc802bcef9` |

`../rewrite-derived-identifiers.mjs` **không dùng lại được nguyên trạng**: nó chỉ viết lại dòng có
UID khớp dẫn xuất theo **Standard**, còn lần này nguồn là namespace **Task Manager**. Cần một biến
thể nhận cặp (namespace cũ, namespace mới).

Giữ nguyên tính chất tự bảo vệ của script gốc: **chỉ ghi đè dòng mà UID hiện tại khớp đúng giá trị
dẫn xuất theo namespace cũ.** Dòng có UID literal do người viết đặt thì không đụng tới.

### View và navigation: KHÔNG re-parent

`../task-manager/scripts/02-reparent-metadata.sql` đã chốt nguyên tắc này và lần này theo y nguyên:
chỉ bốn bảng quyết định bảng vật lý — `objectMetadata`, `fieldMetadata`, `indexMetadata`,
`searchFieldMetadata` — được đổi chủ. `view`, `viewField`, `navigationMenuItem` là phần trình bày,
app khai lại chúng bằng chính universalIdentifier cũ. `indexFieldMetadata` không có cột
`applicationId`, nó đi theo `indexMetadata`.

### Index BẮT BUỘC đi cùng object — đã gặp thật

Thử để index `merchant.appId` ở lại task-manager sau khi gỡ object khỏi manifest, `twenty plan` từ
chối ngay:

```
Sync failed with error: Index "dfae531a-75a7-4810-babc-b75d3f6c6b4f" references unknown object 5d9a58bd-…
```

Field thì không có ràng buộc này — `merchant-email-campaigns` sở hữu 6 field trên `merchant` mà
không khai object, và chạy production bình thường. Vì vậy index cùng cả hai vế quan hệ
`merchant ↔ app` chuyển sang app này, còn `issues` ở lại task-manager.

### Còn một dòng chưa giải quyết

`03-rewrite-derived-identifiers.mjs` viết lại đủ 8 field hệ thống, nhưng báo:

```
CẢNH BÁO: 1 dòng searchFieldMetadata không khớp công thức dẫn xuất nào và bị bỏ qua.
```

Dòng đó là `14162f45-2d08-571f-b4e1-81c222d625a5`. Không tái tạo được nó bằng
`getSearchFieldUniversalIdentifier` với namespace Task Manager lẫn Standard — nhiều khả năng sinh ra
trước khi object mang UID hiện tại. Script cố tình **không đoán**. Phải xem `twenty plan` sau khi
re-parent có chấp nhận nó không; nếu plan đòi tạo mới searchFieldMetadata thì dừng, đừng `--force`.

## Thứ tự chạy — đã diễn tập trọn vẹn trên DB dev 2026-09-29

`cache:flush` sau MỖI đợt sửa SQL là bắt buộc, không phải tuỳ chọn. Bỏ nó thì `twenty plan` của
task-manager vẫn báo `objectMetadata "merchant" — drops the table and all its rows` dù re-parent đã
xong: `CoreEntityCacheService` cache workspace entity đã serialize nên server còn đọc chủ sở hữu cũ.
Đây là lỗi đã gặp thật trong lúc diễn tập.

```
node scripts/run-sql.mjs scripts/01-create-application.sql
node scripts/run-sql.mjs scripts/02-reparent-merchant.sql        # đọc bảng đối chiếu
node scripts/03-rewrite-derived-identifiers.mjs --dry-run
node scripts/03-rewrite-derived-identifiers.mjs --apply
node scripts/run-sql.mjs scripts/04-reparent-merchant-presentation.sql

cd ../../../twenty-server && node dist/command/command.js cache:flush
```

Cổng kiểm tra — `twenty plan` trong task-manager phải ra **0 to destroy**. Còn thấy "drops the
table" là re-parent chưa ăn hoặc chưa flush cache; dừng lại, đừng `--force`.

```
cd ../twenty-apps/internal/task-manager       && npx twenty plan   # 0 to destroy
npx twenty apply
cd ../customer-support                        && npx twenty apply
cd ../merchant-email-campaigns                && npx twenty apply
```

### Vì sao task-manager apply TRƯỚC customer-support

Ngược với trực giác. `merchant` đã thuộc customer-support từ bước 02 nên không app nào tạo lại nó;
thứ quyết định là view/nav dùng chung UID. Bước 04 đã đưa chúng sang customer-support nên cả hai
chiều đều là UPDATE và thứ tự thực ra không còn quan trọng — nhưng nếu bỏ bước 04 thì task-manager
sinh 4 lệnh destroy (view `Merchants`, 2 viewField, nav item) và bắt buộc phải chạy trước
customer-support, kèm `apply --force`. Bước 04 tồn tại để khỏi phải làm vậy.

### Kết quả diễn tập

| Kiểm tra | Trước | Sau |
|---|---|---|
| dòng `_merchant` | 3 | 3 |
| dòng `_issue` / `_issueMerchant` / `_app` | 4 / 2 / 2 | 4 / 2 / 2 |
| chủ object `merchant` | Task Manager | Customer Support |
| field: Customer Support / MEC / Task Manager | 0 / 6 / 12 | 11 / 6 / 1 |
| tên bảng vật lý | `_merchant` | `_merchant` (không đổi) |

`plan` cuối: task-manager `1 add, 31 change, 0 destroy`; customer-support `3 add, 1 change,
0 destroy`; merchant-email-campaigns `2 add, 14 change, 0 destroy`.

Dữ liệu của MEC trên cả 3 merchant còn nguyên, gồm cả `emailUnsubscribed = true` của
shop-beta. Log server sau khi apply không có lỗi metadata nào.

### Còn nợ

`03-rewrite-derived-identifiers.mjs` vẫn báo bỏ qua 1 dòng `searchFieldMetadata`
(`14162f45-2d08-571f-b4e1-81c222d625a5`) vì không khớp công thức dẫn xuất nào. Diễn tập cho thấy
`apply` **không** vướng nó, nhưng nó vẫn đang mang UID thuộc namespace không xác định. Chưa gây hại,
cần theo dõi ở lần đổi chủ tiếp theo.
