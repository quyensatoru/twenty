# Deploy lên production

App này không nằm trong build của server. Nó được đẩy lên một Twenty server đang chạy bằng CLI
`twenty`, từ một máy có source của app (máy dev hoặc runner CI). Server production không cần
checkout repo.

App sở hữu 12 object: `app`, `appAccess`, `merchant`, `project`, `sprint`, `epic`, `issueStatus`,
`issue`, `issueMerchant`, `issueComment`, `worklog`, `issueHistory`. Không có app `bss-core` riêng — `app`,
`appAccess` và `merchant` thuộc về app này.

**Nếu đang chuyển production từ nhánh fork sang `apps/zero-core`, đừng đọc file này trước.** Đọc
`packages/twenty-apps/internal/CUTOVER.md` (thứ tự tổng thể) rồi `MIGRATION.md` (chi tiết của app
này). File này chỉ mô tả cài mới lên một workspace chưa có dữ liệu task-manager.

## 1. Điều kiện phía server

| Thứ cần có | Vì sao |
| --- | --- |
| `LOGIC_FUNCTION_TYPE=LOCAL` trong env của server **và** worker | Mặc định biến này chỉ là `LOCAL` khi `NODE_ENV=development`; ngoài ra là `DISABLED` (`config-variables.ts`). Để `DISABLED` thì **mọi route của app đều không chạy**: board, backlog, roadmap trống trơn, không tạo được issue, không kết sprint. App này là route-only, nên đây là điều kiện cứng chứ không phải tuỳ chọn. |
| Server ở phiên bản `>= 2.43.0` | `package.json` pin `twenty-sdk` 2.43.0. CLI chỉ cảnh báo khi lệch **major**, nên 2.43 với server 2.44+ chạy bình thường. |
| Object `workspaceMember` là standard object của upstream | App khai báo 9 quan hệ ngược lên nó (`ledProjects`, `assignedIssues`, `reportedIssues`, `assignedEpics`, `ownedSprints`, `issueComments`, `worklogs`, `issueHistories`, `appAccesses`) bằng universalIdentifier chuẩn `20202020-3319-4234-a34c-82d5c0e881a6`. |

Không cần worker: app không có cron và không có job. Không cần feature flag nào.

**Nếu production đang chạy bản cũ hơn repo:** deploy code server trước, rồi chạy đúng thứ tự này
(xem `packages/twenty-server/docs/UPGRADE_COMMANDS.md`):

```bash
yarn install
npx nx build twenty-shared --skip-nx-cache
node dist/command/command.js upgrade
node dist/command/command.js cache:flush     # bắt buộc, migration không tự invalidate cache
```

Kiểm tra `node dist/command/command.js upgrade:status` trước khi cài app: mọi workspace phải
`Up to date`.

## 2. Cài app

Trên máy có source:

```bash
cd packages/twenty-apps/internal/task-manager
yarn install

# đăng nhập bằng user (mở browser) — dùng cho cả dev:function:exec sau này
yarn twenty remote:add --as prod --url https://crm.example.com

# hoặc không tương tác, dùng cho CI:
yarn twenty remote:add --as prod --url https://crm.example.com --api-key "$TWENTY_API_KEY"

yarn twenty apply --remote prod     # lần đầu: apply, không phải plan
```

Trước khi `apply`, chạy:

```bash
yarn twenty dev:typecheck
yarn test
yarn lint
```

### Hai cái bẫy của CLI

**Đừng đặt tên remote là `local`.** `getRemotes()` luôn nhét sẵn tên `local` vào danh sách kể cả khi
`~/.twenty/config.json` rỗng, nên `remote:add --as local` rơi vào nhánh re-authenticate và **bỏ qua
`--url` bạn truyền vào**, tụt về `http://localhost:2020`. Dùng tên khác (`dev`, `prod`, `staging`).

**Lần cài đầu tiên phải dùng `apply`, `plan` sẽ fail.** App chưa có application registration trên
server nên `plan` chết với `No registration found for "<uid>"`. `apply` tự đăng ký rồi mới sync. Từ
lần deploy thứ hai trở đi `plan` chạy bình thường và nên chạy trước mỗi `apply`.

**Lần deploy sau:** `plan` rồi `apply`. `apply` mặc định **xoá** entity không còn trong source; thêm
`--no-delete` nếu có ai tạo tay object/field trong namespace của app.

## 3. Biến của app

**App này không khai báo biến nào.** `src/application.config.ts` có `applicationVariables: {}`.
Phạm vi dữ liệu không đến từ cấu hình mà từ dữ liệu: các dòng `appAccess` quyết định ai thấy app
nào. Không có gì phải điền ở Settings → Apps → Task Manager → Variables.

Việc phải làm thay vào đó là **tạo dữ liệu `app` và `appAccess`**:

1. Sidebar **Task Manager → Apps**: mỗi Shopify app một dòng.
2. Sidebar **Task Manager → App Accesses**: mỗi cặp (thành viên, app) một dòng, chọn quyền trong
   `READ` / `WRITE` / `SOFT_DELETE` / `DESTROY`.
3. Mỗi **Project** phải gán `App`. Project không có app thì **không ai thấy** ngoài người bypass
   (xem mục 5): toàn bộ object của app này fail-closed khi chưa gán app.

## 4. Việc phải làm tay sau khi cài

### 4.1 Gán role **Task Manager member** — **bắt buộc**

App-scope được thực thi bằng **row-level permission predicate** của core, không phải trong route.
App khai một role tên **Task Manager member** (`src/roles/app-scoped-member.role.ts`) mang mười
predicate, mỗi object một cái:

```
project, merchant, issue, sprint, epic, issueStatus, issueComment, worklog, issueMerchant,
issueHistory
```

`merchant` là cái vào sau cùng, và nó từng là một lỗ thật: `APP_SCOPE_PATH_BY_OBJECT` coi merchant
là app-scope root nên **route** nào cũng từ chối merchant ngoài phạm vi, nhưng không có predicate
thì **bảng record, picker và GraphQL gọi thẳng vẫn trả về mọi merchant trong workspace**. Hai
đường thực thi, chỉ một đường được bịt. `src/roles/__tests__/app-scoped-member.role.test.ts` giờ
bắt buộc mọi object có scope path phải có predicate, nên kiểu lỗ này không lặp lại im lặng được.

Object `merchant` và field `merchant.app` đều thuộc customer-support; predicate gọi chúng bằng
universalIdentifier và validate trên toàn đồ thị workspace, nên role của app này scope được object
của app khác — cùng kiểu tham chiếu chéo mà `merchant.issues` vẫn đang dùng.

