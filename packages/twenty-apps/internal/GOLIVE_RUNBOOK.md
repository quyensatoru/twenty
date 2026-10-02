# Go-live runbook: production đang chạy `task-manager-sae-backup` → `apps/zero-core`

Đây là **danh sách lệnh chạy theo đúng thứ tự**, không lặp lại phần giải thích "vì sao" đã có ở
`CUTOVER.md` và các `MIGRATION.md` của từng app — file này chỉ trỏ tới đúng chỗ và ghép các bước
lại cho đúng trình tự thật, vì bản thân `CUTOVER.md` viết trước khi `customer-support` tồn tại và
không có app đó trong thứ tự của nó (đã sửa `CUTOVER.md` để thêm vào, nhưng file này là nơi để chạy
theo, không phải đọc hiểu).

**Đã xác minh:** mọi universalIdentifier trong các `MIGRATION.md` được đối chiếu lại trực tiếp với
`origin/task-manager-sae-backup` (`standard-object-universal-identifiers.constant.ts`) trong lúc
soạn file này — khớp tuyệt đối với `merchant`, `issue`, `issueMerchant`. Không phải suy đoán.

**Trước khi chạy bất cứ gì ở đây, đọc theo thứ tự:**
1. `CUTOVER.md` — nền tảng kỹ thuật + thứ tự tổng thể (đã cập nhật thêm customer-support)
2. `task-manager/MIGRATION.md`, `customer-support/MIGRATION.md`, `shift-management/MIGRATION.md` —
   chi tiết riêng từng app
3. `task-manager/DEPLOY.md` mục 4, `shift-management/DEPLOY.md` mục 3 — việc phải làm tay sau cài

File này không thay thế ba tài liệu trên — nếu một bước ở đây và giải thích chi tiết ở nơi khác lệch
nhau, tài liệu chi tiết đúng hơn, vì nó được diễn tập tay trên dữ liệu thật. Báo lại cho người giữ
tài liệu nếu phát hiện lệch.

---

## 0. Việc phải xác minh LẠI trước khi chạy thật (phát hiện lúc soạn file này)

Đừng bỏ qua mục này — hai điểm dưới đây là tài liệu đang dở dang tại thời điểm viết file, không
phải lỗi thao tác.

- [ ] **`task-manager/DEPLOY.md` mục 4.1 đang thiếu bảng "Mức A / Mức B".** Bản commit gần nhất
      (`git show HEAD:...DEPLOY.md`) có bảng so sánh "Mức A — khoá ghi" / "Mức B — khoá cả đọc"
      cho bước khoá quyền của `CUTOVER.md` Bước 6, nhưng bản đang sửa dở trong working tree đã bỏ
      bảng đó (đang refactor bỏ Board/Backlog/Roadmap, mục 4.1 chưa viết lại xong) trong khi các
      mục 5.7, 5.9, và danh sách đối chiếu cuối file **vẫn còn tham chiếu "Mức A"/"Mức B"** như thể
      bảng đó còn tồn tại. Trước go-live: đọc lại mục 4.1 bản mới nhất, xác nhận nó **tự đủ nghĩa**
      (định nghĩa rõ Mức A/B là gì, object nào áp dụng) trước khi làm theo Bước 6 của `CUTOVER.md`.
      Nếu mục 4.1 vẫn chỉ có đoạn về predicate `merchant` (không có bảng A/B), lấy bảng gốc từ
      `git show HEAD:packages/twenty-apps/internal/task-manager/DEPLOY.md | sed -n '95,125p'` làm
      cơ sở tạm thời.
- [ ] **`customer-support/MIGRATION.md` còn nợ 1 dòng `searchFieldMetadata` không khớp công thức
      dẫn xuất nào** (`14162f45-2d08-571f-b4e1-81c222d625a5`). Diễn tập cho thấy `apply` không
      vướng nó, nhưng chạy `twenty plan` của task-manager **sau** bước dời merchant và đọc kỹ xem
      dòng này có khiến plan đòi tạo mới searchFieldMetadata không. Thấy vậy thì dừng, đừng
      `--force` — xem `customer-support/MIGRATION.md` mục "Còn nợ".
