# Deploy lên production

App này không nằm trong build của server. Nó được đẩy lên một Twenty server đang chạy bằng CLI
`twenty`, từ một máy có source của app (máy dev hoặc runner CI). Server production không cần
checkout repo.

App sở hữu 11 object: `app`, `appAccess`, `merchant`, `project`, `sprint`, `epic`, `issueStatus`,
`issue`, `issueMerchant`, `issueComment`, `worklog`. Không có app `bss-core` riêng — `app`,
`appAccess` và `merchant` thuộc về app này.

**Nếu đang chuyển production từ nhánh fork sang `apps/zero-core`, đừng đọc file này trước.** Đọc
`packages/twenty-apps/internal/CUTOVER.md` (thứ tự tổng thể) rồi `MIGRATION.md` (chi tiết của app
này). File này chỉ mô tả cài mới lên một workspace chưa có dữ liệu task-manager.

## 1. Điều kiện phía server

| Thứ cần có | Vì sao |
| --- | --- |
| `LOGIC_FUNCTION_TYPE=LOCAL` trong env của server **và** worker | Mặc định biến này chỉ là `LOCAL` khi `NODE_ENV=development`; ngoài ra là `DISABLED` (`config-variables.ts`). Để `DISABLED` thì **mọi route của app đều không chạy**: board, backlog, roadmap trống trơn, không tạo được issue, không kết sprint. App này là route-only, nên đây là điều kiện cứng chứ không phải tuỳ chọn. |
| Server ở phiên bản `>= 2.43.0` | `package.json` pin `twenty-sdk` 2.43.0. CLI chỉ cảnh báo khi lệch **major**, nên 2.43 với server 2.44+ chạy bình thường. |
| Object `workspaceMember` là standard object của upstream | App khai báo 8 quan hệ ngược lên nó (`ledProjects`, `assignedIssues`, `reportedIssues`, `assignedEpics`, `ownedSprints`, `issueComments`, `worklogs`, `appAccesses`) bằng universalIdentifier chuẩn `20202020-3319-4234-a34c-82d5c0e881a6`. |

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

### 4.1 Gỡ quyền trực tiếp khỏi role Member — **bắt buộc**

App-scope được thực thi trong route (`src/logic-functions/app-scope/`), không phải trong ORM như bản
fork. Nghĩa là **một request GraphQL thẳng tới `issues` vẫn trả về mọi issue của workspace** nếu role
còn quyền. Chưa làm bước này thì app-scope **chưa có hiệu lực**.

Settings → Roles → role **Member** (và mọi role không phải admin) → với từng object dưới đây:

```
Project, Issue, Issue Status, Issue Comment, Issue Merchant,
Epic, Sprint, Worklog, Merchant, App, App Access
```

Có hai mức, chọn một. Khác nhau ở chỗ widget do host render (ở app này chỉ còn `FIELDS`) **đọc và
ghi bằng token của chính người đang xem**, nên nó tắt ngóm nếu role mất quyền đọc.

| | Mức A — khoá ghi | Mức B — khoá cả đọc |
| --- | --- | --- |
| `canUpdateObjectRecords` | tắt | tắt |
| `canReadObjectRecords` | **giữ** | tắt |
| Ghi đi qua route, app-scope ghi có hiệu lực | có | có |
| App-scope **đọc** có hiệu lực | **không** — member gọi thẳng API đọc được mọi dòng | có |
| Trang chi tiết issue — bảng **Fields** (widget host) | chạy | **không mở được** |
| Widget **Description** (front component) | chạy | chạy |
| Board / Backlog / Roadmap / tab Activity | chạy | chạy |

**Mức A là mặc định nên dùng.** Nó giữ trọn vẹn tính toàn vẹn dữ liệu — cấp `issueKey`, tính lại
thời gian, seed trạng thái, kiểm tra app-scope khi ghi — và vẫn xem được bảng field của host. Cái
mất là phạm vi **đọc**: đây là khác biệt lớn nhất so với bản fork và phải nói rõ với khách hàng.

