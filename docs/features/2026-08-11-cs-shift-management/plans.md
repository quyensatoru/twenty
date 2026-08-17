# Plan triển khai Quản lý ca làm việc CS

> **Dành cho agentic worker:** BẮT BUỘC dùng sub-skill subagent-driven-development để thực thi plan này theo từng task. Các step dùng cú pháp checkbox (`- [ ]`) để theo dõi tiến độ.

**Mục tiêu:** Bổ sung bộ tính năng ca làm việc (danh mục ca, đăng ký theo tuần, chấm công check-in/check-out với cờ muộn không ân hạn, hệ số OT lễ tết, leader bù công trực tiếp, thông báo Mattermost, báo cáo cho member) vào `twenty-task-manager-sae` cho team CS SAE — mô phỏng quy trình team TC và module shift của SBC-BOSS.

**Kiến trúc:** Ba _standard object_ mới của Twenty (`shiftTemplate`, `specialDay`, `shift`) định nghĩa qua cơ chế metadata bằng code của fork (UUID registry ở twenty-shared + các flat-metadata builder), business logic đặt trong `WorkspaceQueryHook` pre/post hook, ba action nguyên tử (`checkInShift`, `checkOutShift`, `cancelShift`) là custom mutation `@CoreResolver` (theo mẫu `completeSprint`), **toàn bộ thông báo Mattermost (check-in/out + nhắc Chủ nhật) chạy bằng hai workflow dựng trong workflow engine có sẵn của Twenty** (record-update trigger / cron trigger + node http-request — không có code thông báo phía server), cùng ba trang frontend dưới `/shift` tái sử dụng pattern provider-stack của `TaskManagerPageShell` với các generic record hook.

**Tech stack:** NestJS + Twenty workspace metadata engine (twenty-server), React 18 + Linaria + Jotai + Apollo (twenty-front), Lingui i18n, Jest, BullMQ + Redis, webhook bot Mattermost (gateway BSS).

---

## 0. Bối cảnh — đọc trước khi bắt đầu

### 0.1 Yêu cầu nghiệp vụ

Spec nghiệp vụ chuẩn: [`business-requirements.md`](./business-requirements.md) (FR-1 → FR-9). Quy trình gốc team TC: [`requirements.md`](./requirements.md). Tóm tắt những gì plan này hiện thực hóa:

- **Danh mục ca** (`shiftTemplate`): mã, khung giờ HH:mm, loại ngày (WEEKDAY/WEEKEND/HOLIDAY_OT), cửa sổ check-in sớm, ân hạn check-out (trần giờ công), lương/giờ (tùy chọn). Là dữ liệu, không phải code — SAE tự sửa lúc runtime; bộ ca theo TC chỉ là seed cho môi trường dev.
- **Đăng ký theo tuần**: đăng ký cho tuần kế tiếp, hạn Chủ nhật. Các ngưỡng cam kết (29h / 5 ca trong tuần / 1–3 ca cuối tuần / 30h thực tế) **hoàn toàn nằm ngoài hệ thống** (quyết định PO 11/08/2026): UI chỉ hiện tổng số trung tính; PO tự nhắc từng CS qua báo cáo. Backend chỉ enforce rule toàn vẹn dữ liệu (ngày quá khứ, trùng ca, slot OT độc quyền).
- **Chấm công**: nút check-in/check-out; giờ công bị chặn trần theo cửa sổ ca (`bắt đầu − sớm` → `kết thúc + ân hạn`); handover note tùy chọn khi check-out. **Check-in muộn KHÔNG có ân hạn** (quyết định 12/08/2026): đúng giờ = bấm trước hoặc đúng giờ bắt đầu; quá giờ ≥1 phút ⇒ ca lưu `checkInLateMinutes` và bị gắn cờ **Check-in muộn** ở mọi nơi. Ngưỡng 15 phút giờ **chỉ** áp dụng cho cờ cảnh báo check-out trong báo cáo.
- **Mattermost (FR-8/FR-9, quyết định 12/08/2026)**: mỗi lần check-in/check-out bot post vào channel của team (check-in muộn kèm nhãn "⚠ muộn +X phút"); nhắc đăng ký Chủ nhật 15:00 ICT cũng đi qua bot này. **Toàn bộ chạy bằng 2 workflow của Twenty** (BR-9.5): Leader/PO dựng/sửa trong màn Workflows — lời văn tin, webhook, channel, điều kiện gửi đều là data trong workflow node, không dùng env var, không có code thông báo phía server. Workflow chạy async sau sự kiện nên KHÔNG BAO GIỜ chặn thao tác chấm công (BR-9.4); bước email dự phòng thêm được ngay trong workflow nhắc (BR-8.3).
- **Điều chỉnh**: không có luồng duyệt trong hệ thống (quyết định PO 11/08/2026). Quên check-in/out → member nhắn leader (chat); leader sửa thẳng `checkInAt`/`checkOutAt` trên record ca, post-hook tự tính lại `workingMinutes`, `checkInLateMinutes` + trạng thái. Xin nghỉ/đổi ca → member tự hủy ca (lý do + phân loại) sau khi trao đổi với leader.
- **Hệ số OT**: danh mục ngày đặc biệt (lặp hàng năm hoặc ngày cụ thể, hệ số ≥1, lấy max khi trùng) chốt vào ca lúc đăng ký; leader sửa được từng ca. Slot HOLIDAY_OT **độc quyền giữa các member** (rule TC "không đăng ký trùng ca nhau").
- **Vai trò (quyết định 12/08/2026)**: đúng hai vai — Member và một vai gộp **Leader/PO** duy nhất. Member chỉ thao tác trên dòng của mình và không bao giờ tự sửa được dữ liệu chấm công; role Leader/PO có các flag object-permission (`canUpdateAllObjectRecords`…) khiến `shouldBypassAppScope` trả true — đây là phép kiểm tra "quyền cao" mà plan này tái dùng ở mọi nơi.
- **Hiển thị lương (quyết định 12/08/2026)**: Leader/PO thấy tất cả; member chỉ thấy lương/thu nhập **của chính mình**. Cách làm: `salaryPerHour` vẫn đọc được qua API với mọi workspace member (cần cho việc tự tính thu nhập phía client), view danh mục seed sẵn **không có cột lương**, trang báo cáo bị khóa về chính mình với member (nên earnings hiển thị luôn là của họ), lưới đăng ký không bao giờ render lương.
- **Báo cáo**: trang Tuần-của-tôi (ngày/tuần) + báo cáo tháng theo member với các thẻ: số ca đăng ký, tổng giờ đăng ký, hoàn thành, vắng (suy diễn), **check-in muộn**, đã hủy, tổng giờ công (làm tròn 2 chữ số từng ca rồi cộng), giờ OT, thu nhập ước tính.

### 0.2 Ngoài phạm vi (có chủ đích, không được build)

- **Lệnh** chat-bot `!shift checkin` (chiều inbound) — Mattermost ở đây chỉ outbound (thông báo + nhắc); chấm công thực hiện trên UI.
- Tích hợp Slack/Lark — chỉ Mattermost.
- Scope theo team/app cho các object ca — v1 là workspace-global. Nếu sau này cần đa team, nối `shiftTemplate` vào `app` là có row filtering miễn phí qua cơ chế app-scope của fork.
- Khôi phục ca đã hủy (SBC-BOSS `PATCH /shifts/:id/resurrect`) — hủy + đăng ký lại là đủ (duplicate check bỏ qua ca đã hủy).
- Object đề nghị/duyệt trong hệ thống (`shiftRequest`) — từng thiết kế, **đã bỏ theo quyết định PO 11/08/2026** (khớp với SBC-BOSS, cũng không có luồng duyệt); leader sửa punch trực tiếp, member tự hủy.
- Code thông báo/cron nhắc phía server (`ShiftMattermostService`, cron 5 file, object cấu hình `shiftSetting`) — từng thiết kế, **đã bỏ theo quyết định 12/08/2026**: toàn bộ chạy bằng workflow engine có sẵn (Task 16).
- Cảnh báo ngưỡng cam kết (29h/5/1–3/30h) trên UI — bỏ theo cùng quyết định; chỉ hiện tổng số trung tính.
- Xuất XLSX chấm công, rule fill slot cuối tuần cấp team, màn hình coverage dạng heatmap — backlog sau v1 (rule cuối tuần đã bị từ chối rõ ràng 12/08/2026).

### 0.3 File tham chiếu cần đọc (các idiom plan này sao chép)

| Vấn đề                                   | File tham chiếu                                                                                                                                                                                                             |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry object trong UUID registry         | `packages/twenty-shared/src/metadata/constants/standard-object.constant.ts` (key `worklog`, ~dòng 2652)                                                                                                                     |
| Field builder                            | `packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/compute-worklog-standard-flat-field-metadata.util.ts`                                                                 |
| Shape options của field SELECT           | grep `FieldMetadataType.SELECT` trong `.../twenty-standard-application/utils/field-metadata/` và bắt chước đúng shape `options: [{value,label,color,position}]`                                                             |
| Pre-query hook                           | `packages/twenty-server/src/modules/worklog/query-hooks/worklog-create-one.pre-query.hook.ts`                                                                                                                               |
| Post-hook + shared service               | `packages/twenty-server/src/modules/worklog/query-hooks/worklog-post-query-hook.service.ts`                                                                                                                                 |
| Util kiểm tra quyền sở hữu               | `packages/twenty-server/src/modules/issue-comment/utils/assert-issue-comment-author-or-app-scope-access-or-throw.util.ts`                                                                                                   |
| Custom mutation                          | `packages/twenty-server/src/modules/sprint/{resolvers/sprint-complete.resolver.ts, workspace-services/sprint-complete.workspace-service.ts, sprint.module.ts}`                                                              |
| Phong cách unit test cho hook            | `packages/twenty-server/src/modules/project/query-hooks/__tests__/project-create-one.pre-query.hook.spec.ts`                                                                                                                |
| Cron (pattern 5 file)                    | `packages/twenty-server/src/engine/trash-cleanup/`                                                                                                                                                                          |
| Upgrade command                          | `packages/twenty-server/src/database/commands/upgrade-version-command/2-26/2-26-workspace-command-1784910000000-sync-epic-standard-objects.command.ts`                                                                      |
| Shell cho custom page                    | `packages/twenty-front/src/modules/task-manager/components/TaskManagerPageShell.tsx`                                                                                                                                        |
| Frontend hook full-CRUD                  | `packages/twenty-front/src/modules/task-manager/issue-detail/hooks/useIssueWorklogs.ts`                                                                                                                                     |
| Custom mutation phía frontend            | `packages/twenty-front/src/modules/task-manager/backlog/{graphql/completeSprint.ts, hooks/useCompleteSprint.ts}`                                                                                                            |
| Dev seeds                                | `packages/twenty-server/src/engine/workspace-manager/dev-seeder/data/constants/worklog-data-seeds.constant.ts` + `.../services/dev-seeder-data.service.ts`                                                                  |
| **Shape gọi gateway bot Mattermost BSS** | `/home/pc/project/bloy/bloy_loyalty/shopify-app-loyalty-api/src/shared/bot/mmBot.service.ts` (repo anh em — POST tới `https://mattermost-bot.bsscommerce.com/send`; bắt chước payload/cách đọc env, KHÔNG import trực tiếp) |

### 0.4 Mô hình dữ liệu

Mọi giá trị giờ-trong-ngày là `TEXT 'HH:mm'` (cho phép `'24:00'` làm mốc cuối ngày); ngày lịch là `TEXT 'YYYY-MM-DD'` theo ICT, so sánh theo thứ tự từ điển; các mốc chấm công là `DATE_TIME` thật. "Hôm nay" luôn lấy qua `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })` — không bao giờ dùng `new Date(y, m, d)` (bài học CRM-1024 của SBC-BOSS).

**`shiftTemplate`** (danh mục; label identifier `name`, icon `IconClockCog`)
`name` TEXT · `code` TEXT (vd `SAE-TT-D`) · `startTime`/`endTime` TEXT HH:mm · `dayKind` SELECT `WEEKDAY|WEEKEND|HOLIDAY_OT` · `earlyCheckInMinutes` NUMBER nullable (null = tắt guard cửa sổ check-in) · `lateCheckOutMinutes` NUMBER nullable (null = tắt trần giờ công) · `salaryPerHour` NUMBER nullable (API đọc được; ẩn khỏi view danh mục seed sẵn) · `color` TEXT · `isActive` BOOLEAN mặc định true · `description` TEXT · reverse `shifts`

**`specialDay`** (danh mục ngày lễ/hệ số OT; label identifier `name`, icon `IconCalendarStar`)
`name` TEXT · `kind` SELECT `YEARLY|SPECIFIC` · `month`/`day` NUMBER nullable (YEARLY) · `date` TEXT 'YYYY-MM-DD' nullable (SPECIFIC) · `multiplier` NUMBER mặc định 2 · `isActive` BOOLEAN mặc định true

**`shift`** (một dòng = đăng ký + chấm công, theo SBC-BOSS; label identifier `name`, icon `IconCalendarClock`)
`name` TEXT (tự sinh `"<code> <date>"`) · `date` TEXT 'YYYY-MM-DD' · `status` SELECT `UPCOMING|IN_PROGRESS|COMPLETED|CANCELLED` mặc định UPCOMING · snapshot `templateCode`/`templateName`/`startTime`/`endTime` TEXT · `checkInAt`/`checkOutAt` DATE_TIME nullable · **`checkInLateMinutes` NUMBER nullable** (null = đúng giờ; ≥1 = số phút quá giờ bắt đầu, đóng dấu lúc check-in / leader sửa — không ân hạn) · `workingMinutes` NUMBER nullable (đóng băng lúc check-out) · `rateMultiplier` NUMBER nullable (null = 1.0; chốt từ specialDay lúc tạo) · `handoverNote` TEXT · `cancelReason` TEXT · `cancelCategory` SELECT `SICK|PERSONAL|SWAP|OTHER` nullable · `cancelledAt` DATE_TIME nullable · `member` M-1 → workspaceMember (SET_NULL, `memberId`) · `shiftTemplate` M-1 → shiftTemplate (SET_NULL, `shiftTemplateId`)

**Vai trò:** member thao tác trên dòng của mình (enforce trong query hook bằng cách so `authContext.workspaceMemberId`); vai gộp **Leader/PO** duy nhất được tạo lúc runtime với `canUpdateAllObjectRecords`… để `shouldBypassAppScope` trả true — đúng phép kiểm tra mà issue-comment đang dùng. Không cần hạ tầng phân quyền mới. Khi go-live, cấu hình role member **không có quyền sửa Workflows** (Settings → Roles) — webhook URL nằm trong workflow node.

**Mattermost:** chỉ outbound, chạy hoàn toàn bằng 2 workflow của Twenty (Task 16) — server không giữ, không log webhook URL nào; tắt workflow là ngừng gửi tin, dữ liệu chấm công không bị ảnh hưởng.

### 0.5 Sổ UUID (đã sinh sẵn — copy chính xác; được tham chiếu chéo giữa các task)

| Hằng số                                      | UUID                                   |
| -------------------------------------------- | -------------------------------------- |
| object `shiftTemplate`                       | `930c8d12-0e7e-427c-87ec-5b155483b5d4` |
| object `specialDay`                          | `25080a86-ab21-450f-b33b-b8be58f36a59` |
| object `shift`                               | `476bd249-6ab7-472f-82e0-3e538b41722d` |
| workspaceMember.`shifts` (inverse)           | `217853a5-299d-4b07-8b6b-cf1e8c3bc14b` |
| shift.`checkInLateMinutes` (field)           | `3d35e034-133b-445b-be6a-282e8ff20932` |
| viewField `checkInLateMinutes` của allShifts | `04603f50-3eb9-4ec0-8312-461a8322b5a1` |

Các UUID field/index/view còn lại liệt kê trực tiếp trong Task 1. Giá trị là tùy ý nhưng phải giữ y hệt ở mọi nơi xuất hiện (registry entry ↔ builder ↔ upgrade command).

---

### Task 1: Entry UUID registry trong twenty-shared

**Mục tiêu:** Đăng ký 3 object, toàn bộ field/index/view của chúng, và inverse field trên `workspaceMember` vào UUID registry chung, để mọi `satisfies` map phía sau có key để kiểm tra.

