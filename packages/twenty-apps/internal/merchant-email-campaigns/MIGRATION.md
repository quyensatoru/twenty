# Migration: event cố định → event động

Bản này bỏ danh sách event cố định. Trước đây một automation chọn `trigger` trong 5 giá trị
(`INSTALLED`, `UNINSTALLED`, `SHOPIFY_PLAN_CHANGED`, `PRICING_PLAN_CHANGED`, `CUSTOM_EVENT`) và
chỉ nhánh `CUSTOM_EVENT` mới đọc tới `eventName`. Sau bản này **mọi** automation định tuyến bằng
`eventName`; bốn event app tự phát trở thành bốn tên thường trong cùng một không gian tên:
`merchant.installed`, `merchant.uninstalled`, `merchant.shopify_plan_changed`,
`merchant.pricing_plan_changed`.

App đang chạy production. Phần dưới viết cho dữ liệu đã có.

## 1. Cái gì đổi, cái gì không

| | Trước | Sau |
| --- | --- | --- |
| Khoá định tuyến | `trigger` (select), riêng custom mới dùng `eventName` | `eventName` (text) cho mọi automation |
| Bốn event của merchant | `INSTALLED`, ... | `merchant.installed`, ... |
| So khớp tên | `eq` đúng từng byte | chuẩn hoá hai phía rồi `eq` (cắt trắng, hạ thường, khoảng trắng → `_`) |
| Field `trigger` | khoá định tuyến | **giữ nguyên**, vẫn được studio ghi kèm, ẩn khỏi view mặc định |
| Tên event trong `merchantEvent` | như bên gửi bắn | chuẩn hoá; tên gốc ở `properties.event_name_as_sent` nếu khác |

**Không xoá gì cả.** `yarn twenty plan` của bản này ra `2 to add, 14 to change, 0 to destroy`:
thêm một cột `Event name` vào view Campaigns và một logic function `list-event-names`; phần còn
lại là đổi description, đổi vị trí cột và checksum của function. Không object nào, không field
nào bị xoá, không option nào bị bỏ khỏi select `trigger`.

## 2. Deploy không cần backfill trước

Đây là điểm quan trọng nhất: **định tuyến có đường lùi**. `resolveCampaignEventName` đọc
`eventName` trước, nếu trống thì suy ra từ `trigger` cũ:

```
eventName rỗng + trigger = 'UNINSTALLED'  →  merchant.uninstalled
```

Câu query lấy automation cũng hỏi cả hai (`eventName IN (...) OR trigger IN (...)`), nên một
campaign `INSTALLED` chưa backfill vẫn nhận `merchant.installed` và vẫn gửi như cũ ngay sau khi
deploy. Nút Activate/Resume cũng chấp nhận campaign như vậy.

Backfill vì thế là **dọn dẹp**, không phải điều kiện. Cứ deploy trước, backfill sau cũng được.

## 3. Backfill (nên chạy, không bắt buộc)

Chạy sau khi `yarn twenty apply` xong. `eventName` là cột text thường; `searchVector` của
`_emailCampaign` là generated column chỉ phụ thuộc `name`, không có trigger nào trên bảng, nên
UPDATE thẳng bằng SQL là an toàn và **không** cần `cache:flush`.

Tìm schema của workspace trước:

```sql
SELECT id, "displayName" FROM core.workspace WHERE "deletedAt" IS NULL;
-- schema tương ứng là workspace_<subdomain-hash>, xem core."workspace".schemaName nếu có
SELECT table_schema FROM information_schema.tables WHERE table_name = '_emailCampaign';
```

**3.1 Xem trước cái gì sẽ đổi** (chạy trước, đọc kỹ):

```sql
SELECT id, name, "campaignType", status, "trigger", "eventName"
FROM "workspace_xxx"."_emailCampaign"
WHERE "deletedAt" IS NULL
  AND "campaignType" = 'AUTOMATION'
ORDER BY status, name;
```

**3.2 Điền `eventName` cho bốn event dựng sẵn:**

