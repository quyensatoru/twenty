# Quản lý ca làm việc CS — Requirements nghiệp vụ chi tiết

> Tài liệu cho PO / Leader / BA. Không chứa chi tiết kỹ thuật.
> Tài liệu liên quan: [`requirements.md`](./requirements.md) (quy trình gốc của team TC — nguồn tham chiếu), [`plans.md`](./plans.md) (plan triển khai kỹ thuật).

---

## 1. Bối cảnh & vấn đề

Team CS (CTV) hiện vận hành ca làm việc bằng **nhiều công cụ rời rạc**:

| Việc | Công cụ hiện tại | Vấn đề |
|---|---|---|
| Đăng ký ca hàng tuần | Google Sheet | Không kiểm tra được rule (trùng ca, thiếu giờ), leader phải soát tay |
| Báo lịch cho quản lý | Nhắn trong group chat trước 8h30 thứ 2 | Dễ quên, không có nhắc tự động |
| Check-in / Check-out | Gõ cú pháp `!shift checkin [mã ca]` trong group + hệ thống SM | Sai cú pháp, quên chấm công phải nhờ leader sửa thủ công, không gắn với lịch đã đăng ký |
| Note tồn đọng cuối ca | Crisp note | Nằm ngoài hệ thống ca, không truy vết được theo ca |
| Chốt công tháng cho PO | CTV tự cộng tay và note lại | Sai số, mất thời gian đối soát |

Mục tiêu: đưa **toàn bộ vòng đời ca làm việc** (danh mục ca → đăng ký → thực hiện → điều chỉnh → báo cáo) vào một hệ thống duy nhất trên nền task manager hiện có của team, với luật chơi rõ ràng: **cái gì hệ thống chặn cứng, cái gì chỉ cảnh báo, cái gì chỉ báo cáo**.

## 2. Mục tiêu

1. CTV tự đăng ký ca theo tuần trên giao diện, thấy ngay tổng số ca / tổng giờ mình đã đăng ký.
2. Check-in/out bằng 1 nút bấm, giờ công tính tự động theo công thức thống nhất.
3. Điều chỉnh chấm công (quên check-in/out) chỉ leader làm được: sửa trực tiếp trên ca, hệ thống **tự tính lại giờ công** và lưu vết ai sửa. Xin nghỉ / đổi ca: member trao đổi với leader rồi tự hủy ca.
4. Báo cáo giờ công tháng (kể cả OT nhân hệ số) lấy thẳng từ hệ thống — CTV không phải cộng tay cho PO.
5. Danh mục ca và ngày lễ là **dữ liệu cấu hình được** — team SAE tự định nghĩa bộ ca của mình, không phụ thuộc bộ ca của team TC.

**Không phải mục tiêu (ngoài phạm vi v1):** xem mục 9.

## 3. Vai trò & quyền

Hệ thống chỉ có **2 vai trò** (quyết định 12/08/2026: gộp Leader và PO/Admin làm một):

| Vai trò | Mô tả | Quyền chính |
|---|---|---|
| **CTV / Member** | Nhân viên CS làm theo ca | Đăng ký ca **cho chính mình**; check-in/out, hủy **ca của mình**; báo leader khi cần bù công (qua kênh chat, ngoài hệ thống); xem báo cáo **của mình**; ghi handover note cuối ca |
| **Leader / PO** | Quản lý team CS, kiêm chủ sản phẩm / quản trị | Toàn bộ quyền của Member, cộng thêm: xem/sửa ca của mọi người; đăng ký ca hộ người khác; sửa giờ vào/ra (bù công) cho bất kỳ ca nào; quản lý danh mục ca và ngày lễ; xem báo cáo mọi thành viên; nhận số liệu chốt công tháng; quyết định thay đổi rule (hệ số OT, bộ ca, ngày lễ) |

Nguyên tắc phân quyền xuyên suốt:
- Member **không bao giờ** tự sửa được dữ liệu chấm công (giờ vào/ra, số phút công, trạng thái, hệ số) — chỉ hệ thống ghi (khi bấm nút check-in/out) hoặc leader sửa trực tiếp.
- Mọi hành động trên ca của người khác đều yêu cầu quyền Leader/PO.

## 4. Thuật ngữ

