# Hướng dẫn dựng 2 Workflow Mattermost cho tính năng Quản lý ca CS

> **Task 16** của feature `cs-shift-management`. Tài liệu này hướng dẫn Leader/PO dựng **2 workflow** trong màn **Workflows** của Twenty để bắn thông báo Mattermost — **không có bất kỳ dòng code thông báo nào phía server** (quyết định 12/08/2026, BR-9.5).
>
> - **Workflow 1 — "Shift punch → Mattermost"**: mỗi lần check-in / check-out, bot post vào channel team (check-in muộn kèm nhãn `⚠ muộn +X phút`). Chạy theo trigger *Record Updated* trên object `shift`.
> - **Workflow 2 — "Nhắc đăng ký Chủ nhật"**: 15:00 ICT Chủ nhật hàng tuần, bot @mention từng member **chưa có ca nào của tuần kế tiếp**, kèm link trang đăng ký + hạn chót. Chạy theo trigger *Cron*.
>
> Webhook URL / channel / lời văn tin / điều kiện gửi **đều là DATA trong node workflow** — Leader/PO tự sửa, không cần dev/deploy. Tắt workflow = ngừng gửi tin, thao tác chấm công vẫn chạy bình thường (BR-9.4).

Ảnh chụp màn hình chèn ở các mốc `📷 [Screenshot: ...]` — chụp lại khi dựng thật trên workspace của bạn.

---

## 0. Khảo sát năng lực engine (đọc engine, không đoán)

Trước khi dựng, đây là các năng lực **đã kiểm chứng trong source** của workflow engine Twenty trong repo này. Mỗi kết luận kèm `file:line`. Chỗ nào engine **yếu hơn** giả định của plan thì ghi rõ **phương án thay thế**.

### (a) Trigger *Record Updated* có lọc được theo field vừa đổi không? — ✅ CÓ

- Trigger *Record Updated* lưu setting kiểu `UpdateEventTriggerSettings = BaseDatabaseEventTriggerSettings & { fields: string[] }`.
  `packages/twenty-server/src/modules/workflow/workflow-trigger/automated-trigger/constants/automated-trigger-settings.ts:18-20`
- Payload sự kiện update **có** mảng `updatedFields: string[]` (tên các field vừa thay đổi):
  `packages/twenty-shared/src/database-events/object-record.base.event.ts:3-8`
- Listener chỉ kích hoạt workflow khi field theo dõi nằm trong `updatedFields`; nếu để trống danh sách field → chạy trên **mọi** lần update:
  ```
  return (
    !settings.fields ||
    settings.fields.length === 0 ||
    settings.fields.some((field) => updatedFields.includes(field))
  );
  ```
  `packages/twenty-server/src/modules/workflow/workflow-trigger/automated-trigger/listeners/workflow-database-event-trigger.listener.ts:404-424`
- Ngoài lọc theo field, trigger còn hỗ trợ **lọc theo giá trị record** (`filter.stepFilters` chạy qua `evaluateStepFilters`):
  `...workflow-database-event-trigger.listener.ts:428-455` và `automated-trigger-settings.ts:5-10`

**Kết luận:** Workflow 1 **có thể** chỉ chạy khi `checkInAt` hoặc `checkOutAt` thay đổi → chọn 2 field này ở phần **"Watch fields"** của trigger.

> **⚠ Fallback nếu UI phiên bản của bạn không có ô chọn field theo dõi:** để trigger chạy trên mọi update, rồi thêm một **node Filter** ngay sau trigger để chặn theo `status` (chỉ tiếp tục khi `status` ∈ `{IN_PROGRESS, COMPLETED}`). Đánh đổi: có thể phát sinh vài tin trùng khi leader sửa các field khác của ca đã COMPLETED — chấp nhận được vì đây là kênh phụ.

### (b) Node *HTTP Request* có nhận body JSON tùy biến + nội suy biến không? — ✅ CÓ

- Input node: `{ url, method, headers?, body? }`, `body` là object JSON **hoặc** string:
  `packages/twenty-server/src/modules/workflow/workflow-executor/workflow-actions/http-request/types/workflow-http-request-action-input.type.ts:1-16`
