# Deploy lên production

App này không nằm trong build của server. Nó được đẩy lên một Twenty server đang chạy bằng CLI
`twenty`, từ một máy có source của app (máy dev hoặc runner CI). Server production không cần
checkout repo.

## 1. Điều kiện phía server

| Thứ cần có | Vì sao |
| --- | --- |
| `LOGIC_FUNCTION_TYPE=LOCAL` trong env của server **và** worker | Mặc định biến này chỉ là `LOCAL` khi `NODE_ENV=development`; ngoài ra là `DISABLED` (`config-variables.ts:731`). Để `DISABLED` thì trigger, job và cron của app không chạy: campaign vẫn tạo được nhưng không gửi gì. |
| Worker chạy (`nx run twenty-server:worker` hoặc service worker trong compose) | Broadcast gửi theo lô bằng job, và cron `*/5 * * * *` của `start-scheduled-campaigns` gom campaign hẹn giờ. Không có worker thì chỉ "Send now" một lô đầu là chạy. |
| `SERVER_URL` là URL public HTTPS | Link unsubscribe sinh từ đây khi không set `PUBLIC_SERVER_URL`. |
| Object `merchant` có sẵn | Là standard object của fork (`packages/twenty-server/src/modules/merchant/`), không phải của upstream. |

Không cần feature flag nào. `FeatureFlagKey` không có flag cho application.

**Nếu production đang chạy bản cũ hơn repo:** deploy code server trước, rồi chạy đúng thứ tự này
(xem `packages/twenty-server/docs/UPGRADE_COMMANDS.md`):

```bash
yarn install
npx nx build twenty-shared --skip-nx-cache
node dist/command/command.js upgrade
node dist/command/command.js cache:flush     # bắt buộc, migration không tự invalidate cache
```

Kiểm tra bằng `node dist/command/command.js upgrade:status` trước khi cài app: mọi workspace phải
`Up to date`. Đừng dùng `run-instance-commands` để nâng version, nó đẩy cursor qua và bỏ im lặng
mọi workspace command sắp trước đó.

## 2. Cài app

Trên máy có source:

```bash
cd packages/twenty-apps/internal/merchant-email-campaigns
yarn install

# đăng nhập bằng user (mở browser) — dùng cho cả dev:function:exec sau này
yarn twenty remote:add --as prod --url https://crm.example.com

# hoặc không tương tác, dùng cho CI:
yarn twenty remote:add --as prod --url https://crm.example.com --api-key "$TWENTY_API_KEY"

yarn twenty apply --remote prod     # lần đầu: apply, không phải plan (xem dưới)
```

`--remote` là option toàn cục của CLI, dùng được với mọi lệnh. `yarn twenty remote:use prod` đặt
remote mặc định nếu không muốn gõ lại.

### Hai cái bẫy của CLI

**Đừng đặt tên remote là `local`.** `getRemotes()` luôn nhét sẵn tên `local` vào danh sách kể cả
khi `~/.twenty/config.json` rỗng (`config-service.ts:216`). `remote:add --as local` vì thế luôn rơi
vào nhánh re-authenticate (`remote/index.ts:84`), nhánh này đọc URL đã lưu và **bỏ qua `--url` bạn
truyền vào**, rơi về mặc định `http://localhost:2020`. Triệu chứng: không có browser nào mở, chỉ
thấy `Could not reach the OAuth discovery endpoint at http://localhost:2020/...` rồi tụt xuống hỏi
API key. Dùng bất kỳ tên nào khác (`dev`, `prod`, `staging`) là hết.

**Lần cài đầu tiên phải dùng `apply`, `plan` sẽ fail.** App chưa có application registration trên
server, `plan` chạy dry-run sync và chết với `No registration found for "<uid>". Create one first
with createApplicationRegistration.` Chuỗi này không khớp danh sách lỗi "not installed" mà lệnh bỏ
qua (`dev-once.ts:84`), nên không có đường vòng. `apply` tự đăng ký rồi mới sync. Từ lần deploy thứ
hai trở đi `plan` chạy bình thường và nên chạy trước mỗi `apply`.

Trước khi `apply`, nên chạy:

```bash
yarn twenty dev:typecheck
yarn test
yarn lint
```

**Đổi dữ liệu kèm theo:** một số bản cần backfill dữ liệu đã có sau khi `apply`. Xem
`MIGRATION.md` trước khi deploy bản mới; hiện đang có phần "event cố định → event động".

