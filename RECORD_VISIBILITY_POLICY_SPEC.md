# Record Visibility Policy — Spec & Implementation Plan

> Cơ chế phân quyền theo **hàng dữ liệu** (row-level), phiên bản license-clean, độc lập với tính năng Row-Level Security Enterprise sẵn có của Twenty. Branch `task-manager-sae`.
> Đọc kèm [ARCHITECTURE.md](ARCHITECTURE.md) §6 (metadata engine), §7.B (playbook thêm object/field); và phần app-scope permission đã build trong session trước (chưa có file spec riêng — tóm tắt lại ở mục 8 dưới).

## 0. Bối cảnh

Twenty CRM đã có sẵn **Row-Level Security (RLS)** — cho phép admin gắn điều kiện lọc theo từng field vào 1 cặp (Role, Object), ví dụ "chỉ thấy Company có Industry = Tech". Đây là cơ chế **duy nhất** trong Twenty để lọc theo *hàng* (row), phân biệt với phân quyền Object-level (CRUD trên cả object) và Field-level (đọc/ghi từng field) vốn không lọc theo hàng. Nhưng RLS bị khóa sau **Enterprise license** (JWT validity token) + **billing entitlement `RLS`** — không dùng được nếu không mua Enterprise.

Yêu cầu: xây một tính năng **tương đương về mặt kỹ thuật** (không phải fork/gỡ khóa), độc lập hoàn toàn, không đụng/không import bất kỳ file nào đánh dấu `/* @license Enterprise */`, không bypass license check của Twenty — mà viết code riêng, song song, dùng lại đúng các thành phần lõi (core, không Enterprise) mà bản thân RLS cũng đang dùng.

**Phát hiện quan trọng cần chốt trước khi code** (đã research kỹ, xem mục 2): câu hỏi gốc *"member A có quyền `read` trên App B thì có thấy issue trong App B không"* **đã được app-scope permission giải quyết rồi** (session trước, xem mục 8) — đó là bài toán "lọc theo app-scope, xuyên qua chuỗi quan hệ App→Project→Issue". Còn câu hỏi *"member A chỉ thấy CHÍNH bản ghi App mà họ được cấp — ẩn tên App khác"* là bài toán **khác về bản chất**: đây là "lọc App tự thân theo 1 bảng junction động (`appAccess`)" — RLS (và bản OSS tương đương) **không giải quyết được kiểu bài toán này bằng rule khai báo tĩnh**, vì RLS chỉ so field với giá trị tĩnh hoặc với field của workspace member hiện tại, không so với 1 tập giá trị tra cứu động từ bảng khác. Xem mục 3 để hiểu rõ ranh giới, và mục 8 cho fix riêng của phần App catalog.

Vì vậy plan này có **2 phần độc lập**, làm phần nào trước cũng được:
- **Phần A** (nhanh, ~1 buổi code): mở rộng app-scope để tự lọc luôn bảng `app` (ẩn App chưa được cấp quyền khỏi danh sách). Xem mục 8.
- **Phần B** (đầu tư lớn hơn, tái sử dụng cho mọi object trong tương lai): xây **Record Visibility Policy** — bản OSS tương đương RLS, khai báo qua UI (Role → Object → field/operand/value), áp dụng được cho **bất kỳ object nào**, không riêng App. Xem mục 4-7, 9-11.

---

## 1. Twenty RLS (Enterprise) — bản đồ đầy đủ để tham chiếu, KHÔNG được đụng vào các file này

### 1.1. Data model

`packages/twenty-server/src/engine/metadata-modules/row-level-permission-predicate/entities/row-level-permission-predicate.entity.ts` (`/* @license Enterprise */`), bảng `core.rowLevelPermissionPredicate`:

| Cột | Ý nghĩa |
|---|---|
| `fieldMetadataId` | field bị lọc — **bắt buộc cùng object** với `objectMetadataId`, không có cột "field của object khác" |
| `objectMetadataId` | object áp dụng |
| `operand` | `RowLevelPermissionPredicateOperand` — dùng lại đúng vocab của `ViewFilterOperand` (IS, IS_NOT, CONTAINS, DOES_NOT_CONTAIN, LESS_THAN_OR_EQUAL, GREATER_THAN_OR_EQUAL, IS_BEFORE, IS_AFTER, IS_EMPTY, IS_NOT_EMPTY, IS_RELATIVE, IS_IN_PAST, IS_IN_FUTURE, IS_TODAY, VECTOR_SEARCH, IS_NOT_NULL) |
| `value` (jsonb) | giá trị tĩnh so sánh — `string \| string[] \| boolean \| number \| RelationPredicateValue \| Record<string,unknown> \| null` |
| `subFieldName` | cho composite field (vd `FULL_NAME.firstName`) |
| `workspaceMemberFieldMetadataId` + `workspaceMemberSubFieldName` | **giá trị động**: so với field của **chính workspace member đang đăng nhập** thay vì giá trị tĩnh (vd "assignee == current member") |
| `rowLevelPermissionPredicateGroupId` + `positionInRowLevelPermissionPredicateGroup` | thuộc nhóm nào, vị trí trong nhóm |
| `roleId` | Role áp dụng |

`row-level-permission-predicate-group.entity.ts` — nhóm predicate: `logicalOperator` (AND/OR), `parentRowLevelPermissionPredicateGroupId` (cây nhóm lồng nhau tuỳ ý), `roleId` + `objectMetadataId`. Predicate không có group → mặc định AND ở cấp cao nhất.

**GraphQL**: không có resolver riêng — 1 mutation `upsertRowLevelPermissionPredicates(input: { roleId, objectMetadataId, predicates[], predicateGroups[] })` gắn vào `role.resolver.ts` (file này KHÔNG Enterprise), diff toàn bộ predicate+group của 1 cặp (role,object) trong 1 lần gọi, chạy qua `WorkspaceMigrationValidateBuildAndRunService` (tức là thay đổi RLS = 1 workspace migration).

### 1.2. Enforce (kỹ thuật — được phép học/mirror, KHÔNG được import)

- `build-row-level-permission-record-filter.util.ts` (Enterprise): đọc predicate/group của (role, object) → build `RecordGqlOperationFilter` (cây and/or/not) — nếu có `workspaceMemberFieldMetadataId`, lấy giá trị thật từ `authContext.workspaceMember` tại request-time thay vì `value` tĩnh.
- `apply-row-level-permission-predicates.util.ts` (Enterprise): đi cây filter đó bằng `Brackets`/`NotBrackets`, gọi `GraphqlQueryFilterFieldParser.parse()` (file này **KHÔNG** Enterprise — `packages/twenty-server/src/engine/api/graphql/graphql-query-runner/graphql-query-parsers/graphql-query-filter/graphql-query-filter-field.parser.ts`, dùng chung với filter GraphQL bình thường và View filter) để build WHERE thật.
- Áp dụng ở **cả 5 query builder**: SELECT/UPDATE/DELETE/SOFT-DELETE (WHERE injection qua `applyRowLevelPermissionPredicates()`), INSERT (kiểm tra in-memory qua `validateRLSPredicatesForInsert()` — record mới phải khớp predicate, không thì throw), UPDATE còn thêm `validateRLSPredicatesForUpdate()` (chặn việc sửa field để "lách" khỏi rule).
- **Chỉ lọc theo field của CHÍNH object đó** — đã verify: dù field được chọn là 1 relation field (vd `issue.project`), giá trị so sánh chỉ có thể là ID cụ thể hoặc "bản ghi liên quan tới member hiện tại" (`RelationPredicateValue`), **không thể** viết rule kiểu "project.status = Active" (lọc theo thuộc tính của object liên quan). Frontend cũng chỉ cho chọn field kiểu `BOOLEAN/NUMBER/DATE_TIME/DATE/SELECT/MULTI_SELECT/TEXT/LINKS/PHONES/EMAILS/FULL_NAME/ADDRESS` — không có RELATION.
- **Ranh giới license — chỉ chặn ở tầng CRUD + UI, KHÔNG chặn ở tầng enforce**: `hasRowLevelPermissionFeature()` (trong 2 service, Enterprise) = `enterprisePlanService.isValid()` (JWT) AND `billingService.hasEntitlement(workspaceId, BillingEntitlementKey.RLS)`. Các file enforce (`apply-row-level-permission-predicates.util.ts`, `build-...`, `validate-rls-predicates-for-records.util.ts`) **không hề check license** — chỉ chạy trên dữ liệu gì có sẵn trong `flatRowLevelPermissionPredicateMaps`. (Ghi chú kỹ thuật, không phải hướng dẫn lách license — ta build feature riêng, không đụng bảng/entity Enterprise nên không có dữ liệu để "chạy nhờ" theo cách này.)

