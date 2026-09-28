# Merchant Email Campaigns

Email marketing cho merchant, đóng gói dưới dạng Twenty Application. Gửi qua Resend hoặc qua
email service có sẵn của mình (Custom HTTP). App khác bắn event sang theo đúng format Brevo.
Không sửa dòng nào trong `twenty-front` / `twenty-server` / `twenty-shared`.

## Nó làm gì

| Nhu cầu                                                     | Cách đáp ứng                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Gửi mail khi merchant cài app, gỡ app, đổi Shopify plan/app plan | Campaign loại **Automation**, chọn trigger + delay (phút)                   |
| Gửi một lần cho một nhóm merchant                           | Campaign loại **Broadcast**, gửi ngay hoặc hẹn giờ                             |
| Lọc audience theo app, trạng thái install, plan, quốc gia   | Bộ lọc audience trong Email Studio, nút **Estimate audience** đếm trước        |
| Soạn email không cần biết HTML                              | Editor dạng block (heading, text, button, image, divider, spacer) + preview   |
| Cá nhân hoá                                                 | Biến `{{storeName}}`, `{{contactName\|there}}`, `{{appName}}`, ...            |
| Thử trước khi gửi                                           | Nút **Send test** gửi bản nháp hiện tại tới một địa chỉ                        |
| Unsubscribe                                                 | Link bắt buộc ở footer + header one-click (RFC 8058) cho Gmail/Yahoo           |
| Lịch sử gửi                                                 | Object `Email send`: một dòng mỗi email SENT / FAILED / SKIPPED, gắn merchant |
| App khác bắn event (trial sắp hết, feature dùng lần đầu...) | `POST /s/email-campaigns/events`, cùng body và header với Brevo `/v3/events`   |
| Dùng email service nội bộ thay Resend                        | `EMAIL_PROVIDER = CUSTOM_HTTP` + endpoint, headers, body template             |

Mọi thứ nằm trong sidebar **Email Marketing**: `Email Studio` (trang chính, 3 tab Campaigns /
Templates / Integrations), `Campaigns`, `Templates`, `Send log`, `Event log`.

## Mô hình dữ liệu

```
emailTemplate                 emailCampaign                          emailSend
  name, subject, previewText    name, campaignType, status             name (= địa chỉ nhận)
  design (RAW_JSON: blocks) <── template                               status, trigger, subject
                                trigger, delayMinutes                  providerMessageId, errorMessage
                                audienceFilter (RAW_JSON)              sentAt
                                fromEmail, replyTo                     campaign ──> emailCampaign
                                sendOncePerMerchant                    merchant ──> merchant
                                scheduledAt, startedAt, completedAt
                                lastError

merchantEvent                 (log mọi event app khác gửi sang, kể cả không khớp merchant)
  name (= event_name), email, domain, properties (RAW_JSON), occurredAt
  status MATCHED | UNMATCHED, campaignsQueued, merchant ──> merchant

merchant (đã có) + email (EMAILS), contactName, emailUnsubscribed, emailUnsubscribedAt
```

Những quyết định cần nhớ trước khi sửa:

1. **Template lưu block, không lưu HTML.** HTML được render lúc gửi bằng đúng hàm mà
   preview dùng (`src/utils/render-email-html.util.ts`), nên preview giống hệt mail thật, và
   sửa renderer là mọi template được sửa theo. HTML dùng table + inline style vì Outlook/Gmail
   bỏ `<style>` và flexbox. Mọi text của tác giả và dữ liệu merchant đều được escape.
2. **Audience là JSON chứ không phải relation tới `app`.** Một cạnh MANY_TO_ONE tới `app` sẽ
   kéo `emailCampaign` vào app-scope của fork và ẩn campaign khỏi member không có grant (cùng lý
   do với quyết định 1 của bd-prospects).
3. **Mọi logic function đọc/ghi bằng token của app** (`createAppClient`, `runAs: 'application'`).
   Route gọi từ Email Studio mặc định chạy bằng token uỷ quyền của member, và app-scope khi đó
   ẩn toàn bộ merchant/app mà member không có grant, nên audience sẽ đếm ra 0. Danh sách app và
   thống kê gửi cũng đi qua route (`/email-campaigns/apps`, `/email-campaigns/stats`) vì cùng
   lý do. Quyền **ai được bấm gửi** vẫn kiểm bằng token của member (xem mục Phân quyền).
4. **Chống gửi trùng.** Một shop có nhiều dòng merchant (mỗi app một dòng) cùng một email, nên
   broadcast bỏ qua địa chỉ đã có dòng `SENT` của campaign đó. Automation "send once" kiểm
   dòng `SENT` của (campaign, merchant) ngay trước khi gửi, cộng thêm `Idempotency-Key` của
   Resend. Job id chỉ gom sự kiện trùng trong cùng một phút: nếu dùng id cố định thì lần đầu
   FAILED sẽ chặn luôn mọi lần thử lại.
