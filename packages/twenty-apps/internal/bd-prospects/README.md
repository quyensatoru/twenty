# BD Prospects

Khu vực **High-Value Prospects** cho team BD, đóng gói dưới dạng Twenty Application.
Không sửa một dòng nào trong `twenty-front` / `twenty-server` / `twenty-shared`.

## Nó làm gì

| Yêu cầu                                                      | Cách đáp ứng                                                                                             |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Danh sách khách Advanced/Plus, lọc, sắp xếp, tìm kiếm        | View `High-Value Prospects` (filter plan sẵn)                                                            |
| Lọc "đang dùng app X, chưa dùng app Y"                       | View `Upsell candidates to BLOY`                                                                         |
| Trang chi tiết khách, ghi chú không ghi đè, lịch sử thay đổi | Record page riêng: ghi chú nằm ngay cạnh Fields (widget `BD notes`), thêm tab Notes/Tasks/Timeline/Files |
| Pipeline deal                                                | View Kanban `Upsell pipeline`, kéo thả đổi giai đoạn                                                     |
| Giai đoạn cấu hình được                                      | `stage` là SELECT, sửa option trong Settings, không cần deploy                                           |
| Owner + audit đổi giai đoạn                                  | Field `owner` + timeline activity có sẵn                                                                 |
| Đồng bộ plan hằng ngày                                       | Job `sync-prospects-from-merchants` (cron 03:00)                                                         |
| Gợi ý đóng deal khi khách đã cài app đích                    | Job `suggest-close-deals` (trigger khi `appsUsed` đổi)                                                   |
| Import CSV có preview và gộp theo domain                     | Trang `Import prospects` (front component)                                                               |

## Cột stage: một cột cho mỗi app

Bảng danh sách phải hiện giai đoạn pipeline (mục 5.1 của spec), nhưng cột quan hệ to-many chỉ hiện
chip tên bản ghi, và bộ lọc view cũng không với được sang field của bản ghi liên quan. Nên prospect
mang thêm **một cột SELECT cho mỗi app đã khai báo** (`bloyStage`, `midaStage`, `shoplineStage`),
dùng đúng bộ giai đoạn của pipeline nên đọc giống hệt bảng Kanban. Một khách chạy nhiều deal song
song thì mỗi app có cột riêng, không dồn vào một ô.

Cột do máy ghi, không sửa tay: ba logic function `refresh-prospect-deal-stages-on-create`,
`refresh-prospect-deal-stages` (updated) và `refresh-prospect-deal-stages-on-delete` đọc lại toàn bộ
deal của prospect rồi ghi đè, nên một sự kiện lỡ mất cũng tự lành ở lần sau. Khi một app có nhiều
deal, cột lấy giai đoạn xa nhất.

Thêm app mới trong `registered-apps.ts` là tự có thêm cột stage của app đó, thêm cột vào hai view và
thêm một điều kiện vào filter của view `No deal yet`.

## Mô hình dữ liệu

```
merchant (đã có, 1 dòng = 1 cặp shop+app)   prospect (mới, 1 dòng = 1 shop theo domain)
   name = domain                                domain, shopName, shopifyPlan
   appId ──> app                                appsUsed: string[]   <-- cột lọc
   prospectId ───────────────────────────────>  owner ──> workspaceMember
                                                upsellDeals ──> upsellDeal
                                                                   targetApp: string
                                                                   stage, nextFollowUpAt
                                                                   suggestedClose
```

Ba quyết định cần nhớ trước khi sửa:

1. **`prospect` không có quan hệ MANY_TO_ONE tới `app` hay `merchant`.** Cơ chế app-scope của fork
   (`build-app-scope-path-by-object-id.util.ts`) tự động coi mọi object có đường MANY_TO_ONE tới
   object tên `app` trong 4 hop là app-scoped, và **ẩn hoàn toàn** record có FK app rỗng khỏi mọi
   role hẹp. Khách import từ app lạ chính là trường hợp đó. Nên khoá ngoại nằm ở phía `merchant`
   (`merchant.prospect`), và app được ghi dưới dạng chữ trong `appsUsed`.