### 1.3. Frontend

- Settings → Roles → chọn Role → chọn Object → 3 mục xếp chồng: Object-Level (không Enterprise), Field-Level (không Enterprise), **Record-Level** (Enterprise — frontend gọi RLS là "Record-Level", khác tên với backend gọi "Row-Level").
- Gate: `workspaceBillingEntitlements` có entry `RLS = true` không → không thì hiện Card "Upgrade to access — Enterprise Plan".
- Quan trọng: **UI builder filter dùng lại đúng component chung của View filter** (`RecordFilterGroupsComponentInstanceContext`, `RecordFiltersComponentInstanceContext` — **không Enterprise**), chỉ có phần wrapper/hook nối nó với RLS là Enterprise. Nghĩa là UI xây dựng cây filter (chọn field, operand, value, and/or, nhóm lồng nhau) **có thể tái dùng nguyên khối** cho tính năng mới, không cần viết lại UI filter builder từ đầu.

### 1.4. Danh sách tên KHÔNG được trùng (backend lẫn frontend dùng 2 tên khác nhau cho cùng khái niệm)

- Backend gọi "**Row-Level**": `RowLevelPermissionPredicate(Group)Entity/Service/DTO/Input/Exception`, bảng `rowLevelPermissionPredicate(Group)`, cache key `flat-maps:row-level-permission-predicate(-group)`, `BillingEntitlementKey.RLS`.
- Frontend gọi "**Record-Level**": mọi thứ dưới `packages/twenty-front/.../record-level-permissions/` — `SettingsRolePermissionsObjectLevelRecordLevel*`, `useRecordLevelPermission*`, `RECORD_LEVEL_PERMISSION_PREDICATE_FIELD_TYPES`, `ROW_LEVEL_PERMISSION_PREDICATE(_GROUP)_FRAGMENT`.
- → Tên feature mới **tránh cả 2 tiền tố** `RowLevelPermission*` và `RecordLevelPermission*`. Đã kiểm tra không trùng: `RecordVisibilityPolicy`, `RecordAccessPolicy`, `RowSecurityPolicy`, `RecordVisibility`, `VisibilityRule`, `AccessPolicy` — chọn **`RecordVisibilityPolicy`** cho plan này (rõ nghĩa "kiểm soát bản ghi nào hiển thị", không đụng namespace nào có sẵn).

---

## 2. Xác nhận: RLS là cơ chế lọc-theo-hàng DUY NHẤT trong Twenty core

Đã verify không có cơ chế "record sharing"/"ownership rule"/"visibility rule" nào khác trong `engine/` ngoài RLS. Hệ quyền base (không Enterprise) — `ObjectPermissionEntity` (canRead/Update/SoftDelete/DestroyObjectRecords) + `FieldPermissionEntity` — chỉ là cờ boolean theo (role, object) hoặc (role, object, field), **không có khái niệm hàng**. `permissions.utils.ts` (`validateOperationIsPermittedOrThrow`) chỉ throw allow/deny toàn object, không thêm WHERE nào. Vậy: 1 member có quyền đọc object X sẽ thấy **hết** record của X, trừ khi có RLS predicate (Enterprise) hoặc app-scope (custom, session trước) thu hẹp lại.

---

## 3. Ranh giới quan trọng: Record Visibility Policy giải quyết được gì, KHÔNG giải quyết được gì

| Loại rule | Ví dụ | Giải quyết bằng |
|---|---|---|
| So field của chính object với giá trị **tĩnh** | "chỉ thấy Company có Industry = Tech" | Record Visibility Policy (mục 4-7) |
| So field của chính object với field của **workspace member hiện tại** | "chỉ thấy Issue có assignee = tôi" | Record Visibility Policy (hỗ trợ `currentMemberFieldName`, xem mục 4) |
| So field với **1 tập giá trị tra cứu động từ bảng junction khác** (vd: App nào member có `appAccess`) | "chỉ thấy App mà tôi có `appAccess`" | **KHÔNG** — đây là bài toán app-scope (đã có), không phải RLS-style declarative rule. Xem mục 8. |
| Lọc theo **thuộc tính của object liên quan** (không phải chính field FK) | "chỉ thấy Issue có Project.status = Active" | Cả RLS gốc lẫn bản OSS này **đều không hỗ trợ** (giới hạn kỹ thuật gốc của Twenty, không phải hạn chế riêng của bản OSS) |