**Mức B** dành cho workspace bắt buộc phải giấu dữ liệu giữa các app. Lúc đó member chỉ làm việc qua
Board / Backlog / Roadmap; trang chi tiết issue thành màn của admin. Tab **Activity** (bình luận và
worklog) là front component gọi route nên **vẫn chạy ở cả hai mức** — đó là lý do nó không phải
widget RECORD_TABLE.

Role `Task Manager runtime` mà app tạo ra là role của chính app (route chạy bằng token application),
đừng gán cho người.

### 4.2 Kiểm tra lại quyền admin

Người có permission flag `WORKSPACE` hoặc `ROLES` **bypass toàn bộ app-scope** (xem mục 5). Rà lại
danh sách này trước khi golive.

## 5. Khác biệt so với bản core (fork)

Liệt kê đầy đủ, để không ai bất ngờ sau golive.

### 5.1 App-scope chuyển từ ORM sang route

| | Fork | App |
| --- | --- | --- |
| Đọc | `applyAppScopeFilter` chèn subquery vào **mọi** query, kể cả GraphQL trực tiếp | Route tự lọc: `listVisibleProjectIds` gom tập project nhìn thấy được rồi lọc `projectId IN (...)`. GraphQL trực tiếp **không** bị lọc |
| Ghi | `validateAppScopeForRecords` + pre-query hook trên mọi mutation | `assertAppScopeWriteAccess` trong từng route. Mutation GraphQL trực tiếp **không** bị chặn |
| Nguồn quyền | cache Redis `appScopeGrants`, invalidate bằng post-hook trên `appAccess` | đọc `appAccess` mỗi request. Không cache, nên đổi quyền có hiệu lực ngay, đổi lại là chậm hơn một chút mỗi request |

Hệ quả trực tiếp: **bước 4.1 là bắt buộc**, không phải khuyến nghị.

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

### 5.4 Kanban per-project biến mất

Fork tạo **một view Kanban cho mỗi project** (kèm filter cố định theo project) trong post-hook của
`project.createOne`, và đồng bộ ViewGroup mỗi khi tạo/xoá `issueStatus`. App không tạo view lúc
runtime được.

Thay bằng: một view Kanban duy nhất **By Status** (`src/views/issues-by-status.view.ts`, giữ nguyên
universalIdentifier `29063dae-…` của fork) nhóm theo quan hệ `status`, không có view group tĩnh —
nên status mới tự thành cột, không cần đồng bộ. Lọc theo project thì dùng màn **Board** của app, có
sẵn ô chọn project.

Các view Kanban per-project đã tồn tại trên production vẫn còn nguyên sau khi re-parent; chúng chỉ
không được đồng bộ ViewGroup nữa. Xem `MIGRATION.md`.

### 5.5 Seed trạng thái mặc định và các default khác chỉ chạy qua route

Fork chạy các việc này trong query hook, nên **mọi** đường tạo bản ghi đều được hưởng. App chỉ chạy
chúng trong route:

| Hành vi | Chỉ có khi gọi qua |
| --- | --- |
| Seed 5 trạng thái mặc định (Backlog / Todo / In Progress / In Review / Done) | route `create-project` |
| Sinh `project.key` từ tên | route `create-project` |
| Sinh `issue.issueKey` | route `create-issue`, `update-issue` — trên UI là ô **Issue mới** ở đầu màn Board |
| Gán `issue.reporter` mặc định là người tạo | route `create-issue` |
| Gán `worklog.member` mặc định là người ghi | route `create-worklog` |
| Tính lại `issue.timeSpentMinutes` / `remainingEstimateMinutes` | route `create-worklog`, `update-worklog`, `delete-worklog` |

Tạo project thẳng từ bảng record (Task Manager → Projects → thêm dòng) sẽ ra một project **không có
trạng thái nào và không có key**. Đây là lý do thứ hai để làm bước 4.1.

### 5.6 `completeSprint` đổi từ GraphQL mutation sang route

Fork có mutation `completeSprint(sprintId, targetSprintId)`. Giờ là `POST /s/complete-sprint`.

Định nghĩa "issue chưa xong" cũng được sửa cho đúng: fork so `"status" != 'DONE'` bằng SQL, nhưng
`issue.status` đã là quan hệ tới `issueStatus` từ lâu nên điều kiện đó luôn đúng và **mọi** issue bị
đẩy đi. App so theo `issueStatus.category = 'DONE'`.

