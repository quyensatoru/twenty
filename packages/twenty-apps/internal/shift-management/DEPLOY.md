# Deploy lên production

App này không nằm trong build của server. Nó được đẩy lên một Twenty server đang chạy bằng CLI
`twenty`, từ một máy có source của app (máy dev hoặc runner CI). Server production không cần
checkout repo.

Nếu đây là lần chuyển từ nhánh fork (khi `shift`, `shiftTemplate`, `specialDay` còn là standard
object) sang app, **đọc `MIGRATION.md` và `../CUTOVER.md` trước** — dữ liệu phải được re-parent
trước khi deploy, `apply` thẳng vào production sẽ tạo bảng rỗng song song.

## 1. Điều kiện phía server

| Thứ cần có | Vì sao |
| --- | --- |
| `LOGIC_FUNCTION_TYPE=LOCAL` trong env của server **và** worker | Mặc định biến này chỉ là `LOCAL` khi `NODE_ENV=development`; ngoài ra là `DISABLED` (`config-variables.ts`). Để `DISABLED` thì **toàn bộ app không dùng được**: mọi màn hình đọc và ghi đều đi qua route (logic function), không có route thì trang trắng. |
| `SERVER_URL` là URL public HTTPS | Front component gọi route qua REST client theo URL này. |
| Object `workspaceMember` có sẵn | App gắn thêm field `shifts` lên đó; đây là standard object của upstream nên luôn có. |

Không cần worker: app không có cron và không có job. Không cần feature flag nào.

**Nếu production đang chạy bản cũ hơn repo:** deploy code server trước, rồi chạy đúng thứ tự này
(xem `packages/twenty-server/docs/UPGRADE_COMMANDS.md`):

```bash
yarn install
npx nx build twenty-shared --skip-nx-cache
node dist/command/command.js upgrade
node dist/command/command.js cache:flush     # bắt buộc, migration không tự invalidate cache
```

Kiểm tra bằng `node dist/command/command.js upgrade:status` trước khi cài app: mọi workspace phải
`Up to date`.

## 2. Cài app

Trên máy có source:

```bash
cd packages/twenty-apps/internal/shift-management
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

**Đừng đặt tên remote là `local`.** `getRemotes()` luôn nhét sẵn tên `local` vào danh sách kể cả khi
`~/.twenty/config.json` rỗng, nên `remote:add --as local` luôn rơi vào nhánh re-authenticate: nhánh
này đọc URL đã lưu và **bỏ qua `--url` bạn truyền vào**, rơi về mặc định `http://localhost:2020`.
Dùng bất kỳ tên nào khác (`dev`, `prod`, `staging`) là hết.

**Lần cài đầu tiên phải dùng `apply`, `plan` sẽ fail.** App chưa có application registration trên
server nên `plan` chết với `No registration found for "<uid>". Create one first with
createApplicationRegistration.` `apply` tự đăng ký rồi mới sync. Từ lần deploy thứ hai trở đi `plan`
chạy bình thường và nên chạy trước mỗi `apply`.

Trước khi `apply`, chạy:

```bash
yarn twenty dev:typecheck
yarn test
yarn lint
```

**Lần deploy sau:** lặp lại `plan` rồi `apply`. `apply` mặc định **xoá** entity không còn trong
source. Nếu có ai đó tạo tay object/field trong namespace của app, thêm `--no-delete`. `--force` bỏ
qua câu hỏi xác nhận — chỉ dùng trong CI khi đã đọc kỹ output của `plan`.

## 3. Cấu hình biến

Settings → Apps → Shift Management → Variables.

| Biến | Ghi chú |
| --- | --- |
| `SHIFT_LEADER_EMAILS` | Email của Leader/PO, cách nhau dấu phẩy. `*` nghĩa là mọi người (không khuyến nghị). Bỏ trống thì chỉ workspace admin được coi là Leader/PO. |

**Vì sao cần biến này.** Bản fork xác định Leader/PO bằng cờ role `canUpdateAllObjectRecords`, đọc
qua `shouldBypassAppScope`. App không đọc được cờ role, nên quyền nâng cao được khai báo tường minh:
hoặc có mặt trong `SHIFT_LEADER_EMAILS`, hoặc giữ permission flag `WORKSPACE_MEMBERS` (workspace
admin — người dù sao cũng tự cấp được quyền đó cho mình).

Người trong danh sách này:

- đọc được báo cáo của mọi thành viên (bộ chọn Member trên trang Report),
- đăng ký ca thay cho người khác,
- sửa được punch (`checkInAt`/`checkOutAt`) và các field khác của ca qua route `/shift/update`.

## 4. Việc phải làm tay sau khi cài

### 4.1 Gỡ quyền đọc/ghi trực tiếp của member — **bắt buộc**

App không sửa được role có sẵn của workspace, nên phải làm tay:

Settings → Roles → role của member → gỡ `canReadObjectRecords` và `canUpdateObjectRecords` trên cả
ba object **Shift**, **Shift Template**, **Special Day**.