```sql
UPDATE "workspace_xxx"."_emailCampaign"
SET "eventName" = CASE "trigger"::text
      WHEN 'INSTALLED'            THEN 'merchant.installed'
      WHEN 'UNINSTALLED'          THEN 'merchant.uninstalled'
      WHEN 'SHOPIFY_PLAN_CHANGED' THEN 'merchant.shopify_plan_changed'
      WHEN 'PRICING_PLAN_CHANGED' THEN 'merchant.pricing_plan_changed'
    END
WHERE "deletedAt" IS NULL
  AND "campaignType" = 'AUTOMATION'
  AND COALESCE(btrim("eventName"), '') = ''
  AND "trigger"::text IN (
    'INSTALLED', 'UNINSTALLED', 'SHOPIFY_PLAN_CHANGED', 'PRICING_PLAN_CHANGED'
  );
```

**3.3 Chuẩn hoá `eventName` của các campaign custom đã có.** Cùng phép biến đổi với
`normalize-event-name.util.ts`:

```sql
UPDATE "workspace_xxx"."_emailCampaign"
SET "eventName" = btrim(
      regexp_replace(
        regexp_replace(lower(btrim("eventName")), '\s+', '_', 'g'),
        '_{2,}', '_', 'g'
      ), '_')
WHERE "deletedAt" IS NULL
  AND COALESCE(btrim("eventName"), '') <> ''
  AND "eventName" <> btrim(
      regexp_replace(
        regexp_replace(lower(btrim("eventName")), '\s+', '_', 'g'),
        '_{2,}', '_', 'g'
      ), '_');
```

Lưu ý: nếu trước đây có hai campaign chỉ khác nhau hoa/thường (`Trial_Ending` và `trial_ending`)
thì sau bước này chúng cùng một event và **cả hai** sẽ gửi khi event đó về. Đó là đúng ý thiết kế
(nhiều template trên một event), nhưng nên xem lại 3.1 trước khi chạy để không gửi trùng ngoài ý
muốn.

**3.4 Không đụng vào log.** `merchantEvent` (lịch sử event) và `emailSend.trigger` (lịch sử gửi,
vẫn còn giá trị `INSTALLED`, `CUSTOM_EVENT`...) là dữ liệu lịch sử, giữ nguyên. Hệ quả duy nhất:
trong 500 dòng event gần nhất, một tên chưa chuẩn hoá sẽ hiện thành một gợi ý riêng cho tới khi
nó trôi ra khỏi cửa sổ đó.

## 4. Kiểm tra sau backfill

```sql
-- không automation nào còn thiếu event
SELECT count(*) FROM "workspace_xxx"."_emailCampaign"
WHERE "deletedAt" IS NULL AND "campaignType" = 'AUTOMATION'
  AND COALESCE(btrim("eventName"), '') = '';

-- automation ACTIVE nào đang nghe một event chưa app nào bắn bao giờ (ứng viên gõ sai)
SELECT c."eventName", count(*) AS automations
FROM "workspace_xxx"."_emailCampaign" c
WHERE c."deletedAt" IS NULL AND c."campaignType" = 'AUTOMATION' AND c.status = 'ACTIVE'
  AND c."eventName" NOT LIKE 'merchant.%'
  AND NOT EXISTS (
    SELECT 1 FROM "workspace_xxx"."_merchantEvent" e
    WHERE e."deletedAt" IS NULL AND e.name = c."eventName"
  )
GROUP BY 1 ORDER BY 2 DESC;
```

Câu thứ hai chính là thứ tab **Integrations → Automations waiting on an event never received**
hiển thị trên UI. Danh sách rỗng, hoặc chỉ còn những event mà bên gửi thật sự chưa chạy, là xong.

Trên UI, mở Email Studio → một automation cũ bất kỳ: ô **Send when this event arrives** phải hiện
sẵn tên event và dòng trạng thái xanh/xám, không phải cảnh báo cam.

## 5. Rollback

Deploy lại bản trước rồi `yarn twenty apply` là đủ: `trigger` chưa bao giờ ngừng được ghi, nên
mọi campaign — kể cả campaign tạo mới sau khi lên bản này — vẫn có giá trị `trigger` dùng được.
Campaign tạo mới với event tự đặt sẽ có `trigger = 'CUSTOM_EVENT'` + `eventName`, đúng hình dạng
bản cũ hiểu được.

Thứ không quay lại được: cột `Event name` đã thêm vào view Campaigns và logic function
`list-event-names` — bản cũ không biết tới chúng, `apply` của bản cũ sẽ xoá cả hai. Không có dữ
liệu người dùng nào trong hai thứ đó.
