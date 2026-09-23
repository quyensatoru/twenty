# Deploy BD Prospects

Deploy thật sự chỉ một dòng:

```bash
yarn twenty apply -r prod
```

Phần còn lại của file này là: chuẩn bị gì trước dòng đó, làm gì sau nó, và vì sao nó hoạt động như vậy.

---

## 1. Deploy này là gì, và không phải là gì

Thư mục `bd-prospects/` **không chứa gì để chạy trên server**. Toàn bộ `src/` là bản mô tả: object
Prospect có field nào, view nào, role nào, function nào.

`apply` gọi API của server Twenty và nói "tạo giúp tôi những thứ này". Server nhận, tự tạo bảng và
metadata trong database của nó.

Nghĩa là:

| Không cần | Vì |
|-----------|-----|
| Pull code lên server | Không có code nào chạy trên server |
| Build trên server | Build xảy ra trên máy bạn, trong lệnh `apply` |
| Tạo migration | Server tự tạo bảng khi nhận metadata |
| Restart process | Metadata áp dụng nóng |
| Downtime | Không có |

Ngoại lệ duy nhất: 9 logic function. Code của chúng được `apply` upload lên cho server lưu và chạy,
nhưng vẫn trong cùng lệnh đó, không phải bước riêng.

Khác hẳn với `shopify-app-loyalty-api` / `shopify-app-loyalty-cms`, nơi deploy đúng nghĩa là build
code rồi đẩy lên server và restart.

## 2. Chạy ở đâu

**Trên máy dev.** Không SSH vào server, không đụng gì tới server.

Máy nào cũng chạy được, miễn có:

- Thư mục code này
- Node + yarn
- Mạng tới được URL server prod

Kiểm tra điều kiện thứ ba trước khi làm gì khác:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://crm.bloy.io/healthz
```

Ra `200` là chạy được từ máy bạn. Treo hoặc lỗi kết nối nghĩa là CRM không mở ra internet, lúc đó:

1. Bật VPN công ty rồi thử lại. Cách nên làm.
2. Hoặc SSH vào server, clone repo, cài node + yarn, rồi khai remote với `--url http://localhost:3000`
   (đứng trong server thì CRM chính là localhost). Làm được nhưng lỉnh kỉnh, chỉ dùng khi không có VPN.

## 3. Cái gì lên prod, cái gì không

`apply` chỉ đẩy **metadata** (định nghĩa), không đẩy **record** (dữ liệu).

**Lên prod:**

- 2 object `prospect`, `upsellDeal` kèm toàn bộ field
- 4 view, 2 page layout, 4 navigation menu item
- 3 role: `BD`, `BD Manager`, `BD Prospects runtime`
- 9 logic function
- Options của field select: đúng 2 giá trị `BLOY` và `MIDA`, vì chúng nằm trong
  `src/constants/registered-apps.ts`
- 2 field quan hệ mọc thêm trên object core: `merchant` được thêm `prospect`, `app` được thêm
  `upsellDeals`. Là cột mới và rỗng, không sửa dữ liệu merchant sẵn có. Sẽ thấy trong `plan`.

**Không lên prod:**

- Mọi app / shop / prospect / deal dùng để test bên dev
- Bất kỳ dòng dữ liệu nào khác

Cơ chế này không có khái niệm seed data. Sau khi apply, prod sẽ có menu BD Prospects với **bảng
rỗng**, đó là đúng. Dữ liệu chỉ xuất hiện sau bước 5 bên dưới, và nguồn là bảng merchant của chính
prod.

## 4. Chuẩn bị phía prod

Kiểm tra đủ 4 điều, thiếu thì app cài lên vẫn chạy nhưng không có dữ liệu:

- [ ] Object **Merchant** có field `shopifyPlan` và `name` chứa domain. Job sync đọc đúng hai tên
      này. Giá trị plan thì nhận cả hai từ vựng (`ADVANCED` của MIDA và `UNLIMITED` của BLOY, xem
      README mục "Mỗi app ghi plan một kiểu"); gặp giá trị lạ thì thêm vào `MERCHANT_PLAN_ALIASES`.