2. **`appsUsed` là MULTI_SELECT chứ không phải quan hệ.** Bộ lọc view chỉ xử lý được quan hệ
   MANY_TO_ONE (`graphql-query-filter-field.parser.ts`), nên "chưa dùng app X" không biểu diễn được
   bằng bảng nối. MULTI_SELECT hỗ trợ `CONTAINS` / `DOES_NOT_CONTAIN`, và cho chọn bằng danh sách
   tick thay vì gõ chữ. Danh sách app nằm ở
   [`src/constants/registered-apps.ts`](src/constants/registered-apps.ts) — **đó là chỗ duy nhất
   thêm app mới**, thêm một entry rồi deploy. Lưu ý: so khớp là `%X%` không phân biệt hoa thường,
   nên **app key không được là tiền tố của nhau** (`BLOY` và `BLOYPRO` sẽ đụng nhau).
3. **`upsellDeal.targetApp` là quan hệ tới object `app`**, không phải chữ tự điền, nên app đích luôn
   chọn từ registry. Cái giá: một cạnh MANY_TO_ONE tới `app` kéo `upsellDeal` vào vùng app-scope.
   Với role không có cờ `canReadAllObjectRecords`:
   - chỉ thấy deal của những app mà member có grant trong `appAccess`;
   - **tạo deal mà chưa gán app đích bị từ chối thẳng** (`validate-app-scope-for-records.util.ts`
     fail-closed khi FK app rỗng), nên nút New trên Kanban sẽ lỗi với role hẹp — deal phải được tạo
     kèm app đích trong cùng một lệnh ghi, hoặc do người có cờ all-records tạo;
   - đổi giai đoạn không bị ảnh hưởng: update không đụng cột app thì bỏ qua kiểm tra.
     Nếu sau này thấy bất tiện, đường lui là đổi `targetApp` thành SELECT có option sinh từ App
     registry: mất picker quan hệ nhưng ra khỏi vùng app-scope.
4. **Không khai báo được view "pipeline theo từng app" trong manifest.** Filter trên quan hệ cần id
   của bản ghi `app`, mà id đó là dữ liệu của từng workspace, manifest không biết trước. Nên các
   board theo app được tạo ngay trong giao diện: mở `Upsell deals` → Filter → Target app → lưu view.
5. **Id của prospect = UUID v5 của domain đã chuẩn hoá** (`src/utils/prospect-id.ts`). Nhờ vậy job
   sync và màn import tính ra cùng một id mà không cần tra cứu, chạy lại bao nhiêu lần cũng không
   sinh bản ghi trùng, và file import trước khi merchant được sync về vẫn rơi đúng vào một dòng.
   **Đổi `PROSPECT_ID_NAMESPACE` là mất liên kết toàn bộ dữ liệu cũ.**

## Điều kiện tiên quyết

- Object `merchant` phải có field **`shopifyPlan`** (giá trị `PLUS` / `ADVANCED` / ...) và `name`
  chứa domain. Job sync đọc đúng hai field này. Nếu tên field khác, sửa trong
  `src/logic-functions/sync-prospects-from-merchants.ts`. Workspace dev không có sẵn field này,
  phải tạo tay trong Settings → Data model → Merchant.
- `LOGIC_FUNCTION_TYPE=LOCAL` (hoặc driver tương đương) để cron và trigger chạy được.

## Cài đặt

Phần dưới là cài lên workspace dev. Deploy lên prod xem [DEPLOY.md](DEPLOY.md), có đủ
chuẩn bị, từng bước, kiểm tra và sự cố thường gặp.

```bash
cd packages/twenty-apps/internal/bd-prospects
yarn install
yarn twenty remote:add --url http://localhost:3000 --api-key <API_KEY>
yarn twenty plan     # xem trước thay đổi metadata, không ghi gì
yarn twenty apply    # build, upload, sync manifest, sinh lại API client
```

API key lấy ở Settings → APIs, hoặc tạo bằng mutation `createApiKey` + `generateApiKeyToken` trên
endpoint `/metadata`. `apply` đã bao gồm bước generate client nên không cần chạy riêng.

Chạy thử một job mà không đợi cron:

```bash
yarn twenty dev:function:exec -n sync-prospects-from-merchants
```