**Files:**

- Sửa: `packages/twenty-shared/src/metadata/constants/standard-object-universal-identifiers.constant.ts`
- Sửa: `packages/twenty-shared/src/metadata/constants/standard-object.constant.ts`
- Sửa: `packages/twenty-shared/src/metadata/constants/standard-page-layout-universal-identifiers.constant.ts`

- [ ] **Step 1: Thêm 3 object identifier**

Trong `standard-object-universal-identifiers.constant.ts`, chèn theo thứ tự alphabet:

```ts
shift: '476bd249-6ab7-472f-82e0-3e538b41722d',
shiftTemplate: '930c8d12-0e7e-427c-87ec-5b155483b5d4',
specialDay: '25080a86-ab21-450f-b33b-b8be58f36a59',
```

- [ ] **Step 2: Thêm 3 entry object vào `standard-object.constant.ts`**

Bắt chước đúng shape của entry `worklog` (system field qua `buildStandardObjectSystemFields(...)`). Chèn:

```ts
shiftTemplate: {
  universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.shiftTemplate,
  fields: {
    ...buildStandardObjectSystemFields(STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.shiftTemplate),
    name:                { universalIdentifier: 'bc1b50d2-ae16-4ced-87c6-d44dfef94169' },
    code:                { universalIdentifier: 'e319e588-72a9-4f03-8108-5d9b193a5f43' },
    startTime:           { universalIdentifier: '334b4d7f-40de-4e83-8956-bacbe58d8b97' },
    endTime:             { universalIdentifier: '5d8ca64b-86b9-409e-99eb-e3fe699ab04b' },
    dayKind:             { universalIdentifier: '52eb03f5-4625-462c-8061-b3bad4a45aff' },
    earlyCheckInMinutes: { universalIdentifier: '2c919b8d-cc32-4659-9d25-ebe6b7d95d19' },
    lateCheckOutMinutes: { universalIdentifier: 'ffda6656-01db-4cc4-8b4e-b86e69d4d2db' },
    salaryPerHour:       { universalIdentifier: '1f0f2b17-e648-4180-badc-46e84fc63970' },
    color:               { universalIdentifier: 'aa68129e-6a00-44b0-95e4-e0e0b98a526b' },
    isActive:            { universalIdentifier: '5e0bd44d-c764-4792-af75-ef9137dd16a1' },
    description:         { universalIdentifier: '55e9e449-2e1c-44b3-bef7-4dbcb7b44a5e' },
    shifts:              { universalIdentifier: '4f3f4ab2-20e9-404c-a319-ce3a3a3a2d2c' },
  },
  indexes: {
    isActiveIndex: { universalIdentifier: '440cb5ec-fabb-4575-93ef-6ded444db247' },
    codeIndex:     { universalIdentifier: '2933e33d-0cbb-48d7-a912-00ee7a38ca0e' },
  },
  views: {
    allShiftTemplates: {
      universalIdentifier: '461b371e-7660-45c7-8fd4-0de5fe885ee6',
      // LƯU Ý: salaryPerHour CỐ TÌNH không là view field — member không được
      // thấy cột lương trong danh mục (quyết định nghiệp vụ 12/08/2026).
      viewFields: {
        name:      { universalIdentifier: '2140d08d-3171-4c67-bf4c-0369d3a7745f' },
        code:      { universalIdentifier: '748df8ac-f9a3-41de-bb20-44b224ebd66b' },
        startTime: { universalIdentifier: '49061331-d42f-4d09-8a37-2cf7c282956c' },
        endTime:   { universalIdentifier: 'c6104dc2-a62a-4876-a42b-c61f214c17d9' },
        dayKind:   { universalIdentifier: '8c8aa303-8bde-44f7-9413-a1d7fe74bb02' },
        isActive:  { universalIdentifier: '1b395bf8-205e-42d4-9cfa-90ced9f7fd31' },
      },
    },
    shiftTemplateRecordPageFields: {
      universalIdentifier: 'ed7e1a4e-9540-4dfb-8d1e-0943a9040b1f',
      viewFields: {},
    },
  },
},
specialDay: {
  universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.specialDay,
  fields: {
    ...buildStandardObjectSystemFields(STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.specialDay),
    name:       { universalIdentifier: '60f82307-46d5-4501-8863-4a39c80cc5bb' },
    kind:       { universalIdentifier: 'df691f7e-be49-44ab-bdb0-d4df9442cbc5' },
    month:      { universalIdentifier: '4098c4ab-289f-45e7-849d-3ed3fc6dab84' },
    day:        { universalIdentifier: '5c993363-1b42-4e9f-aa60-84abd0b5c9ff' },
    date:       { universalIdentifier: '2a191783-37ca-47f0-9b5e-26112ffcacdb' },
    multiplier: { universalIdentifier: '96d98940-5d22-4360-a0b6-bb388db87db4' },
    isActive:   { universalIdentifier: 'e67d14f8-052a-443a-a84e-e98331e9d934' },
  },
  indexes: {
    kindIsActiveIndex: { universalIdentifier: 'a8ea95df-ce34-4cbb-ad33-081c7c071f89' },
  },
  views: {
    allSpecialDays: {
      universalIdentifier: '73cf6a3d-d307-405e-8c77-532308046b26',
      viewFields: {
        name:       { universalIdentifier: 'af650b93-77c4-4f86-9fc3-cd6031b8964a' },
        kind:       { universalIdentifier: '6a512d00-2eae-4146-b4b1-d2b7424fcf73' },
        month:      { universalIdentifier: '2ba13915-0dc5-450b-bbbd-788f562b2e27' },
        day:        { universalIdentifier: '6ef7e509-1dc6-4e73-9d53-11000a6accc9' },
        date:       { universalIdentifier: 'd0c04b1f-0a08-4d9c-8740-867a34f0d692' },
        multiplier: { universalIdentifier: '92167e2e-8f67-4229-9775-59115899aa2c' },
        isActive:   { universalIdentifier: '7a253726-1d1c-446a-b85a-9f63a67b7dc2' },
      },
    },
    specialDayRecordPageFields: {
      universalIdentifier: 'be66aa00-a0c4-46a7-81c2-5bbb4cd5abcc',
      viewFields: {},
    },
  },
},
shift: {
  universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.shift,
  fields: {
    ...buildStandardObjectSystemFields(STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.shift),
    name:               { universalIdentifier: '7e227adc-8839-4d2f-bc46-24a42dfb2344' },
    date:               { universalIdentifier: 'd92362a6-d964-47aa-870d-f6da65cb82c1' },
    status:             { universalIdentifier: 'd7e818e9-23f4-4a29-b944-bcb163904a54' },
    templateCode:       { universalIdentifier: 'da7101a4-f577-4a78-8b5e-f60f475fb33d' },
    templateName:       { universalIdentifier: '5c390af4-3b80-4382-87a8-222c6a4afa9b' },
    startTime:          { universalIdentifier: '56415541-132d-4c1b-b423-69336e4ba4d7' },
    endTime:            { universalIdentifier: 'f0825520-2a8a-4a01-8d18-ded678b29acd' },
    checkInAt:          { universalIdentifier: '635861fd-b5f0-41bb-80c2-572f2c7e051c' },
    checkOutAt:         { universalIdentifier: '3e32da4b-30b2-4f65-b8a3-c560cc14e60d' },
    checkInLateMinutes: { universalIdentifier: '3d35e034-133b-445b-be6a-282e8ff20932' },
    workingMinutes:     { universalIdentifier: 'b1ea0630-bda2-476e-8fed-36c8a33bcfa5' },
    rateMultiplier:     { universalIdentifier: '557fa620-fc9b-4943-b36f-136ac4b720cc' },
    handoverNote:       { universalIdentifier: '0ba4615b-38b9-42bb-b7a5-1824365b6171' },
    cancelReason:       { universalIdentifier: '6aa64169-1077-4d28-8895-3ee09f6ba465' },
    cancelCategory:     { universalIdentifier: 'cc835c72-d3a7-425a-a8eb-85397df22acb' },
    cancelledAt:        { universalIdentifier: 'c7c76b49-b913-481a-bb9e-4581aadada9b' },
    member:             { universalIdentifier: '7f58f5d8-a0f4-4096-8256-4ceb56071305' },
    shiftTemplate:      { universalIdentifier: '4ce93038-7f41-4269-a6a5-ab953d91ec49' },
  },
  indexes: {
    memberIdIndex:        { universalIdentifier: '5af540b9-a3e6-47be-bd1d-5905ea0d5ad8' },
    shiftTemplateIdIndex: { universalIdentifier: '6ab554f5-3cc2-428e-8230-cff5ff493675' },
    dateIndex:            { universalIdentifier: '53a29b1a-5acc-4712-ae5e-912083e543dd' },
  },
  views: {
    allShifts: {
      universalIdentifier: 'fdd1d968-9ff8-43ff-a3fe-a8bdffa06ca4',
      viewFields: {
        name:               { universalIdentifier: '98a8825c-7409-47b4-a7a2-c39c6257f016' },
        date:               { universalIdentifier: 'ee06751f-662b-4282-a0b7-cba48397bd40' },
        status:             { universalIdentifier: '9f1503f4-00be-486d-a467-fbc7659811cb' },
        member:             { universalIdentifier: '5cde2759-2ecd-482e-b372-62a03a1f5eaf' },
        templateCode:       { universalIdentifier: 'e3c5e0ac-1e86-4969-ada3-f29514ac5d3a' },
        checkInAt:          { universalIdentifier: 'd9a1818d-ee2f-4b6a-89ca-14e8b07bd4a2' },
        checkOutAt:         { universalIdentifier: 'aedd443f-f742-4a7c-b111-26960c53545c' },
        checkInLateMinutes: { universalIdentifier: '04603f50-3eb9-4ec0-8312-461a8322b5a1' },
        workingMinutes:     { universalIdentifier: 'f9f68168-4ef1-48bd-859e-096306fcff56' },
      },
    },
    shiftRecordPageFields: {
      universalIdentifier: '735d170d-641e-4aad-a7bb-d326051c7f04',
      viewFields: {},
    },
  },
},
```

- [ ] **Step 3: Thêm inverse field vào entry `workspaceMember`**

Bên trong map `workspaceMember.fields` sẵn có (cạnh inverse `worklogs` của nó):

```ts
shifts: { universalIdentifier: '217853a5-299d-4b07-8b6b-cf1e8c3bc14b' },
```

- [ ] **Step 4: Thêm identifier cho page layout**

Trong `standard-page-layout-universal-identifiers.constant.ts`, bắt chước shape các entry của worklog:

```ts
shiftTemplateRecordPage: { universalIdentifier: '93448a17-a03a-4de2-9174-d0f811ee83f7',
  tabs: { fields: { universalIdentifier: 'b2ca63c9-df6f-4744-bd18-7f131a24cd7a',
    widgets: { fields: { universalIdentifier: 'ad0bdb63-f170-4fdb-885f-a5f317829f68' } } } } },
specialDayRecordPage: { universalIdentifier: 'd5ee38ca-a2fe-408e-b71d-6673d48dd74b',
  tabs: { fields: { universalIdentifier: '71698c40-9e46-4bc6-a782-1b9b6dee3f15',
    widgets: { fields: { universalIdentifier: '7e7a231c-74ca-46d4-9332-fbad34d229ef' } } } } },
shiftRecordPage: { universalIdentifier: '7bcd575f-feb9-43a3-b492-33333a734cf5',
  tabs: { fields: { universalIdentifier: '7fccd49a-53e4-4cf8-936e-0d11bdd78220',
    widgets: { fields: { universalIdentifier: '1af603c5-71a4-42bc-b057-0e94309cab48' } } } } },
```

> Cấu trúc lồng của constant này có thể khác — mở file và copy đúng shape thật của entry `worklogRecordPage`, giữ nguyên các UUID trên.

- [ ] **Step 5: Build twenty-shared và xác nhận typecheck phía dưới fail (đúng kỳ vọng)**

Chạy: `npx nx build twenty-shared && npx nx typecheck twenty-server`
Kỳ vọng: build OK; typecheck **FAIL**, liệt kê mọi `satisfies` map đang thiếu key `shiftTemplate|specialDay|shift` (các builder object/field/index/view/view-field/view-group/search/page-layout). Danh sách lỗi này chính là to-do list chuẩn cho Task 2–4 — lưu lại.

---

### Task 2: Standard object `shiftTemplate` (phía server)

**Mục tiêu:** Định nghĩa metadata đầy đủ cho object danh mục ca, để Leader/PO quản lý mã ca dưới dạng dữ liệu qua record UI mặc định.

**Files:**

- Tạo: `packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/compute-shift-template-standard-flat-field-metadata.util.ts`
- Tạo: `.../utils/index/compute-shift-template-standard-flat-index-metadata.util.ts`
- Tạo: `.../utils/view/compute-standard-shift-template-views.util.ts`
- Tạo: `.../utils/view-field/compute-standard-shift-template-view-fields.util.ts`
- Tạo: `.../utils/page-layout-config/standard-shift-template-page-layout.config.ts`
- Tạo: `packages/twenty-server/src/modules/shift/standard-objects/shift-template.workspace-entity.ts`
- Sửa: `.../utils/object-metadata/create-standard-flat-object-metadata.util.ts`
- Sửa: `.../utils/field-metadata/build-standard-flat-field-metadata-maps.util.ts`
- Sửa: `.../utils/index/build-standard-flat-index-metadata-maps.util.ts`
- Sửa: `.../utils/view/build-standard-flat-view-metadata-maps.util.ts`
- Sửa: `.../utils/view-field/build-standard-flat-view-field-metadata-maps.util.ts`
- Sửa: `.../utils/view-group/build-standard-flat-view-group-metadata-maps.util.ts` (builder rỗng `{}`)
- Sửa: `.../constants/search-fields-by-standard-object-name.constant.ts`
- Sửa: `.../constants/standard-page-layout.constant.ts`
- Sửa: `.../page-layout-config/index.ts` (barrel)

- [ ] **Step 1: Entry object builder**

Trong `create-standard-flat-object-metadata.util.ts`, thêm vào `STANDARD_FLAT_OBJECT_METADATA_BUILDERS_BY_OBJECT_NAME` (đúng vị trí alphabet), bắt chước entry `worklog`:

```ts
shiftTemplate: (args) =>
  createStandardFlatObjectMetadata({
    ...args,
    context: {
      nameSingular: 'shiftTemplate',
      namePlural: 'shiftTemplates',
      labelSingular: i18nLabel(msg`Shift Template`),
      labelPlural: i18nLabel(msg`Shift Templates`),
      description: i18nLabel(msg`A reusable shift definition (code, time window, OT kind)`),
      icon: 'IconClockCog',
      labelIdentifierFieldMetadataName: 'name',
      isSearchable: true,
    },
  }),
```

- [ ] **Step 2: File field builder (đầy đủ)**

`compute-shift-template-standard-flat-field-metadata.util.ts` — copy **nguyên văn** 8 entry system field (`id`, `createdAt`, `updatedAt`, `deletedAt`, `position`, `createdBy`, `updatedBy`, `searchVector`) từ `compute-worklog-standard-flat-field-metadata.util.ts` (chỉ khác `objectName`), rồi tới các business field:

