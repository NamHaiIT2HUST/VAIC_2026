# Kế hoạch kiểm thử & Mẫu báo lỗi

> Member 5 (BA2 – UX/UI & QA) phụ trách. Dùng file này để test và báo lỗi cho Tech Lead.

---

## 1. Cách làm việc

1. Tech Lead push code → báo trong nhóm.
2. Member 5 chạy lần lượt các test case ở mục 2, đánh dấu ✅ / ❌.
3. Gặp lỗi → tạo GitHub Issue theo mẫu ở mục 4, gắn nhãn mức độ ở mục 3.
4. Trước buổi demo: **bắt buộc** chạy lại toàn bộ test case của kịch bản demo (mục 5).

---

## 2. Danh sách test case

### A. Đặt lịch (Appointment Coordination)

| ID | Việc cần làm | Kết quả mong đợi | KQ |
|---|---|---|---|
| A1 | Chọn chuyên khoa + bác sĩ | Danh sách bác sĩ hiện đúng, có ảnh và chuyên khoa | ☐ |
| A2 | Xem danh sách khung giờ | Mỗi khung có màu 🟢/🟡/🔴 + số phút chờ dự kiến | ☐ |
| A3 | Chọn khung giờ AI gợi ý | Xác nhận thành công, sinh mã QR | ☐ |
| A4 | Chọn khung giờ đỏ (đông) | Vẫn cho đặt, có cảnh báo — **không được chặn** | ☐ |
| A5 | Đặt lại đúng bác sĩ cũ (tái khám) | Hệ thống giữ nguyên bác sĩ, không tự đổi | ☐ |
| A6 | Đặt trùng 2 lịch cùng giờ | Báo lỗi rõ ràng bằng tiếng Việt | ☐ |

### B. Tiếp đón & định tuyến (Patient Routing)

| ID | Việc cần làm | Kết quả mong đợi | KQ |
|---|---|---|---|
| B1 | Quét QR bệnh nhân đã đặt lịch | Hiện đúng tên, bác sĩ, khung giờ trong < 2 giây | ☐ |
| B2 | Bệnh nhân không đặt lịch, lấy số trực tiếp | Vẫn vào được luồng, được cấp số | ☐ |
| B3 | Bệnh nhân có BHYT | Được chỉ sang đúng quầy kế toán BHYT | ☐ |
| B4 | Bệnh nhân thuộc diện ưu tiên | Được đánh dấu "ưu tiên", xếp lên đầu hàng chờ | ☐ |
| B5 | Quét mã QR sai / hết hạn | Báo lỗi, không làm treo màn hình | ☐ |

### C. Dự báo thời gian chờ (Wait-time Estimation)

| ID | Việc cần làm | Kết quả mong đợi | KQ |
|---|---|---|---|
| C1 | Mở App khi đang chờ | Hiện "Bạn thứ N, dự kiến HH:MM" | ☐ |
| C2 | Một bệnh nhân phía trước khám xong | Số thứ tự và giờ dự kiến tự cập nhật | ☐ |
| C3 | Màn hình LED sảnh | Số đang gọi khớp với số trên App | ☐ |
| C4 | Hàng chờ rỗng | Hiện "Mời vào ngay", không hiện 0 phút lỗi | ☐ |

### D. Xếp thứ tự dịch vụ (Service Sequencing)

| ID | Việc cần làm | Kết quả mong đợi | KQ |
|---|---|---|---|
| D1 | Bác sĩ chỉ định XN máu + SA + XQ | Journey Plan sinh ra trong < 5 giây | ☐ |
| D2 | Kiểm tra thứ tự | Lấy máu đứng **trước** (thời gian trả KQ lâu nhất) | ☐ |
| D3 | Chỉ định có yêu cầu nhịn ăn | Xếp vào buổi sáng, trước các dịch vụ khác | ☐ |
| D4 | Chỉ có 1 chỉ định duy nhất | Vẫn sinh Journey Plan bình thường, không lỗi | ☐ |
| D5 | Chỉ định > 5 dịch vụ | Không bị treo, không sinh lộ trình vô lý | ☐ |
| D6 | Đối chiếu với `clinical_rules.json` | Không vi phạm ràng buộc cứng nào | ☐ |