Chưa làm bước này thì **kiến trúc bảo mật chưa có hiệu lực**: bản fork chặn IDOR bằng query hook
(`shift.findMany` / `shift.findOne` ép `memberId = self` vào mọi read của member, `shift.updateOne`
chặn field nhạy cảm). App không cài được query hook, nên việc đó chuyển hẳn vào các route:
`/shift/my-shifts` chỉ trả ca của người gọi, `/shift/roster` và `/shift/handovers` chỉ trả field an
toàn, `/shift/update` mới kiểm tra field được bảo vệ. Nếu member vẫn còn quyền đọc/ghi thẳng object
thì họ gọi GraphQL trực tiếp là đọc được ca của đồng nghiệp, kể cả giờ công và lương — đúng lỗ hổng
mà query hook của fork đã bịt.

Sau khi gỡ, member vẫn dùng đủ 4 trang vì mọi trang đều đi qua route, và route chạy bằng token của
application (role `Shift Management runtime`).

Hệ quả cần biết:

- Tab **Charts** trong trang Analytics là widget GRAPH do host vẽ, nó truy vấn `shift` bằng quyền
  của **người đang xem** — nên chỉ Leader/PO thấy số. Tab **Coverage** (mặc định) đi qua route nên
  ai cũng xem được.
- Ba mục sidebar **All Shifts / Shift Templates / Special Days** cũng là record index của host: sau
  khi gỡ quyền, member mở ra sẽ thấy rỗng. Đó là chủ ý — chúng dành cho Leader/PO.

### 4.2 Cấp quyền đọc Shift Template và Special Day cho Leader/PO

Role của Leader/PO cần `canReadObjectRecords` + `canUpdateObjectRecords` trên **Shift Template** và
**Special Day** để quản lý danh mục ca và ngày lễ bằng UI record index. Không cấp thì chỉ admin sửa
được.

### 4.3 Nhập dữ liệu danh mục

App không seed dữ liệu. Trước khi member đăng ký được ca:

1. **Shift Templates** — mỗi mẫu ca cần `code`, `startTime`, `endTime` (HH:mm, giờ ICT, cho phép
   `24:00`), và `dayKind`. `dayKind` quyết định mẫu ca hiện ở ngày nào trên lịch đăng ký:
   `WEEKDAY` (T2–T6), `WEEKEND` (T7–CN), `HOLIDAY_OT` (chỉ hiện vào ngày đặc biệt, và **thay thế**
   hoàn toàn danh sách ca thường của ngày đó).
2. **Special Days** — `YEARLY` khớp theo `month`/`day` mọi năm, `SPECIFIC` khớp đúng `date`. Hệ số
   cao nhất trong các ngày khớp sẽ được đóng dấu vào `rateMultiplier` lúc đăng ký.
3. `salaryPerHour` trên mẫu ca là tuỳ chọn. Thiếu ở bất kỳ mẫu ca nào của một ca đã COMPLETED thì
   thẻ **Thu nhập ước tính** trên trang Report biến mất hoàn toàn (thà không hiện còn hơn hiện số
   thiếu).

### 4.4 Ghi chú vận hành

- `earlyCheckInMinutes` để trống nghĩa là **không chặn** check-in sớm. Chặn trên (ca đã hết giờ thì
  không check-in được nữa) luôn có, không phụ thuộc biến này.
- Đăng ký ca là **không nguyên tử giữa các request**: app không có transaction, nên hai người bấm
  cùng lúc vào một slot `HOLIDAY_OT` có thể cùng lọt. Xem `MIGRATION.md`.

## 5. Kiểm tra sau deploy

```bash
yarn twenty dev:function:logs --remote prod
yarn twenty dev:function:exec -n shift-catalog --remote prod
```

`shift-catalog` trả về danh sách mẫu ca đang dùng và ngày đặc biệt đang dùng — đủ để biết app đọc
được dữ liệu chưa mà không cần đăng ký ca thật. `dev:function:exec` cần remote đăng nhập bằng user;
API key không đủ quyền. Tên function **không phải tên file**: xem cột `name` trong mỗi file dưới
`src/logic-functions/` (`check-in.ts` đăng ký thành `check-in-shift`, `cancel-shift.ts` thành
`cancel-shift`, `my-shifts.ts` thành `my-shifts`…). Gõ sai tên thì lệnh in ra danh sách hợp lệ.

Trên UI, sidebar **Shifts** có 7 mục:

| Mục | Kiểm tra |
| --- | --- |
| Tuần của tôi | Thẻ "Ca kế tiếp" hoặc "Ca hiện tại", danh sách ca còn phải xử lý |
| Đăng ký | Lịch tháng hiện coverage của **cả team**; ngày đặc biệt viền cam |
| Báo cáo | Thẻ số liệu + bảng chia theo tuần ICT; Leader/PO thấy thêm bộ chọn Member |
| Phân tích | Tab Coverage: ma trận 24×N; tab Charts: chỉ Leader/PO thấy số |
| All Shifts / Shift Templates / Special Days | Record index của host — rỗng với member là đúng |

Luồng nên chạy thử một lượt trước khi mở cho cả team: đăng ký một ca hôm nay → check-in → check-out
kèm ghi chú bàn giao → mở lại Tuần của tôi bằng tài khoản khác để thấy ghi chú bàn giao đó xuất hiện
ở mục "Bàn giao từ ca trước".

## 6. Gỡ

```bash
yarn twenty app:uninstall --remote prod
```

Xoá luôn object và toàn bộ dữ liệu của app (`shift`, `shiftTemplate`, `specialDay`) cùng field
`shifts` app thêm vào `workspaceMember`. **Export trước** nếu cần giữ lịch sử chấm công — đây là dữ
liệu tính lương.