```ts
export const buildShiftTemplateStandardFlatFieldMetadatas = ({
  now,
  objectName,
  workspaceId,
  standardObjectMetadataRelatedEntityIds,
  dependencyFlatEntityMaps,
  twentyStandardApplicationId,
}: Omit<
  CreateStandardFieldArgs<'shiftTemplate', FieldMetadataType>,
  'context'
>): Record<AllStandardObjectFieldName<'shiftTemplate'>, FlatFieldMetadata> => ({
  // ── system fields: copy nguyên văn từ worklog builder ──
  // id, createdAt, updatedAt, deletedAt, position, createdBy, updatedBy, searchVector

  name: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'name',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(msg`Name`),
      description: i18nLabel(msg`Shift display name`),
      icon: 'IconAbc',
      isNullable: false,
      defaultValue: "''",
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),

  code: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'code',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(msg`Code`),
      description: i18nLabel(msg`Short shift code, e.g. SAE-TT-D`),
      icon: 'IconHash',
      isNullable: false,
      defaultValue: "''",
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),

  startTime: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'startTime',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(msg`Start time`),
      description: i18nLabel(msg`HH:mm, ICT`),
      icon: 'IconClockPlay',
      isNullable: false,
      defaultValue: "''",
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),

  endTime: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'endTime',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(msg`End time`),
      description: i18nLabel(msg`HH:mm, ICT — 24:00 allowed`),
      icon: 'IconClockStop',
      isNullable: false,
      defaultValue: "''",
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),

  dayKind: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'dayKind',
      type: FieldMetadataType.SELECT,
      label: i18nLabel(msg`Day kind`),
      description: i18nLabel(msg`Weekday, weekend or holiday OT`),
      icon: 'IconCalendarWeek',
      isNullable: true,
      options: [
        { value: 'WEEKDAY', label: 'Weekday', color: 'blue', position: 0 },
        { value: 'WEEKEND', label: 'Weekend', color: 'turquoise', position: 1 },
        {
          value: 'HOLIDAY_OT',
          label: 'Holiday OT',
          color: 'orange',
          position: 2,
        },
      ],
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),

  earlyCheckInMinutes: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'earlyCheckInMinutes',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(msg`Early check-in (minutes)`),
      description: i18nLabel(
        msg`Check-in opens this many minutes before start. Empty = no guard`,
      ),
      icon: 'IconClockUp',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),

  lateCheckOutMinutes: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'lateCheckOutMinutes',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(msg`Late check-out grace (minutes)`),
      description: i18nLabel(
        msg`Payable minutes cap grace after end. Empty = cap disabled`,
      ),
      icon: 'IconClockDown',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),

  salaryPerHour: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'salaryPerHour',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(msg`Salary per hour`),
      description: i18nLabel(
        msg`VND per hour, optional. Hidden from the catalog view; members see it only through their own report`,
      ),
      icon: 'IconCurrencyDong',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),

  color: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'color',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(msg`Color`),
      description: i18nLabel(msg`Calendar badge color`),
      icon: 'IconPalette',
      isNullable: true,
      defaultValue: "'#94a3b8'",
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),

  isActive: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'isActive',
      type: FieldMetadataType.BOOLEAN,
      label: i18nLabel(msg`Active`),
      description: i18nLabel(msg`Inactive templates cannot be registered`),
      icon: 'IconToggleRight',
      isNullable: false,
      defaultValue: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),

  description: createStandardFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      fieldName: 'description',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(msg`Description`),
      description: i18nLabel(msg`Description`),
      icon: 'IconFileDescription',
      isNullable: true,
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),

  shifts: createStandardRelationFieldFlatMetadata({
    objectName,
    workspaceId,
    context: {
      type: FieldMetadataType.RELATION,
      morphId: null,
      fieldName: 'shifts',
      label: i18nLabel(msg`Shifts`),
      icon: 'IconCalendarClock',
      isNullable: true,
      targetObjectName: 'shift',
      targetFieldName: 'shiftTemplate',
      settings: { relationType: RelationType.ONE_TO_MANY },
    },
    standardObjectMetadataRelatedEntityIds,
    dependencyFlatEntityMaps,
    twentyStandardApplicationId,
    now,
  }),
});
```

> Đối chiếu shape `settings` của chiều ONE_TO_MANY với cách `issue.worklogs` (inverse của `worklog.issue`) được khai trong field builder của issue — copy đúng shape đó.

- [ ] **Step 3: Đăng ký vào các builder map**

- `build-standard-flat-field-metadata-maps.util.ts`: `shiftTemplate: buildShiftTemplateStandardFlatFieldMetadatas,`
- `build-standard-flat-index-metadata-maps.util.ts`: đăng ký index builder định nghĩa `isActiveIndex` trên `['isActive']` và `codeIndex` trên `['code']` (bắt chước index builder của worklog, dùng UUID ở Task 1).
- `build-standard-flat-view-metadata-maps.util.ts`: đăng ký views builder định nghĩa `allShiftTemplates` (tên "All Shift Templates", icon `IconClockCog`, dạng bảng) và `shiftTemplateRecordPageFields` — bắt chước `compute-standard-worklog-views.util.ts`.
- `build-standard-flat-view-field-metadata-maps.util.ts`: đăng ký view-field builder với 6 cột của `allShiftTemplates` theo đúng thứ tự Task 1 (**không có `salaryPerHour`** — có chủ đích).
- `build-standard-flat-view-group-metadata-maps.util.ts`: `shiftTemplate: () => ({}),` (không có Kanban).
- `search-fields-by-standard-object-name.constant.ts`: `shiftTemplate: [{ name: 'name', type: FieldMetadataType.TEXT }, { name: 'code', type: FieldMetadataType.TEXT }],`
- `standard-page-layout.constant.ts` + barrel: `shiftTemplateRecordPage: STANDARD_SHIFT_TEMPLATE_PAGE_LAYOUT_CONFIG` — copy nguyên `standard-worklog-page-layout.config.ts`, đổi tên và UUID layout theo Task 1 (một tab Fields + một widget FIELDS).

- [ ] **Step 4: Typing shell**

`packages/twenty-server/src/modules/shift/standard-objects/shift-template.workspace-entity.ts`:

```ts
import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-sync-metadata/interfaces/entity-relation.interface';
import { type ShiftWorkspaceEntity } from 'src/modules/shift/standard-objects/shift.workspace-entity';

export class ShiftTemplateWorkspaceEntity extends BaseWorkspaceEntity {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  dayKind: string | null;
  earlyCheckInMinutes: number | null;
  lateCheckOutMinutes: number | null;
  salaryPerHour: number | null;
  color: string | null;
  isActive: boolean;
  description: string | null;
  shifts: EntityRelation<ShiftWorkspaceEntity[]>;
  searchVector: string;
}
```

> Bắt chước đúng import path từ `worklog.workspace-entity.ts`.

- [ ] **Step 5: Typecheck**

Chạy: `npx nx typecheck twenty-server`
Kỳ vọng: `shiftTemplate` không còn trong danh sách lỗi thiếu key; lỗi của `specialDay`/`shift` vẫn còn (chỉ xanh hoàn toàn sau Task 4).

---

### Task 3: Standard object `specialDay` (phía server)

**Mục tiêu:** Danh mục ngày lễ / hệ số OT để 150%/200% là dữ liệu do Leader/PO quản lý.

**Files:** cùng bộ file như Task 2 với tên `special-day`:

- Tạo: `.../field-metadata/compute-special-day-standard-flat-field-metadata.util.ts`
- Tạo: `.../index/compute-special-day-standard-flat-index-metadata.util.ts` (`kindIsActiveIndex` trên `['kind', 'isActive']`)
- Tạo: `.../view/compute-standard-special-day-views.util.ts` (`allSpecialDays` + `specialDayRecordPageFields`)
- Tạo: `.../view-field/compute-standard-special-day-view-fields.util.ts` (7 cột, thứ tự Task 1)
- Tạo: `.../page-layout-config/standard-special-day-page-layout.config.ts`
- Tạo: `packages/twenty-server/src/modules/shift/standard-objects/special-day.workspace-entity.ts`
- Sửa: cùng 8 registration map/constant như Task 2

- [ ] **Step 1: Object builder** — `nameSingular: 'specialDay'`, `namePlural: 'specialDays'`, label `Special Day(s)`, icon `IconCalendarStar`, `labelIdentifierFieldMetadataName: 'name'`, `isSearchable: true` (search field: `name`).

- [ ] **Step 2: Field builder** — system field copy nguyên văn từ file Task 2, cộng thêm (viết mỗi field bằng full call `createStandardFieldFlatMetadata` đúng như Task 2 Step 2):

```ts
name:  TEXT, isNullable: false, defaultValue: "''", icon 'IconAbc'
kind:  SELECT, isNullable: false, icon 'IconRepeat', defaultValue: "'YEARLY'", options: [
         { value: 'YEARLY',   label: 'Yearly',        color: 'green',  position: 0 },
         { value: 'SPECIFIC', label: 'Specific date', color: 'purple', position: 1 }]
month: NUMBER, isNullable: true, icon 'IconCalendarMonth'   // 1–12, dùng khi kind = YEARLY
day:   NUMBER, isNullable: true, icon 'IconCalendarDue'     // 1–31, dùng khi kind = YEARLY
date:  TEXT,   isNullable: true, icon 'IconCalendarEvent'   // 'YYYY-MM-DD', dùng khi kind = SPECIFIC
multiplier: NUMBER, isNullable: false, defaultValue: 2, icon 'IconPercentage'  // 2 = 200%
isActive:   BOOLEAN, isNullable: false, defaultValue: true, icon 'IconToggleRight'
```

- [ ] **Step 3: Typing shell**

```ts
export class SpecialDayWorkspaceEntity extends BaseWorkspaceEntity {
  name: string;
  kind: string; // 'YEARLY' | 'SPECIFIC'
  month: number | null;
  day: number | null;
  date: string | null; // 'YYYY-MM-DD'
  multiplier: number;
  isActive: boolean;
  searchVector: string;
}
```

- [ ] **Step 4: Đăng ký đủ các map** (field/index/view/view-field/view-group `{}`/search/page-layout) và chạy `npx nx typecheck twenty-server` — lỗi của `specialDay` biến mất.

---

### Task 4: Standard object `shift` (phía server)

**Mục tiêu:** Dòng trung tâm: một lần đăng ký ca của một member × một mẫu ca × một ngày, mang toàn bộ trạng thái chấm công gồm cả dấu check-in muộn không ân hạn.

**Files:** cùng pattern:

- Tạo: `.../field-metadata/compute-shift-standard-flat-field-metadata.util.ts`
- Tạo: `.../index/compute-shift-standard-flat-index-metadata.util.ts` (`memberIdIndex`, `shiftTemplateIdIndex`, `dateIndex`)
- Tạo: `.../view/compute-standard-shift-views.util.ts` (`allShifts` + `shiftRecordPageFields`)
- Tạo: `.../view-field/compute-standard-shift-view-fields.util.ts` (9 cột)
- Tạo: `.../page-layout-config/standard-shift-page-layout.config.ts`
- Tạo: `packages/twenty-server/src/modules/shift/standard-objects/shift.workspace-entity.ts`
- Sửa: cùng 8 registration map/constant
- Sửa: `packages/twenty-server/src/modules/workspace-member/standard-objects/workspace-member.workspace-entity.ts` (thêm typing `shifts`) — tìm đúng file entity workspaceMember trước (nó đã chứa `worklogs`)

- [ ] **Step 1: Object builder** — `nameSingular: 'shift'`, `namePlural: 'shifts'`, label `Shift(s)`, icon `IconCalendarClock`, `labelIdentifierFieldMetadataName: 'name'`, `isSearchable: true` (search field `name`).

- [ ] **Step 2: Field builder** — system field nguyên văn, cộng thêm (full call như Task 2; dưới đây là spec rút gọn):

```ts
name:               TEXT, isNullable: false, defaultValue: "''"      // tự sinh "<code> <date>" từ pre-hook
date:               TEXT, isNullable: false, defaultValue: "''"      // 'YYYY-MM-DD' ICT
status:             SELECT, isNullable: false, defaultValue: "'UPCOMING'", options: [
                      { value: 'UPCOMING',    label: 'Upcoming',    color: 'blue',   position: 0 },
                      { value: 'IN_PROGRESS', label: 'In progress', color: 'yellow', position: 1 },
                      { value: 'COMPLETED',   label: 'Completed',   color: 'green',  position: 2 },
                      { value: 'CANCELLED',   label: 'Cancelled',   color: 'red',    position: 3 }]
templateCode:       TEXT, isNullable: true      // snapshot — sống sót khi template bị archive/đổi tên
templateName:       TEXT, isNullable: true      // snapshot
startTime:          TEXT, isNullable: true      // snapshot 'HH:mm'
endTime:            TEXT, isNullable: true      // snapshot 'HH:mm'
checkInAt:          DATE_TIME, isNullable: true
checkOutAt:         DATE_TIME, isNullable: true
checkInLateMinutes: NUMBER, isNullable: true    // null = đúng giờ; >=1 = số phút quá giờ bắt đầu (KHÔNG ân hạn)
workingMinutes:     NUMBER, isNullable: true    // phút công, đóng băng lúc check-out
rateMultiplier:     NUMBER, isNullable: true    // null = 1.0
handoverNote:       TEXT, isNullable: true      // hội thoại tồn đọng ghi lúc check-out
cancelReason:       TEXT, isNullable: true
cancelCategory:     SELECT, isNullable: true, options: [
                      { value: 'SICK',     label: 'Sick leave', color: 'red',    position: 0 },
                      { value: 'PERSONAL', label: 'Personal',   color: 'orange', position: 1 },
                      { value: 'SWAP',     label: 'Shift swap', color: 'blue',   position: 2 },
                      { value: 'OTHER',    label: 'Other',      color: 'gray',   position: 3 }]
cancelledAt:        DATE_TIME, isNullable: true
member:             RELATION MANY_TO_ONE → workspaceMember.shifts,
                    onDelete: SET_NULL, joinColumnName 'memberId', isNullable: true
shiftTemplate:      RELATION MANY_TO_ONE → shiftTemplate.shifts,
                    onDelete: SET_NULL, joinColumnName 'shiftTemplateId', isNullable: true
```

Các relation dùng `createStandardRelationFieldFlatMetadata` với `targetObjectName`/`targetFieldName`, y hệt `worklog.member` → `workspaceMember.worklogs`.

- [ ] **Step 3: Typing shell**

```ts
export class ShiftWorkspaceEntity extends BaseWorkspaceEntity {
  name: string;
  date: string;
  status: string; // 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  templateCode: string | null;
  templateName: string | null;
  startTime: string | null;
  endTime: string | null;
  checkInAt: string | null;
  checkOutAt: string | null;
  checkInLateMinutes: number | null;
  workingMinutes: number | null;
  rateMultiplier: number | null;
  handoverNote: string | null;
  cancelReason: string | null;
  cancelCategory: string | null;
  cancelledAt: string | null;
  member: EntityRelation<WorkspaceMemberWorkspaceEntity> | null;
  memberId: string | null;
  shiftTemplate: EntityRelation<ShiftTemplateWorkspaceEntity> | null;
  shiftTemplateId: string | null;
  searchVector: string;
}
```

- [ ] **Step 4: Thêm typing inverse vào entity workspaceMember** (`shifts: EntityRelation<ShiftWorkspaceEntity[]>`) cạnh `worklogs` sẵn có.

- [ ] **Step 5: Đăng ký đủ map, typecheck xanh hoàn toàn + regen snapshot**

Chạy: `npx nx typecheck twenty-server`
Kỳ vọng: PASS — cả 3 object đã có mặt trong mọi `satisfies` map.
Chạy: `cd packages/twenty-server && npx jest "get-standard-object-metadata-related-entity-ids" -u && npx jest "get-standard-page-layout-metadata-related-entity-ids" -u`
Kỳ vọng: snapshot cập nhật cho 3 object mới; commit các thay đổi `.snap`.

---

### Task 5: — ĐÃ GỠ KHỎI PHẠM VI (giữ số để tham chiếu ổn định)

Slot này từng chứa hai thiết kế, đều đã bỏ theo quyết định PO:

- `shiftRequest` (luồng đề nghị/duyệt) — bỏ 11/08/2026; bù công = leader sửa trực tiếp (Task 10), xin nghỉ/đổi ca = member tự hủy (Task 11).
- `shiftSetting` (object cấu hình bot) — bỏ 12/08/2026; cấu hình Mattermost giờ nằm trong chính các workflow node (Task 16).

Không có việc gì ở đây.

---

### Task 6: Materialize + navigation metadata + checkpoint kiểm chứng

**Mục tiêu:** Các object mới tồn tại thành bảng thật với view seed sẵn, truy cập được từ sidebar.

**Files:**

- Sửa: `.../constants/standard-navigation-menu-item.constant.ts` (+ color map của nó)

- [ ] **Step 1: Các entry navigation**