- **Toàn bộ** `settings.input` (url + headers + body) được chạy qua `resolveInput(...)` trước khi gọi → mọi biến `{{...}}` trong body/URL/header đều được nội suy:
  `packages/twenty-server/src/modules/workflow/workflow-executor/workflow-actions/tool-backed/tool-backed.workflow-action.ts:66-69`
- Cú pháp biến **thật** của engine là **`{{ ... }}`** (regex `\{\{([^{}]+)\}\}`), resolve bằng Handlebars trên context:
  `packages/twenty-shared/src/utils/variable-resolver.ts:8` · `packages/twenty-shared/src/utils/evalFromContext.ts`
- **Đường dẫn biến của record trigger:** record sau update nằm ở `trigger.properties.after.<field>`. (Xác nhận qua test của engine: `{{trigger.properties.after.name}}`, `{{trigger.properties.after.createdBy.source}}` — `...filter/utils/__tests__/evaluate-step-filters.util.spec.ts:88,32`.) Hằng `TRIGGER_STEP_ID = 'trigger'` — `packages/twenty-shared/src/workflow/constants/TriggerStepId.ts:1`.
- Body được gửi đúng theo `content-type`: đặt header `content-type: application/json` thì body object serialize thành JSON:
  `packages/twenty-server/src/engine/core-modules/tool/tools/http-tool/http-tool.ts:29-49`

**Kết luận:** viết body JSON `{ "channel_id": "...", "message": "... {{trigger.properties.after.checkInAt}} ..." }` là hợp lệ.

> **Lưu ý SSRF:** HTTP tool đi qua `secureHttpClientService` — chỉ gọi được host **công khai**. `mattermost-bot.bsscommerce.com` là public nên OK; nếu trỏ webhook nội bộ IP private sẽ bị chặn.

### (c) *If/Else* & *Filter* so sánh số `checkInLateMinutes > 0` được không? — ⚠ CÓ, nhưng **không có toán tử `>` thuần**

- Bộ toán tử số của engine chỉ gồm: `GREATER_THAN_OR_EQUAL` (≥), `LESS_THAN_OR_EQUAL` (≤), `IS` (=), `IS_NOT` (≠), `IS_EMPTY`, `IS_NOT_EMPTY`. **Không có** `GREATER_THAN` (`>`) tuyệt đối:
  `packages/twenty-server/src/modules/workflow/workflow-executor/workflow-actions/filter/utils/evaluate-filter-conditions.util.ts:431-459` (hàm `evaluateNumberFilter`)
  enum: `packages/twenty-shared/src/types/ViewFilterOperand.ts:4-6`
- `If/Else` và `Filter` dùng **cùng** cấu trúc `StepFilter` / `StepFilterGroup` (gộp AND/OR):
  `...if-else/if-else.workflow-action.ts` · `...filter/filter.workflow-action.ts` · `...if-else/types/workflow-if-else-action-settings.type.ts`

**Kết luận / cách diễn đạt `checkInLateMinutes > 0`:** vì phút là số nguyên, dùng **`checkInLateMinutes` `Greater than or equal` `1`**. (Tương đương `> 0`.)
Nếu cần chắc chắn loại `null`, thêm nhánh phụ `checkInLateMinutes` `Is not empty` (AND). Cách khác: `checkInLateMinutes` `Is not` `0`.

### (d) *Cron trigger* nhận pattern `0 8 * * 0` không? Timezone? — ✅ CÓ (pattern CUSTOM), giờ chạy theo **TZ của server**

- Cron trigger hỗ trợ kiểu `{ type: 'CUSTOM', pattern: string }` (ngoài preset DAYS/HOURS/MINUTES):
  `packages/twenty-server/src/modules/workflow/workflow-trigger/types/workflow-trigger.type.ts` (khối `WorkflowCronTrigger`)
- Pattern được validate bằng `cron-parser` (chuẩn 5 trường Unix cron hợp lệ):
  `packages/twenty-server/src/modules/workflow/workflow-trigger/utils/compute-cron-pattern-from-schedule.ts`
- Root job quét mỗi phút (`* * * * *`) rồi so khớp từng trigger:
  `packages/twenty-server/src/modules/workflow/workflow-trigger/automated-trigger/crons/jobs/workflow-cron-trigger-cron.job.ts:31`