- [ ] Cả 5 app (`task-manager`, `customer-support`, `merchant-email-campaigns`, `shift-management`,
      `real-estate`) hiện ở trạng thái build nào — chạy `npx twenty dev:build` trong từng thư mục
      **ngay trước** cửa sổ bảo trì, không tin kết quả cũ. Tại thời điểm viết file này:
      `task-manager`, `customer-support`, `merchant-email-campaigns`, `shift-management` build
      sạch; **`real-estate` KHÔNG build được** (`agency-dashboard.page-layout.ts` dùng shape widget
      GRAPH cũ không khớp SDK hiện tại — lỗi có sẵn, không liên quan cutover). `real-estate` không
      nằm trong phạm vi cutover này (không có production fork tương ứng), nhưng đừng cho nó vào
      cùng đợt deploy nếu chưa sửa.
- [ ] `task-manager` và `merchant-email-campaigns` đang có **sửa đổi chưa commit** tại thời điểm
      viết file này (xem `git status`) — phần việc dang dở của tính năng Custom Settings
      (task-manager) và routing event động (merchant-email-campaigns, có `MIGRATION.md` riêng ở
      mục 10 dưới). Xác nhận cả hai đã **commit xong** và qua review trước khi coi là một phần của
      đợt go-live này.

---

## 1. Chuẩn bị môi trường biến — dễ sai nhất, sai thì âm thầm kết nối nhầm

Hai nhóm script dùng **hai tên biến khác nhau** cho cùng một connection string. Đặt cả hai trước
khi bắt đầu, trỏ đúng production:

```bash
export DATABASE_URL="postgres://...prod..."      # dùng bởi mọi lệnh psql trực tiếp
export PG_DATABASE_URL="$DATABASE_URL"            # dùng bởi *.mjs (run-sql.mjs, rewrite-derived-identifiers.mjs)
```

`*.mjs` không đọc `DATABASE_URL` — thiếu `PG_DATABASE_URL` thì nó lặng lẽ rơi về
`postgres://postgres:postgres@localhost:5432/default` (xem phần đầu `run-sql.mjs`), tức là chạy
SQL vào **một database local rỗng** mà không báo lỗi gì. Kiểm tra bằng:

```bash
node -e "console.log(process.env.PG_DATABASE_URL ?? 'KHÔNG CÓ — SẼ RƠI VỀ LOCALHOST')"
```

---

## 2. Toàn bộ trình tự — một cửa sổ bảo trì

Chặn truy cập người dùng trước khi bắt đầu Bước 2.1.

### 2.1 — Backup (trên server fork, trước khi đụng bất cứ gì)

```bash
pg_dump -Fc -f pre-cutover-$(date +%F).dump "$DATABASE_URL"
```

Khôi phục thử trên một instance khác, xác nhận chạy được, **trước khi đi tiếp** — đây là điểm
quay lui duy nhất từ Bước 2.5 trở đi. Ghi số dòng đối chiếu bằng `task-manager/scripts/00-row-counts.sql`
và `shift-management/scripts/00-row-counts.sql` cho mỗi workspace schema:

```bash
psql "$DATABASE_URL" -v schema=workspace_xxxxxxxx -f task-manager/scripts/00-row-counts.sql | tee before-task-manager.txt
psql "$DATABASE_URL" -v schema=workspace_xxxxxxxx -f shift-management/scripts/00-row-counts.sql | tee before-shift.txt
```

Lấy danh sách schema:

```sql
SELECT nspname FROM pg_namespace WHERE nspname LIKE 'workspace\_%';
```

### 2.2 — Tạo dòng application (vẫn trên server fork)

**Hai app dùng hai kiểu tham số khác nhau — không phải lỗi đánh máy, kiểm tra lại nếu copy-paste:**
`task-manager`'s script tự lặp qua mọi workspace trong một lần chạy; `shift-management`'s script
cần `-v workspace_id=<uuid>` và phải chạy riêng cho **từng** workspace.

```bash
cd packages/twenty-apps/internal/task-manager
psql "$DATABASE_URL" -f scripts/01-create-applications.sql          # KHÔNG cần -v, chạy 1 lần cho mọi workspace

cd ../shift-management
psql "$DATABASE_URL" -v workspace_id=<uuid-workspace-1> -f scripts/01-create-applications.sql
# lặp lại -v workspace_id=... cho mỗi workspace còn lại
```

Cả hai idempotent — chạy lại không tạo trùng.

### 2.3 — Re-parent metadata (vẫn trên server fork)

```bash
cd ../task-manager
psql "$DATABASE_URL" --single-transaction -f scripts/02-reparent-metadata.sql     # KHÔNG cần -v, toàn database

cd ../shift-management
psql "$DATABASE_URL" -v workspace_id=<uuid-workspace-1> --single-transaction -f scripts/02-reparent-metadata.sql
# lặp lại cho mỗi workspace còn lại
```

