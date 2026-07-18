# 🏥 Tổng Quan Dự Án CareFlow AI
*(Tài liệu phục vụ rà soát dự án & Xây dựng Slide Thuyết trình - Pitch Deck)*

---

## Slide 1: Tên Dự án & Slogan
- **Tên dự án:** CareFlow AI - Hệ thống Điều phối & Tối ưu hóa Luồng Bệnh nhân.
- **Slogan:** "Đừng bắt người bệnh chờ hệ thống. Hãy để hệ thống phục vụ người bệnh."
- **Mục tiêu:** Giải quyết triệt để tình trạng ùn tắc cục bộ, giảm thiểu thời gian chờ đợi và nâng cao trải nghiệm khám chữa bệnh bằng sức mạnh của AI và kiến trúc Event-Driven.

## Slide 2: Vấn đề hiện tại (The Problem)
Các bệnh viện đa khoa tuyến đầu đang đối mặt với các "nút thắt cổ chai" nghiêm trọng:
1. **Ùn tắc cục bộ:** Bệnh nhân dồn ứ tại một khu vực (VD: Siêu âm) trong khi các thiết bị khác (VD: X-Quang) bị bỏ trống.
2. **Thiếu thông tin:** Bệnh nhân không biết chính xác thời gian chờ, đi lại lòng vòng, sai thứ tự các bước xét nghiệm.
3. **Phản ứng chậm với sự cố:** Khi một thiết bị hỏng hoặc có ca cấp cứu (VIP) chèn ngang, điều dưỡng mất rất nhiều thời gian để sắp xếp lại thủ công, gây hiệu ứng dây chuyền.
4. **Hệ thống phân mảnh:** Lịch hẹn, phòng khám và cận lâm sàng hoạt động rời rạc, không có cái nhìn tổng quan theo thời gian thực.

## Slide 3: Giải pháp CareFlow AI (The Solution)
CareFlow AI liên kết toàn bộ dữ liệu bệnh viện thành một mạng lưới đồng bộ, áp dụng AI để tự động hóa khâu điều phối:
- **Tối ưu hóa đa biến:** Sắp xếp lịch trình xét nghiệm/cận lâm sàng dựa trên số người đang chờ, thời gian xử lý và các ràng buộc y khoa (VD: Lấy máu trước khi chụp X-Quang).
- **Cập nhật Thời gian thực (Real-time):** Tính toán và thông báo thời gian chờ dự kiến trực tiếp đến điện thoại bệnh nhân qua WebSocket.
- **Điều phối Động (Dynamic Re-routing):** Tự động bẻ luồng bệnh nhân sang các khu vực trống khi phát hiện ùn tắc cục bộ hoặc có sự cố thiết bị.

## Slide 4: Kiến trúc Công nghệ (Architecture)
Kiến trúc Event-Driven, Microservices mạnh mẽ, sẵn sàng mở rộng (Scalable):
- **Core Orchestrator (Golang):** Đảm nhiệm xử lý hàng triệu sự kiện (events) và đẩy dữ liệu tức thời (WebSocket) với hiệu năng cực cao, độ trễ thấp.
- **AI Engine (Python/FastAPI):** Lõi xử lý toán học sử dụng thuật toán Constraint Programming (Google OR-Tools) để lập lịch tối ưu (Sequencing & Routing). Tích hợp RAG Chatbot hỗ trợ thông tin y tế.
- **Frontend (React/Vite):** Giao diện chia thành 3 phân hệ chuyên biệt: Admin/Nurse, Doctor, và Patient App. Đảm bảo UI/UX mượt mà, phản hồi tức thì.

## Slide 5: Phân hệ Điều phối (Nurse/Admin Dashboard)
*Trung tâm chỉ huy của bệnh viện.*
- **KPI Real-time:** Theo dõi thời gian chờ trung bình, hiệu suất thiết bị và số ca đã được AI tối ưu.
- **Tải trọng Phòng khám:** Giám sát trực quan số lượng bệnh nhân tại từng phòng ban (X-Quang, Siêu âm, Sinh hóa).
- **Quản lý Sự cố (Visual Incident Management):** Chỉ với 1 click Tắt/Mở thiết bị (giả lập sự cố), AI tự động cân bằng tải và tính toán lại luồng cho toàn bộ bệnh nhân đang đợi.

## Slide 6: Phân hệ Bác Sĩ (Doctor Dashboard)
*Tập trung vào chuyên môn, tối giản thao tác.*
- **Quản lý Hàng đợi:** Hiển thị danh sách bệnh nhân và độ ưu tiên.
- **Kê đơn Nhanh:** Tích hợp thao tác chỉ định Cận lâm sàng trực tiếp.
- **Hồ sơ Bệnh án Điện tử:** Tự động lưu trữ lời dặn, lịch sử khám bệnh ngay sau khi bấm "Kết luận", đồng bộ tức thời với ứng dụng của người bệnh.

## Slide 7: Ứng dụng Bệnh nhân (Patient App)
*Trợ lý cá nhân trong suốt hành trình khám.*
- **Sơ đồ Di chuyển:** Hiển thị vị trí hiện tại và điểm đến tiếp theo.
- **Ước tính Thời gian (ETA):** Đồng hồ đếm ngược thời gian chờ dựa trên dữ liệu thực tế.
- **Thông báo Chủ động:** Rung/Flash màn hình khi đến lượt hoặc khi có tin nhắn dặn dò từ bác sĩ.
- **AI Chatbot:** Trợ lý ảo giải đáp nhanh các thắc mắc (VD: "Tôi cần nhịn ăn trước khi siêu âm không?").

## Slide 8: Giá trị Mang lại (Impact & Judging Criteria)
1. **Với Bệnh nhân:** Giảm trung bình 30%-45% thời gian chờ đợi lãng phí; Xóa bỏ sự hoang mang, mệt mỏi.
2. **Với Bệnh viện:** Tối đa hóa công suất sử dụng thiết bị (Equipment Utilization); Chấm dứt cảnh chen lấn lộn xộn trước cửa phòng khám.
3. **Mức độ Sẵn sàng (Readiness):** Kiến trúc hệ thống hoàn thiện từ Backend, AI đến Frontend, minh chứng rõ ràng qua Live Demo thời gian thực.