- **Timezone:** dedup service parse pattern **không truyền tùy chọn `tz`** → `cron-parser` khớp theo **giờ local của tiến trình Node** (biến môi trường `TZ`):
  `packages/twenty-server/src/engine/core-modules/cron/services/cron-trigger-deduplication.service.ts:26-30`

**Kết luận & lập luận UTC→ICT:**
- Deploy chuẩn của Twenty chạy server ở **UTC**. Với server UTC: **`0 8 * * 0`** = 08:00 UTC Chủ nhật = **15:00 ICT (UTC+7) Chủ nhật** → đúng BR-8.1.
- Nếu server **không** chạy UTC (ví dụ đặt `TZ=Asia/Ho_Chi_Minh`), thì `0 8 * * 0` sẽ là **08:00 sáng ICT** — sai. Khi đó dùng **`0 15 * * 0`** để có 15:00 ICT.
- 👉 **Trước khi go-live phải xác nhận `TZ` của tiến trình server** rồi chọn pattern cho khớp. Ghi lại giá trị đã chọn vào ô ghi chú của workflow.

### (e) *Find Records* + *Code* + *Iterator* đủ để tính "member chưa có ca tuần sau" không? — ✅ CÓ

- **Find Records** (`record-crud`): `{ objectName, filter (gqlOperationFilter), orderBy, limit, offset }` → truy vấn `shift` theo khoảng `date` và truy vấn `workspaceMember`:
  `packages/twenty-server/src/engine/core-modules/record-crud/types/record-crud-input.type.ts` (type `FindRecordsInput`)
- **Code** = *logic function* serverless chạy **JS thật**, nhận `logicFunctionInput` (đã resolve biến `{{...}}`) và trả `data`:
  `...workflow-actions/code/code.workflow-action.ts` · `...code/types/workflow-code-action-input.type.ts` · `packages/twenty-server/src/engine/core-modules/logic-function/logic-function-drivers/interfaces/logic-function-driver.interface.ts`
  → **Sandbox**: không nối trực tiếp DB. Vì vậy **truyền 2 mảng kết quả Find Records vào input** rồi diff bằng JS (không cần code tự query).
- **Iterator**: lặp qua một mảng (`items`), tối đa 10.000 vòng, chạy lại các node trong thân loop cho từng phần tử:
  `...workflow-actions/iterator/iterator.workflow-action.ts:23,90` → dùng khi cần gửi **N email** cho N member thiếu (BR-8.3).

**Kết luận:** Workflow 2 = *Find Records (ca tuần sau)* → *Find Records (member)* → *Code (diff → build text)* → *HTTP Request*. (Tùy chọn email dự phòng: *Iterator* + *Send Email*.)

### Tóm tắt field object `shift` (dùng cho biến & filter)

Nguồn: `packages/twenty-server/src/modules/shift/standard-objects/shift.workspace-entity.ts:8-34`

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `name` | text | Tên hiển thị của ca (label ca) |
| `date` | date (chuỗi `YYYY-MM-DD`) | Ngày của ca |
| `status` | text | `UPCOMING` / `IN_PROGRESS` / `COMPLETED` / `CANCELLED` |
| `templateCode`, `templateName` | text | Mã / tên mẫu ca (đóng dấu lúc đăng ký) |
| `startTime`, `endTime` | text | Khung giờ ca |
| `checkInAt` | date_time | Thời điểm bấm check-in |
| `checkOutAt` | date_time | Thời điểm bấm check-out |
| `checkInLateMinutes` | number | Số phút vào muộn (0/null = không muộn) |
| `workingMinutes` | number | Giờ công thực tế (phút) |
| `rateMultiplier` | number | Hệ số OT |
| `member` (relation) → `memberId` | relation | `workspaceMember` sở hữu ca. Relation được **enrich sẵn** trong payload trigger |

`workspaceMember`: `name` (FullName: `firstName`/`lastName`) và `userEmail` — `packages/twenty-server/src/modules/workspace-member/standard-objects/workspace-member.workspace-entity.ts:59,63`.

> **Chú ý về tên hiển thị trong tin:** `shift.name` là **label của ca**, không phải tên người. Muốn hiển thị **tên member** dùng `{{trigger.properties.after.member.name.firstName}} {{trigger.properties.after.member.name.lastName}}`. Trong các mẫu tin dưới đây, chỗ cần "tên người trực" bạn tự chọn dùng field member; chỗ cần "tên ca" dùng `name`/`templateCode`.