5. **Automation kiểm lại lúc gửi.** Trigger chỉ xếp job (có delay). Job đọc lại campaign và
   merchant rồi mới gửi, nên win-back 3 ngày sau uninstall sẽ tự bỏ qua merchant đã cài lại, và
   campaign bị Pause trong lúc chờ sẽ không gửi.
6. **Trigger không bắn khi sync điền dữ liệu lần đầu.** Plan đi từ rỗng sang có giá trị không
   tính là "đổi plan", và `using = null` được coi là đang cài (giống bd-prospects).
7. **Broadcast chạy theo lô 100** (giới hạn batch của Resend), mỗi lô là một job tự xếp lô kế
   tiếp. Pause/Cancel chỉ đổi status, lô kế tiếp tự dừng. Một lô mà **tất cả** đều FAILED (key
   sai, domain chưa verify) sẽ chuyển campaign sang PAUSED kèm `lastError`. Resume chạy lại từ
   đầu và bỏ qua địa chỉ đã gửi.

## Soạn template: block hoặc HTML/CSS

Editor có hai chế độ, chuyển bằng nút "Soạn bằng block / HTML / CSS". Nội dung của cả hai được
lưu song song trong `design`, và `design.mode` quyết định bản nào được gửi, nên đổi chế độ không
làm mất gì.

- **Block**: kéo thả kiểu danh sách (heading, text, button, image, divider, spacer), HTML được
  sinh bằng table + inline style.
- **HTML / CSS**: tab HTML và tab CSS. Lần đầu chuyển sang, HTML được khởi tạo từ thiết kế block
  (giữ nguyên `{{biến}}`), có nút "Chuyển thiết kế block sang HTML" để làm lại.
  - Đoạn HTML (fragment) được bọc thành tài liệu đầy đủ; tài liệu có sẵn `<html>` được giữ nguyên.
  - Khi gửi, CSS được **inline** vào phần tử bằng `juice` (Gmail/Outlook bỏ phần lớn `<style>`),
    media query và `@font-face` được giữ trong `<style>`. Preview dùng đúng hàm này.
  - Giá trị biến được escape HTML; `<script>` và thuộc tính `on*` bị loại bỏ.
  - HTML không có `{{unsubscribeUrl}}` thì footer huỷ đăng ký (sửa được chữ) được tự thêm cuối
    email; không template nào gửi đi mà thiếu link huỷ đăng ký.
  - Bản plain text được sinh từ HTML (link giữ URL trong ngoặc).

## Đa ngôn ngữ

UI của app đi theo ngôn ngữ của member trong Twenty; hiện có `en` (gốc) và `vi-VN` trong
`locales/`. Label của object/field/view/nav cũng được dịch. Trang huỷ đăng ký (merchant mở ngoài
Twenty) theo `Accept-Language` của trình duyệt: tiếng Việt hoặc tiếng Anh.

Thêm chuỗi mới: bọc bằng `t('...')` rồi chạy

```bash
yarn i18n:extract   # KHÔNG dùng thẳng `yarn twenty dev:translations-extract`
```

Extractor của SDK chỉ đọc file entry của front component và xoá mọi key khác khỏi catalog; script
này gọi nó rồi bổ sung chuỗi của mọi file trong `src/`, giữ bản dịch đã có, và báo số chuỗi còn
thiếu. Điền bản dịch vào `locales/vi-VN.json`. Nội dung email do người soạn quyết định, không dịch.

## Giao diện

Control trong studio (button, input, select, checkbox, tag...) dựng lại theo style và CSS variable
của Twenty thay vì dùng thẳng `twenty-ui/primitives`: các primitive tương tác của twenty-ui 2.42
(Select, Checkbox, Tag bấm được, SegmentedControl) dùng xử lý event của base-ui mà sandbox của front
component không chạy được (crash `pointerType` / `PointerEvent is not a constructor`, hoặc hiện
thành chữ trơn). Icon và `Tag` tĩnh vẫn lấy từ twenty-ui.

Ô nhập liệu chỉ đẩy `value` xuống host khi giá trị đổi từ bên ngoài (`useStableFieldValue`):
sandbox đồng bộ `value` lên phần tử thật sau mỗi render, và nếu đẩy mỗi phím thì gõ nhanh sẽ mất
ký tự.

## Trigger