### E. Điều chỉnh thời gian thực (Real-time Adjustment)

| ID | Việc cần làm | Kết quả mong đợi | KQ |
|---|---|---|---|
| E1 | KTV bấm "Máy siêu âm hỏng" | AI đề xuất phương án mới trong < 10 giây | ☐ |
| E2 | Điều dưỡng bấm "Áp dụng" | App bệnh nhân nhận thông báo đổi lịch | ☐ |
| E3 | Điều dưỡng bấm "Bỏ qua" | Lịch giữ nguyên, không đẩy thông báo | ☐ |
| E4 | Thêm ca cấp cứu | Mọi lịch khác giãn ra, ca cấp cứu lên đầu | ☐ |
| E5 | Máy hoạt động lại | Hàng chờ tự cân bằng lại | ☐ |

### F. Giao diện & trải nghiệm

| ID | Việc cần làm | Kết quả mong đợi | KQ |
|---|---|---|---|
| F1 | Mở App trên điện thoại (375px) | Không vỡ layout, không phải cuộn ngang | ☐ |
| F2 | Toàn bộ chữ | Tiếng Việt có dấu đầy đủ, không lỗi font | ☐ |
| F3 | Cỡ chữ trên App bệnh nhân | ≥ 16px (nhiều bệnh nhân cao tuổi) | ☐ |
| F4 | Màn hình LED | Đọc được từ khoảng cách 5m | ☐ |
| F5 | Mọi thông báo lỗi | Bằng tiếng Việt, dễ hiểu, không hiện stack trace | ☐ |
| F6 | Trạng thái đang tải | Có spinner / skeleton, không trắng màn hình | ☐ |

---

## 3. Mức độ nghiêm trọng

| Nhãn | Nghĩa | Xử lý |
|---|---|---|
| 🔴 **P0 – Blocker** | Hỏng kịch bản demo, app crash | Sửa ngay |
| 🟠 **P1 – Major** | Chức năng chính sai, có cách né tạm | Sửa trong ngày |
| 🟡 **P2 – Minor** | Sai giao diện, sai chữ, lệch nhẹ | Sửa nếu còn thời gian |
| ⚪ **P3 – Nice to have** | Gợi ý cải thiện | Ghi lại, để sau |

---

## 4. Mẫu báo lỗi (copy vào GitHub Issue)

```markdown
**Tiêu đề:** [P0/P1/P2/P3] Mô tả ngắn gọn lỗi

### Màn hình / Module
(Ví dụ: App bệnh nhân – Hành trình của tôi / Service Sequencing)

### Các bước tái hiện
1.
2.
3.

### Kết quả mong đợi
...

### Kết quả thực tế
...

### Ảnh chụp / Video
(kéo thả vào đây)

### Môi trường
- Trình duyệt / thiết bị:
- Nhánh Git + commit:
- Thời điểm:

### Mức độ
🔴 P0 / 🟠 P1 / 🟡 P2 / ⚪ P3

### Người phụ trách
@tech-lead
```

---

## 5. Checklist trước buổi demo (chạy lại 100%)

Kịch bản demo là **bệnh nhân cần XN máu + siêu âm + X-quang**:

- [ ] Đặt lịch → AI gợi ý khung giờ vắng → xác nhận, có QR
- [ ] Quét QR tại quầy tiếp đón → hiện đúng thông tin
- [ ] Bác sĩ ra 3 chỉ định → Journey Plan sinh ra, **lấy máu đứng đầu**
- [ ] App bệnh nhân hiện đủ 3 bước + giờ dự kiến từng bước
- [ ] Bấm "Máy siêu âm hỏng" → AI đề xuất lại → App nhận thông báo
- [ ] Dashboard quản lý hiện heatmap + thời gian chờ TB giảm so với baseline
- [ ] Không có lỗi đỏ nào trong Console trình duyệt
- [ ] Chạy thử toàn bộ trên đúng máy tính + đúng mạng sẽ dùng khi demo
- [ ] Có video backup phòng khi mạng hỏng tại chỗ