---

## 1. Payload gateway Mattermost BSS (bắt chước, KHÔNG import)

Nguồn tham chiếu (repo anh em, **không** import): `/home/pc/project/bloy/bloy_loyalty/shopify-app-loyalty-api/src/shared/bot/mmBot.service.ts`.

Mọi lời gọi bot trong repo đó đều là:

```
POST https://mattermost-bot.bsscommerce.com/send
Content-Type: application/json

{
  "channel_id": "<ID channel Mattermost>",
  "message":    "<nội dung tin, hỗ trợ Markdown + \n xuống dòng>"
}
```

→ Trong node **HTTP Request** ta mirror đúng 2 key: **`channel_id`** và **`message`**. `channel_id` và URL do Leader/PO **gõ vào node** (data), server không giữ.

> **Về xác thực gateway:** trong `mmBot.service.ts`, request kèm header cookie phiên Mattermost (`MMAUTHTOKEN`/`MMUSERID`/`MMCSRF`) + `x-csrf-token`. Nếu gateway `/send` của bạn **yêu cầu** các header này, thêm chúng vào ô **Headers** của node (cũng là data trong node, không phải code/env). Nếu gateway là cổng nội bộ tin cậy chỉ cần `{channel_id, message}` thì để URL + body là đủ.
>
> **Phương án chuẩn thay thế (nếu team dùng Incoming Webhook gốc của Mattermost):** URL dạng `https://<mattermost-host>/hooks/<token>` và body `{ "channel": "<tên-channel>", "text": "<nội dung>", "username": "Shift Bot" }`. Chọn 1 trong 2 kiểu tuỳ hạ tầng — phần còn lại của recipe giữ nguyên.

---

## 2. Workflow 1 — "Shift punch → Mattermost"

**Ý tưởng:** ca bị update → nếu là lần **check-in** thì post tin (kèm nhãn muộn nếu `checkInLateMinutes ≥ 1`); nếu là lần **check-out** thì post tin giờ công.

📷 [Screenshot: màn Workflows → nút **New Workflow**, đặt tên "Shift punch → Mattermost"]

### Node 1 — Trigger: Record Updated

| Ô cấu hình | Giá trị |
|---|---|
| Trigger type | **Record is updated** |
| Object | **Shift** |
| **Watch fields** (field theo dõi) | `Check In At`, `Check Out At` |

→ Nhờ (a), trigger chỉ chạy khi 1 trong 2 field trên đổi (bỏ qua các update khác như đổi handover note).

📷 [Screenshot: cấu hình trigger Record Updated, ô Watch fields chọn Check In At + Check Out At]

> Nếu UI không có ô Watch fields: dùng fallback ở (a) — bỏ trống, thêm node **Filter** sau trigger: `Status` `Is` `IN_PROGRESS` **OR** `Status` `Is` `COMPLETED`.

### Node 2 — If / Else: phân loại 3 nhánh

Thêm node **If/Else**. Tạo các nhánh (branch) theo thứ tự; branch đầu tiên khớp sẽ chạy:

**Nhánh A — Check-in muộn**
Điều kiện (AND):
- `{{trigger.properties.after.checkInLateMinutes}}` — toán tử **Greater than or equal** — giá trị **`1`**
  *(diễn đạt `> 0` theo (c) — engine không có `>` thuần)*

**Nhánh B — Check-in đúng giờ**
Điều kiện (AND):
- `{{trigger.properties.after.checkInAt}}` — **Is not empty**
- `{{trigger.properties.after.checkOutAt}}` — **Is empty**
  *(đã có check-in, chưa check-out → đây là sự kiện check-in đúng giờ; nhánh A đã bắt trường hợp muộn nên tới đây coi như đúng giờ)*

**Nhánh C (Else / mặc định) — Check-out**
- Không cần điều kiện (nhánh Else): rơi vào đây khi `checkOutAt` vừa được set.
  *(Nếu UI bắt buộc có điều kiện: `{{trigger.properties.after.checkOutAt}}` **Is not empty**.)*

📷 [Screenshot: node If/Else với 3 nhánh A/B/C]

> **Vì sao xếp thứ tự này:** một lần update thường chỉ set 1 trong 2 mốc. Check-in muộn ⊂ check-in, nên A phải đứng trước B. Check-out là sự kiện khi `checkOutAt` chuyển từ rỗng → có giá trị.