## Việc phải làm sau khi install (manifest không làm thay được)

1. **Chặn role Member.** Role `Member` mặc định có `canReadAllObjectRecords: true`
   (`role.service.ts:436`), nghĩa là ai cũng đọc được `prospect` và `upsellDeal`. Vào
   Settings → Roles → Member → Objects, tắt quyền trên hai object này. Bỏ qua bước này thì phân
   quyền trong app coi như không có tác dụng.
2. **Gán người vào role** `BD` hoặc `BD Manager`.
3. **Tuỳ chọn**: Settings → Roles → BD → chọn `Upsell deal` → Record Visibility Policy, đặt
   `owner = current member` nếu muốn mỗi BD chỉ thấy deal của mình. Đây là cấu hình runtime, không
   nằm trong manifest, nên phải làm lại nếu cài sang workspace khác.
4. **Cấp `appAccess` cho từng BD trên từng app** (READ để xem, WRITE để tạo deal). Thiếu grant thì
   deal của app đó không hiện và tạo deal bị từ chối — xem quyết định 3 ở trên. Cột Merchants trên
   trang prospect cũng theo grant này: không có grant thì cột trống, không phải lỗi.

## Owner: một ô, ở cấp khách hàng

Spec nhắc owner ở hai cấp: khách hàng (mục 5.1 cần owner làm cột và filter, user story "tránh 2
người cùng tiếp cận 1 khách") và deal (mục 5.3 "mỗi deal lưu owner", wireframe 5.2 vẽ owner trong
khung deal). Với một BD, hai ô luôn trùng nhau và chỉ tạo cơ hội lệch dữ liệu, nên:

- `prospect.owner` là ô duy nhất được dùng và hiển thị.
- `upsellDeal.owner` vẫn còn trong mô hình nhưng **ẩn khỏi cả hai view deal**, cho trường hợp nhiều
  BD mà spec dự tính ("xem tổng quan pipeline theo owner ... khi có nhiều BD"). Bật lại: Options
  trong view, hoặc `isVisible: true` trong file view.
- Khi có BD thứ hai: bật cột owner của deal, và thêm một job điền sẵn owner deal từ owner khách lúc
  tạo (khoảng nửa ngày) để hai ô không lệch.

Chiều ngược lại không làm được: nếu owner chỉ nằm ở deal thì danh sách khách không hiện và không lọc
được theo owner, đúng giới hạn đã gặp với cột Stage.

## Phân quyền thực tế

- `BD`: đọc/ghi `prospect` + `upsellDeal`, đọc `app` (cho picker app đích), **không** sửa được field
  `owner` (field permission), không xoá.
- `BD Manager`: như trên, thêm quyền sửa `owner` và soft delete.
- Twenty không tách quyền "tạo" khỏi quyền "sửa", nên **bất kỳ role nào ghi được `prospect` đều
  import được**. Trang Import chỉ là UI, nó ghi bằng chính phiên đăng nhập của người dùng nên mọi
  giới hạn quyền vẫn được server áp dụng. Muốn chặn cứng BD import thì phải bỏ quyền ghi
  `prospect` của họ, mà như vậy họ cũng không cập nhật được khách.

## Ba điều đã vấp phải khi deploy (đừng lặp lại)

1. **SDK trên npm không biết object riêng của fork.** `STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS` của
   twenty-sdk chỉ có 28 object upstream, không có `merchant` và `app`, nên tham chiếu qua nó làm
   build manifest chết với "Cannot read properties of undefined". Hai id đó khai báo thẳng trong
   `src/constants/universal-identifiers.ts`, lấy từ `core.objectMetadata`.
2. **App phải có default role.** Thiếu là build từ chối. Role đó (`app-runtime.role.ts`) cũng chính
   là danh tính mà logic function chạy dưới, nên thiếu quyền đọc `app` là job chết với "Entity
   performing the request does not have permission".
3. **Sự kiện `upserted` không tới được logic function.** Server có phát
   `DatabaseEventAction.UPSERTED`, nhưng listener chuyển sự kiện sang logic function
   (`entity-events-to-db.listener.ts`) chỉ nghe created/updated/deleted/restored/destroyed. Một
   trigger `xxx.upserted` vì thế im lặng không chạy, không báo lỗi. Muốn bắt cả tạo lẫn sửa thì phải
   khai báo hai function. Ngoài ra `updateX` với đúng giá trị cũ không phát sự kiện nào cả, nên đừng
   dùng cách đó để backfill.
