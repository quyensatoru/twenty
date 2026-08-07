# Hướng dẫn sử dụng Task Manager

> Cách dùng Task Manager để quản lý công việc hằng ngày — dành cho tất cả mọi người, không cần biết kỹ thuật. Muốn xem spec/kiến trúc kỹ thuật, đọc [TASK_MANAGER_SPEC.md](TASK_MANAGER_SPEC.md).

## 1. Task Manager là gì?

Task Manager là nơi quản lý công việc trong CRM, giống như một danh sách việc cần làm cho cả nhóm. Vào từ mục **Task Manager** ở thanh menu bên trái.

Khi vào Task Manager, bạn đang xem công việc của **một dự án (Project)** — chọn dự án ở góc trên. Mỗi dự án có các trạng thái công việc riêng, không lẫn với dự án khác.

Có 3 cách xem công việc:

| Tab | Dùng để |
|---|---|
| **Board** | Xem theo cột trạng thái, kéo-thả để đổi trạng thái |
| **Backlog** | Xem theo từng đợt làm việc (Sprint) |
| **Roadmap** | Xem tiến độ theo từng nhóm việc lớn (Epic) |

## 2. Các khái niệm chính

Bạn sẽ gặp vài từ này khi dùng Task Manager. Đọc qua một lần cho quen:

- **App** — một ứng dụng/cửa hàng cụ thể. Dự án và khách hàng (Merchant) đều gắn với một App.
- **Project** — nơi chứa toàn bộ công việc của một App. Có mã riêng dùng để đánh số issue (ví dụ `MOB-4`).
- **Issue** — một công việc cụ thể — có thể là lỗi cần sửa, việc cần làm, hoặc một tính năng nhỏ.
- **Epic** — một nhóm gồm nhiều issue nhỏ, cùng phục vụ một mục tiêu lớn hơn.
- **Sprint** — một đợt làm việc có thời hạn (ví dụ 2 tuần), quản lý ở tab Backlog.
- **Merchant** — cửa hàng hoặc khách hàng mà issue đó liên quan tới.

**Mẹo:** không thấy tên khách hàng hoặc người mình cần chọn trong danh sách? Thường là do người/khách hàng đó chưa được gắn vào đúng App của dự án. Nhờ admin kiểm tra giúp.

## 3. Board

- Mỗi cột là một trạng thái công việc.
- Kéo-thả issue sang cột khác để đổi trạng thái.
- Bấm chuột phải vào issue để thao tác nhanh (xoá, tạo bản sao...).
- Bấm vào issue để mở xem chi tiết mà không rời khỏi Board.

## 4. Backlog

- Công việc được chia theo từng Sprint: sprint đang chạy, các sprint sắp tới, và phần chưa xếp vào sprint nào (Backlog).
- Kéo-thả issue giữa các phần để đưa vào hoặc bỏ ra khỏi một sprint.
- Bấm **Start sprint** để bắt đầu một sprint sắp tới.
- Bấm **Complete sprint** khi kết thúc sprint đang chạy — issue chưa hoàn thành sẽ tự chuyển sang sprint kế tiếp hoặc về lại Backlog.

## 5. Roadmap

Công việc được nhóm theo Epic, mỗi Epic có một thanh tiến độ cho biết đã hoàn thành bao nhiêu phần trăm. Issue chưa thuộc Epic nào sẽ nằm ở nhóm riêng. Bấm vào issue để xem chi tiết.

## 6. Tạo và chỉnh sửa issue

Bấm **+ New issue** ở phía trên để tạo issue mới. Muốn sửa thông tin, bấm trực tiếp vào phần cần sửa — không cần vào chế độ sửa riêng.

Các thông tin chính của 1 issue:

| Thông tin | Ý nghĩa |
|---|---|
| Tiêu đề, mô tả | Tên việc và mô tả chi tiết — có thể dán ảnh, đính kèm file |
| Loại, mức độ ưu tiên, trạng thái | Đây là việc gì, quan trọng tới đâu, đang ở giai đoạn nào |
| Người xử lý, người báo cáo | Ai đang làm việc này, ai là người tạo/theo dõi |
| Dự án, Epic, Sprint | Việc này thuộc dự án nào, nhóm việc lớn nào, đợt làm nào |
| Khách hàng (Merchant) | Cửa hàng/khách hàng liên quan tới issue này |
| Hạn hoàn thành | Ngày cần xong |

## 7. Xem chi tiết một issue

Mở một issue bất kỳ (bấm vào nó, hoặc mở link người khác gửi) sẽ thấy đầy đủ:

- **Thông tin chung** — loại issue, mã số, mức ưu tiên, trạng thái, cùng nút chia sẻ link.
- **Tiêu đề và mô tả**
- **Chi tiết** — các thông tin khác như người xử lý, sprint, epic, khách hàng, hạn hoàn thành...
- **Bình luận** — nơi mọi người trao đổi về issue này.
- **Lịch sử thay đổi** — ai đã sửa gì, từ lúc nào.
- **File đính kèm**

Issue có thể xem theo 2 cách: mở nhanh ngay bên cạnh màn hình đang làm, hoặc mở thành một trang riêng đầy đủ — tiện khi cần gửi link cho người khác. Có nút để chuyển qua lại giữa 2 cách xem này.

## 8. Bình luận (Comment)

- Gõ bình luận ở khung soạn phía dưới cùng — đính kèm được ảnh, file.
- **Trả lời** — phản hồi trực tiếp một bình luận cụ thể.
- **Sửa / Xoá** — chỉ người viết mới sửa hoặc xoá được bình luận của mình; xoá sẽ có bước xác nhận trước.
- **Chia sẻ link** — ai cũng bấm được. Link này khi mở lên sẽ tự động cuộn tới và tô sáng đúng bình luận đó, rất tiện khi muốn chỉ cho đồng nghiệp xem đúng một câu trả lời trong một cuộc trao đổi dài.

## 9. Chia sẻ link một issue

Bấm nút liên kết ở phần thông tin chung của issue để sao chép link. Gửi link này qua chat hoặc email, người nhận bấm vào sẽ mở đúng issue đó.

## 10. Câu hỏi thường gặp

**Không thấy khách hàng hoặc người mình cần chọn?**
Kiểm tra xem khách hàng đó có thuộc đúng App của dự án không, hoặc người đó đã được cấp quyền vào App này chưa. Nếu chưa rõ, hỏi admin.

**Ô xem nhanh bên cạnh quá hẹp?**
Có thể kéo giãn ra cho rộng hơn — kéo ở viền bên trái của ô xem nhanh.