### Node 3 — HTTP Request cho mỗi nhánh

Mỗi nhánh nối tới **một** node HTTP Request riêng (cùng URL + `channel_id`, khác `message`).

**Cấu hình chung cả 3 node:**

| Ô | Giá trị |
|---|---|
| Method | **POST** |
| URL | `https://mattermost-bot.bsscommerce.com/send` *(Leader/PO điền)* |
| Headers | `content-type: application/json` *(+ header auth gateway nếu cần — xem §1)* |

**Body — Nhánh A (check-in muộn):**
```json
{
  "channel_id": "<CHANNEL_ID>",
  "message": "✅ {{trigger.properties.after.member.name.firstName}} {{trigger.properties.after.member.name.lastName}} check-in ca {{trigger.properties.after.templateCode}} lúc {{trigger.properties.after.checkInAt}} — ⚠ muộn +{{trigger.properties.after.checkInLateMinutes}} phút"
}
```

**Body — Nhánh B (check-in đúng giờ):**
```json
{
  "channel_id": "<CHANNEL_ID>",
  "message": "✅ {{trigger.properties.after.member.name.firstName}} {{trigger.properties.after.member.name.lastName}} check-in ca {{trigger.properties.after.templateCode}} lúc {{trigger.properties.after.checkInAt}}"
}
```

**Body — Nhánh C (check-out):**
```json
{
  "channel_id": "<CHANNEL_ID>",
  "message": "🏁 {{trigger.properties.after.member.name.firstName}} {{trigger.properties.after.member.name.lastName}} check-out ca {{trigger.properties.after.templateCode}} — giờ công {{trigger.properties.after.workingMinutes}} phút"
}
```

> Muốn dùng **tên ca** thay vì tên người, thay cụm `member.name.*` bằng `{{trigger.properties.after.name}}`. Có thể ghép thêm khung giờ: `({{trigger.properties.after.startTime}}–{{trigger.properties.after.endTime}})`.

📷 [Screenshot: node HTTP Request nhánh A, tab Body với JSON có biến]

### Kích hoạt

Bấm **Activate**. Workflow 1 xong.

📷 [Screenshot: workflow 1 ở trạng thái Active]

---

## 3. Workflow 2 — "Nhắc đăng ký Chủ nhật"

**Ý tưởng:** 15:00 ICT Chủ nhật → lấy danh sách ca tuần kế tiếp + danh sách member đang hoạt động → diff ra ai chưa có ca nào → @mention họ kèm link đăng ký + hạn chót.

📷 [Screenshot: New Workflow "Nhắc đăng ký Chủ nhật"]

### Node 1 — Trigger: Cron

| Ô | Giá trị |
|---|---|
| Trigger type | **Cron / Scheduled** |
| Schedule type | **Custom (cron expression)** |
| Pattern | **`0 8 * * 0`** *(server UTC → 15:00 ICT CN)* — xem (d); nếu server `TZ=Asia/Ho_Chi_Minh` dùng **`0 15 * * 0`** |

📷 [Screenshot: cron trigger với pattern 0 8 * * 0]

> Ghi chú ngay vào workflow: "`0 8 * * 0` = 08:00 UTC = 15:00 ICT — giả định server chạy UTC".

### Node 2 — Find Records: ca của tuần kế tiếp

| Ô | Giá trị |
|---|---|
| Object | **Shift** |
| Filter | `date` **≥** thứ 2 tuần sau **AND** `date` **≤** Chủ nhật tuần sau **AND** `status` **Is not** `CANCELLED` |
| Limit | đủ lớn (vd 500) |

> Khoảng ngày "tuần kế tiếp" tính từ thời điểm chạy (Chủ nhật). Nếu UI filter khó nhập ngày động, để filter rộng hơn (vd `date` trong 8 ngày tới) rồi để **node Code** (Node 4) lọc chính xác khoảng `[T2..CN]` — engine cho phép vì Code nhận cả mảng vào và tự cắt.

### Node 3 — Find Records: member đang hoạt động

| Ô | Giá trị |
|---|---|
| Object | **Workspace Member** |
| Filter | (theo tiêu chí "đang hoạt động" của workspace, BR-8.2 — vd loại tài khoản đã deactivate) |
| Limit | đủ lớn |