Mỗi script tự chốt chặn bằng `RAISE EXCEPTION` nếu còn sót metadata thuộc twenty-standard — lỗi là
rollback toàn bộ transaction, không commit nửa chừng. Đọc kỹ thông báo nếu nó dừng.

### 2.4 — Tính lại universalIdentifier dẫn xuất (Bước 2b của CUTOVER.md)

```bash
cd ..   # packages/twenty-apps/internal
node rewrite-derived-identifiers.mjs --dry-run
# đọc kỹ output — đúng là field hệ thống của task-manager + shift-management, không gì khác
node rewrite-derived-identifiers.mjs --apply
```

**Bỏ bước này thì mọi `apply` ở Bước 2.8 chắc chắn hỏng** với `INVALID_VIEW_DATA: Field metadata
not found` / `ENTITY_ALREADY_EXISTS`.

### 2.5 — Đổi tên bảng vật lý (mỗi workspace schema)

```bash
cd task-manager
psql "$DATABASE_URL" --single-transaction -v schema=workspace_xxxxxxxx -f scripts/03-rename-tables.sql

cd ../shift-management
psql "$DATABASE_URL" --single-transaction -v schema=workspace_xxxxxxxx -f scripts/03-rename-tables.sql
```

Lặp lại cho mỗi workspace. **Từ đây về trước** là điểm hoàn tác rẻ (xem mục 6); từ Bước 2.6 trở đi
hoàn tác phải khôi phục dump.

### 2.6 — Gỡ liên kết chéo mồ côi (Bước 3b của CUTOVER.md, bắt buộc kể cả cho shift-management)

```bash
cd ../task-manager
psql "$DATABASE_URL" -v schema=workspace_xxxxxxxx -f scripts/04-preserve-cross-object-links.sql
```

Ghi lại số dòng nó in ra. Nếu quá lớn để chấp nhận mất liên kết, **dừng cutover ở đây**, đừng chạy
tiếp rồi tính sau. Sau đó xoá 9 field morph mồ côi (`attachment.target*`, `noteTarget.targetMerchant`,
`taskTarget.targetMerchant`, `timelineActivity.target*`) đúng theo SQL ở `CUTOVER.md` Bước 3b —
bước này **bắt buộc dù chỉ cài shift-management**, nó chặn apply của mọi app không liên quan tới
attachment/timeline.

### 2.7 — Deploy server `apps/zero-core`

```bash
yarn install
npx nx build twenty-shared --skip-nx-cache
node dist/command/command.js upgrade
node dist/command/command.js upgrade:status   # mọi workspace phải "Up to date"
node dist/command/command.js cache:flush      # BẮT BUỘC — migration không tự invalidate cache
```

**Điểm kiểm tra bắt buộc trước khi đi tiếp:** chạy lại `00-row-counts.sql` của cả hai app, so với
`before-*.txt` ở Bước 2.1 — phải khớp tuyệt đối. Thiếu dòng nghĩa là standard sync đã `DROP` bảng.
**Dừng và rollback (mục 6), đừng chạy tiếp**, nếu lệch.

### 2.8 — Apply `task-manager`

```bash
cd packages/twenty-apps/internal/task-manager
yarn install
yarn twenty plan --remote prod     # PHẢI ra UPDATE/no-op — KHÔNG được có "will be created"
yarn twenty apply --remote prod
```

Thấy `will be created` cho object đang có dữ liệu → re-parent sót ở Bước 2.3/2.4 — dừng lại, đừng
`apply`, đừng `--force`.

### 2.9 — Dời `merchant` sang `customer-support` (bước hay bị quên nhất — không có trong `CUTOVER.md` gốc)

Chạy trên server **đã** là `apps/zero-core` (khác 2.1–2.6, chạy trên server fork). Env var vẫn
`PG_DATABASE_URL` — xem mục 1.

```bash
cd ../customer-support
node scripts/run-sql.mjs scripts/01-create-application.sql
node scripts/run-sql.mjs scripts/02-reparent-merchant.sql
node scripts/03-rewrite-derived-identifiers.mjs --dry-run
node scripts/03-rewrite-derived-identifiers.mjs --apply
node scripts/run-sql.mjs scripts/04-reparent-merchant-presentation.sql
```

`cache:flush` **sau mỗi đợt SQL ở trên**, không phải một lần cuối — đã gặp thật lúc diễn tập, bỏ sẽ
làm `plan` của task-manager báo nhầm `drops the table` dù re-parent đã xong:

```bash
cd ../../../../twenty-server && node dist/command/command.js cache:flush && cd -
```