| Thuật ngữ | Nghĩa |
|---|---|
| **Mẫu ca (shift template)** | Định nghĩa một loại ca: mã (vd `SAE-TT-D`), tên, khung giờ, loại ngày (trong tuần / cuối tuần / OT lễ), tham số chấm công |
| **Ca (shift)** | Một lần đăng ký cụ thể: 1 người × 1 mẫu ca × 1 ngày. Mang cả dữ liệu chấm công của lần đó |
| **Ngày đặc biệt (special day)** | Ngày lễ/tết có hệ số lương OT (2.0 = 200%, 1.5 = 150%). Lặp hàng năm (vd 2/9) hoặc ngày cụ thể (vd mùng 1 Tết 2026) |
| **Giờ công (payable)** | Số phút được tính lương của một ca, chốt tại thời điểm check-out theo công thức ở FR-4 |
| **Handover note** | Ghi chú cuối ca về các việc/hội thoại còn tồn đọng bàn giao cho ca sau |

## 5. Requirements chi tiết

### FR-1. Danh mục mẫu ca

**Mô tả:** Leader định nghĩa và bảo trì danh mục các loại ca. Đây là dữ liệu, không cố định trong hệ thống.

**User story:** *Là leader, tôi muốn tự tạo/sửa bộ ca của team (mã, khung giờ, loại ngày) để khi quy trình đổi, tôi không phải chờ dev.*

**Thuộc tính một mẫu ca:**