- [ ] Hai field tuỳ chọn trên Merchant, có thì tốt: `using` (boolean, cờ cài/gỡ) và `email`. Thiếu
      thì job tự dò và bỏ qua, nhưng `Our apps` sẽ không phản ánh việc gỡ app và cột Email để trống.
- [ ] Object **App** có đúng hai dòng tên `BLOY` và `MIDA`. Khớp theo tên. Viết khác đi (`Bloy`,
      `BLOY Loyalty`) thì app đó rơi xuống ô Other apps thay vì có cột stage riêng.
- [ ] `LOGIC_FUNCTION_TYPE` đã cấu hình trên server, nếu không thì cron và trigger nằm im.
- [ ] Có **API key role Admin**: Settings → APIs → Create API key. Key chỉ hiện một lần, copy ngay.

## 5. Các bước

### Bước 1 — Khai báo server prod (một lần duy nhất cho cả đời app)

`remote` là **tên bạn đặt cho một server Twenty**, lưu kèm URL và API key, để lần sau khỏi dán lại.
Ý tưởng giống `git remote`: khai địa chỉ một lần, sau đó push theo tên.

```bash
cd packages/twenty-apps/internal/bd-prospects
yarn install
yarn twenty remote:add --as prod --url https://crm.bloy.io --api-key <key_vừa_copy>
yarn twenty remote:list
```

`remote:list` phải hiện ra dòng `prod`. Dấu `*` là remote mặc định, cứ để nguyên ở `localhost`.

Vì sao bước này tồn tại, trong khi tạo object bằng UI hay sửa code core thì không cần: hai cách kia
đều có chỗ ngầm hiểu server nào (bạn đang login trong server đó / bạn đã đẩy code lên server đó).
Cách này code nằm nguyên trên máy bạn, nên buộc phải nói rõ đích.

`remote:add` có gọi sang prod để kiểm tra API key. Key sai hoặc server không tới được thì nó báo
`Authentication failed` và **không lưu gì cả**, chạy lại được ngay. Bước này chưa tạo gì trên prod.

Đổi tên remote, xoá rồi thêm lại đều an toàn. Server nhận ra app qua
`APPLICATION_UNIVERSAL_IDENTIFIER` trong `src/application.config.ts`, không qua config máy bạn:
apply lần sau, CLI tìm lại đúng bản đã cài theo id đó rồi cập nhật. `~/.twenty/config.json` chỉ là
chỗ cache token.

Thứ **không được đổi** là chính `APPLICATION_UNIVERSAL_IDENTIFIER` đó. Đổi nó thì server coi là một
app khác và tạo ra BD Prospects thứ hai nằm song song.

API key nằm dạng chữ thường trong `~/.twenty/config.json`. File ở thư mục home nên không sợ commit
nhầm, nhưng đừng share.

### Bước 2 — Xem trước, chưa ghi gì

```bash
yarn twenty plan -r prod
```

Lệnh chỉ đọc. Nó chạy lần lượt: kiểm tra server → dựng manifest → build → typecheck → tính plan, rồi
in ra sẽ tạo / sửa / xoá những gì.

Đọc kỹ. Workspace prod lần đầu thì phải là **toàn bộ "to add", không có dòng nào "destroy"**. Thấy
destroy mà không hiểu thì dừng lại, đừng apply.

Server không tới được thì `plan` báo `Cannot reach Twenty server` và dừng, chưa ghi gì cả.

### Bước 3 — Apply

```bash
yarn twenty dev:generate-client -r prod
yarn twenty apply -r prod
```

**Lệnh đầu không được bỏ qua khi vừa apply lên dev trước đó.** Bundle của logic function
mang theo client SDK sinh từ schema của remote apply gần nhất, và client này **tự validate selection
ngay tại chỗ** trước khi gửi request. Dev và prod lệch nhau (merchant dev không có `email` và
`using`), nên bundle mang schema dev sẽ từ chối đọc `merchant.email` trên prod với lỗi
``type `Merchant` does not have a field `email` `` — job chạy xong bình thường, chỉ là cột Email
trắng trơn. `apply` có sinh lại client nhưng **sau khi đã upload**, nên không cứu được lần đó.