4. **Đổi kiểu một field phải cấp universalIdentifier mới.** `type` **không** nằm trong các property
   mà sync so sánh, nên sửa `type` trong manifest bị bỏ qua âm thầm: lần đầu đổi `appsUsed` sang
   MULTI_SELECT chỉ có `options` được ghi, field vẫn là ARRAY và giao diện vẫn là editor cũ. Muốn đổi
   thật thì phải đổi universalIdentifier để field bị xoá và tạo lại, tức là mất dữ liệu cột đó và
   cần `apply --force`. Chuyển `targetApp` từ TEXT sang RELATION cũng vậy. Thêm nữa, viewField trỏ vào field bị xoá mà giữ nguyên
   universalIdentifier thì không được tạo lại trong cùng lần apply — cột biến mất khỏi view mà không
   báo lỗi. Phải cấp universalIdentifier mới cho viewField đó.
5. **Front component chạy trong web worker với DOM từ xa.** File input chỉ chuyển được metadata
   (`serializeFileList` trong twenty-front-component-renderer bỏ nội dung), `file.text()` không tồn
   tại, và không tạo được thẻ `<a>` để tải template. Vì vậy màn import nhận CSV bằng cách dán text,
   và template thì copy vào clipboard qua `copyToClipboard` của SDK.

## Vì sao client trong logic function để lỏng kiểu

`CoreApiClient` chỉ biết schema sau khi chạy `generate-client` trên workspace đã cài app, nên trước
bước đó `client.query({ prospects: ... })` không typecheck được. Các file gọi API vì vậy khai báo
`type ApiClient = any` và giữ kiểu riêng cho từng hàng dữ liệu (`MerchantRow`, `ProspectRow`), thay
vì phụ thuộc type sinh ra. Sau khi `generate-client` chạy, có thể bỏ alias đó nếu muốn type chặt.

## Mỗi app ghi plan một kiểu (đọc trước khi sửa filter)

Cột `shopifyPlan` trên merchant **không cùng từ vựng giữa các app**. Đếm trên prod:

| app | ADVANCED | UNLIMITED | PLUS | SHOPIFY_PLUS |
|-----|---------:|----------:|-----:|-------------:|
| MIDA | 423 | 0 | 438 | 0 |
| BLOY | 0 | **150** | 0 | **144** |
| FRAUD | 408 | 0 | 0 | **350** |
| EU | 1 | 2 | 0 | 2 |

MIDA ghi tên đã chuẩn hoá, BLOY ghi đúng handle gốc của Shopify: `UNLIMITED` là Advanced,
`SHOPIFY_PLUS` là Plus, `PROFESSIONAL` và `GROW` là tầng giữa. Filter `shopifyPlan in (ADVANCED,
PLUS)` vì vậy bỏ sót toàn bộ 294 shop cao cấp của BLOY và 350 shop Plus của FRAUD — triệu chứng là
cột `Our apps` không bao giờ có BLOY.

BLOY còn ghi **trạng thái** vào cột plan: `BLOY_UNINSTALLED` khi shop gỡ app, cạnh `PARTNER_TEST`,
`FROZEN`, `CANCELLED`, `DORMANT`, `AFFILIATE`, `TRIAL`. Đọc chúng như plan sẽ ghi đè mất plan thật,
nên `normalizeMerchantPlan` trả `null` cho nhóm này và prospect giữ nguyên plan đang có.

Toàn bộ nằm ở `MERCHANT_PLAN_ALIASES` và `MERCHANT_NON_PLAN_VALUES` trong
`src/constants/shopify-plans.ts`. Thấy giá trị lạ trên merchant thì thêm vào đó, không sửa filter.
Trang Import cũng nhận cả hai từ vựng, PO export từ app nào cũng dán được.

## `using` mới là cờ cài/gỡ, không phải plan