**Hệ quả khi bật:** member giữ role này trước đây thấy toàn bộ merchant, giờ chỉ còn merchant của
app họ có grant. Merchant **không gán app** biến mất khỏi tầm nhìn của họ (predicate sinh
`"appId" IN (...)`, NULL không khớp). Đếm trước khi deploy:

```sql
SELECT count(*) FROM <workspace_schema>._merchant
WHERE "appId" IS NULL AND "deletedAt" IS NULL;
```

Admin không bị ảnh hưởng. Và lưu ý role này áp cho **mọi** màn hình merchant, kể cả view
`Merchants` của customer-support lẫn các field mà merchant-email-campaigns sở hữu.

Role vẫn **không** cho member sửa merchant từ UI (không có objectPermission row cho merchant) —
giữ nguyên như trước. Sửa Custom Settings thì đi qua route của app và được gác bằng grant `write`
trên app, không dính tới quyền object này.

Mỗi predicate so field `app` trên chính bản ghi với field `scopedAppIds` trên bản ghi
workspaceMember của **người đang gọi**, và được biên dịch thành `"appId" IN (...)` ngay trong
repository của ORM. Nghĩa là nó có hiệu lực ở **mọi** đường: bảng record, Kanban, GraphQL gọi
thẳng, và cả lúc ghi.

Settings → Roles → **Task Manager member** → thêm từng member. Thao tác này **thay** role `Member`,
nên role đã được dựng theo hình dáng của `Member` (đọc mọi object, không ghi gì) cộng quyền ghi và
xoá mềm trên chín object trên.

Ba điều phải biết:

- Member chưa có `scopedAppIds` thì **không thấy gì cả**, không phải thấy tất. Engine biến một
  predicate không giải được thành bộ lọc không khớp dòng nào.
- `scopedAppIds` là bản sao của các dòng `appAccess`, do trigger `appAccess.*` ghi. Sửa grant là
  nó tự chạy; không phải chạy tay gì thêm.
- Không tạo được bản ghi mà chính mình sẽ không nhìn thấy. Bảng record của Twenty tạo dòng rỗng
  trước nên **view phải có sẵn filter App**, giá trị filter được gieo vào dòng mới. Board từng
  project do trigger `project.created` dựng đã mang đủ hai filter `Project` và `App`.

Giữ role `Task Manager runtime` cho app, đừng gán cho người.

### 4.1.1 Cái bẫy: danh sách rỗng nghĩa là KHÔNG LỌC

Predicate row-level của core **fail-open** chứ không fail-closed khi danh sách id rỗng, và đây là
hành vi đã kiểm chứng trên server thật, không phải suy đoán:

1. `scopedAppIds` rỗng → bộ lọc quan hệ nhận danh sách id rỗng.
2. `turnRecordFilterIntoGqlOperationFilter` gặp `if (recordIds.length === 0) return;` nên không sinh
   điều kiện nào.
3. Filter thành `{}` → `resolveRowLevelPermissionRecordFilter` trả `null` → policy `open`.
4. Người vừa bị thu hồi hết quyền **thấy toàn bộ workspace**, và sửa được.

Id sai định dạng cũng rơi vào đúng hố đó: `isValidUuid` của core đòi uuid version 1-5 variant 8-b,
id nào trượt thì bị loại âm thầm, loại hết thì lại thành danh sách rỗng.

Vì vậy `sync-member-scoped-app-ids.util.ts` **không bao giờ ghi mảng rỗng**. Không còn grant thì nó
ghi một uuid hợp lệ mà không app nào có (`ffffffff-ffff-4fff-8fff-ffffffffffff`), để bộ lọc vẫn
được sinh ra và không khớp dòng nào.

Đừng bỏ sentinel đó đi, và nếu sau này thêm predicate bound vào field khác của member thì áp dụng
cùng quy tắc: **giá trị rỗng phải được thay bằng một giá trị không khớp, không phải để rỗng.**

### 4.2 Kiểm tra lại quyền admin

Người có permission flag `WORKSPACE` hoặc `ROLES` **bypass toàn bộ app-scope** (xem mục 5). Rà lại
danh sách này trước khi golive.

## 5. Khác biệt so với bản core (fork)

Liệt kê đầy đủ, để không ai bất ngờ sau golive.

### 5.1 App-scope: ORM của fork → predicate của core

| | Fork | App |
| --- | --- | --- |
| Đọc | `applyAppScopeFilter` chèn subquery vào mọi query | predicate row-level, áp trong `workspace-repository` nên phủ mọi đường đọc |
| Ghi | `validateAppScopeForRecords` + pre-query hook | predicate được kiểm lại khi ghi (`validate-rls-predicates-for-records`), cộng guard trong các route còn lại |
| Nguồn quyền | cache Redis `appScopeGrants` | `workspaceMember.scopedAppIds`, bản sao của `appAccess` do trigger giữ đồng bộ |
| Đường đi tới app | chuỗi `issue → project → app` trong SQL | field `app` phi chuẩn hoá trên từng object, vì predicate chỉ so field nằm trên chính bản ghi |

Phần phi chuẩn hoá do route ghi ngay trong lệnh tạo, và trigger `issue.created` vá cho những dòng
sinh ra ngoài route. `sync-app-scope-mirror` là route sửa chữa khi cần dựng lại toàn bộ.

### 5.2 Quy tắc bypass đổi

Fork bypass khi: (1) auth context `system`, (2) auth context `apiKey`/`application`, hoặc (3) **mọi
role đang tác dụng đều bật cờ thô `canXAllObjectRecords`**.

App không đọc được cờ (3) — metadata API chỉ trả `permissionFlags` của user workspace, không trả cờ
truy cập bản ghi của role. Thay bằng:

- caller không có workspace member phía sau (token application / API key) → bypass, khớp quy tắc (2);
- caller có permission flag `WORKSPACE` hoặc `ROLES` → bypass, thay cho quy tắc (3).

Khai báo ở `src/constants/bypass-permission-flags.ts`. Thực tế tập người bypass rộng hơn fork một
chút: một role có `canReadAllObjectRecords` nhưng không có quyền settings thì trước bypass, giờ
không; ngược lại một người có quyền Settings → Roles nhưng role hẹp thì trước không bypass, giờ có.

### 5.3 Cấp `issueKey` không còn atomic

Fork bump `project.nextIssueNumber` bằng một câu `UPDATE ... RETURNING` — atomic dưới mọi mức đồng
thời. App không có raw SQL và không có transaction, nên:

- đọc bộ đếm, ghi lại, rồi tạo issue với key sinh ra;
- **unique index trên `issue.issueKey`** là thứ đảm bảo đúng đắn thật sự;
- trúng unique violation thì retry, tối đa **5 lần**, mỗi lần đọc lại bộ đếm và dịch qua khỏi va
  chạm trước (`src/logic-functions/utils/create-issue-with-reserved-key.util.ts`).

Hệ quả: quá 5 request tạo issue **cùng một project** va nhau thì request cuối trả lỗi rõ ràng
(`Could not allocate a unique issue key after 5 attempts`) thay vì tạo trùng key. Ngoài ra
`nextIssueNumber` có thể nhảy số khi có va chạm — số thứ tự issue không còn liên tục tuyệt đối.

### 5.4 Kanban per-project — giữ nguyên, dựng bằng trigger, không có view all

Fork tạo một view Kanban cho mỗi project trong post-hook của `project.createOne`. App làm đúng như
vậy: trigger `project.created` gọi `createProjectBoardView`, dựng view KANBAN lọc theo
`Project` và `App`, kèm một cột cho mỗi status của project đó.

View được tạo **không mang applicationId**, nên nó thuộc application `Custom` của workspace và
`twenty apply` không xoá nó. Muốn dựng lại cho project cũ thì gọi route
`/task-manager/create-project-board-view`.

**Không có view Kanban dùng chung.** Mục Board trên menu là navigation item kiểu OBJECT trỏ vào
object `issue`, nên mỗi member mở board của project mình đã vào lần trước. View all (không lọc
project/app) đã bị xoá vì tạo issue từ đó thiếu cả `app` lẫn `project` và bị row-level predicate
từ chối. Muốn tạo issue thì mở board của đúng project: filter của view gieo sẵn cả hai giá trị
cho card mới.

### 5.5 Các default chạy bằng database event trigger

Fork chạy chúng trong query hook nên mọi đường tạo đều được hưởng. App làm lại bằng trigger, nên
cũng vậy — kể cả khi bản ghi được tạo từ bảng record của Twenty:

| Hành vi | Trigger |
| --- | --- |
| Cấp `issueKey`, điền mirror `app`, gán reporter | `issue.created` |
| Tính lại `timeSpentMinutes` / `remainingEstimateMinutes` | `worklog.*` |
| Sinh `project.key`, seed 5 status, dựng board của project | `project.created` |
| Đồng bộ `workspaceMember.scopedAppIds` | `appAccess.*` |
| Ghi entry `created` vào `issueHistory` | `issue.created` |
| Ghi entry `status-changed` vào `issueHistory` khi status đổi | `issue.updated` |

Mỗi trigger đều bỏ qua phần việc đã có sẵn giá trị, nên bản ghi tạo qua route không bị xử lý hai
lần.

### 5.6 `completeSprint` đổi từ GraphQL mutation sang route

Fork có mutation `completeSprint(sprintId, targetSprintId)`. Giờ là `POST /s/complete-sprint`.

Định nghĩa "issue chưa xong" cũng được sửa cho đúng: fork so `"status" != 'DONE'` bằng SQL, nhưng
`issue.status` đã là quan hệ tới `issueStatus` từ lâu nên điều kiện đó luôn đúng và **mọi** issue bị
đẩy đi. App so theo `issueStatus.category = 'DONE'`.

### 5.7 Màn chi tiết issue

Là một RECORD_PAGE layout **một tab duy nhất**, tab đó ở chế độ `GRID` và xếp như Jira:

- **Description** (front component) chiếm cột đọc rộng bên trái, trên cùng;
- bảng field dùng widget `FIELDS` của host nằm ở cột hẹp bên phải → thay cho `IssueFieldPanel`
  viết tay của fork;
- **Activity** (bình luận + worklog, cũng là front component) nằm **dưới** Description, không còn
  là một tab riêng;
- panel Details (front component) nằm trên, bảng field (`FIELDS` của host) dính ngay dưới nó —
  hai khối này là một danh sách liền, không chen widget nào vào giữa;
- **Subtasks** (issue cha + issue con, bấm mở side panel) và **Attachments** (tên file + copy
  link) là hai widget riêng nằm ngay dưới bảng field ở cột phải. Bảng field chỉ giữ 8 dòng —
  vừa bảng thu gọn — nên hai widget này ghé sát lên thay vì tít dưới trang; mở **More** thì bảng
  cuộn trong ô của nó. Ảnh dán vào description/comment được file tự động vào `issue.attachments`
  (route `append-issue-attachment`) nên cũng hiện ở đây;
- không có tab Files và Timeline — xem mục 5.12.

**Lưới của host: 12 cột, mỗi dòng cao đúng 55px cộng 8px khe** (`PAGE_LAYOUT_CONFIG` và
`PAGE_LAYOUT_GRID_ROW_HEIGHT` trong twenty-front). Chiều cao **không** theo nội dung, nên `rowSpan`
của mỗi widget là một hạn mức pixel cố định và hai front component tự cuộn bên trong.

Hai hệ quả phải biết trước khi sửa `issue-record.page-layout.ts`:

- **`heightBehavior` không dùng được ở tab `GRID`.** Nó chỉ tồn tại trên position kiểu
  `VERTICAL_LIST`, và `normalizePageLayoutTabManifest` **từ chối cả manifest** nếu một widget trong
  tab GRID khai nó.
- **Lưới tự gộp về một cột khi container hẹp hơn 768px** — side panel (320-600px) và pinned left
  panel (348px) luôn rơi vào trường hợp này. Lúc đó mỗi widget giữ nguyên `row` của nó và chiếm
  trọn bề ngang. Vì vậy `row` khai trong source là **thứ tự đọc** (Description → Details →
  Activity), còn hình dạng hai cột trên màn rộng do React Grid Layout nén dọc tạo ra.

**Description đọc-trước, bấm-để-sửa.** Nội dung hiện ở dạng **đã render**, trực tiếp trên
nền trang, không hộp không viền; bấm (hoặc Enter) vào đoạn văn thì hiện khung soạn có viền accent
kèm trạng thái `Saving...`, rời ô (blur) thì tự lưu và quay về bản đọc. Lưu vẫn là autosave:
debounce 700ms cộng một lần flush khi blur. Vào chế độ sửa là mount lại editor nên cú bấm mở khung
không đặt được con trỏ — đặt con trỏ tốn thêm một cú bấm nữa; sandbox không forward autofocus nên
không có đường nào tránh được thứ tự đó.