→ Đừng cố nhét bài toán "App catalog theo appAccess" vào Record Visibility Policy — 2 cơ chế khác mục đích. Làm Phần A (mục 8) riêng cho App.

---

## 4. Data model đề xuất (Phần B)

**Đơn giản hoá có chủ đích so với RLS gốc**: thay vì 2 bảng chuẩn hoá (predicate + predicate-group, với `position`/`parentGroupId` quản lý cây lồng nhau) — dùng **1 bảng, 1 cột `filter` kiểu jsonb lưu nguyên cây `RecordGqlOperationFilter`** (đúng shape Twenty đã dùng cho View filter và cho `computeRecordGqlOperationFilter`). Lý do: cây and/or/not đã biểu diễn tự nhiên bằng JSON lồng nhau, không cần bảng group riêng + quản lý `position`; đơn giản hoá đáng kể phần ghi (upsert = ghi đè nguyên `filter`, không cần diff predicate-by-predicate như RLS gốc).

```ts
// packages/twenty-server/src/engine/metadata-modules/record-visibility-policy/entities/record-visibility-policy.entity.ts
@Entity('recordVisibilityPolicy')  // schema core, KHÔNG phải workspace standard object — giống ObjectPermissionEntity
export class RecordVisibilityPolicyEntity {
  id: uuid;
  roleId: uuid;          // FK -> RoleEntity, CASCADE
  objectMetadataId: uuid; // FK -> ObjectMetadataEntity, CASCADE
  filter: jsonb;          // RecordGqlOperationFilter — cây and/or/not, field/operand/value
  currentMemberFieldName: text | null; // nếu set: trước khi evaluate, thay thế 1 placeholder trong `filter`
                                        // (vd giá trị đặc biệt "$$CURRENT_MEMBER$$") bằng workspaceMember.id
                                        // hoặc field tương ứng của member hiện tại — cách làm "so với member hiện tại"
                                        // đơn giản hơn RLS gốc (RLS gốc trỏ tới 1 fieldMetadataId cụ thể trên WorkspaceMember,
                                        // ở đây tối giản: chỉ hỗ trợ so field với chính workspaceMember.id, đủ cho case phổ biến
                                        // "assignee = tôi" / "owner = tôi" — mở rộng thêm field khác là việc của v2)
  createdAt, updatedAt;
  // KHÔNG cần universalIdentifier/SyncableEntity/application-manifest ở v1 — đây là simplification có chủ đích,
  // đổi lại: không tự động đóng gói được vào Application manifest nếu sau này cần installable app bundle
  // (RLS gốc extends SyncableEntity chính vì mục đích đó). Nếu cần, nâng cấp lên SyncableEntity là việc riêng, không chặn v1.
}
```

Unique index: `(workspaceId, roleId, objectMetadataId)` — **1 policy / (role, object)**, giống hệt phạm vi của RLS gốc.

**GraphQL**: 1 mutation duy nhất, đơn giản hơn RLS gốc nhiều (không cần diff):
```graphql
upsertRecordVisibilityPolicy(input: { roleId: UUID!, objectMetadataId: UUID!, filter: JSON, currentMemberFieldName: String }): RecordVisibilityPolicyDTO
deleteRecordVisibilityPolicy(input: { roleId: UUID!, objectMetadataId: UUID! }): boolean
```
Gắn resolver-field vào `role.resolver.ts` y hệt cách RLS gốc làm (`@ResolveField('recordVisibilityPolicy', ...)`), hoặc module/resolver riêng — quyết định lúc code, không ảnh hưởng thiết kế.

---

## 5. Cache (theo đúng pattern đã dùng cho app-scope)