Merchant có field `using` (boolean). Shop gỡ app thì app **giữ lại row** và set `using = false`, nên
đó là nguồn duy nhất đáng tin về trạng thái cài.

- `ourApps` chỉ tính row có `using !== false`. Gỡ BLOY là shop rơi lại vào danh sách candidate.
- `shopifyPlan` đọc từ **mọi** row kể cả row đã gỡ, vì row đó vẫn báo plan cuối cùng nó thấy. Bỏ
  chúng đi thì cột plan trắng ngay khi shop gỡ app.
- `null` (workspace chưa từng ghi cờ này) tính là **đang cài**, để workspace dev không bị đổi hành vi.

## Merchant không giống nhau giữa các workspace

`using` và `email` có trên workspace mà BLOY/MIDA sync vào, **không có** trên workspace dev trắng.
Client SDK validate selection ngay tại client nên hỏi field không tồn tại là throw, không phải trả
null — một selection không dùng được cho cả hai. `resolveMerchantSelection` dò từ rộng tới hẹp một
lần mỗi tiến trình và cache lại. Lỗi schema được `executeWithRetry` nhận ra là lỗi vĩnh viễn nên
không retry.

`prospect.email` được điền từ email của merchant, **chỉ khi ô đang trống**: BD có thể đã sửa tay và
merchant không có quyền ghi đè việc đó. Ưu tiên email trên row còn cài app.

Cái bẫy của kiểu dò field này, đã vấp một lần: fall back phải **chỉ** xảy ra với lỗi schema. Bản đầu
tôi viết catch mọi lỗi, nên một lần probe trúng rate limit là nó im lặng bỏ `email` cho cả vòng chạy,
và job trông như không hề đọc email. Kết quả trả về của job có `readsInstallFlag` và `readsEmail`
đúng để soi chuyện này: chạy trên prod mà thấy `readsEmail: false` là probe đã bị degrade, không phải
merchant thiếu field.

## Vì sao job sync quét toàn bộ bảng merchant

Không lọc theo plan nữa. Một shop đủ điều kiện nhờ row của MIDA (Advanced), nhưng row chứng minh nó
cũng dùng BLOY lại mang plan `BLOY_UNINSTALLED`. Query có filter không bao giờ trả về row thứ hai,
nên BLOY không thể xuất hiện. Quét cả bảng (37k row, khoảng 190 request, hơn 30 giây) là cách duy
nhất thấy đủ. Đổi lại phải chấp nhận một quy tắc: **quét dở thì không ghi gì cả**, vì ghi từ bảng đọc
thiếu sẽ xoá sạch cột app của mọi shop mà vòng quét chưa tới.

## Rate limit dùng chung của app

Server tính quota theo **application**, không theo function: `APPLICATION_API_RATE_LIMITING_LIMIT`
(mặc định 500) request mỗi `APPLICATION_API_RATE_LIMITING_TTL_IN_MS` (60s), key là
`api:throttler:application:<universalIdentifier>`
(`common-base-query-runner.service.ts`). Cron và cả 7 trigger chia nhau một budget, nên một vòng lặp
ghi từng record sẽ vét sạch token và làm chết luôn các function khác.

Ba điều rút ra, đã áp vào code:

1. **Ghi theo lô, không ghi từng record.** `createProspects(data: [...200], upsert: true)` khớp theo
   `id` hoặc unique index và chỉ update đúng field được truyền, nên dùng được cho cả create lẫn
   update. Không gộp được bằng alias trong một document GraphQL: server từ chối với
   `Duplicate root resolver`.
2. **`executeWithRetry` phải phân biệt lỗi throttle với lỗi tạm thời.** Bucket mất tới một phút mới
   hồi, retry 300ms là vô nghĩa. Lỗi throttle được chờ theo thang 2/5/10/15 giây, tổng 32 giây, vừa
   trong `timeoutSeconds: 60` của các trigger.
3. **Giữ nhịp chủ động** (`rate-limiter.ts`, 360 request/phút) để cron còn chỗ cho trigger chạy.