**Bảng field bật/tắt và sắp xếp lại được — bằng công cụ của chính Twenty, không phải đồ tự viết.**
Widget `FIELDS` đọc danh sách field từ một **view kiểu `FIELDS_WIDGET`**; app ship sẵn view đó ở
`src/views/issue-record-page-fields.view.ts` và trỏ `viewUniversalIdentifier` của widget vào nó.
Thứ tự mặc định theo panel của Jira: mã task, rồi ai/trạng thái, rồi field kế hoạch, rồi field thời
gian. Những field để `isVisible: false` không biến mất mà nằm trong mục **More** thu gọn
(`shouldAllowUserToSeeHiddenFields: true`).

Để người dùng đổi: **Layout customization mode** → bấm vào widget → **Edit Fields** → kéo để đổi
thứ tự, bấm biểu tượng con mắt để hiện/ẩn. Ba điều phải nói rõ với khách:

- cần permission flag **`LAYOUTS`**;
- **chỉ mở được ở trang record đầy đủ, không mở được trong side panel**
  (`RecordPageLayoutEditModeProvider`: `isInEditMode = isLayoutCustomizationModeEnabled &&
  !isInSidePanel`);
- thay đổi lưu vào **metadata view của cả workspace**, không phải per-user: một người sắp xếp lại
  là mọi người thấy như nhau. Với entity do app sở hữu, host ghi dưới dạng **override** nên bản
  `apply` sau của app không xoá mất tuỳ biến đó.