Dấu hiệu nhận ra: kết quả job có `readsEmail: false` kèm `selectionRejection` là một lỗi schema.

In plan ra lần nữa rồi ghi. Lần đầu không cần `--force` vì không có gì bị xoá. Chỉ dùng `--force`
khi plan có destroy và bạn đã đọc kỹ danh sách đó.

Dùng `-r prod` thay vì `remote:use prod` là có lý do: dấu `*` vẫn nằm ở `localhost`, nên không có
chuyện gõ nhầm một lệnh rồi nó ghi thẳng vào prod.

### Bước 4 — Nạp dữ liệu lần đầu

```bash
yarn twenty dev:function:exec -n sync-prospects-from-merchants -r prod
```

Đọc bảng merchant của prod, gom theo domain thành một prospect cho mỗi shop, dựng lại plan và hai ô
app. Chạy xong nó in ra số đếm, quan tâm 3 dòng cuối:

```json
{ "merchantsScanned": 37699, "shopsHighValue": 1804,
  "createsRemaining": 0, "refreshesRemaining": 0, "completed": true }
```

`readsEmail` và `readsInstallFlag` phải là `true` trên prod. Thấy `false` nghĩa là bước dò field bị
lỗi (thường do rate limit), chạy lại sau một phút — không phải merchant thiếu field.

`merchantsScanned` phải bằng tổng số row của bảng Merchant. Nhỏ hơn nghĩa là vòng quét bị cắt và khi
đó hàm **không ghi gì cả** (ghi từ bảng đọc thiếu sẽ xoá sạch cột app của những shop chưa tới).

`completed: true` là xong. Còn số dư thì **chạy lại đúng lệnh đó**, hàm idempotent nên lần sau làm
tiếp phần còn thiếu. Lặp tới khi `completed: true`.

Vì sao có thể còn dư: server giới hạn **500 request mỗi phút cho cả app**, tính chung cả 9 function
(`APPLICATION_API_RATE_LIMITING_LIMIT`, key theo `universalIdentifier` của app). Hàm sync tự giữ
nhịp dưới mức đó và tự dừng ở giây thứ 480 để báo cáo phần còn lại, thay vì bị timeout ở giây 600 mà
không báo gì.

Prod rất nhiều merchant, muốn chạy từng mẻ nhỏ cho chắc:

```bash
yarn twenty dev:function:exec -n sync-prospects-from-merchants -r prod -p '{"limit":500}'
```

`limit` là số khách được ghi trong một lần chạy. Không truyền thì không giới hạn.

Từ hôm sau cron tự lo, không phải chạy tay nữa. Các lần sau rất nhẹ vì hàm chỉ ghi những khách thật
sự có thay đổi.

### Bước 5 — Bốn việc phải làm tay trong Settings

Manifest không làm thay được bốn việc này. Bỏ bước 1 thì coi như không có phân quyền.

1. **Chặn role Member.** Settings → Roles → Member → Objects, tắt quyền đọc `Prospect` và
   `Upsell deal`. Role Member mặc định `canReadAllObjectRecords: true`, nghĩa là cả công ty đọc được
   khu BD.
2. **Gán người vào role** `BD` hoặc `BD Manager`.
3. **Cấp `appAccess` cho từng BD trên `BLOY` và `MIDA`**: READ để xem, WRITE để tạo deal. Vì
   `upsellDeal.targetApp` trỏ tới object App nên deal nằm trong vùng app-scope. Thiếu grant thì deal
   không hiện và tạo deal bị từ chối. Cột Merchants trên trang prospect cũng theo grant này, không
   có grant thì cột trống, không phải lỗi.
4. **Tuỳ chọn**: Settings → Roles → BD → `Upsell deal` → Record Visibility Policy, đặt
   `owner = current member` nếu muốn mỗi BD chỉ thấy deal của mình.

### Bước 6 — Kiểm tra

- Menu **BD Prospects** hiện 3 mục.
- Mở **High-Value Prospects**, có khách, cột Shopify plan chỉ toàn `ADVANCED` / `PLUS`.
- Tạo thử một deal, chọn app đích trong picker, quay lại danh sách xem cột `BLOY stage` có lên không.
  Lên được nghĩa là trigger đang chạy.