| Thuộc tính | Bắt buộc | Ghi chú |
|---|---|---|
| Tên | ✔ | vd "Ca đêm trong tuần" |
| Mã | ✔ | ngắn gọn, dùng ở mọi báo cáo, vd `SAE-TT-D` |
| Giờ bắt đầu / kết thúc | ✔ | định dạng HH:mm; `24:00` được phép làm mốc cuối ngày; ca qua đêm (kết thúc ≤ bắt đầu) hợp lệ |
| Loại ngày | ✔ | Trong tuần / Cuối tuần / OT lễ — quyết định rule đăng ký (FR-3) |
| Cho check-in sớm (phút) | ✕ | mở cửa check-in sớm X phút trước giờ bắt đầu; **bỏ trống = không giới hạn giờ check-in** |
| Ân hạn check-out muộn (phút) | ✕ | Giới hạn giờ công khi check-out muộn. Nhập X: giờ công chỉ được tính **tối đa đến giờ kết thúc ca + X phút** — check-out muộn hơn nữa cũng không cộng thêm giờ (vd ca 14:00–19:00, ân hạn 30' → check-out 21:00 vẫn chỉ tính đến 19:30). **Bỏ trống: không giới hạn**, làm bao nhiêu tính bấy nhiêu (dành cho ca linh hoạt). Công thức đầy đủ ở BR-4.5 |
| Lương/giờ | ✕ | Leader/PO thấy tất cả; member chỉ thấy lương/giờ và thu nhập ước tính **của chính mình** (trên ca / báo cáo cá nhân), không thấy của người khác |
| Màu hiển thị | ✕ | badge trên lịch |
| Đang hoạt động | ✔ | tắt = không cho đăng ký mới, ca cũ giữ nguyên |

**Business rules:**
- BR-1.1: Ca đã đăng ký **giữ nguyên thông tin mẫu ca tại thời điểm đăng ký** (mã, tên, khung giờ) — sửa/tắt mẫu ca về sau không làm sai lệch dữ liệu lịch sử và báo cáo cũ.
- BR-1.2: Hệ thống seed sẵn bộ ca mẫu (phỏng theo bộ TC: 5 ca trong tuần, 6 ca cuối tuần, 8 ca OT 3h) để team dùng ngay và sửa dần.

**Acceptance criteria:**
- Given tôi là leader, when tôi tạo mẫu ca mới với đủ trường bắt buộc, then mẫu ca xuất hiện trong lưới đăng ký của member từ tuần kế tiếp trở đi.
- Given một mẫu ca đã có ca đăng ký, when leader đổi tên/tắt mẫu ca, then các ca đã đăng ký và báo cáo cũ vẫn hiển thị thông tin cũ.
- Given tôi là member, when tôi mở danh mục ca chung, then tôi **không** thấy cột lương/giờ; when tôi mở báo cáo tháng **của chính mình**, then tôi thấy lương/giờ áp cho ca của mình và thu nhập ước tính.

### FR-2. Danh mục ngày đặc biệt (hệ số OT)

**Mô tả:** Leader quản lý danh sách ngày lễ/tết kèm hệ số lương.

**User story:** *Là leader, tôi muốn khai báo ngày lễ và hệ số (150% ngày thường được duyệt OT, 200% lễ tết nhà nước) để hệ thống tự gắn hệ số vào ca, không ai phải nhớ.*

**Business rules:**
- BR-2.1: Hai kiểu ngày: **lặp hàng năm** (khai tháng + ngày, vd 30/4) và **ngày cụ thể** (vd 16/02/2026 — mùng 1 Tết Bính Ngọ).
- BR-2.2: Hệ số mặc định 2.0; nhập tự do ≥ 1.0 (1.5 = 150%).
- BR-2.3: Khi một ngày khớp nhiều ngày đặc biệt, lấy **hệ số cao nhất**.
- BR-2.4: Hệ số được **chốt vào ca tại thời điểm đăng ký**. Leader có quyền sửa hệ số của từng ca riêng lẻ (trường hợp đặc cách).
- BR-2.5: Seed sẵn các ngày lễ VN (1/1, 30/4, 1/5, 2/9, các ngày Tết âm của năm hiện hành) với hệ số 2.0.
- BR-2.6: Cách tính lương thống nhất: `lương ca = giờ công × lương/giờ × hệ số` (hệ số trống = 1.0).

**Acceptance criteria:**
- Given ngày mai là ngày đặc biệt hệ số 2.0, when member đăng ký một ca ngày mai, then ca đó hiển thị badge ×2 và báo cáo tính hệ số 2.0.
- Given leader xóa/tắt ngày đặc biệt **sau khi** đã có ca đăng ký cho ngày đó, then hệ số đã chốt trên các ca cũ không đổi.

### FR-3. Đăng ký ca theo tuần

**Mô tả:** Member đăng ký ca cho tuần kế tiếp trên lưới ngày × ca, thấy ngay tổng số ca / tổng giờ đã đăng ký.

**User story:** *Là CTV, tôi muốn tick chọn ca cho tuần sau và thấy ngay tổng số ca/tổng giờ mình đã đăng ký — thay vì tự đếm trên Google Sheet.*

**Quy tắc:**

| # | Quy tắc | Mức thực thi |
|---|---|---|
| BR-3.1 | Không đăng ký ca cho **ngày đã qua** | 🔴 Chặn cứng |
| BR-3.2 | Không đăng ký **trùng** (cùng người + cùng ngày + cùng mẫu ca, trừ ca đã hủy) | 🔴 Chặn cứng |
| BR-3.3 | Ca **OT lễ**: mỗi slot (mẫu ca × ngày) chỉ **một người** đăng ký — ai nhanh được trước | 🔴 Chặn cứng |
| BR-3.4 | Chỉ đăng ký được mẫu ca **đang hoạt động** | 🔴 Chặn cứng |
| BR-3.5 | Member chỉ đăng ký cho **chính mình** (leader được đăng ký hộ) | 🔴 Chặn cứng |
| BR-3.6 | Không giới hạn tổng số ca; được đăng ký thêm ca trống bất kỳ lúc nào (kể cả giữa tuần, miễn chưa qua ngày) | — |
| BR-3.7 | Hạn đăng ký: **Chủ nhật** tuần trước; hệ thống nhắc (FR-8) nhưng không khóa việc đăng ký muộn | 🟡 Nhắc nhở |
| BR-3.8 | Mẫu ca "trong tuần" chỉ đăng ký được vào thứ 2–6; "cuối tuần" chỉ thứ 7–CN; "OT lễ" ngày nào cũng được (leader chủ động mở đợt OT) | 🔴 Chặn ở giao diện |

> **Quyết định (11/08/2026): các ngưỡng cam kết KHÔNG đưa vào hệ thống.** Min 29h đăng ký/tuần, 5 ca cam kết T2–T6, 1–3 ca cuối tuần, min 30h thực tế/tuần là cam kết quản lý con người — PO tự nhìn báo cáo đăng ký ca và nhắc riêng từng CS. Hệ thống chỉ hiển thị **số liệu trung tính** (tổng ca, tổng giờ), không ✓/⚠, không chặn, không tô đỏ.

**Giao diện (mô tả nghiệp vụ):**
- Lưới: cột = 7 ngày của tuần đang xem (thứ 2 → CN), hàng = các mẫu ca đang hoạt động, nhóm Trong tuần / Cuối tuần. Nhóm OT lễ chỉ hiện khi trong tuần đó có ngày đặc biệt.
- Ô đã đăng ký: hiện chip khóa (muốn bỏ phải qua luồng hủy ca — FR-6). Ô ngày đã qua: khóa mờ.
- Dòng tổng kết cập nhật trực tiếp khi tick: tổng số ca và tổng giờ (đã đăng ký + đang chọn) của tuần, tách trong tuần / cuối tuần — **thuần thông tin, không đánh giá đạt/chưa đạt**.
- Bấm "Đăng ký N ca" một lần cho tất cả ô đã tick; ô nào bị hệ thống từ chối (trùng, slot OT bị lấy trước…) hiện lỗi theo từng ô, các ô còn lại vẫn thành công.

**Acceptance criteria:**
- Given tuần sau còn trống, when tôi tick 5 ca trong tuần (24h) + 2 ca cuối tuần (8h) và bấm đăng ký, then 7 ca được tạo và dòng tổng kết hiện 7 ca / 32h.
- Given tôi đã có ca `SAE-TT-C` ngày 17/08, when tôi đăng ký lại đúng ca đó, then hệ thống từ chối với thông báo "đã đăng ký".
- Given bạn A đã lấy slot OT `SAE-OT-0-3` ngày 01/01, when tôi đăng ký cùng slot, then hệ thống từ chối với thông báo slot đã có người.
- Given tôi chỉ đăng ký 20h/tuần, when tôi bấm đăng ký, then các ca **vẫn được tạo** — hệ thống không chặn, không cảnh báo; việc nhắc thiếu cam kết do PO thực hiện dựa trên báo cáo.

### FR-4. Thực hiện ca — Check-in / Check-out

**Mô tả:** Thay cú pháp `!shift checkin/checkout` bằng nút bấm trên trang "Tuần của tôi". Giờ công tính tự động.

**User story:** *Là CTV, đầu ca tôi bấm Check-in, cuối ca bấm Check-out và ghi nhanh việc tồn đọng — hệ thống tự tính giờ công, tôi không cần nhớ mã ca hay cú pháp.*

**Business rules:**
- BR-4.1: Chỉ check-in được ca ở trạng thái **Sắp diễn ra** của chính mình, vào **đúng ngày** của ca.
- BR-4.2: Nếu mẫu ca khai "cho check-in sớm X phút": chỉ check-in được từ `giờ bắt đầu − X`. Bỏ trống = check-in lúc nào cũng được (trong ngày của ca).
- BR-4.3: Check-in xong ca chuyển **Đang diễn ra**; không check-in lần hai.
- BR-4.4: Chỉ check-out được ca **đã check-in** và chưa check-out.
- BR-4.5: **Công thức giờ công (chốt tại check-out):**
  - Giờ thực tế = check-out − check-in (làm tròn xuống phút).
  - Nếu mẫu ca khai "ân hạn check-out muộn": giờ công bị **chặn trần** bằng độ rộng cửa sổ ca = `(bắt đầu − check-in sớm) → (kết thúc + ân hạn)`; ca qua đêm tính đúng qua ngày.
  - Nếu bỏ trống ân hạn: **không áp trần** (ghi nhận đủ giờ thực tế — dành cho ca linh hoạt).
  - Giờ công không bao giờ âm.
- BR-4.6: Khi check-out, member được nhập **handover note** (không bắt buộc): các hội thoại/việc còn tồn đọng cho ca sau. Note gắn vĩnh viễn vào ca.
- BR-4.7: Check-out xong ca chuyển **Hoàn thành**, giờ công **đóng băng** — sau đó chỉ leader sửa được (FR-5).
- BR-4.8: Ca Sắp diễn ra đã **quá giờ kết thúc mà không có check-in** được hiển thị là **Vắng (Absent)** trên mọi màn hình và báo cáo (trạng thái suy diễn, không cần ai bấm gì).
**Acceptance criteria:**
- Given ca của tôi 14:00–19:00 hôm nay, check-in sớm 15 phút, when tôi bấm Check-in lúc 13:30, then bị từ chối kèm thông báo "mở lúc 13:45"; lúc 13:50 thì thành công.
- Given tôi check-in 14:00 và check-out 21:00, ân hạn 30 phút, when hệ thống tính giờ công, then tôi nhận 5h45 (trần cửa sổ 13:45→19:30) chứ không phải 7h.
- Given tôi check-out và nhập handover note, then note hiển thị trên chi tiết ca cho mọi người trong team đọc được.
- Given ca hôm qua của bạn B không có check-in, when leader mở báo cáo, then ca đó đếm vào cột **Vắng**.

### FR-5. Bù công & xin nghỉ — leader xử lý trực tiếp (không có luồng duyệt)

> **Quyết định (11/08/2026):** không xây luồng "đề nghị → duyệt" trong hệ thống. Member báo leader qua kênh chat như hiện tại; leader thao tác thẳng trên ca. Đơn giản, ít màn hình; dấu vết là "ai sửa gì, lúc nào" do hệ thống tự lưu.

**User stories:**
- *Là CTV quên check-in/check-out, tôi nhắn leader kèm giờ thực tế; leader điền giờ vào/ra cho ca — giờ công của tôi được hệ thống tự tính lại đúng công thức.*
- *Là CTV cần nghỉ ca đã đăng ký, tôi trao đổi với leader rồi tự hủy ca trên hệ thống (FR-6); nếu có người thay, người đó tự đăng ký slot vừa trống.*

**Business rules:**
- BR-5.1: Chỉ leader sửa được giờ vào / giờ ra / hệ số của ca (member bị chặn — xem ma trận quyền mục 6).
- BR-5.2: Khi leader sửa giờ vào/ra, hệ thống **tự tính lại giờ công** theo đúng công thức BR-4.5 và tự cập nhật trạng thái ca (đủ giờ vào + giờ ra → Hoàn thành; mới có giờ vào → Đang diễn ra) — leader không nhập tay số phút công, nên không bao giờ có số mâu thuẫn với giờ vào/ra.
- BR-5.3: Mọi lần sửa đều lưu vết tự động: ai sửa, sửa lúc nào.
- BR-5.4: Xin nghỉ / đổi ca không cần thao tác duyệt trong hệ thống: member trao đổi với leader rồi tự hủy ca theo FR-6 (đã ép lý do + phân loại Ốm/Cá nhân/Đổi ca/Khác).

**Acceptance criteria:**
- Given tôi quên check-out ca hôm qua (ca treo Đang diễn ra) và đã nhắn leader "tôi làm đến 19:05", when leader điền giờ ra 19:05 cho ca, then ca chuyển Hoàn thành với giờ công tính từ giờ vào cũ đến 19:05 (áp trần như bình thường), chi tiết ca hiện người sửa gần nhất là leader.
- Given tôi là member, when tôi cố sửa giờ vào/ra của chính ca mình, then hệ thống từ chối.
- Given ca của tôi đang hiện Vắng (không có cả check-in lẫn check-out), when leader điền cả giờ vào và giờ ra, then ca chuyển Hoàn thành và giờ công tính đúng công thức.

### FR-6. Hủy ca

**Mô tả:** Member tự hủy ca của mình, không cần ai duyệt — bù lại có kỷ luật nhập liệu bắt buộc.

**Business rules:**
- BR-6.1: Chỉ hủy được ca **Sắp diễn ra** hoặc **Đang diễn ra** (ca Hoàn thành không hủy; ca đã hủy không hủy lại).
- BR-6.2: Bắt buộc: **lý do ≥ 10 ký tự** + **phân loại** (Ốm / Cá nhân / Đổi ca / Khác).
- BR-6.3: Hủy ca đang diễn ra phải xác nhận thêm cảnh báo.
- BR-6.4: Ca hủy vẫn nằm trong dữ liệu (gạch ngang trên lịch, đếm ở báo cáo mục "Đã hủy") — không xóa.
- BR-6.5: Member hủy ca của mình; leader hủy được ca của bất kỳ ai. Muốn đăng ký lại sau khi hủy: đăng ký bình thường (BR-3.2 bỏ qua ca đã hủy).

**Acceptance criteria:**
- Given ca sắp diễn ra của tôi, when tôi hủy với lý do 5 ký tự, then nút xác nhận bị khóa cho tới khi lý do đủ 10 ký tự và chọn phân loại.
- Given ca đã hủy, when xem tuần, then ca hiển thị gạch ngang kèm nhãn phân loại, không cộng vào giờ đăng ký.

### FR-7. Báo cáo

**Mô tả:** Hai góc nhìn thay cho `!shift report [day|week|month]` và bản chốt công tháng gửi PO.

**FR-7a — Tuần của tôi (member, thay report day/week):**
- Danh sách ca theo 7 ngày, hôm nay nổi bật; mỗi ca: khung giờ, mã ca, trạng thái (Sắp diễn ra / Đang diễn ra / Hoàn thành / Đã hủy / Vắng), giờ công khi đã xong, badge hệ số khi là ngày lễ.
- Footer 2 con số tuần: tổng giờ **đăng ký** và tổng giờ **thực tế** — thuần thông tin, không so mốc, không tô màu (PO dùng chính các số này để nhắc cam kết ngoài hệ thống).

**FR-7b — Báo cáo tháng (thay report month + chốt công cho PO):**
- Bộ lọc: thành viên (member thường chỉ xem được chính mình; leader chọn bất kỳ ai) + tháng (24 tháng gần nhất).
- Thẻ chỉ số: Số ca đăng ký · **Tổng giờ đăng ký** (số PO dùng để soi cam kết đăng ký của từng CS) · Hoàn thành · Vắng · **Check-in muộn** (số lần vào sau giờ bắt đầu — xem FR-9, không có ân hạn) · Đã hủy · **Tổng giờ công** · **Giờ OT** (các ca có hệ số > 1). Thẻ "Thu nhập ước tính" chỉ hiện khi mọi ca hoàn thành trong tháng đều có lương/giờ khai trên mẫu ca; member xem báo cáo **của chính mình** cũng thấy thẻ này (quyết định 12/08/2026).
- Bảng chi tiết từng ca: ngày, ca, khung giờ, trạng thái, giờ vào, giờ ra, giờ công, hệ số, cờ **Check-in muộn** (FR-9 — quá giờ bắt đầu là muộn, không ân hạn) và cờ cảnh báo khi check-out lệch quá 15 phút so cửa sổ ca.
- Quy tắc số liệu:
  - BR-7.1: Giờ công hiển thị theo **giờ, làm tròn 2 chữ số thập phân từng ca rồi mới cộng** (tránh lệch số khi đối soát từng dòng — bài học từ hệ cũ).
  - BR-7.2: Ca hủy không tính vào giờ; đếm riêng cột "Đã hủy".
  - BR-7.3: "Vắng" = ca đăng ký đã qua giờ mà không có check-in (đồng nhất với BR-4.8).
  - BR-7.4: Thu nhập = Σ (giờ công × lương/giờ × hệ số) trên các ca hoàn thành.
- Cuối trang có ghi chú cố định: *"Đối chiếu số liệu và gửi PO khi chốt tháng."*

**Acceptance criteria:**
- Given tháng 8 tôi có 20 ca hoàn thành (80,00h) + 1 ca vắng + 2 ca hủy, when tôi mở báo cáo tháng 8, then các thẻ hiện đúng 20 / 1 / 2 và 80,00h; bảng khớp từng dòng.
- Given tôi là member thường, when tôi mở báo cáo, then bộ chọn thành viên không cho chọn người khác.
- Given 2 ca ngày lễ hệ số 2.0 tổng 8h, then thẻ "Giờ OT" hiện 8,00h tách khỏi giờ thường.

### FR-8. Nhắc hạn đăng ký

**Mô tả:** Tự động hóa việc "báo lại quản lý tại group trước 8h30 thứ 2".

**Business rules:**
- BR-8.1: **Chủ nhật 15:00** hàng tuần, hệ thống nhắc qua **bot Mattermost** từng member **chưa có ca nào của tuần kế tiếp** — tin nhắn kèm link trang đăng ký và hạn chót.
- BR-8.2: Chỉ nhắc thành viên đang hoạt động (không nhắc tài khoản đã khóa/rời team).
- BR-8.3: Kênh nhắc là **bot Mattermost** (quyết định 12/08/2026), chạy bằng workflow của hệ thống (BR-9.5); bước **email dự phòng** thêm được ngay trong cùng workflow khi cần.

**Acceptance criteria:**
- Given đến 15:00 Chủ nhật bạn C chưa đăng ký ca tuần sau còn tôi đã đăng ký, then chỉ C nhận tin nhắc từ bot Mattermost.

### FR-9. Theo dõi check-in muộn & thông báo ca qua Mattermost

**Mô tả:** Giữ thói quen "nhìn group biết ai đang trực" của quy trình cũ nhưng do bot làm tự động: mọi check-in/check-out được bot Mattermost thông báo vào channel của team, và ca vào muộn bị gắn cờ để leader/PO nhìn thấy ngay ai check-in muộn.

**Business rules:**
- BR-9.1: **Không có ngưỡng ân hạn cho check-in**: đúng giờ nghĩa là bấm check-in **trước hoặc đúng giờ bắt đầu ca** (check-in sớm trong cửa sổ cho phép — BR-4.2). Bấm **quá giờ bắt đầu 1 phút trở lên** là gắn cờ **Check-in muộn** (+X phút tính từ giờ bắt đầu).
- BR-9.2: Khi member check-in / check-out, bot Mattermost post vào channel của team: ai, ca nào (mã ca + khung giờ), thời điểm bấm; nếu là check-in muộn, tin nhắn kèm nhãn **"⚠ muộn +X phút"**.
- BR-9.3: Báo cáo tháng (FR-7b) hiển thị **số lần check-in muộn** của từng member; bảng chi tiết cho leader/PO thấy từng ca muộn bao nhiêu phút — trả lời trực tiếp câu "ai check-in muộn".
- BR-9.4: Lỗi gửi Mattermost **không được chặn** thao tác check-in/out — thông báo là kênh phụ, dữ liệu trong hệ thống là nguồn chính.
- BR-9.5: **Toàn bộ việc gửi tin chạy bằng Workflow có sẵn của nền tảng** (quyết định 12/08/2026): tin check-in/out và tin nhắc Chủ nhật là 2 workflow do Leader/PO dựng/sửa ngay trong màn Workflows — tự chỉnh lời văn tin nhắn, webhook, channel, điều kiện gửi mà không cần dev/deploy. Chỉ Leader/PO có quyền sửa workflow; tắt workflow thì hệ thống vẫn chạy bình thường, chỉ không gửi tin. Mỗi lần gửi đều có log chạy (run) xem lại được.

**Acceptance criteria:**
- Given ca của tôi bắt đầu 14:00, when tôi check-in lúc 14:20, then ca gắn cờ Check-in muộn, channel Mattermost nhận tin "… check-in ca SAE-TT-C lúc 14:20 — ⚠ muộn +20 phút", và báo cáo tháng của tôi cộng 1 vào thẻ "Check-in muộn".
- Given tôi check-in 13:50 (sớm) hoặc đúng 14:00, then ca không gắn cờ muộn và tin Mattermost không có nhãn muộn.
- Given tôi check-in 14:02, then ca gắn cờ Check-in muộn (+2 phút) — không có ân hạn.
- Given Mattermost gặp sự cố, when tôi check-in, then thao tác vẫn thành công và giờ vào vẫn được ghi bình thường.

## 6. Ma trận quyền (tổng hợp)

| Hành động | Member | Leader / PO |
|---|:---:|:---:|
| Xem danh mục ca / ngày lễ | ✔ (ẩn lương) | ✔ |
| Tạo/sửa mẫu ca, ngày lễ | ✕ | ✔ |
| Cấu hình bot Mattermost (webhook, channel, bật/tắt) | ✕ | ✔ |
| Đăng ký ca cho mình | ✔ | ✔ |
| Đăng ký ca cho người khác | ✕ | ✔ |
| Check-in/out ca của mình | ✔ | ✔ |
| Check-in/out ca người khác | ✕ | ✔ |
| Sửa trực tiếp giờ vào/ra, giờ công, hệ số | ✕ | ✔ |
| Hủy ca của mình / của người khác | ✔ / ✕ | ✔ / ✔ |
| Xem báo cáo của mình / mọi người | ✔ / ✕ | ✔ / ✔ |
| Thấy lương/giờ & thu nhập ước tính của chính mình | ✔ | ✔ |
| Thấy lương/giờ & thu nhập của người khác | ✕ | ✔ |

## 7. Dữ liệu khởi tạo (seed)

- Bộ mẫu ca phỏng theo team TC, đổi prefix `SAE-`: 5 ca trong tuần (`SAE-TT-D/SS/TR/C/T`), 6 ca cuối tuần (`SAE-CT-D/SS/S/C/T/TM`), 8 ca OT 3h (`SAE-OT-0-3` … `SAE-OT-21-24`); mặc định check-in sớm 15', ân hạn 30'.
- 9 ngày lễ VN hệ số 2.0 (1/1, 30/4, 1/5, 2/9 lặp hàng năm + 5 ngày Tết âm của năm hiện hành).
- Team SAE **được kỳ vọng sửa lại toàn bộ** cho khớp quy trình của mình — seed chỉ là điểm xuất phát.

## 8. Khác biệt có chủ đích so với quy trình TC hiện tại

| Quy trình TC | Hệ thống mới | Lý do |
|---|---|---|
| `!shift checkin [mã]` trong group chat | Nút Check-in/out trên trang cá nhân; bot Mattermost tự post thông báo vào channel, kèm cờ check-in muộn (FR-9) | Bỏ lỗi cú pháp, gắn thẳng vào ca đã đăng ký; group vẫn nhìn thấy ai đang trực, ai vào muộn |
| Note tồn đọng vào Crisp | Handover note ngay khi check-out | Truy vết theo ca; team SAE không dùng Crisp |
| Báo leader trong group để bù công | Vẫn báo leader qua chat, nhưng leader sửa ngay trên hệ thống — giờ công tự tính lại theo công thức, có vết ai sửa lúc nào | Số liệu cuối cùng nằm trong hệ thống, khỏi đối soát lại chat |
| CTV tự cộng giờ note cho PO cuối tháng | Báo cáo tháng tự động | Bỏ sai số cộng tay |
| Điền Google Sheet trước Chủ nhật | Lưới đăng ký + bot Mattermost nhắc Chủ nhật 15:00 | Một nguồn dữ liệu duy nhất |
| Các cam kết (29h/tuần, 5 ca T2–T6, 1–3 ca cuối tuần, fill đủ slot cuối tuần) soát tay | Vẫn nằm ngoài hệ thống (quyết định PO): hệ thống cung cấp số liệu qua báo cáo, PO nhắc riêng từng CS | Nếu sau này muốn hệ thống cảnh báo, bổ sung được mà không đổi thiết kế |

## 9. Ngoài phạm vi v1 (backlog có chủ đích)

1. **Màn hình coverage của leader** (lưới thành viên × ngày × slot: slot nào trống/đủ người) — v1 leader xem qua danh sách/lọc ca.
2. Xuất **file chốt công (XLSX/CSV)** cho payroll — v1 đối soát trên màn hình báo cáo.
3. **Khôi phục ca đã hủy** (resurrect) — v1 đăng ký lại là đủ.
4. Đa team / đa phòng ban trong cùng workspace — v1 mặc định một team CS.
5. **Luồng đề nghị – duyệt trong hệ thống** (member tạo yêu cầu bù công/xin nghỉ, leader bấm duyệt, hệ thống tự áp hiệu lực) — **đã chốt bỏ ở v1 (11/08/2026)** để giữ luồng gọn: member báo leader qua chat, leader sửa/hủy trực tiếp. Bổ sung sau được nếu quy mô team tăng.

## 10. Open questions — cần PO/Leader SAE chốt trước khi build

1. **Bộ ca của team SAE**: dùng luôn khung giờ như TC hay khác? (ảnh hưởng seed, không ảnh hưởng thiết kế)
2. ~~Ngưỡng cam kết~~ — **Đã chốt (11/08/2026):** không đưa ngưỡng cam kết (29h/30h/5 ca/1–3 ca) vào hệ thống. PO tự nhìn báo cáo đăng ký ca và nhắc riêng từng CS; hệ thống chỉ hiển thị tổng số trung tính.
3. ~~Quy mô cuối tuần~~ — **Đã chốt (12/08/2026):** không cần rule cấp team cho slot cuối tuần; PO theo dõi độ phủ qua báo cáo / danh sách ca.
4. ~~Kênh nhắc~~ — **Đã chốt (12/08/2026):** nhắc hạn đăng ký và thông báo check-in/out qua **bot Mattermost** (FR-8, FR-9); email chỉ là dự phòng.
5. **Danh sách ai được gán vai trò Leader/PO** (vai trò quản lý duy nhất, đã gộp) để gán quyền ngày go-live?
6. **OT ngày thường 150%**: TC áp 150% cho OT ngày thường được duyệt — SAE có cơ chế duyệt OT ngày thường không, hay chỉ OT lễ? (v1 hỗ trợ bằng cách leader thêm "ngày đặc biệt" hệ số 1.5 cho ngày được duyệt, hoặc sửa hệ số từng ca)
7. ~~Riêng tư lương~~ — **Đã chốt (12/08/2026):** member được thấy lương/giờ và thu nhập ước tính **của chính mình**; lương/thu nhập của người khác chỉ Leader/PO thấy.

## 11. Tiêu chí nghiệm thu tổng thể (go-live)

1. Một CTV mới vào team tự hoàn thành trọn vòng đời không cần hướng dẫn miệng: đăng ký tuần → nhận nhắc nếu quên → check-in/out có note → nhờ leader bù công khi quên → xem báo cáo tháng của mình.
2. Leader bù công cho một ca (điền giờ vào/ra, hệ thống tự tính lại giờ công) trong ≤ 1 phút thao tác, và trả lời được câu "tháng này bạn X làm bao nhiêu giờ, bao nhiêu giờ OT, check-in muộn mấy lần" bằng một màn hình.
3. Số giờ công trên báo cáo khớp 100% với tính tay theo công thức BR-4.5 trên bộ dữ liệu thử (bao gồm ca qua đêm, ca bị trần, ca ngày lễ, ca leader bù công).
4. Member không có cách nào tự thay đổi giờ công của mình ngoài việc bấm check-in/check-out đúng luồng; chỉ leader sửa được.
