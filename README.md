<div align="center">
  <img src="https://img.shields.io/badge/VAIC%202026-Vietnam%20AI%20Innovation%20Challenge-blue?style=for-the-badge&logo=google" alt="VAIC 2026" />
  <img src="https://img.shields.io/badge/Status-Checkpoint%202%20Submitted-success?style=for-the-badge" alt="Status" />
  <br/><br/>
  
  <h1>🏥 CareFlow AI - Hệ thống Điều phối & Tối ưu hóa Luồng Bệnh nhân</h1>
  <p>Giải pháp <b>Toàn diện & Tự động</b> giải quyết triệt để tình trạng ùn tắc cục bộ, giảm thiểu thời gian chờ đợi và nâng cao trải nghiệm khám chữa bệnh dựa trên AI và kiến trúc Event-Driven Real-time.</p>
</div>

---

## 🎯 Đặt vấn đề (Problem Statement)

Tại các bệnh viện đa khoa lớn, tình trạng thắt cổ chai trong quy trình khám chữa bệnh là thách thức dai dẳng:
- **Phân bổ không đồng đều:** Bệnh nhân dồn ứ cục bộ vào một khung giờ hoặc một phòng chức năng (X-Quang, Siêu âm), trong khi các thiết bị khác bị bỏ trống.
- **Trải nghiệm chờ đợi thụ động:** Bệnh nhân thiếu thông tin về thời gian chờ thực tế và lộ trình tiếp theo, dẫn đến tâm lý hoang mang và di chuyển sai luồng.
- **Dữ liệu phân mảnh:** Thiếu sự liên kết thời gian thực giữa các khâu (Tiếp nhận, Lâm sàng, Cận lâm sàng), khiến Ban Quản lý khó đưa ra quyết định điều phối tức thời khi có sự cố.

## 💡 Giải pháp CareFlow AI (Our Solution)

**CareFlow AI** là hệ thống điều phối thông minh (Smart Coordination System) liên kết toàn bộ dữ liệu từ khâu Đặt lịch, Tiếp nhận, Khám bệnh đến Cận lâm sàng, tạo ra một luồng vận hành xuyên suốt và tự động hoá.

### 🌟 Tính năng Cốt lõi (Core Innovations)

1. **AI Patient Routing & Sequencing (OR-Tools CP Solver):** Khi bác sĩ chỉ định các dịch vụ cận lâm sàng, hệ thống AI tự động giải quyết bài toán Ràng buộc (Constraint Programming) để sắp xếp **thứ tự thực hiện tối ưu nhất**. Thuật toán tính toán dựa trên thời gian chờ hiện tại của từng phòng, yêu cầu chuyên môn (nhịn ăn, lấy máu trước) để giảm tối đa thời gian chờ và di chuyển lòng vòng.
2. **Dynamic Real-time Adjustment:** Tự động điều phối lại toàn bộ luồng bệnh nhân khi có sự cố bất ngờ (Ví dụ: Máy X-Quang hỏng, có ca cấp cứu chen ngang). Sự thay đổi này được cập nhật ngay lập tức đến mọi thiết bị liên quan.
3. **Wait-time Estimation & Tracking:** Tính toán và hiển thị thời gian chờ dự kiến liên tục theo thời gian thực (Real-time). Bệnh nhân được chỉ dẫn trực tiếp qua App cá nhân thông qua kết nối **WebSocket**.
4. **Smart Nurse/Admin Dashboard:** Bảng điều khiển trung tâm cung cấp bức tranh toàn cảnh về tải trọng bệnh viện (Department Load), theo dõi KPI thời gian chờ và hỗ trợ Quản lý Sự cố Trực quan (Visual Incident Management).

---

## 🏗️ Kiến trúc Hệ thống (Architecture & Tech Stack)

Hệ thống được thiết kế theo kiến trúc Microservices & Event-driven, đảm bảo tính nhất quán dữ liệu và khả năng mở rộng cho các Bệnh viện quy mô lớn.

![Architecture Flow](https://img.shields.io/badge/Architecture-Event--Driven-blueviolet) ![Status](https://img.shields.io/badge/Ready_for-Scale-success)

- **Backend (Go / Fiber):** Đảm nhiệm vai trò Orchestrator, xử lý REST API hiệu năng cao và duy trì hàng ngàn kết nối WebSocket đồng thời.
- **AI Engine (Python / FastAPI):** 
  - Tích hợp **Google OR-Tools** cho lõi thuật toán tối ưu hóa lịch trình và phân luồng.
  - Tích hợp LLM Chatbot hỗ trợ giải đáp quy trình y tế.
- **Frontend (React / Vite / TailwindCSS):** Giao diện chia thành 3 phân hệ độc lập: `Admin/Nurse Dashboard`, `Doctor Dashboard`, và `Patient App`.
- **Cơ sở dữ liệu:** PostgreSQL lưu trữ hồ sơ, lịch hẹn và trạng thái luồng (Workflow State).

---

## ⚙️ Hướng dẫn Khởi chạy (Local Setup)

### 1. Database
Yêu cầu PostgreSQL. Khởi tạo database `careflow` và cập nhật chuỗi kết nối trong `backend/internal/config/db.go`.

### 2. AI Engine (Python)
```bash
cd ai_engine
pip install -r requirements.txt
python server.py
# Server chạy tại http://localhost:8000
```

### 3. Backend Orchestrator (Go)
```bash
cd backend
go mod tidy
go run cmd/server/main.go
# Server chạy tại http://localhost:8080 (REST + WebSocket)
```

### 4. Frontend Application (React)
```bash
cd frontend
npm install
npm run dev
# Mở trình duyệt tại http://localhost:5173
```

---

## 🏆 Đội ngũ Phát triển
Sản phẩm được nghiên cứu và phát triển để tham gia **Vietnam AI Innovation Challenge (VAIC) 2026**. 
Chúng tôi tin rằng **CareFlow AI** sẽ định hình lại tiêu chuẩn vận hành y tế, chuyển dịch từ mô hình "Bệnh nhân chờ hệ thống" sang "Hệ thống chủ động phục vụ Bệnh nhân".