Cổng kiểm tra bắt buộc:

```bash
cd ../task-manager && yarn twenty plan --remote prod   # PHẢI ra 0 to destroy
```

Thấy "drops the table" → re-parent chưa ăn hoặc chưa flush cache. Dừng lại, lặp lại SQL + flush,
đừng `--force`.

```bash
cd ../customer-support
yarn install
yarn twenty apply --remote prod
```

### 2.10 — Apply `shift-management` và `merchant-email-campaigns`

```bash
cd ../shift-management
yarn install && yarn twenty plan --remote prod
yarn twenty apply --remote prod

cd ../merchant-email-campaigns
yarn install && yarn twenty plan --remote prod
yarn twenty apply --remote prod
```

`merchant-email-campaigns` phải chạy **sau cùng** — field của nó (`email`, `contactName`,
`emailUnsubscribed`, `emailUnsubscribedAt`, `emailSends`, `merchantEvents`) gắn vào `_merchant`,
và `_merchant` vừa đổi chủ ở Bước 2.9. Tuyệt đối không dùng `--force` ở bất kỳ `apply` nào trong
toàn bộ phase này.

`shift-management` độc lập hoàn toàn — chạy trước/giữa/sau các app trên đều được, không ảnh hưởng.

---

## 3. Việc phải làm tay ngay sau khi apply xong (không tự động, dễ quên)

- [ ] **`task-manager`** — Settings → Roles → gán role **Task Manager member** cho từng member
      (thay role Member). Chọn Mức A hoặc Mức B theo bảng ở `task-manager/DEPLOY.md` mục 4.1 (xem
      cảnh báo ở mục 0 phía trên nếu bảng đó chưa có trong bản đang đọc). Role `Task Manager
      runtime` giữ cho app, đừng gán cho người.
- [ ] **`shift-management`** — điền biến môi trường `SHIFT_LEADER_EMAILS` (xem `DEPLOY.md` mục 3).
      Bỏ bước này thì **mọi** Leader/PO tụt xuống quyền member thường và trang Report mất bộ chọn
      Member.
- [ ] **`shift-management`** — làm Bước 6 của `CUTOVER.md` (khoá `canReadObjectRecords` /
      `canUpdateObjectRecords` trên `shift`, `shiftTemplate`, `specialDay` cho role không-admin).
      Đây là nơi **duy nhất** còn chặn đọc thẳng GraphQL — bản fork chặn bằng query hook, app không
      cài được hook nên toàn bộ trách nhiệm dồn vào bước này.
- [ ] Rà lại danh sách member có permission flag `WORKSPACE` hoặc `ROLES` (bypass toàn bộ
      app-scope) — `task-manager/DEPLOY.md` mục 4.2.
- [ ] Đếm merchant chưa gán `app` trước khi xem là xong, vì predicate mới sẽ ẩn hẳn chúng khỏi
      member thường (không phải thấy-rồi-không-sửa-được như trước; giờ là **không thấy**):

  ```sql
  SELECT count(*) FROM <workspace_schema>._merchant
  WHERE "appId" IS NULL AND "deletedAt" IS NULL;
  ```

---

## 4. Đối chiếu cuối cùng — gộp từ tất cả checklist riêng

**Số dòng:**
- [ ] `00-row-counts.sql` của cả hai app, chạy lại nguyên văn, khớp tuyệt đối với Bước 2.1.
- [ ] `_cutover_link_*` (Bước 2.6) còn nguyên, đúng số dòng đã ghi khi tạo.

**Plan phải sạch:**
- [ ] `yarn twenty plan --remote prod` của cả 4 app (task-manager, customer-support,
      shift-management, merchant-email-campaigns) ra **0 to destroy**.

**Dữ liệu còn đúng (mở UI, kiểm tra bằng mắt):**
- [ ] Mở một `merchant` bất kỳ: field `Email`, `Contact name`, `Email unsubscribed` của
      merchant-email-campaigns **còn và còn giá trị**. Mất là ranh giới re-parent đã hỏng.
- [ ] Mở một `issue` cũ: có `issueKey`, có comment, có worklog, `Time spent` khớp tổng worklog.
- [ ] Tạo issue mới trong project cũ nhất → key tiếp nối đúng số, không nhảy bất thường
      (`task-manager/MIGRATION.md` mục 7 — kiểm tra `nextIssueNumber` trước nếu nghi ngờ).
- [ ] Mở Email Studio → một automation cũ: ô "Send when this event arrives" hiện tên event, không
      phải cảnh báo cam (nếu đã deploy phần event động — `merchant-email-campaigns/MIGRATION.md`).