### 5.7 Màn chi tiết issue

Là một RECORD_PAGE layout với hai tab:

- bảng field dùng widget `FIELDS` của host → thay cho `IssueFieldPanel` viết tay của fork;
- **Description** là **front component**, không phải widget `FIELD_RICH_TEXT`;
- tab **Activity** (bình luận + worklog) cũng là **front component**, không phải widget
  `RECORD_TABLE`;
- không có tab Files và Timeline — xem mục 5.12.

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

### 5.8 Kéo thả viết tay

Board và Backlog kéo thả bằng HTML5 drag-and-drop gốc (`draggable` + `onDragStart`/`onDragOver`/
`onDrop`), browser tự hit-test. `@hello-pangea/dnd` không dùng được vì nó hit-test bằng
`document.elementFromPoint` mà sandbox không có `document`. Hành vi người dùng thấy là như nhau:
kéo giữa các cột, kéo giữa các sprint, thả vào đúng vị trí trong danh sách.

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
`src/page-layouts/issue-record.page-layout.ts` vì thế chỉ có hai tab: **Issue** (bảng field + mô tả)
và **Activity** (bình luận + worklog).

Dữ liệu cũ không mất, chỉ mất liên kết, và các cặp id đã được giữ lại — xem `MIGRATION.md` mục 5.

### 5.13 View mặc định

Các view `INDEX` ("All Issues", "All Projects"…) mà engine tự tạo cho object standard không tái sử
dụng được: manifest của app luôn tạo view **bổ sung**. App ship view riêng tên "Issues",
"Projects", "Sprints"… Tuỳ biến người dùng lưu trên view INDEX cũ (cột hiện/ẩn, sort) không theo
sang view mới. View Kanban **By Status** thì giữ nguyên identifier của fork nên không mất.

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
7. Mở issue → chỉ có **hai** tab: **Issue** (bảng field + widget **Description**) và **Activity**.
   Không có tab Files/Timeline — xem mục 5.12. Description phải hiện nội dung, **không** phải một
   thanh xám rỗng; bấm **Edit** → sửa markdown → **Save** thì nội dung render lại có định dạng.
   Trong Activity, chuyển qua lại giữa **Comments** và **Worklogs**; ô soạn, nút và ô chọn ngày phải
   trông như control của Twenty, không phải control mặc định của trình duyệt. Thử **Preview** trên ô
   soạn bình luận và dán một URL ảnh công khai — markdown phải tự thành `![…](…)` và URL trong đó
   phải đổi thành `<SERVER_URL>/file/files-field/…` sau một hai giây (ảnh đã vào storage của Twenty).
   Ở bảng **Fields**, bấm field **Attachments** → hộp thoại chọn tệp của trình duyệt mở ra → chọn một
   ảnh → nó hiện thành chip trên field. Thử **thả** một tệp vào ô soạn: phải ra snackbar chỉ sang
   field Attachments, không được im lặng. Xem mục 5.7.1.
8. **Backlog** → tạo sprint, kéo issue vào, bấm **Bắt đầu sprint** rồi **Kết thúc sprint**.
9. Đăng nhập bằng một member **không** có `appAccess` trên app đó → Board hiện rỗng, không lỗi.
10. Mở issue → tab **Activity** → viết một bình luận và log 30 phút. Bình luận hiện tên đúng, và
    `Time spent` trên tab Issue tăng đúng 30 phút (route tự tính lại).
11. Nếu chọn **Mức B** ở bước 4.1: vẫn member đó, gọi thẳng GraphQL `issues` → **phải trả về rỗng**.
    Ở Mức A câu này trả về dữ liệu, đúng như bảng ở mục 4.1 mô tả.

## 7. Gỡ

```bash
yarn twenty app:uninstall --remote prod
```

**Xoá luôn 11 object và toàn bộ dữ liệu** — project, issue, comment, worklog, sprint, epic, cả
`merchant` và `app`. Với production đang chạy thì đây là lệnh huỷ dữ liệu, không phải lệnh gỡ cài
đặt. `merchant-email-campaigns` cũng hỏng theo vì field của nó nằm trên `merchant`. Export trước.