- Cache key mới trong `WORKSPACE_CACHE_KEYS_V2`: `recordVisibilityPolicies` (kiểu `Record<roleId, Record<objectMetadataId, { filter: RecordGqlOperationFilter; currentMemberFieldName: string | null }>>`).
- Provider mới `packages/twenty-server/src/engine/metadata-modules/record-visibility-policy/services/workspace-record-visibility-policy-cache.service.ts`, model theo `WorkspaceRolesPermissionsCacheService` (đọc toàn bộ `RecordVisibilityPolicyEntity` của workspace, group theo roleId→objectMetadataId).
- Invalidate: gọi `workspaceCacheService.invalidateAndRecompute(workspaceId, ['recordVisibilityPolicies'])` ngay trong resolver/service khi upsert/delete (không cần qua hook như appAccess, vì đây không phải object thao tác qua GraphQL CRUD chuẩn của workspace schema).
- Thêm field mới vào `ORMWorkspaceContext` (`orm-workspace-context.storage.ts`) + `WorkspaceInternalContext` (`workspace-internal-context.interface.ts`) + copy trong `WorkspaceEntityManager.internalContext` getter + thêm vào batched `getOrRecompute(...)` trong `GlobalWorkspaceOrmManager.loadWorkspaceContext()` — **đúng 4 chỗ, đúng như đã làm cho `appScopeGrants`** ở app-scope feature.

---

## 6. Enforce (Phần B) — đơn giản hơn app-scope, vì chỉ same-object-field

Khác với app-scope (phải tự dựng subquery nhiều tầng vì đi xuyên quan hệ Project→Issue→Worklog), Record Visibility Policy **chỉ lọc theo field của chính object** — đúng scope của RLS gốc. Điều này nghĩa là **có thể tái dùng an toàn** kỹ thuật `GraphqlQueryFilterFieldParser` + `Brackets` (thứ mà app-scope đã xác định KHÔNG dùng được, vì app-scope cần xuyên nhiều object — giới hạn `MAX_RELATION_FILTER_DEPTH` không áp dụng ở đây vì không cần đi quá field của chính object).

- File mới `packages/twenty-server/src/engine/twenty-orm/utils/apply-record-visibility-filter.util.ts` (không có license header) — mirror kỹ thuật của `apply-row-level-permission-predicates.util.ts` (KHÔNG import file đó): resolve roleId từ authContext → tra `internalContext.recordVisibilityPolicies[roleId]?.[objectMetadata.id]` → nếu không có policy, no-op → nếu có, thay placeholder member (nếu `currentMemberFieldName` được set) bằng giá trị thật từ `authContext.workspaceMember`, rồi build `Brackets`/`NotBrackets` + gọi `GraphqlQueryFilterFieldParser.parse()` y hệt cách RLS gốc làm (file parser này không Enterprise, dùng thoải mái).
- Gọi ở đúng 4 nơi app-scope đã gọi: `workspace-select/update/delete/soft-delete-query-builder.ts`, thêm 1 sibling method `applyRecordVisibilityFilter()` cạnh `applyRowLevelPermissionPredicates()` và `applyAppScopeFilter()` (3 lớp enforce độc lập, đều AND lại với nhau, không lớp nào biết tới lớp kia).
- **Insert/update validation (khác app-scope)**: vì same-object-field, **không cần pre-query-hook riêng cho từng object** như app-scope — viết 1 hàm evaluator chung `doesRecordMatchFilter(record, filter)` (tự viết mới, KHÔNG copy từ `is-record-matching-rls-row-level-permission-predicate.util.ts` dù thuật toán tương tự — đây là logic thuần diễn giải filter tree theo operand, không phải business logic đặc thù, viết lại độc lập là hợp lý), gọi trực tiếp trong `WorkspaceInsertQueryBuilder.execute()` và `WorkspaceUpdateQueryBuilder`'s update-path — y hệt vị trí RLS gốc gọi `validateRLSPredicatesForInsert()`/`validateRLSPredicatesForUpdate()`, nhưng generic, không cần hook riêng.

---

## 7. Frontend (Phần B) — tái dùng UI filter builder có sẵn (không Enterprise)

- Thêm 1 section mới trong `SettingsRolePermissionsObjectLevelObjectForm.tsx` (cạnh Object-Level/Field-Level đã có), KHÔNG đặt trong thư mục `record-level-permissions/` (đó là namespace Enterprise) — tạo thư mục riêng `packages/twenty-front/src/modules/settings/roles/role-permissions/object-level-permissions/record-visibility-policy/`.
- Tái dùng `RecordFilterGroupsComponentInstanceContext`/`RecordFiltersComponentInstanceContext` (không Enterprise) làm nền UI xây filter — đúng cách RLS gốc đã làm, chỉ khác là gắn với `recordVisibilityPolicy` thay vì RLS entity.
- Vì data model đơn giản hoá (1 cột jsonb thay vì 2 bảng chuẩn hoá), lớp "conversion" giữa UI filter state và dữ liệu lưu sẽ ĐƠN GIẢN HƠN nhiều so với `recordLevelPermissionPredicateConversion.ts` của RLS gốc (không cần convert predicate/group riêng lẻ, chỉ serialize thẳng cây filter).
- Field type whitelist: có thể tái dùng nguyên `RECORD_LEVEL_PERMISSION_PREDICATE_FIELD_TYPES`'s Ý TƯỞNG (danh sách kiểu field hợp lệ) nhưng định nghĩa hằng số RIÊNG (không import từ thư mục Enterprise).