Còn một cái bẫy gián tiếp: ghi `ourApps`/`otherApps` sẽ bắn `prospect.updated`, kéo theo
`suggest-close-deals` chạy một lần cho mỗi khách, tốn thêm request từ cùng budget. Nên lúc tạo
prospect mới, hàm sync ghi luôn plan và hai ô app vào chính lệnh create thay vì update sau — khách
mới chỉ sinh event `created`, không ai nghe, nên không có cascade.

## Giới hạn đã biết

- **Ngày cài app** của từng app chưa lưu (spec 5.2). Cột `installedAt` trong file CSV bị bỏ qua và
  được liệt kê ở phần "Ignored columns" của preview. Muốn có, thêm object nối
  `prospectAppInstall` (không được để nó trỏ MANY_TO_ONE tới `app`, xem quyết định 1).
- **MRR** nằm ngoài phạm vi theo yêu cầu hiện tại; thêm sau là một field NUMBER trên `prospect`.
- Bốn trigger realtime chạy mỗi lần một dòng merchant thay đổi. Nếu endpoint sync của app ghi hàng
  loạt (ví dụ đẩy lại toàn bộ merchant mỗi đêm), số lần chạy sẽ lớn; lúc đó tắt bớt trigger
  `merchant.updated` và dựa vào cron là đủ.
- Job sync quét merchant theo filter gói Advanced/Plus để **tìm** khách, nhưng dựng lại cột app từ
  **toàn bộ** merchant của khách đó, nên một dòng merchant thiếu gói không làm mất app.
- **Email** là field EMAILS (`primaryEmail` + danh sách phụ), điền tay hoặc qua cột `email` của file
  CSV import. Job sync không đụng tới nó vì merchant không mang email.
- Job sync quét `merchant` theo filter plan; nếu bảng merchant rất lớn, cân nhắc hạ
  `timeoutSeconds` hoặc tách theo app.
- `suggest-close-deals` chỉ chạy khi `appsUsed` của prospect thay đổi, tức là sau job sync hằng
  ngày, không realtime.

## Cái gì lấy từ object `App`, cái gì không

| Chỗ                                        | Nguồn                                | Vì sao                                   |
| ------------------------------------------ | ------------------------------------ | ---------------------------------------- |
| `upsellDeal.targetApp` (app đích của deal) | **Object `App`**, chọn bằng picker   | Đây là dữ liệu, quan hệ bình thường      |
| `prospect.appsUsed` (app shop đang dùng)   | Danh sách trong `registered-apps.ts` | Là option của MULTI_SELECT, tức metadata |
| Cột stage theo app                         | Cũng từ `registered-apps.ts`         | Là field, cũng metadata                  |

Nên khi BD mở một deal và chọn app đích, danh sách hiện ra chính là các dòng trong object `App`, không phải danh sách trong code. Chỉ hai thứ metadata ở dưới mới phải khai báo.

## Dữ liệu `Our apps` đến từ đâu

Không nhập tay. Job sync suy ra từ dữ liệu có sẵn:

```
object App (id, name) ──► key chuẩn hoá (BLOY, MIDA, EU, ...)
object Merchant: name = domain, appId → app, shopifyPlan
        │
        └─► gom merchant theo domain → tập app key của shop
                    │
        ┌───────────┴───────────┐
   key mình bán              key còn lại
        ▼                         ▼
    Our apps                  Other apps
```

Một shop được coi là **đang dùng BLOY khi và chỉ khi** tồn tại dòng merchant của shop đó với app
BLOY. Không có nguồn nào khác.

**Cập nhật tức thì, không chờ tới 3h sáng.** Bốn trigger trên object `merchant`
(`created`, `updated`, `deleted`, `destroyed`) dựng lại đúng shop vừa thay đổi trong vài giây, nên
shop cài hay gỡ app là bên BD thấy ngay. Job cron 3h sáng vẫn giữ, làm lưới an toàn cho sự kiện lỡ
mất và cho thay đổi gói.

**`Our apps` lấy merchant làm chuẩn, ghi đè chứ không cộng dồn.** BLOY và MIDA đẩy cả cài lẫn gỡ vào
CRM qua endpoint sync hai chiều, nên dòng merchant phản ánh đúng thực tế: shop gỡ app thì dòng
merchant biến mất, job xoá app đó khỏi `Our apps`, và shop quay lại danh sách ứng viên ngay hôm sau.
Cùng lúc đó `suggest-close-deals` gỡ cờ "suggested close" của deal tương ứng, để BD không bị bảo
đóng một deal vừa sống lại.