| Trigger                | Điều kiện trên dòng merchant                              |
| ---------------------- | --------------------------------------------------------- |
| `INSTALLED`            | Dòng mới tạo với `using` khác `false`, hoặc `using` false → true |
| `UNINSTALLED`          | `using` true/null → false                                  |
| `SHOPIFY_PLAN_CHANGED` | `shopifyPlan` đổi từ một giá trị có sẵn                    |
| `PRICING_PLAN_CHANGED` | `pricingPlan` đổi từ một giá trị có sẵn                    |
| `CUSTOM_EVENT`         | App khác POST event có `event_name` trùng `eventName` của campaign |

## Nhận event từ app khác (Brevo-compatible)

Code đang gọi Brevo chỉ cần đổi URL và key (URL đầy đủ copy ở tab **Integrations**):

```js
const res = await fetch('https://<server>/s/email-campaigns/events', {
  method: 'POST',
  headers: {
    accept: 'application/json',
    'api-key': process.env.TWENTY_EVENTS_API_KEY, // = INBOUND_EVENTS_API_KEY của app
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    event_name: 'trial_ending',
    identifiers: { email_id: 'owner@shop.com' },
    contact_properties: { DOMAIN: 'shop.myshopify.com', APP: 'MIDA', FIRSTNAME: 'Linh' },
    event_properties: { days_left: 3 },
  }),
});
// 204 = nhận, 400 = payload sai ({ code, message }), 401 = sai key
```

Khi nhận một event:

1. Tìm merchant theo `DOMAIN` (không phân biệt hoa thường, bỏ `https://` và path), không có
   domain thì theo email. Có `APP` thì chỉ lấy dòng merchant của app đó.
2. `email_id` khác email đang lưu thì **ghi đè** `merchant.email` (bên gửi là nguồn chuẩn của
   địa chỉ). `FIRSTNAME` chỉ điền khi `contactName` đang trống.
3. Mỗi automation ACTIVE có trigger `Custom event (API)` và `eventName` trùng sẽ xếp **một**
   email cho shop (dòng merchant đầu tiên qua được audience filter, tránh gửi mỗi app một bản).
   Delay, send-once, audience và unsubscribe áp dụng như automation thường.
4. Ghi một dòng `merchantEvent`; không khớp merchant nào thì `UNMATCHED` để team biết sync thiếu.

Trong template, mọi `contact_properties` và `event_properties` dùng được qua `{{event.<key>}}`,
ví dụ `{{event.days_left}}`, `{{event.DOMAIN}}`. Giá trị lồng nhau được đổi thành JSON.

## Gửi qua email service có sẵn (Custom HTTP)

Đặt `EMAIL_PROVIDER = CUSTOM_HTTP`, rồi:

| Biến                         | Ví dụ                                                             |
| ---------------------------- | ----------------------------------------------------------------- |
| `CUSTOM_EMAIL_ENDPOINT`      | `https://mail.internal.example.com/send`                          |
| `CUSTOM_EMAIL_HEADERS`       | `{"Authorization": "Bearer ...", "x-service-key": "..."}` (secret) |
| `CUSTOM_EMAIL_BODY_TEMPLATE` | Mặc định khớp service hiện tại, xem dưới                          |

Body mặc định:

```json
{
  "toAddress": "{{to}}",
  "htmlData": "{{html}}",
  "subject": "{{subject}}",
  "sourceEmail": "{{fromEmail}}",
  "replyToAddress": "{{replyTo}}",
  "domain": "{{shopDomain}}",
  "oTag": "{{campaignName}}"
}
```

Token dùng được: `to`, `from`, `fromEmail`, `fromName`, `replyTo`, `subject`, `html`, `text`,
`unsubscribeUrl`, `shopDomain`, `campaignId`, `campaignName`, `merchantId`, `idempotencyKey`.
Giá trị **đúng bằng một token** được thay bằng giá trị thô, hoặc `null` khi rỗng (nên
`replyToAddress` ra `null` như code cũ). Token nằm giữa chuỗi dài hơn thì được nối thành text.
Giá trị không bao giờ được ghép vào JSON source, nên HTML hay dấu nháy trong email không làm
hỏng body.

Mọi phản hồi 2xx tính là đã gửi; `id` / `messageId` / `MessageId` trong phản hồi được lưu làm
message id. 429 và 5xx được thử lại 3 lần. Service không có batch, nên broadcast gửi 5 email
song song mỗi lượt. Service tự chịu trách nhiệm header `List-Unsubscribe`: token
`unsubscribeUrl` có sẵn nếu cần đưa vào body.

## Điều kiện tiên quyết

- Object `merchant` của workspace MIDA/BLOY đã có `using`, `shopifyPlan`, `pricingPlan`,
  `country`, `storeName`. App tự dò field nào tồn tại, thiếu field nào thì bộ lọc tương ứng
  không dùng được (workspace dev trơn không có sẵn các field này).