---

## 8. Phần A — Fix riêng cho App catalog visibility (làm trước, độc lập với Phần B)

Đã research kỹ cơ chế app-scope hiện có (`packages/twenty-server/src/engine/twenty-orm/utils/build-app-scope-path-by-object-id.util.ts`, `apply-app-scope-filter.util.ts`). Hiện trạng: `app` **không nằm trong** kết quả BFS của `buildAppScopePathByObjectId` — không phải `[]` (là scope root) cũng không phải lọc được, mà đơn giản BFS không bao giờ gán giá trị cho chính `app` (vì `app` không có field MANY_TO_ONE trỏ tới chính nó) → rơi vào nhánh mặc định `return null` (không bị lọc) sau khi vét cạn `maxDepth`.

**Cần 2 thay đổi nhỏ, có chủ đích (không phải rewrite)**:

1. Trong `buildAppScopePathByObjectId` (`build-app-scope-path-by-object-id.util.ts`): sau khi build xong `result`, set thêm `result[appObjectId] = []` một cách tường minh — NHƯNG `[]` hiện đang có nghĩa "0 hop, object này CÓ cột FK `appId` trực tiếp" (đúng cho `project`). Gán `[]` cho `app` sẽ khiến `applyAppScopeFilter` gọi `findAppJoinColumnName(app-metadata, ...)` để tìm field MANY_TO_ONE trỏ tới `app` — nhưng `app` không có field như vậy trỏ tới CHÍNH NÓ → trả `null` → rơi vào nhánh fail-closed `1=0` (ẩn hết, sai). Vậy **không thể tái dùng nguyên `[]`** — cần 1 sentinel MỚI phân biệt "tôi CHÍNH LÀ app, so `id` trực tiếp" khác với "tôi CÓ cột FK tới app". Đề xuất: đổi kiểu `AppScopePathByObjectId` từ `Record<string, string[] | null>` thành `Record<string, string[] | null | 'IS_APP_ITSELF'>` (hoặc 1 discriminated union rõ ràng hơn), và trong `buildAppScopePathByObjectId` set `result[appObjectId] = 'IS_APP_ITSELF'` tường minh (không qua BFS).
2. Trong `applyAppScopeFilter` (`apply-app-scope-filter.util.ts`): thêm 1 nhánh mới NGAY ĐẦU (trước đoạn xử lý `hops.length === 0` hiện tại) — nếu `scopePath === 'IS_APP_ITSELF'`, bỏ qua hoàn toàn `resolveAppScopeHops`/`findAppJoinColumnName`, build thẳng predicate `"${mainTableReference}"."id" IN (:...grantedAppIds)` (so `id` của chính bảng `app`, không phải cột FK nào). Toàn bộ phần bypass-check (`shouldBypassAppScope`), tính `grantedAppIds` (member → app → quyền), xử lý "0 quyền → `1=0`" đều **dùng lại y nguyên**, không đổi gì — chỉ khác đúng chỗ build SQL predicate cuối cùng.

Việc ghi (create/update) trên `app` không cần thêm write-guard mới — object `app` không có FK nào để "gán sai app" như `project`/`issue`, nên phần `assert-app-scope-write-access-or-throw.util.ts` hiện tại không áp dụng cho chính `app`.

**Kết quả sau khi làm Phần A**: member không có `appAccess` nào cho App B sẽ **không thấy App B trong danh sách Apps** (đúng yêu cầu gốc của bạn), thay vì hiện trạng "App catalog global, ai cũng thấy tên App" (quyết định cũ trong bản spec app-scope v1, giờ đảo lại theo yêu cầu mới).

---

## 9. Kế hoạch triển khai theo giai đoạn

