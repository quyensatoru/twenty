# Discounts: hợp đồng giữa CRM và app server

CRM (app Customer Support) gửi mỗi discount sang server của app mà nó thuộc về và đọc câu trả
lời, để CSE thấy ngay app đã nhận, từ chối, hay không gọi được.

## Request CRM gửi

`POST <endpoint của app>` (admin điền ở trang Discounts > App connections) khi discount được tạo, sửa (field app đọc), xoá, hoặc khi CSE
bấm "Gửi lại". Body giữ đúng shape webhook Twenty cũ:

```json
{
  "eventName": "discount.created | discount.updated | discount.deleted",
  "workspaceId": "…",
  "webhookId": "customer-support-discounts",
  "eventDate": "2026-10-23T05:05:42.796Z",
  "objectMetadata": { "id": "…", "nameSingular": "discount" },
  "record": {
    "id": "…", "appId": "…", "merchantId": "…",
    "discountCode": "MIDA25-AYSFI1", "discountType": "PERCENTAGE", "discountValue": 25,
    "limitInIntervals": 1, "limitUsage": 1, "startDate": "2026-10-23", "endDate": "2026-10-30",
    "status": true, "scope": "SINGLE", "assignedDomains": ["aysfi1-zu.myshopify.com"],
    "reason": "Touch point", "timesUsed": 0, "name": "…", "createdAt": "…", "updatedAt": "…"
  },
  "updatedFields": ["discountValue"]
}
```

- `discountValue` phần trăm là **số nguyên** (25 = 25%) cho mọi app.
- Mọi app nhận cùng payload; field nào app không dùng thì bỏ qua.
- `limitInIntervals` từ 9999 trở lên nghĩa là mãi mãi.

Header:

| Header | Ý nghĩa |
|---|---|
| `X-Twenty-Webhook-Timestamp` | ms epoch |
| `X-Twenty-Webhook-Signature` | hex HMAC-SHA256 của `${timestamp}:${rawBody}` với secret của app đó |
| `X-Crm-Delivery-Id` | khoá idempotency; cùng id thì là gửi trùng |
| `X-Crm-Expect-Result` | `1`: CRM đọc body trả về |

Timeout 10 giây.

## App trả về

| Trả | CRM hiểu là | Ghi chú |
|---|---|---|
| `2xx` `{ "status": "applied", "externalId": "…" }` | Đã áp dụng | `externalId` tuỳ chọn, hiện trên CRM |
| `2xx` không có `status` | Đã áp dụng | cách các app đang trả hôm nay |
| `422` (hoặc `2xx` với `"status": "rejected"`) | Bị từ chối, không thử lại | kèm `errors` |
| `202` `{ "status": "accepted" }` | Chờ kết quả | app gọi callback bên dưới |
| `5xx`, `408`, `429`, timeout | Gửi lỗi, tự thử lại sau 1, 5, 30, 120 phút | |
| `401`, `403`, `404` | Gửi lỗi, không thử lại | sai secret hoặc URL |

`errors` dùng tên field của CRM để trang Discounts tô đúng ô:

```json
{ "status": "rejected",
  "errors": [{ "field": "discountCode", "code": "duplicate", "message": "code already exists" }] }
```

**Không trả 200 khi đã bỏ qua dữ liệu.** Đây là lỗi đang có: MIDA lưu `null` cho phần trăm
lớn hơn 1 mà vẫn trả 200, nên 10 discount trên production không dùng được mà không ai biết.
MIDA còn broadcast tới mọi cluster và lấy 2xx đầu tiên; proxy cần trả 4xx nếu cluster nào từ
chối.

## Callback cho app trả 202

`POST {CRM}/s/customer-support/discounts/sync-result`, `Authorization: Bearer <CRM API key>`,
ký body bằng cùng secret và header `X-Twenty-Webhook-Timestamp` / `X-Twenty-Webhook-Signature`:

```json
{ "deliveryId": "<X-Crm-Delivery-Id đã nhận>", "status": "applied | rejected",
  "externalId": "…", "errors": [] }
```

Không có callback sau 30 phút thì CRM gửi lại.

## Lượt dùng

Như hiện nay: app ghi `timesUsed` về CRM qua REST. Thay đổi này không làm CRM gửi lại.