- Muốn chắc phần realtime: gỡ một app trên shop test, đợi vài giây, ô Our apps phải bớt app đó.

Xem log function khi có gì không chạy:

```bash
yarn twenty dev:function:logs -n sync-prospects-from-merchants -r prod
```

## 6. Những gì sẽ tự chạy trên prod sau khi deploy

| Function | Kích hoạt bởi |
|----------|---------------|
| `sync-prospects-from-merchants` | Cron `0 3 * * *` |
| `refresh-prospect-on-merchant-created` | `merchant.created` |
| `refresh-prospect-on-merchant-updated` | `merchant.updated` |
| `refresh-prospect-on-merchant-deleted` | `merchant.deleted` |
| `refresh-prospect-on-merchant-destroyed` | `merchant.destroyed` |
| `refresh-prospect-deal-stages-on-create` | `upsellDeal.created` |
| `refresh-prospect-deal-stages` | `upsellDeal.updated` |
| `refresh-prospect-deal-stages-on-delete` | `upsellDeal.deleted` |
| `suggest-close-deals` | `prospect.updated` |

Lưu ý `merchant.updated`: nếu endpoint sync của BLOY/MIDA ghi merchant theo lô lớn, trigger này chạy
một lần cho mỗi dòng. Thấy nặng thì bỏ file
`src/logic-functions/refresh-prospect-on-merchant-updated.ts` rồi apply lại, cron hàng ngày vẫn bắt
được thay đổi, chỉ chậm hơn.

## 7. Deploy lần sau

```bash
git pull
cd packages/twenty-apps/internal/bd-prospects
yarn twenty plan  -r prod     # luôn đọc trước
yarn twenty apply -r prod
```

Không cần `remote:add` lại. Sửa field, thêm view, đổi stage, tất cả chỉ hai lệnh này.

## 8. Đừng làm

- **Đừng dùng `app:uninstall` để rollback.** Nó gỡ object kèm toàn bộ khách và deal đã nhập.
  Muốn lùi lại thì checkout commit cũ rồi `apply` lại.
- **Đừng bấm "Update view" trên view do app tạo** (High-Value Prospects, No deal yet). Lần apply sau
  sẽ ghi đè về định nghĩa trong code. Muốn giữ filter riêng thì "Save as new view".
- **Đừng đổi tên dòng `BLOY` / `MIDA`** trong object App. Khớp theo tên, đổi là shop rơi sang ô
  Other apps.
- **Đừng sửa field của app bằng UI Settings.** Manifest là nguồn duy nhất, apply sau sẽ kéo về.
- **Đừng đổi `APPLICATION_UNIVERSAL_IDENTIFIER`** trong `src/application.config.ts`. Đó là danh tính
  của app trên mọi server.

## 9. Sự cố thường gặp

| Hiện tượng | Nguyên nhân |
|-----------|-------------|
| `Cannot reach Twenty server` | Sai URL, hoặc prod không mở ra internet. Xem mục 2. |
| Bảng rỗng sau khi apply | Bình thường. Chưa chạy bước 4. |
| Chạy bước 4 xong vẫn rỗng | Merchant thiếu field `shopifyPlan`, hoặc không shop nào là Advanced/Plus. |
| `completed: false`, còn số dư | Bình thường với dữ liệu lớn. Chạy lại tới khi `true`. |
| `Limit reached (500 tokens per 60000 ms)` | Đã hết budget 500 request/phút của app. Đợi một phút rồi chạy lại với `-p '{"limit":300}'`. |
| Cột `BLOY stage` không lên khi tạo deal | `LOGIC_FUNCTION_TYPE` chưa cấu hình, trigger không chạy. |
| BD không thấy deal nào | Thiếu `appAccess` trên BLOY/MIDA. Bước 5 mục 3. |
| Tạo deal bị từ chối | Chưa chọn app đích, hoặc thiếu grant WRITE. |
| Shop dùng BLOY nhưng nằm ở Other apps | Tên dòng trong object App không khớp `BLOY`. |
| Apply xong thấy 2 app BD Prospects | `APPLICATION_UNIVERSAL_IDENTIFIER` đã bị đổi. |