**Giai đoạn 1 — Phần A (App self-scope), ước lượng nhỏ:**
1. Đổi kiểu `AppScopePathByObjectId`, thêm sentinel `'IS_APP_ITSELF'`.
2. Set `result[appObjectId] = 'IS_APP_ITSELF'` trong `buildAppScopePathByObjectId`.
3. Thêm nhánh xử lý sentinel trong `applyAppScopeFilter`.
4. Viết/chạy lại test integration (`app-scope.integration-spec.ts` đã có — thêm case mới: Jony không thấy App Fraud trong danh sách `apps` dù Role cho đọc `app` object).
5. `database:reset` cả `default` và `test`, verify qua GraphQL query `apps`.

**Giai đoạn 2 — Phần B (Record Visibility Policy), theo mục 4-7 ở trên:**
1. Data model: `RecordVisibilityPolicyEntity` (core schema, plain TypeORM entity — KHÔNG cần SyncableEntity ceremony ở v1), migration tạo bảng (TypeORM migration bình thường cho core schema, khác với workspace-migration dùng cho object chuẩn — xem cách `ObjectPermissionEntity`/`RoleEntity` được migrate làm mẫu).
2. GraphQL: DTO + resolver-field/mutation (`upsertRecordVisibilityPolicy`/`deleteRecordVisibilityPolicy`), gắn vào `role.resolver.ts` hoặc module riêng.
3. Cache: `recordVisibilityPolicies` key + provider service + 4 điểm nối `WorkspaceInternalContext`/`ORMWorkspaceContext`/`WorkspaceEntityManager`/`GlobalWorkspaceOrmManager` (đúng pattern đã làm cho `appScopeGrants`).
4. Enforce: `apply-record-visibility-filter.util.ts` (SELECT/UPDATE/DELETE/SOFT-DELETE), `doesRecordMatchFilter` evaluator dùng chung cho INSERT + UPDATE validation.
5. Wiring: gọi `applyRecordVisibilityFilter()` ở đúng 4 query builder (cạnh `applyRowLevelPermissionPredicates()`/`applyAppScopeFilter()`), gọi validation trong insert/update builder.
6. Frontend: section mới trong Settings → Roles → Object permission form, tái dùng `RecordFilter*ComponentInstanceContext`.
7. Test: integration test cho ít nhất 1 use case cụ thể ngoài App (vd "Company theo Industry", hoặc "Issue theo assignee = current member" để test nhánh `currentMemberFieldName`).

---

## 10. Câu hỏi mở — cần chốt trước khi code Phần B

1. **`currentMemberFieldName` chỉ hỗ trợ so với `workspaceMember.id`, hay cho phép so với field bất kỳ của WorkspaceMember** (giống RLS gốc dùng `workspaceMemberFieldMetadataId` trỏ tới field bất kỳ)? Đề xuất v1: chỉ hỗ trợ so với `id` (đủ cho case phổ biến "assignee = tôi"), mở rộng field khác là v2 nếu cần.
2. **Policy áp dụng cho TẤT CẢ role hay có role nào bypass mặc định** (vd Admin luôn bypass)? Đề xuất: giống RLS gốc — không có bypass đặc biệt, đơn giản là admin sẽ không có ai gán policy cho role Admin thì tự nhiên không bị lọc. Nhất quán với triết lý "opt-in per role", khác với app-scope (vốn có bypass 3 điều kiện tường minh).
3. **Field type whitelist** — dùng lại đúng danh sách của RLS gốc (BOOLEAN/NUMBER/DATE_TIME/DATE/SELECT/MULTI_SELECT/TEXT/LINKS/PHONES/EMAILS/FULL_NAME/ADDRESS) hay điều chỉnh?
4. **Có cần UI riêng để test/preview** (giống RLS gốc chỉ cho save, không preview trước) hay thêm nút "xem trước kết quả lọc"?

---

## 11. File tham chiếu cụ thể (để session mới không phải research lại)