**Đừng gỡ `viewUniversalIdentifier` ra.** Không có view thì host rơi về
`buildDefaultFieldsWidgetGroups`: thứ tự field là thứ tự metadata trả về, **mọi field quan hệ bị ẩn
và không có đường nào mở ra**, và Edit Fields **lưu thất bại** ("Some layout changes could not be
saved") vì `fields-widget-upsert.service.ts` ném `Fields widget has no associated view`.

**Ảnh hiện cả khi đang soạn.** Textarea chỉ chứa text, nên mọi ảnh mà markdown trỏ tới được render
thành một dải ngay dưới ô soạn (`src/utils/collect-markdown-images.util.ts`). Không có nó thì người
viết đang sửa một URL ký dài ngoằng mà không biết đó là ảnh nào.

**Dán một tệp thì trình duyệt dán kèm cả đường dẫn của nó.** Trên Linux, clipboard của một ảnh
chụp màn hình mang **cả** tệp **lẫn** đường dẫn ở dạng `text/plain`. App không huỷ được cú dán đó:
`preventDefaultThenForwardToRemote` của renderer chỉ được gắn cho `dragover`, `drop` và `form
submit`, còn `preventDefault` do chính handler trong sandbox gọi thì sang tới nơi sau khi trình
duyệt đã dán xong (`packages/twenty-front-component-renderer/src/host/events/utils/`). Vì vậy app
**gỡ lại** đoạn text đó khi sự kiện change mang nó về
(`src/utils/remove-native-paste-insertion.util.ts`) — chỉ gỡ đúng trường hợp giá trị mới bằng giá
trị cũ cộng đúng đoạn vừa dán, nên một phím gõ bình thường không bao giờ bị nuốt. Không làm thế thì
người dùng thấy **ảnh cộng thêm một dòng đường dẫn cũ** nằm lại trong nội dung.

**Vì sao Description không dùng widget `FIELD_RICH_TEXT`.** Widget đó không phân giải được field
nào cả. `FieldRichTextConfiguration` chỉ có đúng một khoá `configurationType` — không có
`fieldMetadataId` — và `FieldRichTextCard` của host đọc thẳng field **tên là `bodyV2`** trên bản ghi
đang xem, rồi hiện skeleton khi không thấy. Field rich text của `issue` tên là `description`, nên
widget này đứng nguyên ở skeleton: người dùng thấy một thanh xám rỗng. Đổi tên field thành `bodyV2`
cũng không cứu được: editor của host ghi bằng token của **người xem** (role Member không còn quyền
ghi sau mục 4.1) và nó truy vấn attachment qua `attachment.targetIssueId` — nhánh morph mà cutover
đã xoá (mục 5.12) — nên mỗi lần mở sẽ lỗi filter.

Vì sao Activity không phải widget: widget host đọc/ghi bằng token của người xem, nên ở Mức B (mục
4.1) nó tắt ngóm, và ngay ở Mức A một lần ghi trực tiếp cũng **bỏ qua** việc tính lại
`timeSpentMinutes` / `remainingEstimateMinutes` và bỏ qua quy tắc chỉ tác giả được sửa bình luận.
Đi qua route thì cả hai vẫn được áp dụng.

Cái mất: không có WYSIWYG. Sandbox không có remote element contentEditable và không có Selection
API, nên BlockNote/ProseMirror không chạy được ở đó. Thay vào đó Description, bình luận và mô tả
worklog dùng chung một **editor markdown**: ô textarea + thanh công cụ (đậm, nghiêng, code, tiêu đề,
danh sách, trích dẫn, liên kết) + nút **Preview** render tại chỗ. Ghi vào cả hai nửa của trường
RICH_TEXT — `markdown` là bản gốc, `blocknote` sinh ra từ nó — nên editor thật của host và ô record
table đọc lại vẫn đúng nội dung.

Ba giới hạn của sandbox mà thanh công cụ phải sống chung, đã kiểm chứng trên trình duyệt:

- **`selectionStart`/`selectionEnd` của textarea không sang được sandbox.** Host chỉ serialize một
  danh sách property cố định lên remote element (`applySerializedEventTargetProperties`:
  `value`, `checked`, `files`, scroll và các property media) và selection không nằm trong đó. App
  suy ra **vị trí con trỏ** bằng cách diff giá trị cũ với giá trị mới ở mỗi lần sửa — chính xác cho
  gõ, dán và xoá — nhưng **vùng bôi đen bằng chuột thì không biết được**, nên nút định dạng chèn
  một placeholder (`**bold text**`) tại con trỏ thay vì bọc chữ đang chọn.
- **Dán/thả FILE không mang theo byte.** `SerializedFileData` chỉ có `{name, size, type,
  lastModified}`, và trường `files` chỉ được đọc từ `event.target.files` của một `<input
  type="file">` — không từ `dataTransfer` (thả) cũng không từ `clipboardData` (dán). Đọc clipboard
  cũng bị chặn hẳn (`installClipboardPolyfill` chỉ polyfill `writeText`). Nghĩa là `uploadFile` của
  SDK **không thể** nhận tệp người dùng chọn; nó chỉ dùng được cho Blob do chính sandbox tạo ra —
  kể cả Blob sinh ra từ `fetch`, xem mục 5.7.1.
- **Dán TEXT thì được.** Sự kiện `paste` mang `clipboardText`, nên dán một URL sẽ tự thành markdown:
  `![tên](url)` nếu là ảnh, `[tên](url)` nếu không. Dán hoặc thả **tệp** chỉ hiện một snackbar nói
  rõ là không được, kèm hướng dẫn dùng field **Attachments** (mục 5.7.1).

**Board**, **Backlog**, **Roadmap**, **Description** và **Activity** là năm front component của app.

#### 5.7.1 Ảnh và tệp đính kèm — cái gì chạy, cái gì không

Bảng này là toàn bộ sự thật; đã kiểm chứng trên trình duyệt kèm đối chiếu SQL.

| Người dùng làm gì | Kết quả |
| --- | --- |
| Chọn tệp ở field **Attachments** (tab Issue, widget `FIELDS`) | **Chạy.** Tệp được lưu trong Twenty và gắn vào bản ghi issue |
| Dán một **URL ảnh** vào ô soạn markdown | **Chạy.** Ảnh được tải về, upload vào Twenty, markdown trỏ tới URL của Twenty chứ không hotlink |
| Dán một URL không phải ảnh | Thành `[tên](url)`, không upload gì — đúng ý |
| **Dán một tệp** từ máy (Ctrl+V sau khi copy ảnh) | **Không thể.** Snackbar chỉ sang field Attachments |
| **Thả một tệp** vào ô soạn | **Không thể.** Snackbar chỉ sang field Attachments |

**Vì sao tệp cục bộ phải đi qua field Attachments.** `issue.attachments` là field `FILES`, do host
render trong widget `FIELDS`. Người dùng bấm vào ô đó thì **trình duyệt** mở hộp thoại chọn tệp và
**host** upload — không có byte nào đi qua sandbox. Đây là đường duy nhất cho tệp trên máy người
dùng, vì lý do đã nói ở mục 5.7: `paste` và `drop` không mang byte sang được, và không có bản vá nào
ở phía app sửa được điều đó. (Field `FILES` **khác** widget `FILES` — mục 5.12 vẫn đúng: đừng khai
widget đó.)

**Dán URL ảnh thì upload thật.** Sandbox có `fetch`, `Blob` và `File`, nên
`src/front-components/utils/upload-image-from-url.util.ts` tải URL về thành Blob rồi gọi `uploadFile`
của SDK với `fieldMetadataId` của chính field `attachments`. Markdown chèn vào dùng **URL trả về**,
nên ảnh nằm trong storage của Twenty.

`fieldMetadataId` là id per-workspace, không nhét cứng vào bundle được (chỉ universalIdentifier là
cố định), nên nó được phân giải lúc chạy qua route `POST /s/task-manager/attachment-field`. Route
đọc metadata bằng token của **application**, nên người dùng ở Mức B (mục 4.1) vẫn dán ảnh được.

Bốn đường hỏng, mỗi đường một snackbar riêng, và **URL gốc luôn được giữ lại** trong markdown chứ
không bao giờ mất cái người dùng vừa dán:

| Hỏng ở đâu | Snackbar |
| --- | --- |
| Chưa sync field `attachments` | "The Attachments field is missing…" |
| `fetch` bị chặn (host từ xa không gửi CORS) | "That address could not be read from here…" |
| URL trả về không phải ảnh | "That address did not return an image…" |
| Server từ chối tệp | "The image could not be stored in Twenty…" |

Hai giới hạn còn lại phải nói rõ với khách:

- **CORS.** Sandbox chạy trong iframe `sandbox="allow-scripts"` với `srcdoc`, nên origin của nó là
  `null`. `fetch` tới host khác chỉ chạy khi host đó trả `Access-Control-Allow-Origin: *`. Ảnh trên
  CDN công khai thường có; ảnh sau một trang đăng nhập thì không.
- **URL ký có hạn.** `completeFileUpload` trả về `<SERVER_URL>/file/files-field/<id>?token=<jwt>` với
  hạn `FILE_TOKEN_EXPIRES_IN` (mặc định `1d`). Markdown giữ nguyên URL đó, nên **sau khi token hết
  hạn ảnh trong markdown không hiện nữa** — tệp vẫn còn nguyên trong Twenty và vẫn xem được qua field
  Attachments. Muốn ảnh sống lâu thì tăng `FILE_TOKEN_EXPIRES_IN`.

URL vốn đã nằm trên origin của API thì **không** upload lại: request tới origin đó đi qua host fetch
bridge, mà bridge serialize body bằng `response.text()` (`serializeResponseToHostFetchResult`), tức
là ảnh sẽ hỏng. Gặp URL như vậy app để nguyên, không báo lỗi. "Origin của API" ở đây là
`TWENTY_API_URL` mà host tiêm vào sandbox, tức `REACT_APP_SERVER_BASE_URL` — trên máy dev không đặt
`window._env_` thì biến này rơi về `window.location.origin` (cổng của front), không phải cổng của
server; trên production hai cái trùng nhau.

### 5.8 Board, Backlog và Roadmap đã bị gỡ

Ba màn này từng là front component tự vẽ, tồn tại vì một lý do duy nhất: app-scope nằm trong route
nên UI của Twenty không lọc được. Từ khi app-scope là predicate của core thì lý do đó mất, và
Kanban của core làm tốt hơn phần lớn những gì chúng làm: filter, sort, đổi layout, sửa field tại
chỗ, kéo thả, tạo bản ghi.

Cái mất, cần nói rõ với khách:

- **Backlog** nhóm theo sprint và nút hoàn tất sprint. Route `complete-sprint` vẫn còn và vẫn đúng,
  nhưng không còn màn nào gọi nó.
- **Roadmap** theo epic.
- Ô soạn issue có sẵn project và sprint. Thay bằng nút tạo trên board từng project, filter của view
  gieo sẵn project và app cho card mới.

Vẫn là front component: **Description** và **Activity** trên trang chi tiết issue.

### 5.9 CSS chỉ có inline

SDK không export đường ship stylesheet, nên `:hover` / `:focus` / media query / keyframes phải điều
khiển bằng state qua event. Màu lấy từ CSS variable của Twenty (`src/front-components/components/
task-tokens.ts`) nên vẫn theo light/dark mode.

### 5.10 `issue.merchants` — quan hệ junction, giữ nguyên

Entity cũ của fork có `issue.merchantId` (một merchant cho một issue), nhưng metadata thực tế đã là
**junction**: `issue.merchants` và `merchant.issues` là hai field `ONE_TO_MANY` mang
`junctionTargetFieldId`, đi qua object nối `issueMerchant` (unique index `(merchantId, issueId)`).
Một issue liên kết được nhiều merchant và ngược lại.

App khai lại đúng hình dạng đó bằng `universalSettings.junctionTargetFieldUniversalIdentifier`
(`src/fields/merchants-on-issue.field.ts`, `src/fields/issues-on-merchant.field.ts`), nên **picker
merchant trên issue và picker issue trên merchant giữ nguyên như bản fork** — không phải đi vòng
qua bản ghi `issueMerchant`.

Nếu chỉ khai hai vế `MANY_TO_ONE` trên `issueMerchant` thì `plan` sẽ **xoá** hai field junction này
(dữ liệu trong `_issueMerchant` vẫn còn, nhưng picker trực tiếp thì mất). Diễn tập đã gặp đúng lỗi
đó.

### 5.11 `issueMerchant` hiện ra trong UI

Fork đánh dấu `issueMerchant` là `isSystem` để giấu khỏi UI, nhưng app sync từ chối sửa system
object nên bước re-parent phải gỡ cờ (`scripts/02-reparent-metadata.sql`). **Hệ quả: `issueMerchant`
xuất hiện như một object bình thường**, có bảng record riêng.

Nó chỉ là bảng nối; người dùng nên thao tác qua picker `Merchants` trên issue (mục 5.10). App không
tạo navigation item cho nó, nên nó chỉ lộ ra ở màn Search và danh sách object trong Settings. Muốn
giấu hẳn thì tắt quyền đọc object đó cho role Member (mục 4.1).

### 5.12 Không có tab Files, Timeline, Notes, Tasks trên object của app

Bốn widget này của host đều phân giải qua **nhánh morph trên object upstream** trỏ ngược vào object
task-manager:

| Widget | Cột nó cần |
| --- | --- |
| Files | `attachment.targetIssueId`, `targetProjectId`, `targetMerchantId`, `targetIssueCommentId` |
| Timeline | `timelineActivity.targetIssueId`, `targetEpicId`, `targetMerchantId` |
| Notes | `noteTarget.targetMerchantId` |
| Tasks | `taskTarget.targetMerchantId` |

Các nhánh đó thuộc twenty-standard và **đã bị xoá trong cutover**: giữ lại thì đồ thị metadata không
hợp lệ — vế nghịch nằm bên app còn `relationTargetFieldMetadataId` NULL, và mọi trang của workspace
đổ về `Could not find flat entity in maps`, chặn luôn `apply` của mọi app. SDK chưa cho app khai lại
một nhánh vào field MORPH của standard object, nên không dựng lại được.

Hệ quả: **đừng khai widget `FILES`, `TIMELINE`, `NOTES` hay `TASKS` trong page layout của bất kỳ
object nào app này sở hữu.** Điều này **không** liên quan tới field kiểu `FILES` — `issue.attachments`
là field, do widget `FIELDS` render, không đi qua `attachment` hay nhánh morph nào (mục 5.7.1). Khai rồi thì người dùng thấy
`Invalid filter : timelineActivity object doesn't have any "targetIssueId" field` thay vì nội dung.
`src/page-layouts/issue-record.page-layout.ts` vì thế chỉ có **một** tab: **Issue** (mô tả + bảng
field + bình luận/worklog) — xem mục 5.7.

Dữ liệu cũ không mất, chỉ mất liên kết, và các cặp id đã được giữ lại — xem `MIGRATION.md` mục 5.

### 5.13 View mặc định

Các view `INDEX` ("All Issues", "All Projects"…) mà engine tự tạo cho object standard không tái sử
dụng được: manifest của app luôn tạo view **bổ sung**. App ship view riêng tên "Issues",
"Projects", "Sprints"… Tuỳ biến người dùng lưu trên view INDEX cũ (cột hiện/ẩn, sort) không theo
sang view mới. Riêng object `issue`, ngoài INDEX của engine chỉ còn các board từng project do
trigger dựng (mục 5.4) — không có Kanban dùng chung.

### 5.14 Custom Settings của merchant

Fork dựng cái này bằng cách vá `FieldDisplay.tsx`: ô `merchant.customSettings` (RAW_JSON) bị thay
bằng một button, bấm vào mở modal form. App **không có hook nào vào phần hiển thị của một field** —
`FieldDisplay` là một chuỗi switch đóng trong core — nên hình dạng đổi:

| Fork | App |
|---|---|
| button nằm trong ô field | widget `Custom Settings` riêng trên trang record merchant |
| modal giữa màn hình | popover do host vẽ (`<twenty-overlay>`), neo vào nút `Custom settings` |
| đọc `app.fieldSchema` bằng token người dùng | đọc qua route `merchant-custom-settings` của app này |

Cấu trúc dialog (`merchant-custom-settings-dialog.tsx`) y hệt fork: hai tab **Settings** / **Tools**,
tab bar chỉ hiện khi schema có cả hai loại; tab Settings mang form + Cancel/Save, tab Tools mang
danh sách `MerchantCustomSettingToolCard` (title + status tag bên trái, nút **Run** cùng hàng bên
phải, field hiện sẵn ngay dưới, last-run bên dưới field) + nút Close. Mỗi tool Run độc lập với
Settings và với các tool khác — không có Save chung.

**Bẫy:** `<twenty-overlay>` tự định vị lại mỗi khi phần tử nó bọc đổi chiều cao
(`ResizeObserver` trong `TwentyOverlayRenderer`), và khi chiều cao vượt mép viewport nó **lật**
giữa mở-xuống và mở-lên. Settings (3-4 field) và Tools (nhiều tool, field lồng nhau) cao khác hẳn
nhau, nên chuyển tab = cả dialog nhảy vị trí. Sửa bằng cách khoá vùng nội dung ở `height` **cố
định** (không phải `maxHeight`) — `CONTENT_HEIGHT` trong `merchant-custom-settings-dialog.tsx` —
cuộn bên trong khi tràn, nên tổng chiều cao dialog không đổi dù đang ở tab nào. Đánh đổi: tab
Settings có khoảng trống dưới field cuối nếu Tools cao hơn.

`TaskSelect` (chỉ mình file này dùng) đổi từ render listbox **in-flow** (đẩy nội dung bên dưới
xuống — lý do cũ: tránh bị `overflow:hidden` của widget FIELDS cắt, xem comment cũ trong file)
sang **popover nổi** qua `<twenty-overlay>` riêng của nó, lồng bên trong overlay của dialog. Đúng
bên trong một dialog vốn đã nổi thì nổi thêm lần nữa không có gì lạ; lý do tránh floating cũ chỉ
áp dụng khi `TaskSelect` còn được dùng trực tiếp trong widget page-layout, hiện không còn chỗ nào
dùng kiểu đó.

Vì sao phần này nằm ở Task Manager chứ không phải Customer Support — app sở hữu object `merchant`:
schema nằm trên `app.fieldSchema`, và `app` là gốc app-scope của app này. Role runtime của
Customer Support không đọc được object `app`, còn mọi grant per-app (`appAccess`) thì ở đây. Hai
route mới đi qua đúng `runScopedRoute` + `assertRecordInScope` như mọi route khác:

- `POST /task-manager/merchant-custom-settings` — trả schema + values + `canUpdate`. Không có grant
  `read` trên app của merchant thì `PERMISSION_DENIED`.
- `POST /task-manager/update-merchant-custom-settings` — cần grant `write`. Schema được **đọc lại ở
  server**, không tin payload: key nào app không khai thì không ghi. Key nào không nằm trong schema
  mà đang có sẵn trên record thì giữ nguyên.

Role runtime của app vì vậy được mở `canUpdateObjectRecords` trên `merchant` (trước là read-only).
Xoá thì vẫn không.

**Widget gắn vào tab của app khác.** Trang record merchant là "Default Merchant Layout" do
application **Standard** sở hữu — nó có sẵn trong workspace, không app nào khai. App này gắn thêm
một `pageLayoutWidget` standalone vào tab Home của trang đó
(`src/page-layout-widgets/merchant-custom-settings.page-layout-widget.ts`), không khai lại cả trang
layout. UID của tab là literal `c578b3a9-a013-560e-99d8-957d8e338f65`; nó là v5 theo namespace
Standard nên giống nhau ở mọi workspace, nhưng **không được tính lại trong code front component** —
module uuid bị stub trong bundle, kết quả ra giá trị rác.

**Bẫy quen thuộc:** chỉ cần một lần kéo thả trong Edit Layout là vị trí widget bị ghim vào override
của người dùng, và manifest hết tác dụng với riêng người đó. Widget "biến mất" sau khi sửa
`index` thường là cái này, không phải cache.

`fieldSchema` nhận cả hai hình dạng: mảng entry kiểu fork
(`[{key,label,type,options,default,required}]`) và map `{"plan": {"type": "string"}}` mà dữ liệu
seed đang mang. Kiểu field: TEXT, NUMBER, DATE, BOOLEAN, SELECT, ARRAY, RICH_TEXT, FILE.

**TOOL là một loại entry RIÊNG, không phải field.** `normalizeCustomSettingSchema` trả
`{fields, tools}` và mọi thứ ghi xuống record chỉ duyệt `fields`. Đây không phải chuyện gọn gàng:
giá trị lưu dưới key của một TOOL là envelope `{runId, requestedAt, requestedBy, status, params,
result}` do app phía webhook cập nhật. Đọc TOOL như một field thì nó hiện ra thành ô text chứa
`[object Object]`, và lần Save kế tiếp ghi đè envelope bằng đúng chuỗi đó — mất lịch sử chạy.
Route update cũng duyệt `fields` nên payload cố tình gửi `{"importCustomerPhone": "wiped!"}` cũng
không đụng được vào envelope.

**Run ghi nửa `REQUESTED`, nửa `PROCESSING/DONE/FAILED` là việc của app bên ngoài.** Route
`run-merchant-custom-setting-tool`:

- gác bằng `assertRecordInScope(operation: 'write')`, đọc lại schema ở server (không tin payload —
  `toolKey` lạ hoặc field ngoài khai báo của tool bị từ chối với `Unknown tool` / `Missing required
  fields`)
- dựng envelope `{runId: crypto.randomUUID(), requestedAt, requestedBy, status: 'REQUESTED', params}`
  — `requestedBy` lấy email của caller qua `resolveCallerEmail` (một query `workspaceMembers` bằng
  token của application, caller không có workspace member — API key, application — thì bỏ qua field
  này)
- ghi đè **đúng một key** của `customSettings`, giữ nguyên mọi key khác — kể cả envelope của tool
  khác đang chạy dở

Không có đường nào trong app này nhận lại `PROCESSING/DONE/FAILED`. App đứng sau webhook (Shopify
app của bạn) đọc `runId` để dedupe, làm việc, rồi tự ghi `customSettings` của đúng merchant đó bằng
tín thực của chính nó — y hệt cách tôi test thủ công bằng `curl PATCH /rest/merchants/:id` ở bước
build tính năng này. Request đó không đi qua role `Task Manager member`/`Task Manager runtime`, nên
phải có quyền ghi `merchant` theo cách riêng của nó (API key với `canBypassAppScope`, hoặc bất cứ
credential nào bạn đã cấp cho tích hợp Shopify). Nếu webhook của bạn không echo lại được, tag sẽ
đứng yên ở `REQUESTED` mãi — không phải lỗi của route này.

**FILE: kéo-thả, dán, hoặc chọn bằng hộp thoại OS — cả ba đều cho handle thật.** Trước đây
`<input type="file">` trong front component chỉ gửi sang guest metadata (`name`, `size`, `type`,
`lastModified`) khi người dùng chọn file qua `change` — `handle` để gọi `uploadFileByHandle` chỉ
được cấp cho `paste` và `drop` (`serializeTransferredFileList`, bảng `EVENT_TYPE_TO_TRANSFER_KEY`
chỉ có hai key đó). Đã vá thêm nhánh `change` đọc `event.target.files` trong
`twenty-front-component-renderer` (`resolveFileListLike`, cùng file) — tái dùng nguyên
`stashTransferredFile`, không thêm cơ chế mới. Hai file đổi, có test:
`serializeTransferredFileList.ts` + `serializeTransferredFileList.test.ts` +
`serializeEvent.test.ts` (test end-to-end xác nhận handle từ DOM event thật tới
`takeTransferredFile`). Không cần sửa gì ở `applySerializedEventTransferredFiles.ts` (phần guest):
`applySerializedEventTargetProperties` đã gán `element.files = eventData.files` cho **mọi** loại
sự kiện từ trước, nhánh `paste`/`drop` riêng chỉ vì hai loại đó cần dựng thêm
`event.clipboardData`/`event.dataTransfer`.

`merchant-custom-setting-file-input.tsx` giờ là một `<label>` bọc `<input type="file" hidden>`:
bấm vào mở đúng hộp thoại OS, không cần gọi method `.click()` qua remote-dom — bảng `properties`
của `HtmlInputElement` trong `remote-elements.ts` (generated) có `methods: Record<string, never>`,
nghĩa là `.click()` **không** được forward, nên phải dùng hành vi native "label kích hoạt control
nó bọc", không JS. Xác nhận bằng Playwright thật (`browser_click` + nhận diện `[File chooser]`),
không phải suy đoán.

Ai muốn hộp thoại chọn file kiểu khác vẫn có đường riêng: field `merchant.customSettingFiles` được
host vẽ bằng picker của chính nó trong widget Fields.

Upload phải nhắm vào một field FILES có thật — không có kho vô danh — nên app khai
`merchant.customSettingFiles` (`src/fields/custom-setting-files-on-merchant.field.ts`) làm **thư
mục**, còn `customSettings[key]` giữ **tham chiếu** `{fileId, label, extension, url}`. Giá trị của
chính field đó không bao giờ được ghi; nó hiện ra như một dòng rỗng trong widget Fields của
merchant, ẩn đi được bằng chính widget đó.

`fieldMetadataId` là metadata theo từng workspace nên không nhúng vào bundle được: route
`merchant-custom-settings` resolve nó bằng token của application, và **chỉ resolve khi schema thật
sự có FILE** — mọi trang merchant đều gọi route này, thêm một round trip metadata cho schema không
có FILE là phí.

⚠️ **URL lưu trong `customSettings` có hạn.** Nó là link ký sẵn, token `exp` cách `iat` đúng 24 giờ.
Phần bền là `fileId`; app nào tiêu thụ file (webhook của tool chẳng hạn) phải tải sớm, hoặc tự ký
lại URL từ `fileId`, chứ đừng cất URL đó đi dùng sau. Bản fork cũng mang đúng tính chất này.

Và lưu ý: trong schema production hiện tại, FILE **chỉ xuất hiện bên trong TOOL**. Tool chưa chạy
được từ UI, nên đường FILE chỉ với tới được qua một field FILE ở cấp cao nhất — tới khi nút Run có
mặt.

## 6. Kiểm tra sau deploy

```bash
yarn twenty dev:function:logs --remote prod
yarn twenty dev:function:exec -n board-data --remote prod
```

`dev:function:exec` cần remote đăng nhập bằng user; API key không đủ quyền. Tên function là tên khai
trong `defineLogicFunction({ name })`, không phải tên file — ở app này hai tên trùng nhau.

Danh sách kiểm bằng tay, theo thứ tự:

1. Sidebar hiện folder **Task Manager** với Board / Backlog / Roadmap và các view record.
2. **Apps** → tạo một app. **App Accesses** → cấp `READ` + `WRITE` cho chính mình.
3. **Board** → ô chọn project trống (chưa có project nào) và hiện "Bạn chưa được cấp quyền vào dự án
   nào." — đúng, fail-closed.
4. Tạo project qua route (API hoặc UI có gọi route), gán app vừa tạo → project có key và 5 trạng
   thái.
5. **Board** → gõ tiêu đề vào ô **Issue mới** → Tạo. Thẻ hiện ở cột đầu tiên với `issueKey` dạng
   `<KEY>-1`, `reporter` là chính mình.
6. **Board** → kéo một thẻ sang cột khác, reload, thẻ vẫn ở cột mới. Gõ vào ô **tìm kiếm** thì
   danh sách lọc theo key/tiêu đề ngay; menu **Fields** bật tắt được chip trên thẻ. Bấm vào một thẻ
   thì mở **side panel** chi tiết, board vẫn ở phía sau.
7. Mở issue → chỉ có **một** tab **Issue**, xếp hai cột: **Description** trên bên trái (văn bản
    đọc trực tiếp, bấm vào mới hiện khung soạn có viền accent, rời ô thì tự lưu và về bản đọc),
    **Details** bên phải, **Activity** dưới Description. Không có tab Files/Timeline —
    xem mục 5.12. Thu hẹp cửa sổ dưới 768px → ba khối xếp một cột theo thứ tự Description → Details →
    Activity.
    Trong Activity, tab **Comments** / **Worklogs** / **History** là segmented control, ô soạn bình
    luận phải nằm **trên** danh sách bình luận và mỗi bình luận có avatar
    tác giả. Ô soạn, nút và ô chọn ngày phải
    trông như control của Twenty, không phải control mặc định của trình duyệt. Thử **Preview** trên ô
   soạn bình luận và dán một URL ảnh công khai — markdown phải tự thành `![…](…)` và URL trong đó
   phải đổi thành `<SERVER_URL>/file/files-field/…` sau một hai giây (ảnh đã vào storage của Twenty).
   Ở bảng **Fields**, bấm field **Attachments** → hộp thoại chọn tệp của trình duyệt mở ra → chọn một
   ảnh → nó hiện thành chip trên field. Thử **thả** một tệp vào ô soạn: phải ra snackbar chỉ sang
   field Attachments, không được im lặng. Xem mục 5.7.1.
8. **Backlog** → tạo sprint, kéo issue vào, bấm **Bắt đầu sprint** rồi **Kết thúc sprint**.
9. Đăng nhập bằng một member **không** có `appAccess` trên app đó → Board hiện rỗng, không lỗi.
10. Mở issue → khối **Activity** → viết một bình luận và log 30 phút. Bình luận hiện tên và avatar
    đúng, và `Time spent` ở bảng **Details** tăng đúng 30 phút (route tự tính lại).
11. Nếu chọn **Mức B** ở bước 4.1: vẫn member đó, gọi thẳng GraphQL `issues` → **phải trả về rỗng**.
    Ở Mức A câu này trả về dữ liệu, đúng như bảng ở mục 4.1 mô tả.

## 7. Gỡ

```bash
yarn twenty app:uninstall --remote prod
```

**Xoá luôn 12 object và toàn bộ dữ liệu** — project, issue, comment, worklog, sprint, epic, cả
`merchant` và `app`. Với production đang chạy thì đây là lệnh huỷ dữ liệu, không phải lệnh gỡ cài
đặt. `merchant-email-campaigns` cũng hỏng theo vì field của nó nằm trên `merchant`. Export trước.