- **Job sync phải điền `merchant.email`** (field do app này tạo, kiểu EMAILS, tên `email` để
  bd-prospects đọc chung) và nên điền `contactName`. Merchant không có email bị bỏ qua.
- Một domain gửi đã verify trong Resend.
- `LOGIC_FUNCTION_TYPE=LOCAL` (hoặc driver tương đương) để trigger, job và cron chạy được.

## Cài đặt

```bash
cd packages/twenty-apps/internal/merchant-email-campaigns
yarn install
yarn twenty remote:add --as <tên> --url <server> --api-key <API_KEY>
yarn twenty plan --remote <tên>     # xem trước, không ghi gì
yarn twenty apply --remote <tên>    # build, upload, sync manifest, sinh API client
```

Sau khi cài, vào **Settings → Apps → Merchant Email Campaigns → Variables**:

| Biến                 | Bắt buộc | Ý nghĩa                                                                 |
| -------------------- | -------- | ----------------------------------------------------------------------- |
| `EMAIL_PROVIDER`     | Có       | `RESEND` (mặc định) hoặc `CUSTOM_HTTP`                                  |
| `RESEND_API_KEY`     | Nếu Resend | Key có quyền gửi                                                      |
| `DEFAULT_FROM_EMAIL` | Nên có   | Ví dụ `MIDA Team <hello@mida.so>`, dùng khi campaign để trống From      |
| `DEFAULT_REPLY_TO`   | Không    | Địa chỉ nhận reply                                                     |
| `UNSUBSCRIBE_SECRET` | Nên có   | Chuỗi ngẫu nhiên dài để ký link unsubscribe. **Đặt trước lần gửi đầu**: đổi sau này làm hỏng mọi link đã gửi |
| `PUBLIC_SERVER_URL`  | Tuỳ      | URL public của server cho link unsubscribe, mặc định là server URL      |
| `CAMPAIGN_SENDERS`   | Tuỳ      | Danh sách email member được phép launch, cách nhau bằng dấu phẩy, hoặc `*` |
| `INBOUND_EVENTS_API_KEY` | Nếu nhận event | Chuỗi ngẫu nhiên dài; app khác gửi trong header `api-key`. Chưa đặt thì mọi event bị từ chối |
| `CUSTOM_EMAIL_*`     | Nếu Custom HTTP | Xem mục Custom HTTP                                            |

Trang settings của app có health check: báo thiếu key, key bị Resend từ chối, cấu hình Custom
HTTP sai, thiếu From, chưa bật events API. Tab **Integrations** trong studio hiện provider đang
dùng, URL events API và 20 event gần nhất.

## Phân quyền

- **Launch** (Activate, Send now, Schedule, Pause, Resume, Cancel) đi qua route
  `launch-campaign`, route này chỉ cho member có quyền `Applications` hoặc có tên trong
  `CAMPAIGN_SENDERS`. Luật chuyển trạng thái nằm ở `resolve-campaign-transition.util.ts`.
- **Việc phải làm tay:** field `status` vẫn sửa được từ bảng Campaigns. Muốn chặn hẳn, vào
  Settings → Roles → role của team → Email campaign → khoá `canUpdateFieldValue` trên `Status`.
  Không làm thì một người sửa tay status thành ACTIVE là automation bắt đầu chạy.
- Role `Member` mặc định đọc được mọi object, nên ai cũng xem được template/campaign/send log.

## Vận hành

- **Bật automation `INSTALLED` sau khi sync backfill xong.** Trong lúc sync tạo hàng loạt dòng
  merchant, mỗi dòng mới là một sự kiện install.
- Chạy thử một function không cần đợi sự kiện: `yarn twenty dev:function:exec -n <tên>`
  (cần remote đăng nhập bằng user, API key không đủ quyền).
- Xem log function: `yarn twenty dev:function:logs`.
- Merchant bấm unsubscribe: trang GET chỉ hiện nút xác nhận (tránh link scanner của công ty tự
  unsubscribe hộ), POST mới ghi `emailUnsubscribed = true`.

## Phát triển

```bash
yarn test                 # vitest, các util thuần
yarn lint
yarn twenty dev:typecheck
```

Build front component của SDK xoá mọi dòng bắt đầu bằng `//`, kể cả trong template literal
(mất luôn dấu backtick đóng, bundle hỏng với "Unexpected token"). Chuỗi nhiều dòng hiển thị
trên UI không được có dòng như vậy.

Front component chạy trong Remote DOM: không có `window`/`document`, không đọc được vị trí con
trỏ, nên nút chèn biến luôn thêm vào cuối ô đang sửa. Thuộc tính `min`/`max` của input cũng không
được chuyển tiếp. Preview là `<iframe srcDoc>` với
`sandbox=""` để link trong email không điều hướng khỏi studio.