```ts
shiftTracker: { universalIdentifier: '117117dd-9191-411f-98b8-945c61c9c045',
  type: NavigationMenuItemType.LINK, name: 'Shifts', link: '/shift',
  icon: 'IconCalendarClock', position: 9 },
allShiftTemplates: { universalIdentifier: 'c8404305-c783-4f36-a31e-336570455584',
  type: NavigationMenuItemType.OBJECT,
  viewUniversalIdentifier: STANDARD_OBJECTS.shiftTemplate.views.allShiftTemplates.universalIdentifier,
  position: 10 },
allSpecialDays: { universalIdentifier: '9713ecf5-8a52-4159-8206-9909bbae94d3',
  type: NavigationMenuItemType.OBJECT,
  viewUniversalIdentifier: STANDARD_OBJECTS.specialDay.views.allSpecialDays.universalIdentifier,
  position: 11 },
```

Chỉnh `position` để xếp sau item `taskManager` sẵn có; thêm entry vào `STANDARD_NAVIGATION_MENU_ITEM_DEFAULT_COLORS` theo các dòng hiện hữu.

- [ ] **Step 2: Reset và kiểm chứng**

Chạy: `npx nx run twenty-server:database:reset`
Kỳ vọng: exit 0.
Kiểm chứng qua Postgres MCP read-only (`.mcp.json`): `SELECT "nameSingular" FROM core."objectMetadata" WHERE "nameSingular" IN ('shift','shiftTemplate','specialDay');` trả 3 dòng, và workspace schema có bảng `shift`, `shiftTemplate`, `specialDay` (bảng `shift` phải có cột `checkInLateMinutes`).

- [ ] **Step 3: Smoke thủ công** — `yarn start`, đăng nhập ("Continue with Email", credentials điền sẵn), xác nhận sidebar có Shifts / Shift Templates / Special Days; `/objects/shiftTemplates` mở view bảng rỗng **không có cột lương**, tạo/sửa được một template bằng tay.

---

### Task 7: Dev seed data (bộ ca theo TC + ngày lễ VN)

**Mục tiêu:** `database:reset` cho ra danh mục demo sẵn: 11 ca thường + 8 ca OT và 9 ngày lễ Việt Nam.

**Files:**

- Tạo: `packages/twenty-server/src/engine/workspace-manager/dev-seeder/data/constants/shift-template-data-seeds.constant.ts`
- Tạo: `.../data/constants/special-day-data-seeds.constant.ts`
- Sửa: `.../data/services/dev-seeder-data.service.ts`

- [ ] **Step 1: Seed template** — bắt chước cấu trúc `worklog-data-seeds.constant.ts` (`type ShiftTemplateDataSeed`, `SHIFT_TEMPLATE_DATA_SEED_COLUMNS`, `SHIFT_TEMPLATE_DATA_SEED_IDS`, `SHIFT_TEMPLATE_DATA_SEEDS`). Lưu ý cột ACTOR composite bung ra (`createdBySource`, `createdByWorkspaceMemberId`, `createdByName`). Các dòng (tất cả `earlyCheckInMinutes: 15`, `lateCheckOutMinutes: 30`, `isActive: true`, `salaryPerHour: null`):

| code                      | name                      | startTime                   | endTime | dayKind       |
| ------------------------- | ------------------------- | --------------------------- | ------- | ------------- |
| SAE-TT-D                  | Ca đêm trong tuần         | 00:00                       | 05:00   | WEEKDAY       |
| SAE-TT-SS                 | Ca sáng sớm trong tuần    | 05:00                       | 10:00   | WEEKDAY       |
| SAE-TT-TR                 | Ca trưa trong tuần        | 10:00                       | 14:00   | WEEKDAY       |
| SAE-TT-C                  | Ca chiều                  | 14:00                       | 19:00   | WEEKDAY       |
| SAE-TT-T                  | Ca tối trong tuần         | 19:00                       | 24:00   | WEEKDAY       |
| SAE-CT-D                  | Ca đêm cuối tuần          | 00:00                       | 04:00   | WEEKEND       |
| SAE-CT-SS                 | Ca sáng sớm cuối tuần     | 04:00                       | 08:00   | WEEKEND       |
| SAE-CT-S                  | Ca sáng cuối tuần         | 08:00                       | 12:00   | WEEKEND       |
| SAE-CT-C                  | Ca chiều cuối tuần        | 12:00                       | 16:00   | WEEKEND       |
| SAE-CT-T                  | Ca tối cuối tuần          | 16:00                       | 20:00   | WEEKEND       |
| SAE-CT-TM                 | Ca tối muộn cuối tuần     | 20:00                       | 24:00   | WEEKEND       |
| SAE-OT-0-3 … SAE-OT-21-24 | Ca OT 0-3h … Ca OT 21-24h | các block 3h từ 00:00→24:00 |         | HOLIDAY_OT ×8 |

- [ ] **Step 2: Seed ngày đặc biệt** — 9 dòng, tất cả `multiplier: 2`, `isActive: true`: Tết dương (YEARLY 1/1), Giải phóng miền Nam (YEARLY 30/4), Quốc tế lao động (YEARLY 1/5), Quốc khánh (YEARLY 2/9), Tết âm 2026 ×5 (SPECIFIC `2026-02-16`…`2026-02-20`).

- [ ] **Step 3: Nối vào batch** trong `dev-seeder-data.service.ts`: `shiftTemplate` + `specialDay` vào batch sớm không có phụ thuộc FK (cạnh `project` ở batch2); v1 không cần seed `shift` (đăng ký qua UI khi QA).

- [ ] **Step 4: Kiểm chứng** — `npx nx run twenty-server:database:reset`, rồi trong app `/objects/shiftTemplates` hiện 19 dòng, `/objects/specialDays` hiện 9 dòng.

---

### Task 8: Các util thuần về ngày giờ (TDD)

**Mục tiêu:** Một module có test sở hữu toàn bộ phép tính thời gian: "hôm nay" theo ICT, parse HH:mm, cửa sổ check-in, trần giờ công, và **số phút check-in muộn không ân hạn**. Mọi hook/service phía sau import từ đây — không tính giờ ở bất kỳ đâu khác.

**Files:**

- Tạo: `packages/twenty-server/src/modules/shift/utils/shift-time.util.ts`
- Test: `packages/twenty-server/src/modules/shift/utils/__tests__/shift-time.util.spec.ts`

- [ ] **Step 1: Viết test fail trước**

```ts
import {
  computeCheckInLateMinutes,
  computePayableMinutes,
  computeWindowMinutesOfDay,
  getTodayIct,
  parseHHmm,
} from 'src/modules/shift/utils/shift-time.util';

describe('parseHHmm', () => {
  it('parses HH:mm into minutes of day', () => {
    expect(parseHHmm('00:00')).toBe(0);
    expect(parseHHmm('05:30')).toBe(330);
    expect(parseHHmm('24:00')).toBe(1440);
  });
  it('throws on malformed input', () => {
    expect(() => parseHHmm('25:00')).toThrow();
    expect(() => parseHHmm('5:0')).toThrow();
  });
});

describe('getTodayIct', () => {
  it('formats the ICT calendar date as YYYY-MM-DD', () => {
    // 2026-08-11T18:00:00Z đã là 2026-08-12 01:00 theo ICT (UTC+7)
    expect(getTodayIct(new Date('2026-08-11T18:00:00Z'))).toBe('2026-08-12');
    expect(getTodayIct(new Date('2026-08-11T10:00:00Z'))).toBe('2026-08-11');
  });
});

describe('computeWindowMinutesOfDay', () => {
  it('opens early by earlyCheckInMinutes and closes late by lateCheckOutMinutes', () => {
    expect(
      computeWindowMinutesOfDay({
        startTime: '14:00',
        endTime: '19:00',
        earlyCheckInMinutes: 15,
        lateCheckOutMinutes: 30,
      }),
    ).toEqual({ open: 825, close: 1170 }); // 13:45 → 19:30
  });
  it('adds a day for overnight shifts (endTime <= startTime)', () => {
    expect(
      computeWindowMinutesOfDay({
        startTime: '19:00',
        endTime: '05:00',
        earlyCheckInMinutes: 0,
        lateCheckOutMinutes: 0,
      }),
    ).toEqual({ open: 1140, close: 1740 }); // 05:00 hôm sau = 1440 + 300
  });
});

describe('computePayableMinutes', () => {
  const template = {
    startTime: '14:00',
    endTime: '19:00',
    earlyCheckInMinutes: 15,
    lateCheckOutMinutes: 30,
  };
  it('pays elapsed minutes when under the cap', () => {
    expect(
      computePayableMinutes({
        checkInAt: new Date('2026-08-11T07:00:00Z'), // 14:00 ICT
        checkOutAt: new Date('2026-08-11T11:00:00Z'), // 18:00 ICT
        ...template,
      }),
    ).toBe(240);
  });
  it('caps payable minutes at the template window width', () => {
    expect(
      computePayableMinutes({
        checkInAt: new Date('2026-08-11T06:00:00Z'), // 13:00 ICT (trước cửa sổ)
        checkOutAt: new Date('2026-08-11T14:00:00Z'), // 21:00 ICT (sau cửa sổ)
        ...template,
      }),
    ).toBe(345); // độ rộng cửa sổ 13:45→19:30
  });
  it('does not cap when lateCheckOutMinutes is null', () => {
    expect(
      computePayableMinutes({
        checkInAt: new Date('2026-08-11T07:00:00Z'),
        checkOutAt: new Date('2026-08-11T14:00:00Z'), // 7h thực tế
        ...template,
        lateCheckOutMinutes: null,
      }),
    ).toBe(420);
  });
  it('never returns negative minutes', () => {
    expect(
      computePayableMinutes({
        checkInAt: new Date('2026-08-11T11:00:00Z'),
        checkOutAt: new Date('2026-08-11T10:00:00Z'),
        ...template,
      }),
    ).toBe(0);
  });
});

describe('computeCheckInLateMinutes (KHÔNG ân hạn — BR-9.1)', () => {
  const shift = { date: '2026-08-11', startTime: '14:00' };
  it('returns null when punching at or before start', () => {
    expect(
      computeCheckInLateMinutes({
        ...shift,
        checkInAt: new Date('2026-08-11T07:00:00Z'),
      }),
    ).toBeNull(); // đúng 14:00 ICT
    expect(
      computeCheckInLateMinutes({
        ...shift,
        checkInAt: new Date('2026-08-11T06:50:00Z'),
      }),
    ).toBeNull(); // 13:50 ICT (sớm)
  });
  it('returns minutes late from the first minute past start', () => {
    expect(
      computeCheckInLateMinutes({
        ...shift,
        checkInAt: new Date('2026-08-11T07:02:00Z'),
      }),
    ).toBe(2); // 14:02 ICT
    expect(
      computeCheckInLateMinutes({
        ...shift,
        checkInAt: new Date('2026-08-11T07:20:00Z'),
      }),
    ).toBe(20); // 14:20 ICT
  });
  it('handles a punch landing on the next ICT day for a late-evening shift', () => {
    expect(
      computeCheckInLateMinutes({
        date: '2026-08-11',
        startTime: '23:30',
        checkInAt: new Date('2026-08-11T17:10:00Z'),
      }),
    ).toBe(40); // 00:10 ICT ngày 2026-08-12
  });
});
```

- [ ] **Step 2: Chạy để xác nhận fail**

Chạy: `cd packages/twenty-server && npx jest "shift-time"`
Kỳ vọng: FAIL — module chưa tồn tại.

- [ ] **Step 3: Cài đặt**

```ts
const ICT_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const HH_MM_PATTERN = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/;

export const parseHHmm = (value: string): number => {
  if (!HH_MM_PATTERN.test(value)) {
    throw new Error(`Invalid HH:mm time: ${value}`);
  }
  const [hours, minutes] = value.split(':').map(Number);

  return hours * 60 + minutes;
};

// 'en-CA' trả thẳng YYYY-MM-DD; không bao giờ dựng ngày ICT bằng new Date(y, m, d)
export const getTodayIct = (now: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: ICT_TIME_ZONE }).format(now);

export const getIctMinutesOfDay = (at: Date): number => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: ICT_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);

  return hour * 60 + minute;
};

export const computeWindowMinutesOfDay = ({
  startTime,
  endTime,
  earlyCheckInMinutes,
  lateCheckOutMinutes,
}: {
  startTime: string;
  endTime: string;
  earlyCheckInMinutes: number | null;
  lateCheckOutMinutes: number | null;
}): { open: number; close: number } => {
  const startMinutes = parseHHmm(startTime);
  let endMinutes = parseHHmm(endTime);

  if (endMinutes <= startMinutes) {
    endMinutes += 1440;
  }

  return {
    open: startMinutes - (earlyCheckInMinutes ?? 0),
    close: endMinutes + (lateCheckOutMinutes ?? 0),
  };
};

// Giờ công = thời gian thực tế, chặn trần theo độ rộng cửa sổ ca khi trần
// được bật (lateCheckOutMinutes !== null). Khớp công thức checkout của SBC-BOSS.
export const computePayableMinutes = ({
  checkInAt,
  checkOutAt,
  startTime,
  endTime,
  earlyCheckInMinutes,
  lateCheckOutMinutes,
}: {
  checkInAt: Date;
  checkOutAt: Date;
  startTime: string;
  endTime: string;
  earlyCheckInMinutes: number | null;
  lateCheckOutMinutes: number | null;
}): number => {
  const elapsedMinutes = Math.max(
    0,
    Math.floor((checkOutAt.getTime() - checkInAt.getTime()) / 60_000),
  );

  if (lateCheckOutMinutes === null) {
    return elapsedMinutes;
  }

  const window = computeWindowMinutesOfDay({
    startTime,
    endTime,
    earlyCheckInMinutes,
    lateCheckOutMinutes,
  });
  const maxPayableMinutes = window.close - window.open;

  return maxPayableMinutes > 0
    ? Math.min(elapsedMinutes, maxPayableMinutes)
    : elapsedMinutes;
};

// BR-9.1: KHÔNG ân hạn. Đúng giờ = bấm trước/đúng giờ bắt đầu ca; quá >=1 phút
// là muộn. Chỉ là cờ kỷ luật — không ảnh hưởng giờ công.
export const computeCheckInLateMinutes = ({
  date,
  startTime,
  checkInAt,
}: {
  date: string;
  startTime: string;
  checkInAt: Date;
}): number | null => {
  const punchDateIct = getTodayIct(checkInAt);
  // punch chỉ rơi vào đúng ngày ICT của ca hoặc ngày kế tiếp (muộn với ca sát
  // nửa đêm); trường hợp khác là leader backfill và vẫn đúng trong phạm vi ±1 ngày
  const dayOffset =
    punchDateIct > date ? 1440 : punchDateIct < date ? -1440 : 0;
  const lateMinutes =
    getIctMinutesOfDay(checkInAt) + dayOffset - parseHHmm(startTime);

  return lateMinutes >= 1 ? lateMinutes : null;
};
```

- [ ] **Step 4: Chạy test** — `cd packages/twenty-server && npx jest "shift-time"` → PASS (toàn bộ case).

---

### Task 9: Rate service + pre-hook create/update cho shift (TDD)

**Mục tiêu:** Toàn vẹn khâu đăng ký: không ngày quá khứ, chỉ template đang hoạt động, không trùng (theo member với ca thường, **độc quyền toàn team với slot HOLIDAY_OT**), snapshot + hệ số OT đóng dấu phía server; member chỉ đụng dòng của mình và không bao giờ tự sửa được field chấm công.

**Files:**

- Tạo: `packages/twenty-server/src/modules/shift/query-hooks/shift-rate.workspace-service.ts`
- Tạo: `packages/twenty-server/src/modules/shift/query-hooks/shift-create-one.pre-query.hook.ts`
- Tạo: `packages/twenty-server/src/modules/shift/query-hooks/shift-update-one.pre-query.hook.ts`
- Tạo: `packages/twenty-server/src/modules/shift/utils/assert-shift-owner-or-elevated-or-throw.util.ts`
- Tạo: `packages/twenty-server/src/modules/shift/query-hooks/shift-query-hook.module.ts`
- Test: `packages/twenty-server/src/modules/shift/query-hooks/__tests__/shift-create-one.pre-query.hook.spec.ts`
- Test: `packages/twenty-server/src/modules/shift/query-hooks/__tests__/shift-rate.workspace-service.spec.ts`
- Sửa: `packages/twenty-server/src/engine/api/graphql/workspace-query-runner/workspace-query-hook/workspace-query-hook.module.ts` (import `ShiftQueryHookModule`)