`Other apps` thì ngược lại, vẫn cộng dồn: app bên thứ ba có thể chỉ đến từ file CSV, không có dòng
merchant nào xác nhận, xoá đi là mất hẳn thông tin.

Hai chi tiết vận hành:

- **Khớp theo tên app, không theo id.** Đổi tên dòng App từ `BLOY` thành `Bloy Loyalty` sẽ làm key
  thành `BLOY_LOYALTY`, không khớp nữa, và app đó rơi xuống `Other apps` ở lần sync sau.
- Khách chỉ đến từ import CSV (chưa bao giờ có merchant) không bị job đụng tới, nên dữ liệu import
  không bị xoá oan.

## Hai ô app trên khách hàng

| Ô            | Kiểu                      | Chứa gì                                                       | Thêm app mới                                 |
| ------------ | ------------------------- | ------------------------------------------------------------- | -------------------------------------------- |
| `Our apps`   | MULTI_SELECT (BLOY, MIDA) | App của mình shop đang chạy, quyết định ứng viên upsell       | Thêm entry vào `registered-apps.ts` + deploy |
| `Other apps` | ARRAY text                | Mọi app còn lại, đúng tên: EU, FRAUD, hay app lạ chưa ai biết | Không cần làm gì                             |

Job sync đọc tên app từ object `App` rồi tự chia về đúng ô. Import CSV cũng vậy: dòng có app lạ
không còn bị từ chối, app đó vào `Other apps` với nguyên tên trong file. Không có đường nào làm mất
tên app nữa.

Khi bắt đầu bán một app đang nằm ở `Other apps`, thêm entry vào `registered-apps.ts` rồi deploy:
lần sync sau tự chuyển shop đang chạy app đó sang `Our apps` và cột stage mới xuất hiện.

## Vì sao danh sách app của mình nằm trong code, không lấy động từ object App

`appsUsed` là MULTI_SELECT nên danh sách app là **option của field**, tức là metadata. Hai rào chắn
khiến không thể sinh option lúc chạy:

- `options` nằm trong danh sách property mà manifest sync so sánh
  (`all-entity-properties-configuration-by-metadata-name.constant.ts`) và không phải property
  overridable. Option thêm lúc chạy, dù bằng logic function hay bằng tay trong Settings, sẽ bị lần
  `twenty apply` sau ghi đè về danh sách trong manifest, để lại bản ghi mang giá trị không còn tồn
  tại.
- Ngược lại, quyền thì có: guard của field metadata truyền `applicationId` xuống
  (`settings-permission.guard.ts`) và `permissions.service.ts` có nhánh xử lý application, nên nếu
  chỉ xét quyền thì logic function ghi được. Rào chắn là chuyện ghi đè ở trên, không phải quyền.
- Và kể cả tạo được field lúc chạy thì vẫn kẹt ở bước hiển thị: thêm một cột vào view ở mức
  workspace đi qua `canUserModifyViewByChildEntity` → `hasViewsPermission`, mà hàm đó chỉ hiểu ngữ
  cảnh user hoặc API key, không hiểu application. Hai cổng chặn độc lập nhau.

Danh sách khai báo trong `registered-apps.ts`, và **một entry có hai vai trò tách biệt**:

| Loại entry                        | Có gì                                                                         | Ví dụ           |
| --------------------------------- | ----------------------------------------------------------------------------- | --------------- |
| App nguồn (không có khối `stage`) | Một giá trị trong `Apps used`, xuất hiện trong filter chiều upsell            | SHOPLINE, AVADA |
| App đích (có khối `stage`)        | Thêm cột stage riêng trên danh sách và một điều kiện trong view `No deal yet` | BLOY, MIDA      |

Hầu hết app chỉ là nguồn: BD cần biết shop đang chạy app đó, nhưng không ai bán nó. Nâng một app
nguồn lên thành đích sau này chỉ là thêm khối `stage` với UUID mới rồi deploy.

Hệ quả phải biết:

- Thêm app mới = thêm một entry + deploy (khoảng 2 phút), **không phải** chỉ thêm một dòng trong
  object `App`. Đây là chỗ lệch so với mục 5.6.2 của spec, vốn muốn import app lạ là app đó tự xuất
  hiện trong filter.
- Deal nhắm vào một app mình không bán vẫn tạo được (trường `Target app` lấy từ object `App`),
  nhưng nó không có cột stage trên danh sách khách; giai đoạn vẫn xem được trên chính deal đó.
- Màn import từ chối dòng có app chưa khai báo, kèm tên app trong thông báo lỗi, thay vì dồn vào một
  giá trị chung rồi mất thông tin.

## Cột Merchants bị ẩn khỏi danh sách

`merchant` lấy domain làm nhãn, nên cột Merchants lặp lại y nguyên cột Domain. Nó bị ẩn ở view danh
sách (`isVisible: false`) chứ không xoá: mở trang chi tiết khách vẫn thấy đủ merchant của từng app,
và bật lại chỉ là một cú bấm trong Options.

## Lọc chiều upsell: app nguồn và app đích

Chiều là hai điều kiện trên cùng một trường `Apps used`, mà thanh filter thường chỉ giữ **một** điều
kiện cho mỗi trường (bấm lại đúng trường đó là mở lại chip cũ). Nên điều kiện thứ hai đặt trong
Advanced filter:

1. `Add filter` → `Apps used` → `Contains` → tick **app nguồn**.
2. `Filter` → `Advanced filter` → `Add filter rule` → `Apps used` → `Doesn't contain` → tick
   **app đích**.
3. `Save as new view` nếu muốn giữ lại. View cá nhân không cần quyền gì, và không bị lần deploy sau
   ghi đè như view do manifest quản.

Hai chiều với dữ liệu hiện có:

| Chiều          | Điều kiện                            | Kết quả       |
| -------------- | ------------------------------------ | ------------- |
| MIDA sang BLOY | contains MIDA + doesn't contain BLOY | beta-fashion  |
| BLOY sang MIDA | contains BLOY + doesn't contain MIDA | epsilon-goods |

Bỏ lọc tạm thời bằng nút `Reset` trên thanh view.

## Vì sao chỉ còn một trang danh sách khách

Trước đây có hai trang: `High-Value Prospects` và `Upsell candidates`. Chúng trả về **cùng một tập
dữ liệu**, vì điều kiện phân biệt duy nhất là "đang dùng ít nhất 1 app" mà điều kiện đó luôn đúng:
prospect chỉ sinh ra từ một dòng merchant hoặc một dòng CSV import, cả hai đều bắt buộc có app. Nên
view thứ hai đã bị bỏ, thay bằng view thật sự khác:

| View                   | Filter                                  | Trả lời câu hỏi                             |
| ---------------------- | --------------------------------------- | ------------------------------------------- |
| `High-Value Prospects` | plan Advanced/Plus                      | Toàn bộ khách hạng cao                      |
| `No deal yet`          | plan Advanced/Plus + `Deal stages` rỗng | Ai chưa được tiếp cận, tức hàng đợi cần làm |

Chiều upsell vẫn là **tham số của bộ lọc**, không phải một trang riêng và không có app nào viết
cứng: BD thêm `Apps used doesn't contain <app đích>`, muốn siết nguồn thì thêm
`Apps used contains <app nguồn>`, rồi Save as new view nếu muốn giữ. View cá nhân không cần quyền
gì.

**Đã thử sinh view tự động theo App registry và không làm được**: tạo view ở mức workspace cần
quyền `VIEWS`, mà `view-access.service.ts` chỉ cấp quyền đó cho ngữ cảnh user hoặc API key, không
bao giờ cho ngữ cảnh application mà logic function chạy dưới. Hai đường còn lại nếu sau này cần:
nhúng một API key admin vào application variable (thêm secret dài hạn, không khuyến khích), hoặc
dựng trang riêng bằng front component với hai dropdown App nguồn / App đích đọc từ registry, đúng
wireframe 5.1, tốn khoảng một ngày.

## Test

```bash
yarn test     # unit test cho phần thuần: chuẩn hoá domain, id v5, parse CSV, gộp app key
```