**Quyền đã khoá đúng:**
- [ ] Đăng nhập bằng một member **không có** `appAccess` trên app nào: Board (hoặc trang tương
      đương) rỗng; gọi thẳng GraphQL `issues`/`shifts` rỗng nếu chọn mức khoá-cả-đọc, có dữ liệu
      nếu chọn mức khoá-ghi-thôi (xem mục 0 cảnh báo Mức A/B).
- [ ] Đăng nhập bằng member **có** `scopedAppIds` cho đúng một app: chỉ thấy merchant của app đó,
      không thấy merchant của app khác (tính năng mới nhất, chưa verify qua tài khoản non-admin
      thật — xem mục 5).

**Log:**
- [ ] `yarn twenty dev:function:logs --remote prod` của từng app — không có lỗi bị nuốt.

---

## 5. Việc mới phát sinh trong phiên làm việc gần nhất, chưa có trong các MIGRATION.md gốc

Không cần bước migrate dữ liệu riêng — toàn bộ là field/route/widget **mới**, không di chuyển gì
từ fork. Nhưng ảnh hưởng tới checklist đối chiếu ở trên:

- **Widget Custom Settings trên trang merchant** (task-manager) — field mới
  `merchant.customSettingFiles`, 2 route mới (`merchant-custom-settings`,
  `update-merchant-custom-settings`, `run-merchant-custom-setting-tool`). `apply` tạo mới bình
  thường, không cần thao tác gì thêm.
- **Predicate app-scope mới trên `merchant`** (role `Task Manager member`) — đây là thay đổi hành
  vi thật cho member đang hoạt động, không chỉ tính năng mới: trước đây member giữ role này thấy
  **toàn bộ** merchant trong workspace (một lỗ hổng thật), từ nay chỉ thấy merchant của app họ có
  grant. Đã thêm vào checklist mục 4. **Chưa verify bằng tài khoản non-admin thật trong phiên vừa
  rồi** (chỉ verify qua truy vấn SQL + đọc code) — nên là việc đầu tiên thử bằng tay sau go-live.
- Core đã chạm (renderer `twenty-front-component-renderer`): thêm khả năng lấy file qua `<input
  type="file">` thật (trước đó chỉ kéo-thả/dán) và popover nổi cho dropdown trong dialog Custom
  Settings. Không ảnh hưởng dữ liệu, chỉ ảnh hưởng UI — không cần bước go-live riêng, đi kèm trong
  deploy server bình thường ở Bước 2.7.

---

## 6. Rollback nhanh

**Trước Bước 2.7 (server vẫn là fork):** hoàn tác 2.2–2.6 theo chiều ngược (đổi tên bảng về, trả
`applicationId` về twenty-standard, xoá dòng `application`), dữ liệu chưa hề bị động.

**Từ Bước 2.7 trở đi:** khôi phục dump của Bước 2.1, deploy lại nhánh fork. Không có đường lùi từng
phần — đây là lý do Bước 2.1 phải dump toàn bộ database và phải kiểm tra khôi phục được trước khi
đi tiếp.

**Riêng Bước 2.9 (dời merchant sang customer-support), nếu phát hiện hỏng SAU khi đã đi tiếp sang
Bước 2.10:** phức tạp hơn vì `merchant-email-campaigns` có thể đã apply dựa trên chủ sở hữu mới.
Ưu tiên khôi phục dump toàn bộ thay vì cố gỡ tay từng app.

---

## 7. Tra cứu chi tiết

| Câu hỏi | Xem ở đâu |
|---|---|
| Vì sao không dump/restore toàn bộ | `CUTOVER.md` đầu file |
| Chi tiết từng bảng/field của task-manager | `task-manager/MIGRATION.md` |
| Chi tiết dời merchant sang customer-support | `customer-support/MIGRATION.md` |
| Chi tiết shift-management, biến `SHIFT_LEADER_EMAILS` | `shift-management/MIGRATION.md`,
  `shift-management/DEPLOY.md` |
| Routing event tĩnh → động của merchant-email-campaigns | `merchant-email-campaigns/MIGRATION.md`
  (migration riêng, độc lập với cutover fork→app) |
| Mức khoá quyền A/B, predicate merchant mới | `task-manager/DEPLOY.md` mục 4 |
| Khác biệt hành vi so với fork (kéo thả, CSS, rich text, issueKey) | `CUTOVER.md` mục cuối +
  `DEPLOY.md` mục 5 của từng app |