- [ ] **Step 1: Util quyền sở hữu** — phỏng theo `assert-issue-comment-author-or-app-scope-access-or-throw.util.ts` (đọc file đó trước; cùng bộ import):

```ts
export const assertShiftOwnerOrElevatedOrThrow = async ({
  authContext,
  globalWorkspaceOrmManager,
  shiftId,
  operation,
}: {
  authContext: WorkspaceAuthContext;
  globalWorkspaceOrmManager: GlobalWorkspaceOrmManager;
  shiftId: string;
  operation: AppScopeOperation;
}): Promise<void> => {
  const workspace = authContext.workspace;

  assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

  await globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
    const context = getWorkspaceContext();
    const shiftRepository =
      await globalWorkspaceOrmManager.getRepository<ShiftWorkspaceEntity>(
        workspace.id,
        'shift',
        { shouldBypassPermissionChecks: true },
      );
    const shift = await shiftRepository.findOne({
      where: { id: shiftId },
      select: ['id', 'memberId'],
    });

    const isOwner =
      isDefined(shift) &&
      isDefined(shift.memberId) &&
      isUserAuthContext(authContext) &&
      shift.memberId === authContext.workspaceMemberId;

    if (isOwner) return;

    if (
      shouldBypassAppScope({
        authContext,
        operation,
        allObjectRecordsRoleFlagsByRoleId:
          context.allObjectRecordsRoleFlagsByRoleId,
        userWorkspaceRoleMap: context.userWorkspaceRoleMap,
        apiKeyRoleMap: context.apiKeyRoleMap,
      })
    )
      return;

    throw new PermissionsException(
      PermissionsExceptionMessage.PERMISSION_DENIED,
      PermissionsExceptionCode.PERMISSION_DENIED,
    );
  }, authContext);
};
```

Export thêm một helper nhỏ trong cùng file cho các create-hook (chưa có record để load) — **phải được gọi bên trong `executeInWorkspaceContext`** (ghi rõ vào comment):

```ts
export const isElevatedActor = ({
  authContext,
  operation,
}: {
  authContext: WorkspaceAuthContext;
  operation: AppScopeOperation;
}): boolean => {
  const context = getWorkspaceContext();

  return shouldBypassAppScope({
    authContext,
    operation,
    allObjectRecordsRoleFlagsByRoleId:
      context.allObjectRecordsRoleFlagsByRoleId,
    userWorkspaceRoleMap: context.userWorkspaceRoleMap,
    apiKeyRoleMap: context.apiKeyRoleMap,
  });
};
```

- [ ] **Step 2: Test rate service (fail trước)**

```ts
describe('ShiftRateWorkspaceService.getMultiplierForDate', () => {
  const buildService = (specialDays: unknown[]) => {
    const specialDayRepository = {
      find: jest.fn().mockResolvedValue(specialDays),
    };
    const globalWorkspaceOrmManager = {
      getRepository: jest.fn().mockResolvedValue(specialDayRepository),
      executeInWorkspaceContext: jest
        .fn()
        .mockImplementation((fn: () => unknown) => fn()),
    };

    return new ShiftRateWorkspaceService(globalWorkspaceOrmManager as never);
  };

  it('returns 1 when no special day matches', async () => {
    const service = buildService([]);

    expect(
      await service.getMultiplierForDate(mockAuthContext, '2026-08-12'),
    ).toBe(1);
  });

  it('matches a yearly special day by month and day', async () => {
    const service = buildService([
      {
        kind: 'YEARLY',
        month: 9,
        day: 2,
        date: null,
        multiplier: 2,
        isActive: true,
      },
    ]);

    expect(
      await service.getMultiplierForDate(mockAuthContext, '2026-09-02'),
    ).toBe(2);
  });

  it('returns the highest multiplier when several match', async () => {
    const service = buildService([
      {
        kind: 'SPECIFIC',
        month: null,
        day: null,
        date: '2026-02-16',
        multiplier: 2,
        isActive: true,
      },
      {
        kind: 'YEARLY',
        month: 2,
        day: 16,
        date: null,
        multiplier: 1.5,
        isActive: true,
      },
    ]);

    expect(
      await service.getMultiplierForDate(mockAuthContext, '2026-02-16'),
    ).toBe(2);
  });
});
```

Chạy: `cd packages/twenty-server && npx jest "shift-rate"` → FAIL.

- [ ] **Step 3: Cài đặt rate service**

```ts
@Injectable()
export class ShiftRateWorkspaceService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async getMultiplierForDate(
    authContext: WorkspaceAuthContext,
    date: string,
  ): Promise<number> {
    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const specialDayRepository =
          await this.globalWorkspaceOrmManager.getRepository<SpecialDayWorkspaceEntity>(
            workspace.id,
            'specialDay',
            { shouldBypassPermissionChecks: true },
          );
        const specialDays = await specialDayRepository.find({
          where: { isActive: true },
        });

        const [, monthPart, dayPart] = date.split('-').map(Number);
        const matching = specialDays.filter((specialDay) =>
          specialDay.kind === 'SPECIFIC'
            ? specialDay.date === date
            : specialDay.month === monthPart && specialDay.day === dayPart,
        );

        return matching.reduce(
          (max, specialDay) => Math.max(max, specialDay.multiplier),
          1,
        );
      },
      authContext,
    );
  }
}
```

Chạy: `npx jest "shift-rate"` → PASS.

- [ ] **Step 4: Test create pre-hook (fail trước)** — cùng phong cách mock constructor; cover: từ chối ngày quá khứ; từ chối template inactive; từ chối trùng theo member; **từ chối slot HOLIDAY_OT đã có người khác lấy**; đóng dấu snapshot + name + rateMultiplier; actor thường tạo hộ người khác bị từ chối; các field chấm công bị strip.

```ts
it('rejects a registration for a past date', async () => {
  const hook = buildHook({ templates: [activeTemplate], existingShifts: [] });

  await expect(
    hook.execute(mockMemberAuthContext, 'shift', {
      data: {
        date: '2020-01-01',
        shiftTemplateId: activeTemplate.id,
        memberId: mockMemberAuthContext.workspaceMemberId,
      },
    } as never),
  ).rejects.toThrow('past date');
});

it('snapshots template fields and stamps the OT multiplier', async () => {
  const hook = buildHook({
    templates: [activeTemplate],
    existingShifts: [],
    multiplier: 2,
  });
  const futureDate = '2999-01-01';

  const result = await hook.execute(mockMemberAuthContext, 'shift', {
    data: {
      date: futureDate,
      shiftTemplateId: activeTemplate.id,
      memberId: mockMemberAuthContext.workspaceMemberId,
    },
  } as never);

  expect(result.data).toMatchObject({
    templateCode: 'SAE-TT-C',
    templateName: 'Ca chiều',
    startTime: '14:00',
    endTime: '19:00',
    name: `SAE-TT-C ${futureDate}`,
    status: 'UPCOMING',
    rateMultiplier: 2,
  });
});

it('rejects a duplicate active registration for the same member/date/template', async () => {
  const hook = buildHook({
    templates: [activeTemplate],
    existingShifts: [{ id: 'existing', status: 'UPCOMING' }],
  });

  await expect(
    hook.execute(mockMemberAuthContext, 'shift', {
      data: {
        date: '2999-01-01',
        shiftTemplateId: activeTemplate.id,
        memberId: mockMemberAuthContext.workspaceMemberId,
      },
    } as never),
  ).rejects.toThrow('already registered');
});

it('rejects a HOLIDAY_OT slot already taken by ANOTHER member (OT slots are exclusive)', async () => {
  // Rule TC: "Không đăng kí trùng ca nhau" — mỗi slot OT mỗi ngày một người
  const hook = buildHook({
    templates: [holidayOtTemplate],
    existingShifts: [
      { id: 'other', status: 'UPCOMING', memberId: 'someone-else' },
    ],
  });

  await expect(
    hook.execute(mockMemberAuthContext, 'shift', {
      data: {
        date: '2999-01-01',
        shiftTemplateId: holidayOtTemplate.id,
        memberId: mockMemberAuthContext.workspaceMemberId,
      },
    } as never),
  ).rejects.toThrow('OT slot is already taken');
});
```

- [ ] **Step 5: Cài đặt create pre-hook**

```ts
@Injectable()
@WorkspaceQueryHook(`shift.createOne`)
export class ShiftCreateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly shiftRateWorkspaceService: ShiftRateWorkspaceService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs<ShiftWorkspaceEntity>,
  ): Promise<CreateOneResolverArgs<ShiftWorkspaceEntity>> {
    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const data = payload.data;

        // member tự đăng ký cho mình; chỉ role Leader/PO được đăng ký hộ
        const actorMemberId = isUserAuthContext(authContext)
          ? authContext.workspaceMemberId
          : null;
        const targetMemberId = data.memberId ?? actorMemberId;

        if (!isDefined(targetMemberId)) {
          throw new Error('A shift must belong to a workspace member');
        }
        if (
          targetMemberId !== actorMemberId &&
          !isElevatedActor({ authContext, operation: 'write' })
        ) {
          throw new PermissionsException(
            PermissionsExceptionMessage.PERMISSION_DENIED,
            PermissionsExceptionCode.PERMISSION_DENIED,
          );
        }

        if (!isDefined(data.date) || data.date < getTodayIct()) {
          throw new Error('Cannot register a shift for a past date');
        }
        if (!isDefined(data.shiftTemplateId)) {
          throw new Error('A shift must reference a shift template');
        }

        const templateRepository =
          await this.globalWorkspaceOrmManager.getRepository<ShiftTemplateWorkspaceEntity>(
            workspace.id,
            'shiftTemplate',
            { shouldBypassPermissionChecks: true },
          );
        const template = await templateRepository.findOne({
          where: { id: data.shiftTemplateId },
        });

        if (!isDefined(template) || !template.isActive) {
          throw new Error('Shift template not found or inactive');
        }

        const shiftRepository =
          await this.globalWorkspaceOrmManager.getRepository<ShiftWorkspaceEntity>(
            workspace.id,
            'shift',
            { shouldBypassPermissionChecks: true },
          );

        // Slot HOLIDAY_OT độc quyền toàn team ("không đăng kí trùng ca nhau");
        // ca thường chỉ cần unique theo member.
        const conflictQuery = shiftRepository
          .createQueryBuilder()
          .where('"date" = :date', { date: data.date })
          .andWhere('"shiftTemplateId" = :templateId', {
            templateId: template.id,
          })
          .andWhere('"status" != :cancelled', { cancelled: 'CANCELLED' });

        if (template.dayKind !== 'HOLIDAY_OT') {
          conflictQuery.andWhere('"memberId" = :memberId', {
            memberId: targetMemberId,
          });
        }

        const conflict = await conflictQuery.getOne();

        if (isDefined(conflict)) {
          throw new Error(
            template.dayKind === 'HOLIDAY_OT' &&
              conflict.memberId !== targetMemberId
              ? `This OT slot is already taken (${template.code} on ${data.date})`
              : `Already registered for ${template.code} on ${data.date}`,
          );
        }

        const rateMultiplier =
          await this.shiftRateWorkspaceService.getMultiplierForDate(
            authContext,
            data.date,
          );

        return {
          ...payload,
          data: {
            ...data,
            memberId: targetMemberId,
            name: `${template.code} ${data.date}`,
            templateCode: template.code,
            templateName: template.name,
            startTime: template.startTime,
            endTime: template.endTime,
            status: 'UPCOMING',
            // các field chấm công không bao giờ cho client ghi lúc tạo
            checkInAt: null,
            checkOutAt: null,
            checkInLateMinutes: null,
            workingMinutes: null,
            cancelReason: null,
            cancelCategory: null,
            cancelledAt: null,
            rateMultiplier: rateMultiplier > 1 ? rateMultiplier : null,
          },
        };
      },
      authContext,
    );
  }
}
```

- [ ] **Step 6: Update pre-hook** (`shift.updateOne`): gọi `assertShiftOwnerOrElevatedOrThrow({ shiftId: payload.id, operation: 'write' })`; sau đó, khi actor **không** phải Leader/PO, throw nếu `payload.data` đụng vào field bảo vệ — member chỉ thay đổi chấm công qua mutation check-in/out; bù công là leader sửa trực tiếp (tự tính lại ở Task 10):

```ts
const PROTECTED_SHIFT_FIELDS = [
  'checkInAt',
  'checkOutAt',
  'checkInLateMinutes',
  'workingMinutes',
  'status',
  'rateMultiplier',
  'cancelledAt',
  'cancelReason',
  'cancelCategory',
  'memberId',
] as const;

const touchedProtectedField = PROTECTED_SHIFT_FIELDS.find(
  (field) => field in payload.data,
);

if (
  isDefined(touchedProtectedField) &&
  !isElevatedActor({ authContext, operation: 'write' })
) {
  throw new PermissionsException(
    PermissionsExceptionMessage.PERMISSION_DENIED,
    PermissionsExceptionCode.PERMISSION_DENIED,
  );
}
```

- [ ] **Step 7: Module + đăng ký**

`shift-query-hook.module.ts` providers: `ShiftCreateOnePreQueryHook`, `ShiftUpdateOnePreQueryHook`, `ShiftRateWorkspaceService`. Import module này trong `workspace-query-hook.module.ts` (mỗi chỗ một dòng trong `imports` và danh sách import, cạnh `WorklogQueryHookModule`).

- [ ] **Step 8: Chạy toàn bộ test mới** — `cd packages/twenty-server && npx jest "modules/shift"` → PASS; `npx nx typecheck twenty-server` → PASS.

---

### Task 10: Leader sửa punch → tự động tính lại (TDD)

**Mục tiêu:** Thay thế luồng duyệt đã bỏ: khi Leader/PO sửa thẳng `checkInAt`/`checkOutAt` trên record ca, hệ thống tự tính lại `workingMinutes`, **`checkInLateMinutes`** và `status` để số liệu lưu trữ không bao giờ mâu thuẫn với giờ vào/ra (BR-5.2, BR-9.1). Actor thường không bao giờ tới được nhánh này — pre-hook Task 9 đã chặn.

**Files:**

- Tạo: `packages/twenty-server/src/modules/shift/query-hooks/shift-update-one.post-query.hook.ts`
- Tạo: `packages/twenty-server/src/modules/shift/query-hooks/shift-recompute.workspace-service.ts`
- Test: `.../query-hooks/__tests__/shift-recompute.workspace-service.spec.ts`
- Sửa: `shift-query-hook.module.ts` (thêm hook + service vào `providers`)

- [ ] **Step 1: Test recompute service (fail trước)** — phong cách mock constructor:

```ts
it('completes the shift, recomputes capped payable minutes and the late flag when both punches are set', async () => {
  const { service, shiftRepository } = buildService({
    shift: {
      id: 'shift-1',
      status: 'IN_PROGRESS',
      date: '2026-08-11',
      startTime: '14:00',
      endTime: '19:00',
      checkInAt: '2026-08-11T07:05:00Z', // 14:05 ICT → muộn +5 (không ân hạn)
      checkOutAt: '2026-08-11T12:05:00Z', // 19:05 ICT
      checkInLateMinutes: null,
      workingMinutes: null,
    },
    template: { earlyCheckInMinutes: 15, lateCheckOutMinutes: 30 },
  });

  await service.recomputeAttendance(mockAuthContext, 'shift-1');

  expect(shiftRepository.update).toHaveBeenCalledWith(
    { id: 'shift-1' },
    expect.objectContaining({
      status: 'COMPLETED',
      workingMinutes: 300,
      checkInLateMinutes: 5,
    }),
  );
});

it('moves a shift with only a check-in to IN_PROGRESS with null workingMinutes', async () => {
  /* status IN_PROGRESS, workingMinutes null, checkInLateMinutes suy từ punch */
});

it('resets a shift with both punches cleared back to UPCOMING', async () => {
  /* status UPCOMING, workingMinutes null, checkInLateMinutes null */
});

it('never touches a CANCELLED shift', async () => {
  /* update không được gọi */
});

it('skips the write when nothing would change', async () => {
  /* update không gọi khi giá trị lưu đã khớp */
});
```