**RLS Enterprise (chỉ đọc để học kỹ thuật, KHÔNG import/sửa):**
- `packages/twenty-server/src/engine/metadata-modules/row-level-permission-predicate/entities/row-level-permission-predicate.entity.ts` (+ `-group.entity.ts`)
- `packages/twenty-server/src/engine/metadata-modules/row-level-permission-predicate/services/row-level-permission-predicate.service.ts` (+ `-group.service.ts`)
- `packages/twenty-server/src/engine/twenty-orm/utils/apply-row-level-permission-predicates.util.ts`
- `packages/twenty-server/src/engine/twenty-orm/utils/build-row-level-permission-record-filter.util.ts`
- `packages/twenty-server/src/engine/twenty-orm/utils/validate-rls-predicates-for-records.util.ts`
- `packages/twenty-server/src/engine/twenty-orm/utils/is-record-matching-rls-row-level-permission-predicate.util.ts`
- `packages/twenty-shared/src/types/RowLevelPermissionPredicateOperand.ts`, `RowLevelPermissionPredicateValue.ts`
- `packages/twenty-front/src/modules/settings/roles/role-permissions/object-level-permissions/record-level-permissions/` (toàn bộ thư mục)

**Core, KHÔNG Enterprise, dùng thoải mái:**
- `packages/twenty-server/src/engine/api/graphql/graphql-query-runner/graphql-query-parsers/graphql-query-filter/graphql-query-filter-field.parser.ts`
- `packages/twenty-server/src/engine/metadata-modules/role/role.resolver.ts`, `role.entity.ts`
- `packages/twenty-server/src/engine/metadata-modules/object-permission/object-permission.entity.ts`
- `packages/twenty-server/src/engine/twenty-orm/repository/permissions.utils.ts`
- `packages/twenty-front/src/modules/object-record/record-filter/` (context/hooks UI filter builder, dùng cho cả View filter lẫn RLS gốc)
- `packages/twenty-server/src/engine/metadata-modules/role/services/workspace-roles-permissions-cache.service.ts` (mẫu cache provider)

**App-scope (đã build, session trước — cần sửa cho Phần A):**
- `packages/twenty-server/src/engine/twenty-orm/utils/build-app-scope-path-by-object-id.util.ts`
- `packages/twenty-server/src/engine/twenty-orm/utils/apply-app-scope-filter.util.ts`
- `packages/twenty-server/src/engine/twenty-orm/utils/should-bypass-app-scope.util.ts`
- `packages/twenty-server/src/engine/twenty-orm/types/app-scope-permission.type.ts`
- `packages/twenty-server/test/integration/graphql/suites/app-scope/app-scope.integration-spec.ts` (test có sẵn, thêm case mới vào đây)

**Wiring 4-điểm cần lặp lại cho cache mới (đã làm cho `appScopeGrants`, làm y hệt cho `recordVisibilityPolicies`):**
- `packages/twenty-server/src/engine/twenty-orm/storage/orm-workspace-context.storage.ts`
- `packages/twenty-server/src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager.ts`
- `packages/twenty-server/src/engine/twenty-orm/interfaces/workspace-internal-context.interface.ts`
- `packages/twenty-server/src/engine/twenty-orm/entity-manager/workspace-entity-manager.ts`

**5 query builder cần thêm sibling-call (đã thêm `applyAppScopeFilter`, thêm tiếp `applyRecordVisibilityFilter`):**
- `packages/twenty-server/src/engine/twenty-orm/repository/workspace-select-query-builder.ts`
- `packages/twenty-server/src/engine/twenty-orm/repository/workspace-update-query-builder.ts`
- `packages/twenty-server/src/engine/twenty-orm/repository/workspace-delete-query-builder.ts`
- `packages/twenty-server/src/engine/twenty-orm/repository/workspace-soft-delete-query-builder.ts`
- `packages/twenty-server/src/engine/twenty-orm/repository/workspace-insert-query-builder.ts`

## 12. Xác minh sau khi implement

- `npx nx typecheck twenty-server` + `npx nx lint:diff-with-main twenty-server` (dùng lại file-list tự dựng đúng cách, xem bài học ở phần app-scope: `lint:diff-with-main` chỉ diff với `main...HEAD`, không thấy code chưa commit).
- `NODE_ENV=test npx nx run twenty-server:database:reset` trước khi chạy integration test (test dùng DB `test` riêng, không phải `default`).
- Viết integration test theo đúng pattern `test/integration/graphql/suites/app-scope/app-scope.integration-spec.ts` (tạo custom Role không bypass, gán tạm cho Jony/Phil, restore lại `afterAll`).
- Test tối thiểu: Phần A (App ẩn/hiện theo appAccess), Phần B (1 rule tĩnh + 1 rule `currentMemberFieldName`).