**Lần deploy sau:** lặp lại `plan` rồi `apply`. `apply` mặc định **xoá** entity không còn trong
source. Nếu có ai đó tạo tay object/field trong namespace của app, thêm `--no-delete`. Lệnh sẽ hỏi
xác nhận trước khi xoá; `--force` bỏ qua hỏi — chỉ dùng trong CI khi đã đọc kỹ output của `plan`.

**Lệch version SDK:** `package.json` pin `twenty-sdk` 2.42.0 còn repo đã ở 2.44.0. CLI chỉ cảnh báo
khi lệch **major** (`check-sdk-version-compatibility.ts`), nên 2.42 với server 2.44 chạy bình
thường. Chỉ nâng khi `plan` báo lỗi schema/manifest.

## 3. Cấu hình biến

Settings → Apps → Merchant Email Campaigns → Variables. Tối thiểu để gửi được:

| Biến | Ghi chú |
| --- | --- |
| `EMAIL_PROVIDER` | `RESEND` (mặc định) hoặc `CUSTOM_HTTP` |
| `RESEND_API_KEY` | Key có quyền gửi |
| `DEFAULT_FROM_EMAIL` | Ví dụ `MIDA Team <hello@mida.so>`, domain phải verify ở Resend |
| `UNSUBSCRIBE_SECRET` | **Đặt trước lần gửi đầu tiên.** Đổi về sau làm hỏng mọi link đã gửi đi, không sửa lại được |
| `PUBLIC_SERVER_URL` | Set nếu server đứng sau proxy và `SERVER_URL` không phải URL người dùng thấy |
| `INBOUND_EVENTS_API_KEY` | Bắt buộc nếu app khác bắn event sang; chưa đặt thì mọi event bị từ chối |
| `CAMPAIGN_SENDERS` | Email member được phép launch, cách nhau dấu phẩy, hoặc `*` |

Trang settings của app có health check, báo luôn thiếu gì và key có bị Resend từ chối không.

## 4. Việc phải làm tay sau khi cài

1. **Khoá field `Status`.** Settings → Roles → role của team → Email campaign → tắt
   `canUpdateFieldValue` trên `Status`. Không làm thì một người sửa tay status thành ACTIVE là
   automation bắt đầu gửi thật, không qua route kiểm quyền `launch-campaign`.
2. **Bật automation `INSTALLED` sau khi job sync backfill xong.** Trong lúc sync tạo hàng loạt dòng
   merchant, mỗi dòng mới là một sự kiện install — bật trước là gửi nhầm cho toàn bộ merchant cũ.
3. **Job sync phải điền `merchant.email`** (field do app này tạo, kiểu EMAILS). Merchant không có
   email bị bỏ qua khi gửi.
4. **Verify domain gửi ở Resend.** Một lô mà tất cả đều FAILED (key sai, domain chưa verify) sẽ tự
   chuyển campaign sang PAUSED kèm `lastError`.

## 5. Kiểm tra sau deploy

```bash
yarn twenty dev:function:logs --remote prod          # log function
yarn twenty dev:function:exec -n integration-info --remote prod
```

`integration-info` trả về provider đang dùng, URL events, `isInboundKeySet` và `providerError` —
đủ để biết cấu hình đã đúng chưa mà không cần gửi email thật.

`dev:function:exec` cần remote đăng nhập bằng user; API key không đủ quyền. Gõ sai tên function thì
lệnh in ra danh sách tên hợp lệ. Tên function **không phải tên file**: `campaign-stats.ts` đăng ký
thành `campaign-send-stats`, `preview-audience.ts` thành `preview-campaign-audience`, và
`health-check.ts` dùng `defineHealthCheck` nên không phải logic function, không exec được.

Trên UI: sidebar **Email Marketing** → Email Studio → tab **Integrations** hiện provider đang dùng,
URL events API và 20 event gần nhất. Gửi thử bằng nút **Send test** trước khi Activate campaign đầu
tiên.

Endpoint nhận event từ app khác: `POST https://<server>/s/email-campaigns/events`, header `api-key`,
body đúng format Brevo `/v3/events`, trả 204 khi nhận.

## 6. Gỡ

```bash
yarn twenty app:uninstall --remote prod
```

Xoá luôn object và dữ liệu của app (template, campaign, send log, event log) cùng các field app
thêm vào `merchant`. Export trước nếu cần giữ lịch sử gửi.