- [ ] **Step 2: Cài đặt `ShiftRecomputeWorkspaceService.recomputeAttendance(authContext, shiftId)`** — load ca (bypass permission) qua `GlobalWorkspaceOrmManager`; return sớm khi `status === 'CANCELLED'`; suy `{ status, workingMinutes, checkInLateMinutes }` từ hai punch:
  - đủ hai punch → `COMPLETED`, `workingMinutes = computePayableMinutes(...)` (tham số template; fallback về snapshot `startTime`/`endTime` khi `shiftTemplateId` null), `checkInLateMinutes = computeCheckInLateMinutes(...)`;
  - chỉ có giờ vào → `IN_PROGRESS`, `workingMinutes = null`, cờ muộn suy từ punch;
  - không có gì → `UPCOMING`, cả hai null;
  - chỉ `repository.update` khi giá trị suy ra khác giá trị lưu. Ghi comment: `repository.update` từ trong service **không** đi lại qua GraphQL query hook nên không thể đệ quy.

- [ ] **Step 3: Post-hook** — `@WorkspaceQueryHook({ key: 'shift.updateOne', type: WorkspaceQueryHookType.POST_HOOK })`: nếu payload update đụng `checkInAt` hoặc `checkOutAt`, gọi `recomputeAttendance` cho từng record trả về. Lỗi: log và rethrow (theo cách xử lý lỗi của post-hook `worklog`).

- [ ] **Step 4: Chạy test** — `cd packages/twenty-server && npx jest "shift-recompute"` → PASS.

---

### Task 11: Mutation `checkInShift` / `checkOutShift` / `cancelShift` (TDD)

**Mục tiêu:** Các action chấm công nguyên tử theo ngữ nghĩa hệ SM, đóng dấu cờ muộn không ân hạn — thay cho lệnh bot `!shift checkin/checkout`. **Không có code thông báo ở đây**: mutation chỉ ghi dữ liệu; tin Mattermost do workflow (Task 16) bắn theo sự kiện record-updated.

**Files:**

- Tạo: `packages/twenty-server/src/modules/shift/workspace-services/shift-attendance.workspace-service.ts`
- Tạo: `packages/twenty-server/src/modules/shift/resolvers/shift-attendance.resolver.ts`
- Tạo: `packages/twenty-server/src/modules/shift/shift.module.ts`
- Test: `.../workspace-services/__tests__/shift-attendance.workspace-service.spec.ts`
- Sửa: `packages/twenty-server/src/engine/core-modules/core-engine.module.ts` (import `ShiftModule` cạnh `SprintModule`)

- [ ] **Step 1: Test service (fail trước)** — phong cách mock constructor:

```ts
describe('ShiftAttendanceWorkspaceService', () => {
  it('checkIn rejects when the shift is not UPCOMING', async () => {
    const { service } = buildService({ shift: { status: 'COMPLETED' } });

    await expect(service.checkIn(mockAuthContext, 'shift-1')).rejects.toThrow(
      'not open for check-in',
    );
  });

  it('checkIn rejects before the early window opens', async () => {
    // ca hôm nay 14:00–19:00, earlyCheckInMinutes 15 → mở lúc 13:45 ICT
    const { service } = buildService({
      shift: {
        status: 'UPCOMING',
        date: getTodayIct(),
        startTime: '14:00',
        endTime: '19:00',
      },
      template: { earlyCheckInMinutes: 15, lateCheckOutMinutes: 30 },
      now: ictDate('13:00'),
    });

    await expect(service.checkIn(mockAuthContext, 'shift-1')).rejects.toThrow(
      'Too early to check in',
    );
  });

  it('checkIn stamps checkInAt, the NO-grace late flag, and moves to IN_PROGRESS', async () => {
    // now = 14:02 ICT cho ca 14:00 → checkInLateMinutes: 2
    /* update được gọi với checkInAt: now, status: 'IN_PROGRESS', checkInLateMinutes: 2 */
  });

  it('checkIn on time (or early) stores checkInLateMinutes: null', async () => {
    /* ... */
  });

  it('checkOut computes capped payable minutes and completes the shift', async () => {
    /* ... */
  });

  it('checkOut persists the handover note when provided', async () => {
    /* ... */
  });

  it('cancel requires a reason of at least 10 characters and a valid category', async () => {
    const { service } = buildService({ shift: { status: 'UPCOMING' } });

    await expect(
      service.cancel(mockAuthContext, 'shift-1', 'too short', 'SICK'),
    ).rejects.toThrow('at least 10 characters');
    await expect(
      service.cancel(
        mockAuthContext,
        'shift-1',
        'a valid long reason',
        'BOGUS',
      ),
    ).rejects.toThrow('category');
  });

  it('cancel rejects an already-cancelled shift', async () => {
    /* reject với 'already cancelled' */
  });
});
```

- [ ] **Step 2: Cài đặt service**

```ts
const CANCEL_CATEGORIES = ['SICK', 'PERSONAL', 'SWAP', 'OTHER'] as const;

@Injectable()
export class ShiftAttendanceWorkspaceService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async checkIn(
    authContext: WorkspaceAuthContext,
    shiftId: string,
  ): Promise<boolean> {
    await assertShiftOwnerOrElevatedOrThrow({
      authContext,
      globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
      shiftId,
      operation: 'write',
    });

    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const shiftRepository =
          await this.globalWorkspaceOrmManager.getRepository<ShiftWorkspaceEntity>(
            workspace.id,
            'shift',
            { shouldBypassPermissionChecks: true },
          );
        const shift = await shiftRepository.findOne({ where: { id: shiftId } });

        if (!isDefined(shift)) throw new Error('Shift not found');
        if (shift.status !== 'UPCOMING')
          throw new Error('Shift is not open for check-in');
        if (isDefined(shift.checkInAt)) throw new Error('Already checked in');

        const template = await this.loadTemplate(
          workspace.id,
          shift.shiftTemplateId,
        );
        const earlyCheckInMinutes = template?.earlyCheckInMinutes ?? null;

        // chỉ guard khi template có cấu hình (null = tắt)
        if (
          earlyCheckInMinutes !== null &&
          isDefined(shift.startTime) &&
          shift.date === getTodayIct()
        ) {
          const opensAt = parseHHmm(shift.startTime) - earlyCheckInMinutes;

          if (getIctMinutesOfDay(new Date()) < opensAt) {
            throw new Error(
              `Too early to check in — opens ${Math.floor(opensAt / 60)}:${String(opensAt % 60).padStart(2, '0')} ICT`,
            );
          }
        }

        const now = new Date();
        // BR-9.1: không ân hạn — quá giờ bắt đầu >=1 phút là muộn
        const checkInLateMinutes = isDefined(shift.startTime)
          ? computeCheckInLateMinutes({
              date: shift.date,
              startTime: shift.startTime,
              checkInAt: now,
            })
          : null;

        // Tin Mattermost do workflow (Task 16) bắn theo sự kiện record-updated —
        // mutation này chỉ ghi dữ liệu, không gọi HTTP nào.
        await shiftRepository.update(
          { id: shiftId },
          {
            checkInAt: now.toISOString(),
            status: 'IN_PROGRESS',
            checkInLateMinutes,
          },
        );

        return true;
      },
      authContext,
    );
  }

  async checkOut(
    authContext: WorkspaceAuthContext,
    shiftId: string,
    handoverNote: string | null,
  ): Promise<boolean> {
    await assertShiftOwnerOrElevatedOrThrow({
      /* như trên */
    });

    // bên trong executeInWorkspaceContext:
    //   yêu cầu shift.checkInAt ('Not checked in yet'), yêu cầu !shift.checkOutAt
    //   const template = await this.loadTemplate(...)
    //   workingMinutes = computePayableMinutes({
    //     checkInAt: new Date(shift.checkInAt), checkOutAt: now,
    //     startTime: shift.startTime ?? '00:00', endTime: shift.endTime ?? '24:00',
    //     earlyCheckInMinutes: template?.earlyCheckInMinutes ?? null,
    //     lateCheckOutMinutes: template?.lateCheckOutMinutes ?? null })
    //   update: { checkOutAt: now, status: 'COMPLETED', workingMinutes,
    //             ...(isNonEmptyString(handoverNote) ? { handoverNote } : {}) }
  }

  async cancel(
    authContext: WorkspaceAuthContext,
    shiftId: string,
    reason: string,
    category: string,
  ): Promise<boolean> {
    await assertShiftOwnerOrElevatedOrThrow({
      /* như trên */
    });

    if (reason.trim().length < 10) {
      throw new Error('Cancel reason must be at least 10 characters');
    }
    if (!CANCEL_CATEGORIES.includes(category as never)) {
      throw new Error(`Invalid cancel category: ${category}`);
    }

    // bên trong executeInWorkspaceContext:
    //   reject khi status === 'CANCELLED' ('already cancelled')
    //   reject khi status === 'COMPLETED' ('completed shifts cannot be cancelled')
    //   update: { status: 'CANCELLED', cancelReason: reason, cancelCategory: category,
    //             cancelledAt: new Date().toISOString() }
  }

  private async loadTemplate(
    workspaceId: string,
    shiftTemplateId: string | null,
  ) {
    if (!isDefined(shiftTemplateId)) return null;

    const templateRepository =
      await this.globalWorkspaceOrmManager.getRepository<ShiftTemplateWorkspaceEntity>(
        workspaceId,
        'shiftTemplate',
        { shouldBypassPermissionChecks: true },
      );

    return templateRepository.findOne({ where: { id: shiftTemplateId } });
  }
}
```

Điền các phần body đang là comment bằng code thật theo đúng hình dạng của `checkIn` (comment ở đây chỉ là nén cho plan; file thật phải có cài đặt đầy đủ).

- [ ] **Step 3: Resolver** — bắt chước `sprint-complete.resolver.ts` chính xác:

```ts
@CoreResolver()
@UseGuards(WorkspaceAuthGuard)
export class ShiftAttendanceResolver {
  constructor(
    private readonly shiftAttendanceWorkspaceService: ShiftAttendanceWorkspaceService,
  ) {}

  @Mutation(() => Boolean, { description: 'Check in to a registered shift.' })
  @UseGuards(NoPermissionGuard)
  async checkInShift(
    @Args('shiftId', { type: () => UUIDScalarType }) shiftId: string,
  ): Promise<boolean> {
    return this.shiftAttendanceWorkspaceService.checkIn(
      getWorkspaceAuthContext(),
      shiftId,
    );
  }

  @Mutation(() => Boolean, {
    description: 'Check out of a shift; computes payable minutes.',
  })
  @UseGuards(NoPermissionGuard)
  async checkOutShift(
    @Args('shiftId', { type: () => UUIDScalarType }) shiftId: string,
    @Args('handoverNote', { type: () => String, nullable: true })
    handoverNote: string | null,
  ): Promise<boolean> {
    return this.shiftAttendanceWorkspaceService.checkOut(
      getWorkspaceAuthContext(),
      shiftId,
      handoverNote ?? null,
    );
  }

  @Mutation(() => Boolean, {
    description: 'Cancel a registered shift with a reason and category.',
  })
  @UseGuards(NoPermissionGuard)
  async cancelShift(
    @Args('shiftId', { type: () => UUIDScalarType }) shiftId: string,
    @Args('reason', { type: () => String }) reason: string,
    @Args('category', { type: () => String }) category: string,
  ): Promise<boolean> {
    return this.shiftAttendanceWorkspaceService.cancel(
      getWorkspaceAuthContext(),
      shiftId,
      reason,
      category,
    );
  }
}
```

- [ ] **Step 4: Module + đăng ký** — `shift.module.ts` providers `[ShiftAttendanceWorkspaceService, ShiftAttendanceResolver]`; import trong `core-engine.module.ts` (dòng import + entry `imports:`, cạnh `SprintModule`).

- [ ] **Step 5: Chạy test + typecheck** — `npx jest "shift-attendance"` → PASS; `npx nx typecheck twenty-server` → PASS.

- [ ] **Step 6: Smoke GraphQL** — start server, chạy trong GraphQL playground: `mutation { checkInShift(shiftId: "<uuid>") }` → trả `true`, record chuyển `IN_PROGRESS` và `checkInLateMinutes` được đóng dấu khi bấm quá giờ bắt đầu (hoặc lỗi validation rõ ràng khi ngoài cửa sổ).

---

### Task 12: Routing, shell và data hook phía frontend

**Mục tiêu:** Các route `/shift`, `/shift/register`, `/shift/report` với provider stack cho phép các generic record component hoạt động, cộng đủ bộ data hook.

**Files:**

- Sửa: `packages/twenty-shared/src/types/AppPath.ts`
- Sửa: `packages/twenty-front/src/modules/app/hooks/useCreateWorkspaceAppRouter.tsx`
- Tạo: `packages/twenty-front/src/modules/shift/components/ShiftPageShell.tsx`
- Tạo: `packages/twenty-front/src/modules/shift/components/ShiftTopBar.tsx`
- Tạo: `packages/twenty-front/src/modules/shift/hooks/useShiftViews.ts`
- Tạo: `packages/twenty-front/src/modules/shift/hooks/useShiftTemplates.ts`
- Tạo: `packages/twenty-front/src/modules/shift/hooks/useMyShifts.ts`
- Tạo: `packages/twenty-front/src/modules/shift/hooks/useShiftAttendance.ts`
- Tạo: `packages/twenty-front/src/modules/shift/graphql/shiftAttendanceMutations.ts`
- Tạo: `packages/twenty-front/src/pages/shift/ShiftPage.tsx`
- Tạo: `packages/twenty-front/src/pages/shift/ShiftRegisterPage.tsx`
- Tạo: `packages/twenty-front/src/pages/shift/ShiftReportPage.tsx`

- [ ] **Step 1: Routes**

`AppPath.ts`:

```ts
ShiftPage = '/shift',
ShiftRegisterPage = '/shift/register',
ShiftReportPage = '/shift/report',
```

`useCreateWorkspaceAppRouter.tsx`: ba khai báo `lazy()` + ba entry `<Route path={AppPath.X} …>`, copy từ các dòng route của TaskManager (114–136 / 212–241).

- [ ] **Step 2: `ShiftPageShell.tsx`** — copy nguyên `TaskManagerPageShell.tsx`, đổi prefix instance thành `shift-${viewId}` và `objectNameSingular` thành `'shift'`. Giữ comment về instance-id theo từng `viewId` và effect NumberOfSelectedRecords cục bộ. `useShiftViews.ts` resolve id của view `allShifts` seed sẵn theo đúng cách `useTaskManagerIssueViews` resolve view bảng dùng chung (đọc hook đó trước và chỉ bắt chước nhánh table-view).

- [ ] **Step 3: `ShiftTopBar.tsx`** — copy layout của `TaskManagerTopBar.tsx`: tiêu đề "Shifts", tab **My Week** (`AppPath.ShiftPage`) / **Register** (`AppPath.ShiftRegisterPage`) / **Report** (`AppPath.ShiftReportPage`), giữ `searchParams.toString()` khi navigate. Mọi chuỗi qua Lingui `t`/`<Trans>`.

- [ ] **Step 4: Data hooks**

`useShiftTemplates.ts`:

```ts
export type ShiftTemplateRecord = ObjectRecord & {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  dayKind: string | null;
  earlyCheckInMinutes: number | null;
  lateCheckOutMinutes: number | null;
  salaryPerHour: number | null;
  color: string | null;
  isActive: boolean;
};

export const useShiftTemplates = () => {
  const { records: shiftTemplates, loading } =
    useFindManyRecords<ShiftTemplateRecord>({
      objectNameSingular: 'shiftTemplate',
      filter: { isActive: { eq: true } },
      orderBy: [{ code: 'AscNullsLast' }],
      recordGqlFields: {
        id: true,
        name: true,
        code: true,
        startTime: true,
        endTime: true,
        dayKind: true,
        earlyCheckInMinutes: true,
        lateCheckOutMinutes: true,
        salaryPerHour: true,
        color: true,
        isActive: true,
      },
      limit: 100,
    });

  return { shiftTemplates, loading };
};
```