> Nếu không có cờ "active" sạch để filter ở đây, lấy tất cả member rồi lọc trong Node Code.

### Node 4 — Code (JS): diff → build tin @mention

Tạo node **Code**. **Input** (map biến từ 2 node Find Records ở trên — dùng variable picker; ví dụ tên output có thể là `{{step_2.records}}` / `{{step_3.records}}` tuỳ id node của bạn):

| Input key | Giá trị (biến) |
|---|---|
| `shifts` | output records của Node 2 |
| `members` | output records của Node 3 |
| `serverUrl` | URL app của bạn, vd `https://sae-cs.example.com` *(data, tự điền)* |
| `deadline` | ví dụ `"Chủ nhật 23:59"` |

**Source (JS)** — diff và dựng text @mention (handle = phần local-part của email theo convention SBC-BOSS):
```js
export const handler = async ({ shifts, members, serverUrl, deadline }) => {
  const shifts_ = Array.isArray(shifts) ? shifts : [];
  const members_ = Array.isArray(members) ? members : [];

  // member đã có ít nhất 1 ca tuần sau (bỏ ca đã hủy nếu lọt qua filter)
  const withShift = new Set(
    shifts_
      .filter((s) => s && s.status !== 'CANCELLED')
      .map((s) => s.memberId)
      .filter(Boolean),
  );

  const missing = members_.filter((m) => m && !withShift.has(m.id));

  const mentions = missing
    .map((m) => {
      const email = m.userEmail || '';
      const handle = email.includes('@') ? email.split('@')[0] : email;
      return handle ? '@' + handle : '';
    })
    .filter(Boolean)
    .join(' ');

  const message = missing.length
    ? `🔔 Nhắc đăng ký ca tuần sau!\n${mentions}\n` +
      `Bạn chưa đăng ký ca nào cho tuần kế tiếp. Vào ${serverUrl}/shift/register để đăng ký trước ${deadline}.`
    : '';

  return {
    message,
    missingCount: missing.length,
    // để bước email tuỳ chọn iterate
    missingMembers: missing.map((m) => ({ email: m.userEmail, name: m.name })),
  };
};
```

> `serverUrl + '/shift/register'` khớp route đăng ký của app (Task 12/14). `handler` nhận input đã resolve biến `{{...}}`, trả `data` (ở đây là `{ message, missingCount, missingMembers }`).

📷 [Screenshot: node Code với source + input mapping]

### Node 5 — HTTP Request → Mattermost

| Ô | Giá trị |
|---|---|
| Method | **POST** |
| URL | `https://mattermost-bot.bsscommerce.com/send` |
| Headers | `content-type: application/json` *(+ auth nếu cần)* |
| Body | JSON dưới |

```json
{
  "channel_id": "<CHANNEL_ID>",
  "message": "{{step_4.message}}"
}
```

*(thay `step_4` bằng id thật của node Code)*

> **Tùy chọn — chặn gửi tin rỗng:** thêm node **Filter** trước Node 5: `{{step_4.missingCount}}` **Greater than or equal** `1` → không ai thiếu thì không post.

### Node 6 (tùy chọn) — Email dự phòng (BR-8.3)

Dùng **Iterator** lặp `{{step_4.missingMembers}}` → trong loop đặt node **Send Email**:

| Ô Send Email | Giá trị |
|---|---|
| Connected account | tài khoản email đã kết nối của workspace |
| Recipients | `{{iterator.currentItem.email}}` |
| Subject | `Nhắc đăng ký ca tuần sau` |
| Body | `Bạn chưa đăng ký ca nào cho tuần kế tiếp. Vào {{serverUrl}}/shift/register để đăng ký trước hạn.` |

Nguồn iterator: tối đa 10.000 vòng — `...iterator/iterator.workflow-action.ts:23`.

### Kích hoạt

Bấm **Activate**. Workflow 2 xong.

---

## 4. Phân quyền & Go-live

Webhook URL + `channel_id` nằm **trong node workflow** → ai xem/sửa Workflows là thấy được. Vì vậy:

- **Chỉ Leader/PO** được quyền xem/sửa Workflows. Vào **Settings → Roles**, mở role **CS Member** (role hạn chế thêm ở Task 15), **bỏ** mọi quyền liên quan Workflows (view/edit). Chỉ role Admin/Leader (Jane = Admin/Leader trong seed) giữ quyền.
  - Khớp ma trận quyền: dòng *"Cấu hình bot Mattermost (webhook, channel, bật/tắt)"* = ✕ với Member, ✔ với Leader/PO (`business-requirements.md` §6).
- Điều này **ăn khớp** với role **CS Member** non-elevated đã thêm ở Task 15 (`canUpdateAllObjectRecords=false`, RVP scope `shift` về chính mình). Member vẫn đăng ký/hủy ca của mình nhưng **không** đụng được webhook.
- **Bảo mật:** server **không** giữ/log bất kỳ webhook URL hay secret nào (BR-9.5); tắt workflow = ngừng gửi tin, dữ liệu chấm công không đổi (BR-9.4).

📷 [Screenshot: Settings → Roles → CS Member, phần Workflows tắt quyền]

---

## 5. Workflow là DATA theo workspace (không đi theo migration/seed)

- 2 workflow này là **dữ liệu trong workspace**, **không** nằm trong code sync / migration / dev-seeder. **Workspace mới phải dựng lại từ tài liệu này** — giống role CS Member + RVP ở Task 15 (cũng là dữ liệu, dựng tay lúc go-live).
- Ghi vào **release note**: *"Workspace mới → dựng lại 2 workflow Mattermost theo `mattermost-workflows.md` (Task 16)."*
- **Log mỗi lần chạy** xem ở record **`Workflow Run`** (mỗi lần trigger tạo 1 `workflowRun`, có step logs của từng node — payload gửi, response HTTP). Dùng để debug khi tin không tới.

---

## 6. Checklist kiểm chứng (làm trên dev, trỏ webhook về channel test)

- [ ] **Check-in tạo tin (trong vài giây):** sửa tay `checkInAt` của một ca (hoặc bấm Check-in trên `/shift`) → channel test nhận tin `✅ ... check-in ...` trong vài giây.
- [ ] **Cờ muộn hiển thị đúng:** đặt `checkInLateMinutes = 5` (hoặc check-in trễ 5') → tin có đuôi `⚠ muộn +5 phút`; check-in đúng giờ (`checkInLateMinutes` = 0/null) → tin **không** có nhãn muộn.
- [ ] **Check-out tạo tin giờ công:** set `checkOutAt` → tin `🏁 ... check-out ... giờ công X phút`.
- [ ] **Trigger không nhiễu:** sửa 1 field khác của ca (vd `handoverNote`) mà không đụng `checkInAt`/`checkOutAt` → **không** phát sinh tin (nhờ Watch fields ở (a)).
- [ ] **Nhắc Chủ nhật:** bấm **Run** thử Workflow 2 → tin @mention **đúng** các member đang hoạt động **chưa có ca** tuần sau; member đã có ca **không** bị nhắc; không ai thiếu → không post (nếu bật Filter).
- [ ] **Timezone:** xác nhận `TZ` server; nếu UTC thì `0 8 * * 0` chạy 15:00 ICT CN (kiểm bằng `Workflow Run` timestamp).
- [ ] **Không chặn thao tác (BR-9.4):** **Deactivate cả 2 workflow** → check-in/out trên app **vẫn thành công**, chỉ **không** có tin. Chứng minh thông báo là async, không nằm trên đường ghi dữ liệu.
- [ ] **Phân quyền:** đăng nhập bằng user role CS Member (seed: Jony) → **không** vào được màn Workflows / không thấy webhook URL.
- [ ] **Log:** mở record `Workflow Run` tương ứng → thấy step log HTTP Request (body đã nội suy biến + response 2xx từ gateway).

---

### Phụ lục — vì sao không có code server

Thiết kế cũ (`ShiftMattermostService` + 5 file cron + object `shiftSetting`) **đã bị gỡ** khỏi phạm vi (quyết định 12/08/2026, xem `plans.md` Task 5 — giữ số để tham chiếu). Toàn bộ thông báo giờ chạy bằng workflow engine. Nếu về sau **bắt buộc** cần code path (vd logic diff quá phức tạp cho node Code), thiết kế cron-code cũ vẫn còn trong lịch sử git của plan này để khôi phục — nhưng mặc định **không dùng**.
