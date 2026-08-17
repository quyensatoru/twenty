# CS Shift Management — Requirements (chuẩn hóa từ quy trình team TC)

> Nguồn: quy trình quản lý CS + đăng ký ca của team TC (BLOY), dùng làm mẫu để triển khai
> tính năng tương đương cho team SAE trên `twenty-task-manager-sae`.
> Hệ thống tham chiếu hiện tại: https://shift-management.bsscommerce.com/ (SM) + Google Sheet + group chat CTV + Crisp note.

## 1. Danh mục ca làm việc (Shift Catalog)

### Ca thường — trong tuần (Thứ 2 – Thứ 6)

| Code | Tên | Khung giờ | Số giờ |
|---|---|---|---|
| `TC-TT-D` | Ca đêm trong tuần | 00:00 – 05:00 | 5h |
| `TC-TT-SS` | Ca sáng sớm trong tuần | 05:00 – 10:00 | 5h |
| `TC-TT-TR` | Ca trưa trong tuần | 10:00 – 14:00 | 4h |
| `TC-TT-C` | Ca chiều | 14:00 – 19:00 | 5h |
| `TC-TT-T` | Ca tối trong tuần | 19:00 – 24:00 | 5h |

### Ca thường — cuối tuần (Thứ 7 – Chủ nhật)

| Code | Tên | Khung giờ | Số giờ |
|---|---|---|---|
| `TC-CT-D` | Ca đêm cuối tuần | 00:00 – 04:00 | 4h |
| `TC-CT-SS` | Ca sáng sớm cuối tuần | 04:00 – 08:00 | 4h |
| `TC-CT-S` | Ca sáng cuối tuần | 08:00 – 12:00 | 4h |
| `TC-CT-C` | Ca chiều cuối tuần | 12:00 – 16:00 | 4h |
| `TC-CT-T` | Ca tối cuối tuần | 16:00 – 20:00 | 4h |
| `TC-CT-TM` | Ca tối muộn cuối tuần | 20:00 – 24:00 | 4h |

### Ca OT lễ / tết

| Code | Khung giờ | Số giờ |
|---|---|---|
| `TC-OT-0/3` | 00:00 – 03:00 | 3h |
| `TC-OT-3/6` | 03:00 – 06:00 | 3h |
| `TC-OT-6/9` | 06:00 – 09:00 | 3h |
| `TC-OT-9/12` | 09:00 – 12:00 | 3h |
| `TC-OT-12/15` | 12:00 – 15:00 | 3h |
| `TC-OT-15/18` | 15:00 – 18:00 | 3h |
| `TC-OT-18/21` | 18:00 – 21:00 | 3h |
| `TC-OT-21/24` | 21:00 – 24:00 | 3h |

Rate OT: **150%** lương giờ ngày thường, **200%** ngày lễ/tết theo quy định nhà nước
(lương tính trên 1 giờ rồi nhân hệ số).

> Lưu ý cho team SAE: bộ code `TC-*` là của team TC. Catalog phải **config được** (prefix,
> khung giờ, số ca) — không hardcode — để team SAE tự định nghĩa bộ ca của mình.

## 2. Đăng ký ca (Shift Registration)

- Chu kỳ đăng ký theo **tuần**; hạn điền lịch: **muộn nhất Chủ nhật** của tuần trước.
- Sau khi điền, báo quản lý (hiện tại: group CTV) trước **8h30 Thứ 2**.
- Ràng buộc:
  - Tối thiểu **29h/tuần** (~7 ca/tuần), **không có tối đa**.
  - Trong tuần: đảm bảo **5 ca cam kết** từ Thứ 2 – Thứ 6.
  - Cuối tuần: đội 7 CS phải fill đủ **14 ca cuối tuần**; mỗi CTV đăng ký **1–3 ca** cuối tuần.
  - Không giới hạn tổng số ca đăng ký; được đăng ký thêm ca trống.
- Riêng ca OT lễ/tết: 3h/ca, **không đăng ký trùng ca nhau** (2 người không cùng 1 slot),
  không giới hạn số ca, không phân chia CTV sáng/tối/đêm.
- Cuối tháng: CTV note **tổng giờ** cho PO.

## 3. Thực hiện ca — Check-in / Check-out (Attendance)

- Đầu ca **check-in**, cuối ca **check-out** (hiện tại theo cú pháp trong group CTV, hệ thống SM):
  - `!shift checkin [shift_code]`
  - `!shift checkout [shift_code]`
  - `!shift checkin` → liệt kê ca available để check-in
  - `!shift checkin list` → tổng hợp các ca làm việc
  - `!shift report [day|week|month]` → report ca đã thực hiện trong khung thời gian
- Tổng giờ check-in thực tế 1 tuần: **min 30h**.
- Cuối ca: **note các conversation còn tồn đọng** (hiện tại note vào Crisp) → handover note.

## 4. Chấm công bù (Attendance Adjustment)

- Member quên check-in/check-out → báo Leader (trong group CTV) → Leader sửa/bù công.
- Cần audit: ai sửa, sửa lúc nào, lý do.

## 5. Xin nghỉ / Đổi ca (Leave & Swap)

- Nghỉ ca cố định hoặc nghỉ đột xuất: **trao đổi với leader** (cần approve).
- Phải báo lên nhóm đăng ký ca để **đổi ca** hoặc **nhờ người làm thay** (re-assign ca).

## 6. Báo cáo

- Report theo member: ngày / tuần / tháng (số ca, số giờ thực tế vs đăng ký).
- Report tổng giờ tháng cho PO (payroll input); ca OT tách riêng kèm hệ số 150%/200%.
- Leader view: độ phủ ca theo tuần (slot nào trống, ai đăng ký slot nào).

## 7. Vai trò

| Role | Quyền |
|---|---|
| CTV / Member | Đăng ký ca, check-in/out ca của mình, xem report của mình, tạo yêu cầu bù công / xin nghỉ / đổi ca, viết handover note |
| Leader | Duyệt bù công, duyệt xin nghỉ/đổi ca, sửa attendance, xem coverage + report toàn team, quản lý catalog ca |
| PO / Admin | Như Leader + chốt report tháng (payroll), cấu hình rule (min giờ/tuần, deadline đăng ký, hệ số OT, ngày lễ) |

## 8. Điểm khác biệt cần quyết định khi port sang team SAE (open questions)

1. Bộ shift catalog của team SAE (khung giờ, số ca/ngày) — dùng bộ TC làm seed mặc định hay để trống cho leader tự tạo?
2. Kênh thông báo thay cho "group CTV" (hiện chưa rõ team SAE dùng Slack/Lark/khác) — phase đầu có thể chỉ cần in-app.
3. "Note conversation tồn đọng" của team SAE gắn vào hệ thống nào (không có Crisp?) — phase đầu dùng rich-text handover note trong hệ thống.
4. Quy tắc 7 CS / 14 ca cuối tuần là của team TC — với team SAE, số slot mỗi ca cuối tuần cần config được.
5. Min 29h (đăng ký) vs min 30h (thực tế check-in) — giữ 2 ngưỡng riêng, đều config được.