`useMyShifts.ts` — ca của một member trong khoảng `[fromDate, toDate]` (dùng cho My Week và Report):

```ts
export const useMyShifts = ({
  memberId,
  fromDate,
  toDate,
}: {
  memberId: string | undefined;
  fromDate: string;
  toDate: string;
}) => {
  const {
    records: shifts,
    loading,
    refetch,
  } = useFindManyRecords<ShiftRecord>({
    objectNameSingular: 'shift',
    filter: {
      ...(isDefined(memberId) ? { memberId: { eq: memberId } } : {}),
      date: { gte: fromDate, lte: toDate },
    },
    orderBy: [{ date: 'AscNullsLast' }],
    recordGqlFields: {
      id: true,
      name: true,
      date: true,
      status: true,
      templateCode: true,
      templateName: true,
      startTime: true,
      endTime: true,
      checkInAt: true,
      checkOutAt: true,
      checkInLateMinutes: true,
      workingMinutes: true,
      rateMultiplier: true,
      handoverNote: true,
      cancelCategory: true,
      memberId: true,
      shiftTemplateId: true,
      member: { id: true, name: true, avatarUrl: true },
    },
    limit: 400,
    skip: !isDefined(memberId),
  });

  return { shifts, loading, refetch };
};
```

(Type `ShiftRecord` khai ngay cạnh — nhớ có `checkInLateMinutes: number | null`; id member hiện tại lấy từ `currentWorkspaceMemberState`.)

`shiftAttendanceMutations.ts` + `useShiftAttendance.ts` — gql viết tay như `completeSprint`:

```ts
export const CHECK_IN_SHIFT = gql`
  mutation CheckInShift($shiftId: UUID!) {
    checkInShift(shiftId: $shiftId)
  }
`;
export const CHECK_OUT_SHIFT = gql`
  mutation CheckOutShift($shiftId: UUID!, $handoverNote: String) {
    checkOutShift(shiftId: $shiftId, handoverNote: $handoverNote)
  }
`;
export const CANCEL_SHIFT = gql`
  mutation CancelShift($shiftId: UUID!, $reason: String!, $category: String!) {
    cancelShift(shiftId: $shiftId, reason: $reason, category: $category)
  }
`;
```

```ts
export const useShiftAttendance = () => {
  const apolloCoreClient = useApolloCoreClient();
  const [checkInShiftMutation] = useMutation(CHECK_IN_SHIFT, {
    client: apolloCoreClient,
  });
  const [checkOutShiftMutation] = useMutation(CHECK_OUT_SHIFT, {
    client: apolloCoreClient,
  });
  const [cancelShiftMutation] = useMutation(CANCEL_SHIFT, {
    client: apolloCoreClient,
  });

  return {
    checkInShift: (shiftId: string) =>
      checkInShiftMutation({ variables: { shiftId } }),
    checkOutShift: (shiftId: string, handoverNote: string | null) =>
      checkOutShiftMutation({ variables: { shiftId, handoverNote } }),
    cancelShift: (shiftId: string, reason: string, category: string) =>
      cancelShiftMutation({ variables: { shiftId, reason, category } }),
  };
};
```

(`client: apolloCoreClient` là bắt buộc — có hai Apollo client.)

- [ ] **Step 5: Các page mỏng** — mỗi page theo mẫu `TaskManagerBoardPage.tsx`: resolve view `allShifts` qua `useShiftViews`, return `null` khi chưa có, bọc nội dung trong `<ShiftPageShell viewId={…}><ShiftTopBar/>…</ShiftPageShell>`.

- [ ] **Step 6: Kiểm chứng** — `npx nx typecheck twenty-front` → PASS; app chạy; 3 route render top bar với body rỗng.

---

### Task 13: Trang My Week (UI check-in/check-out)

**Mục tiêu:** "Nhà" vận hành của member: các ca tuần này, check-in/out một cú bấm với prompt handover note, hủy ca có lý do + phân loại, badge muộn hiển thị rõ.

**UI/UX:** Chưa có thiết kế Figma (`assets/` rỗng — thiết kế đang chờ; kiểm chứng theo spec chữ này). Layout từ trên xuống:

- **Panel hôm nay**: một card nổi bật cho mỗi ca hôm nay — tên ca + khung giờ + `Tag` trạng thái; `Button` chính "Check in" khi UPCOMING (disable kèm tooltip "Opens at HH:mm" trước cửa sổ), "Check out" khi IN_PROGRESS. Check-out mở modal có textarea tùy chọn "Handover note — pending conversations" và nút Confirm.
- **Danh sách tuần**: 7 mục theo ngày (Thứ 2 → CN theo ICT, hôm nay nổi bật), mỗi ca: khung giờ, chip mã ca (nền là `color` của template), tag trạng thái, giờ công `X.XXh` khi hoàn thành, badge OT `×2` khi `rateMultiplier > 1`, **badge đỏ "Muộn +X'" khi `checkInLateMinutes` có giá trị** (không ân hạn — muộn +1' cũng hiện), ca hủy gạch ngang kèm nhãn phân loại.
- **Kebab menu từng dòng**: "Cancel shift…" (chỉ UPCOMING/IN_PROGRESS) → modal: textarea lý do (đếm ký tự, min 10, Confirm disable tới khi hợp lệ) + `Select` phân loại (Sick leave / Personal / Shift swap / Other) + cảnh báo đỏ "This shift is in progress" khi phù hợp.
- **Footer tuần**: tổng giờ đăng ký và tổng giờ thực tế — hai con số trung tính, không mốc, không tô màu cảnh báo (việc nhắc cam kết là của PO, ngoài hệ thống).
- Empty state: "No shifts this week — register for next week" + nút → `/shift/register`. Loading: skeleton. Error: chữ lỗi inline kèm retry.

**Files:**

- Tạo: `packages/twenty-front/src/modules/shift/utils/shift-week.util.ts` (+ test)
- Tạo: `packages/twenty-front/src/modules/shift/components/ShiftTodayPanel.tsx`
- Tạo: `packages/twenty-front/src/modules/shift/components/ShiftWeekList.tsx`
- Tạo: `packages/twenty-front/src/modules/shift/components/CancelShiftModal.tsx`
- Tạo: `packages/twenty-front/src/modules/shift/components/CheckOutModal.tsx`
- Sửa: `packages/twenty-front/src/pages/shift/ShiftPage.tsx`

- [ ] **Step 1: Util tuần + test fail** — `getIctWeekRange(reference: Date): { fromDate: string; toDate: string; days: string[] }` trả tuần ICT bắt đầu Thứ 2 dạng `'YYYY-MM-DD'` (7 phần tử). Test: một tối Thứ 4 UTC đã là Thứ 5 ICT phải rơi đúng tuần; tuần bắt đầu Thứ 2.
- [ ] **Step 2: Chạy test** — `cd packages/twenty-front && npx jest "shift-week"` → FAIL, rồi cài đặt bằng `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })` + số học thứ-trong-tuần trên formatted parts (không `new Date(y, m, d)`), chạy lại → PASS.
- [ ] **Step 3: Components** — Linaria `styled` + token `themeCssVariables`; `Tag`, `Button`, `Select`, `ConfirmationModal`/`useModal` từ đúng bộ import mà `IssueWorklogList.tsx` dùng; mọi copy qua `t`/`<Trans>`. Nối `useMyShifts` + `useShiftAttendance`; sau mỗi mutation `await refetch()`. Điều kiện bật nút check-in suy từ logic tương đương `parseHHmm` phía client trong `shift-week.util.ts` (tái dùng cùng file).
- [ ] **Step 4: Kiểm chứng UI/UX trong browser** theo spec trên (các trạng thái: rỗng, loading, một ca UPCOMING hôm nay, check-out IN_PROGRESS có note, badge muộn sau một punch muộn, validation modal hủy, footer tổng số). Lưu file để Vite HMR tự reload.

---

### Task 14: Trang Register (lưới tuần kế tiếp)

**Mục tiêu:** Thay thế Google Sheet: lưới checkbox ngày × mẫu ca cho tuần sau, tổng số trung tính cập nhật trực tiếp, submit hàng loạt.

**UI/UX:** (spec chữ; chưa có thiết kế)

- Header: "Register shifts — week of {Mon} → {Sun}" kèm chuyển tuần (tuần hiện tại disable các ngày đã qua; không cho lùi về trước tuần hiện tại).
- Lưới: hàng = template đang hoạt động, nhóm `WEEKDAY` / `WEEKEND` (nhóm OT ẩn trừ khi tuần đang xem có ngày đặc biệt — kiểm tra qua record `specialDay`), cột = 7 ngày. Ô là checkbox; ô đã đăng ký render chip khóa; ô ngày đã qua disable. Ô template cuối tuần chỉ bật ở cột T7/CN; template trong tuần chỉ T2–T6. Không bao giờ render lương ở trang này.
- Sidebar tổng kết (live): tổng số ca và tổng giờ (đã chọn + đã đăng ký) của tuần đang xem, tách trong tuần / cuối tuần — chỉ là con số trung tính, không mốc/✓/⚠ (ngưỡng cam kết cố tình nằm ngoài hệ thống; PO theo dõi qua báo cáo).
- Submit: `Button` "Register N shifts" → mỗi ô một `createOneRecord` qua `Promise.allSettled` (pattern SBC-BOSS), rồi snackbar thành công + refetch. Lỗi từ hook phía server (trùng/quá khứ/inactive/slot OT bị lấy) hiện theo từng ô trong danh sách lỗi dưới lưới.

**Files:**

- Tạo: `packages/twenty-front/src/modules/shift/hooks/useShiftRegistration.ts`
- Tạo: `packages/twenty-front/src/modules/shift/components/ShiftRegisterGrid.tsx`
- Tạo: `packages/twenty-front/src/modules/shift/components/ShiftRegisterSummary.tsx`
- Sửa: `packages/twenty-front/src/modules/shift/utils/shift-week.util.ts` (+ test của nó)
- Sửa: `packages/twenty-front/src/pages/shift/ShiftRegisterPage.tsx`

- [ ] **Step 1: Util tổng số + test fail** — thêm `computeWeekTotals({ shifts, selections, templatesById }) → { totalHours, weekdayShiftCount, weekendShiftCount }` vào `shift-week.util.ts` (giờ từ hiệu `parseHHmm`, xử lý ca qua đêm; **không phán xét mốc**). Test: 5 ca trong tuần (24h) + 2 ca cuối tuần (8h) → `{ totalHours: 32, weekdayShiftCount: 5, weekendShiftCount: 2 }`; ca qua đêm 19:00–05:00 tính 10h; ca hủy bị loại.
- [ ] **Step 2: Cài đặt, test PASS** (`npx jest "shift-week"`).
- [ ] **Step 3: `useShiftRegistration.ts`** — state chọn ô (`Set` các key `"${date}|${templateId}"` trong `useState`), `registerSelected()` gọi `useCreateOneRecord({ objectNameSingular: 'shift' })` cho từng key với `{ date, shiftTemplateId, memberId }`, gom lỗi theo key từ `Promise.allSettled`, rồi `refetch`.
- [ ] **Step 4: Component lưới + sidebar**, nối vào page.
- [ ] **Step 5: Kiểm chứng UI/UX trong browser**: đăng ký một tuần, thấy chip khóa; thử trùng (lỗi hiện trong danh sách); nhìn tổng số cập nhật trực tiếp khi tick; kiểm tra bật/tắt ô theo ngày trong tuần/cuối tuần.

---

### Task 15: Trang Report (member × tháng)

**Mục tiêu:** Thay `!shift report` + bản chốt công tháng cho PO: thống kê tháng theo member kèm bảng ca, có số lần check-in muộn và thu nhập chỉ-của-mình.

**UI/UX:** (spec chữ; chưa có thiết kế)

- Bộ điều khiển: `Select` thành viên (chỉ render khi `useObjectPermissions()` của viewer có update-all trên `shift` — tức Leader/PO; ngược lại khóa về chính mình) + `Select` tháng (24 tháng gần nhất) — cả hai lưu vào URL (`?member=`, `?month=`).
- Hàng thẻ chỉ số (8): Số ca đăng ký · Tổng giờ đăng ký (Σ giờ theo cửa sổ snapshot của các ca không hủy — con số PO dùng để nhắc cam kết ngoài hệ thống) · Hoàn thành · Vắng (UPCOMING quá giờ kết thúc mà không có check-in — suy phía client) · **Check-in muộn** (đếm ca có `checkInLateMinutes` — không ân hạn) · Đã hủy · Tổng giờ công (`Σ workingMinutes/60`, 2 chữ số thập phân, làm tròn từng ca rồi cộng) · Giờ OT (`Σ` các ca có `rateMultiplier > 1`). Thẻ thứ 9 "Est. earnings" chỉ hiện khi mọi ca hoàn thành đều có `salaryPerHour` trên template (earnings = `giờ × salaryPerHour × (rateMultiplier ?? 1)`) — member luôn thấy thẻ này với báo cáo của chính mình (quyết định 12/08/2026); Leader/PO thấy với bất kỳ ai.
- Bảng: Ngày · Ca (mã + tên) · Khung giờ · Tag trạng thái · Giờ vào · Giờ ra · Giờ công · Hệ số · **badge "Muộn +X'" từ `checkInLateMinutes`** · icon cảnh báo khi check-out lệch >15 phút so cửa sổ (ngưỡng 15' chỉ áp cho check-out).
- Ghi chú footer: "Verify totals and send to PO at month end" (`<Trans>`).

**Files:**

- Tạo: `packages/twenty-front/src/modules/shift/utils/shift-report.util.ts` (+ test)
- Tạo: `packages/twenty-front/src/modules/shift/components/ShiftReportStatCards.tsx`
- Tạo: `packages/twenty-front/src/modules/shift/components/ShiftReportTable.tsx`
- Sửa: `packages/twenty-front/src/pages/shift/ShiftReportPage.tsx`

- [ ] **Step 1: Util báo cáo + test fail** — `computeMonthReport(shifts, templatesById)` trả các con số cho thẻ; test cover: tổng giờ đăng ký (hiệu giờ snapshot, xử lý qua đêm, loại ca hủy), suy diễn Vắng (UPCOMING + quá giờ kết thúc + không check-in), **đếm check-in muộn (mọi `checkInLateMinutes >= 1` đều đếm — không ngưỡng)**, làm tròn giờ công (2 chữ số từng ca rồi cộng — rule CRM-1313 của SBC-BOSS), nhóm giờ OT, earnings chỉ-khi-đủ-dữ-liệu-lương.
- [ ] **Step 2: Cài đặt → test PASS** (`npx jest "shift-report"`).
- [ ] **Step 3: Component + nối page** — tái dùng `useMyShifts` với khoảng tháng và id member được chọn.
- [ ] **Step 4: Kiểm chứng UI/UX trong browser** với dữ liệu seed + punch tay: tổng khớp tính tay; một punch muộn hiện ở cả thẻ lẫn badge dòng; select thành viên ẩn với member thường; member thấy thẻ earnings của chính mình.

---

### Task 16: Hai workflow Mattermost (dựng trong UI Twenty — không viết code server)

**Mục tiêu:** Toàn bộ thông báo (BR-9.5, quyết định 12/08/2026) chạy bằng workflow engine có sẵn: (1) tin check-in/check-out theo sự kiện record-updated, (2) tin nhắc đăng ký Chủ nhật 15:00 ICT theo cron trigger. Sản phẩm của task là **file hướng dẫn dựng workflow** + 2 workflow đã dựng và test trên môi trường dev. Webhook URL/channel/lời văn tin nằm trong workflow node — Leader/PO tự sửa về sau.

**Files:**

- Tạo: `docs/features/2026-08-11-cs-shift-management/mattermost-workflows.md` — hướng dẫn từng bước (tiếng Việt, có ảnh chụp màn hình) để dựng lại 2 workflow trên bất kỳ workspace nào
- Tham chiếu năng lực engine: `packages/twenty-server/src/modules/workflow/workflow-executor/workflow-actions/` (các action `http-request`, `mail-sender`, `filter`, `if-else`, `code`, `record-crud`, `iterator`) và `workflow-trigger/automated-trigger/` (listener record event + cron trigger)

- [ ] **Step 1: Khảo sát năng lực workflow (bước chặn rủi ro — làm TRƯỚC khi viết guide)** — mở màn Workflows trên dev và xác nhận từng khả năng: (a) trigger "Record updated" trên `shift` có cho lọc theo field vừa thay đổi không (kiểm tra listener `workflow-database-event-trigger.listener.ts` xem payload có `updatedFields`); (b) node `http-request` nhận body JSON tùy biến với biến `{{record.*}}`; (c) `if-else` so sánh được `checkInLateMinutes > 0`; (d) cron trigger nhận pattern `0 8 * * 0`; (e) node `record-crud`/search + `code` đủ để tính "member chưa có ca tuần sau". Khả năng nào thiếu → ghi vào guide kèm phương án thay thế (thiết kế cron-code cũ còn trong lịch sử git của plan này — khôi phục được nếu cần).

- [ ] **Step 2: Viết `mattermost-workflows.md`** với 2 công thức đầy đủ (node nào, giá trị gì):

**Workflow 1 — "Shift punch → Mattermost":**

1. Trigger: `Record updated` trên object `shift`.
2. Filter: chỉ tiếp tục khi `checkInAt` hoặc `checkOutAt` nằm trong danh sách field vừa thay đổi (nếu engine không expose updatedFields → thay bằng điều kiện `status` = IN_PROGRESS/COMPLETED, chấp nhận tin trùng khi leader sửa các field khác).
3. If/else theo nhánh:
   - Check-in muộn (`checkInLateMinutes > 0`): text `✅ {{record.name}} check-in lúc {{record.checkInAt}} — ⚠ muộn +{{record.checkInLateMinutes}} phút`
   - Check-in đúng giờ: text như trên, không có nhãn muộn
   - Check-out (`checkOutAt` vừa set): text `🏁 {{record.name}} check-out — giờ công {{record.workingMinutes}} phút`
4. `http-request`: POST tới webhook Mattermost (URL + channel điền trong node — mirror payload của gateway BSS, xem `mmBot.service.ts` ở §0.3).

**Workflow 2 — "Nhắc đăng ký Chủ nhật":**

1. Trigger: Cron `0 8 * * 0` (= 15:00 ICT Chủ nhật).
2. Search records: các `shift` có `date` trong [Thứ 2..CN tuần kế tiếp] + toàn bộ `workspaceMember` đang active.
3. Node `code` (JS): diff hai danh sách → member thiếu; build text @mention từng người (`@` + phần local của email — convention handle SBC-BOSS) kèm link `{serverUrl}/shift/register` và hạn chót.
4. `http-request` → webhook Mattermost. (Tùy chọn: thêm bước `mail-sender` gửi email từng member thiếu — email dự phòng theo BR-8.3.)

- [ ] **Step 3: Dựng 2 workflow trên dev theo đúng guide**, activate cả hai. Ghi chú trong guide: workflow là **dữ liệu theo workspace** — môi trường/workspace mới phải dựng lại theo guide (không seed bằng code được); log từng lần gửi xem ở record `workflowRun`.

- [ ] **Step 4: Phân quyền** — Settings → Roles: role member **không có quyền xem/sửa Workflows** (webhook URL nằm trong node); chỉ Leader/PO. Ghi bước này vào guide + checklist go-live.

- [ ] **Step 5: Kiểm chứng end-to-end**
  - Sửa tay `checkInAt` trên một record shift → channel test nhận tin trong vài giây; set `checkInLateMinutes = 5` → tin có "⚠ muộn +5 phút".
  - Bấm run thử workflow nhắc → tin @mention đúng các member chưa đăng ký tuần sau.
  - Deactivate cả 2 workflow → check-in/out trong app vẫn hoạt động bình thường, chỉ không có tin (BR-9.4 thỏa mãn nhờ workflow chạy async, không nằm trên đường ghi dữ liệu).
  - Lưu ý ghi vào guide: leader bù công (sửa `checkOutAt` tay) cũng bắn Workflow 1 → có tin check-out cho lần bù công; chấp nhận (minh bạch) hoặc thêm điều kiện lọc nếu team không muốn.

---

### Task 17: Upgrade command cho workspace đang chạy

**Mục tiêu:** Workspace prod/staging (không `database:reset`) nhận 3 object khi nâng phiên bản.

**Files:**

- Tạo: `packages/twenty-server/src/database/commands/upgrade-version-command/2-29/2-29-workspace-command-<timestamp>-sync-shift-standard-objects.command.ts`
- Tạo: `.../2-29/2-29-upgrade-version-command.module.ts`
- Sửa: `.../workspace-command-provider.module.ts`
- Sửa (generated): 3 version constant qua `npx nx version:bump twenty-server`

- [ ] **Step 1: Đọc trọn file tham chiếu** — `2-26-workspace-command-1784910000000-sync-epic-standard-objects.command.ts`. Chi tiết bất di bất dịch nó mã hóa: system field **bị loại** khỏi danh sách UUID field (engine tự chèn cho object mới), nhưng **cả hai chiều của mỗi cặp relation phải liệt kê tường minh**.
- [ ] **Step 2: Viết command** — `@RegisteredWorkspaceCommand('2.29.0', <epoch-ms>)`, `@Command({ name: 'upgrade:2-29:sync-shift-standard-objects' })`; diff trạng-thái-code (`computeTwentyStandardApplicationAllFlatEntityMaps`) với trạng-thái-workspace theo `universalIdentifier`; `flatEntityToCreate` phủ: 3 object, toàn bộ business field của chúng (gồm `shift.checkInLateMinutes`) **cộng** `workspaceMember.shifts` (cả hai chiều relation!), 6 index, 6 view + view field, 3 page layout (+tab/widget), 3 navigation item; tôn trọng `options.dryRun`; chạy qua `workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigration` và throw khi `status === 'fail'`.
- [ ] **Step 3: Module + đăng ký + bump version** — liệt kê command trong `providers` của module 2-29, import module trong `workspace-command-provider.module.ts`, chạy `npx nx version:bump twenty-server`.
- [ ] **Step 4: Kiểm chứng bằng dry run** — `npx nx run twenty-server:command -- upgrade:2-29:sync-shift-standard-objects --dryRun` trên một workspace tạo _trước_ branch này (tạo trên `main` rồi switch): log các create dự kiến, không ghi gì; sau đó chạy thật + check Postgres MCP thấy `core.objectMetadata` có 3 dòng cho workspace đó. Nhắc trong release note: **workspace mới phải dựng lại 2 workflow Mattermost theo guide Task 16** (workflow là dữ liệu, không đi theo migration).

---

### Task 18: i18n, codegen, lint và QA tổng

**Mục tiêu:** Sẵn sàng ship: dịch đã compile, GraphQL types đã regen, lint sạch, luồng end-to-end đã kiểm chứng.

- [ ] **Step 1:** `npx nx run twenty-server:lingui:extract && npx nx run twenty-front:lingui:extract && npx nx run twenty-front:lingui:compile` (bắt buộc compile, không thì chuỗi mới không render — tiền lệ commit `0449331cac`).
- [ ] **Step 2:** `npx nx run twenty-front:graphql:generate` (mutation mới) — commit file generated.
- [ ] **Step 3:** `npx nx lint:diff-with-main twenty-server && npx nx lint:diff-with-main twenty-front --configuration=fix && npx nx fmt twenty-front && npx nx typecheck twenty-server && npx nx typecheck twenty-front` → tất cả PASS.
- [ ] **Step 4:** `npx nx test twenty-server` → PASS (mọi suite mới xanh, không regression; snapshot test standard-object đã cập nhật ở Task 4).
- [ ] **Step 5: Kịch bản QA end-to-end** (thủ công, `yarn start`; dựng và activate 2 workflow Mattermost theo guide Task 16, trỏ webhook về channel test trước):
  1. `database:reset` mới; đăng nhập. Sidebar có 3 mục (Shifts, Shift Templates, Special Days); `/objects/shiftTemplates` **không có cột lương**.
  2. `/shift/register`: đăng ký tuần sau — 5 ca trong tuần + 2 ca cuối tuần; tổng kết hiện 7 ca / 32h (trung tính, không cảnh báo); thử trùng thấy lỗi theo ô; user thứ hai lấy trước một slot OT thì user đầu bị chặn.
  3. Leader (admin mặc định) mở `/objects/shifts`: thấy ca của mọi người; member thường (user thứ hai, role không phải admin) không sửa trực tiếp được `checkInAt` (hook throw).
  4. Đăng ký một ca cho **hôm nay** bằng user có quyền; `/shift`: Check-in trước cửa sổ → lỗi rõ ràng; **check-in 2 phút sau giờ bắt đầu → thành công, dòng hiện badge "Muộn +2'", channel Mattermost test nhận tin có "⚠ muộn +2 phút"**; check-in đúng giờ ở ca khác → không badge, tin không nhãn muộn. Check-out kèm handover note → COMPLETED với `workingMinutes` bị chặn trần và message check-out trong channel.
  5. Để một ca của member treo IN_PROGRESS (không check-out); với vai leader, sửa thẳng `checkOutAt` trên record trong `/objects/shifts` → ca tự hoàn thành với `workingMinutes` tính lại (hook Task 10); sửa `checkInAt` về trước giờ bắt đầu → badge muộn tự mất.
  6. Hủy một ca sắp diễn ra (lý do ≥10 ký tự + phân loại) → CANCELLED, gạch ngang trong My Week.
  7. Tạo `specialDay` cho ngày mai (SPECIFIC, ×2), đăng ký ca ngày mai → badge `rateMultiplier = 2`; `/shift/report` hiện nhóm OT, **thẻ Check-in muộn**, và earnings: member thấy thẻ earnings của mình; leader thấy của bất kỳ ai.
  8. Run thử workflow nhắc trong màn Workflows → channel Mattermost nhận tin @mention member có tuần sau trống; deactivate cả 2 workflow rồi check-in lại → punch vẫn ghi bình thường, chỉ không có tin; log các lần gửi xem được ở `workflowRun`.

---

## Checklist tự soát (chạy sau khi viết code, trước khi bàn giao)

- Mọi yêu cầu ở §0.1 map vào task: danh mục (ẩn lương khỏi view) → T2/T7, đăng ký + tổng số trung tính → T9/T14, chấm công + trần + handover → T8/T11/T13, **cờ muộn không ân hạn** → T8 (`computeCheckInLateMinutes`) / T11 (đóng dấu) / T10 (tính lại khi leader sửa) / T13+T15 (hiển thị), thông báo Mattermost + nhắc Chủ nhật → **T16 (2 workflow, không code server)**, bù công → T9 (chặn member) + T10 (leader sửa + tự tính lại), xin nghỉ/đổi ca → tự hủy qua T11, hệ số OT + slot OT độc quyền → T3/T9, báo cáo (đếm muộn, earnings của mình) → T15 (tháng) + T13 (ngày/tuần).
- Đối chiếu chéo tên: object key (`shiftTemplate|specialDay|shift`), tên field (gồm `checkInLateMinutes`), thành viên `AppPath`, tên mutation (`checkInShift|checkOutShift|cancelShift`), và mọi UUID ở §0.5/Task 1 được tham chiếu y hệt trong Task 2–17.
- Bảo mật (rules của workspace): server không giữ webhook URL/secret nào — key nằm trong node `http-request` của workflow (BR-9.5), role member không có quyền xem/sửa Workflows (cấu hình lúc go-live, Task 16 Step 4); workflow chạy async nên không bao giờ chặn ghi dữ liệu; mọi truy cập repository đi qua workspace ORM, bypass permission tường minh chỉ trong service/hook phía server.
- Phân quyền `shift` lúc go-live (Task 9): role member **KHÔNG** được cấp `canSoftDeleteObjectRecords` / `canDestroyObjectRecords` trên object `shift`. Ownership theo dòng chỉ được canh bằng pre-query hook, mà delete/destroy không có hook per-row — member hủy ca qua mutation `cancelShift` (Task 11), không xóa trực tiếp. Các hook create/update đã chặn: `createOne`/`createMany` **chỉ** từ chối `upsert` (vector ghi đè thật) — client `id` được cho qua (Twenty `useCreateOneRecord` luôn tự sinh `v4()` cho cache; không có `upsert` thì id trùng va chạm primary key khi INSERT chứ không ghi đè được, nên dấu ownership `memberId` + chặn `upsert` đã đóng IDOR); `updateMany` chặn actor không elevated.
- **Đọc `shift` cũng scope theo caller (đóng IDOR read — security.md §6):** Task 9 chỉ enforce ownership trên WRITE; READ trước đây hở vì `shift` là object toàn-workspace (không app-connected) nên app-scope không lọc SELECT. Đã thêm 2 pre-query hook `shift.findMany` / `shift.findOne`: actor **không** elevated bị ép AND `memberId = <chính mình>` vào filter (không có filter thì gán thẳng; filter cố nhắm member khác thành `other AND self` → rỗng, không lộ); Leader/PO (elevated) đọc tất cả. Phép "elevated" dùng **`isElevatedActor({ operation: 'write' })`** — **cùng discriminator với WRITE** (`canUpdateAllObjectRecords`), **cố ý không dùng `operation: 'read'`** vì role member seed sẵn `canReadAllObjectRecords=true` sẽ khiến member bị nhận nhầm là elevated. Actor không có `workspaceMemberId` (API key không elevated) → deny. Frontend `ShiftReportPage` cũng khoá cổng theo `canSoftDeleteObjectRecords && canDestroyObjectRecords` (member không có → luôn khoá về báo cáo của mình) thay cho `canUpdateObjectRecords` (member cũng có → hở); đây chỉ là defense-in-depth, hook server mới là chốt chặn.
- **Dev-seeder provision sẵn split member-vs-leader + RVP (đóng read-IDOR ở tầng dữ liệu):** trước đây role "Member" seed mặc định có `canUpdateAllObjectRecords=true` nên **bị coi là elevated** (`isElevatedActor=false` không bao giờ đúng) — không có member bị hạn chế để QA, và không có chỗ đúng để gắn RVP. Nay `dev-seeder-permissions.service.ts` tạo thêm role **"CS Member"** riêng, NON-elevated: `canUpdateAllObjectRecords=false` (→ `isElevatedActor=false`, find-hook + write-guard scope về chính mình), `canSoftDeleteAllObjectRecords=false` + `canDestroyAllObjectRecords=false` (client leader-gate đọc là "member", cấm member xóa/hủy cứng ca); `canReadAllObjectRecords=true` để đọc catalog dùng chung `shiftTemplate`/`specialDay`. Vì `shift` là object **không phải system**, INSERT/UPDATE cần `canUpdateObjectRecords` → cấp **per-object update grant trên `shift`** (read+update=true, softDelete/destroy=false) để member vẫn **đăng ký + hủy ca của mình** (grant per-object KHÔNG elevate actor vì `shouldBypassAppScope` chỉ đọc cờ `canUpdateAllObjectRecords` thô). Gắn **RVP** `shift.filter = { memberId: { eq: "$$CURRENT_MEMBER$$" } }`, `currentMemberFieldName: 'id'` **chỉ vào role CS Member** (KHÔNG vào Admin / bất kỳ all-records role nào) — scope MỌI read `shift` (top-level find, relation hydration qua `process-nested-relations-v2 → getMany`, groupBy) và validate own-create/own-update (insert/update). Seed gán **Jony → CS Member** (member non-elevated thật để QA login), giữ **Jane → Admin** làm Leader/PO elevated. **Lúc go-live prod, admin phải tự tạo role CS Member hạn chế tương đương + RVP này bằng tay** (là **dữ liệu**, giống 2 workflow Mattermost ở Task 16 — không đi kèm code sync).
- Khác biệt có chủ đích so với SBC-BOSS: punch là `DATE_TIME` thật thay vì chuỗi locale; không có `breakMinutes` (field chết bên đó); không resurrect; **check-in muộn không ân hạn (SBC-BOSS dùng badge ±15'; ở đây 15' chỉ áp cho cảnh báo check-out)**. Giống SBC-BOSS: không luồng duyệt — leader sửa punch với tự tính lại, member tự hủy; Mattermost là kênh thông báo.
