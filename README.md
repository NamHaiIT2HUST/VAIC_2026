<div align="center">
  <img src="https://img.shields.io/badge/VAIC%202026-Vietnam%20AI%20Innovation%20Challenge-blue?style=for-the-badge&logo=google" alt="VAIC 2026" />
  <img src="https://img.shields.io/badge/Status-Checkpoint%202%20Submitted-success?style=for-the-badge" alt="Status" />
  
  <br/>
  <br/>
  
  <h1>🏥 CareFlow AI - Hệ thống Điều phối & Tối ưu hóa Luồng Bệnh nhân</h1>
  <p>Giải pháp <b>Toàn diện & Tự động</b> giúp bệnh viện giải quyết triệt để vấn đề ùn tắc cục bộ, giảm thiểu thời gian chờ đợi và nâng cao trải nghiệm khám chữa bệnh thông qua sức mạnh của AI và kiến trúc Event-Driven Real-time.</p>
</div>

---

## 🎯 Vấn đề & Bài toán (The Pain)

Tại các bệnh viện đa khoa lớn, tình trạng **"thắt cổ chai"** thường xuyên xảy ra:
- ⏳ Bệnh nhân dồn ứ cục bộ vào một khung giờ, trong khi các khung giờ khác bị bỏ trống.
- 🔄 Bệnh nhân đi lạc, xếp nhầm hàng, phải quay lại nhiều lần do thiếu chỉ dẫn rõ ràng.
- 🤷 Cả bệnh nhân lẫn nhân viên y tế đều mù mờ về thời gian chờ thực tế ở từng phòng ban (Khám lâm sàng, Xét nghiệm, Siêu âm, X-Quang).
- 🧩 Dữ liệu lịch hẹn, tiếp nhận, cận lâm sàng bị phân mảnh, không có một cái nhìn toàn cảnh tập trung.

## 💡 Giải pháp CareFlow AI (The Cure)

**CareFlow AI** là một hệ thống phối hợp thông minh liên kết toàn bộ dữ liệu từ khâu Đặt lịch, Kiosk Tiếp nhận (Check-in), Phòng khám (Clinic), Cận lâm sàng (Lab/Imaging) cho đến Bảng điều khiển quản lý trung tâm.

### 🌟 3 Tính năng Cốt lõi (Core Innovations)

1. **AI Appointment Coordination & Smart Kiosk**: Thay vì chỉ cấp số thứ tự tuyến tính, AI Engine tự động phân tích độ ưu tiên (Khám thường / Cấp cứu VIP) và tải trọng hiện tại của bệnh viện để chỉ định khung giờ phù hợp ngay tại cửa vào (Kiosk), giúp **san phẳng đỉnh tải (load balancing)**.
2. **AI Patient Routing (OR-Tools CP Solver)**: Khi bác sĩ kê đơn Cận lâm sàng, hệ thống AI tự động giải quyết bài toán Ràng buộc (Constraint Programming) để sắp xếp **thứ tự đi các phòng tối ưu nhất** cho bệnh nhân, tránh đi lại lòng vòng và giảm độ trễ.
3. **Real-time Wait-time Estimation & Tracking**: Dựa trên số lượng bệnh nhân trong hàng đợi và thời gian xử lý trung bình của từng khoa, hệ thống tính toán và liên tục cập nhật lộ trình trực tiếp lên Ứng dụng điện thoại của Bệnh nhân qua **WebSocket**. 
4. **Trợ lý ảo RAG Chatbot**: Hỗ trợ giải đáp thắc mắc của bệnh nhân (VD: "Phòng X-Quang ở đâu?", "Có cần nhịn ăn không?") ngay lập tức.

---

## 🚀 Trải nghiệm Demo Trực tiếp (Dành cho Ban Giám Khảo)

Chúng tôi thiết kế riêng một **màn hình chia 3 cột (Live Demo Hub)** để Ban giám khảo có thể nhìn thấy sự đồng bộ thời gian thực của kiến trúc Event-Driven mà không cần dùng đến 3 thiết bị khác nhau.

👉 **[Bấm vào đây để vào Trang Demo Hub Trực tiếp](https://careflow-ai.vercel.app/demo)** *(Lưu ý: Thay domain thực tế của bạn)*

### 🎬 Kịch bản Test 1 phút:
1. Mở trang **[Kiosk Tiếp nhận](https://careflow-ai.vercel.app/kiosk)**.
2. Khai báo 1 bệnh nhân và đánh dấu mức độ "Khám thường" hoặc "Cấp cứu VIP". 
3. Chuyển sang trang **[Demo Hub](https://careflow-ai.vercel.app/demo)**. Bạn sẽ thấy Bệnh nhân vừa tạo nhảy ngay vào hàng chờ của Y tá (Cột 1) với huy hiệu tương ứng.
4. Ở Cột 2 (Bác sĩ), bấm **"Bắt đầu khám"** và **"Kê đơn Cận lâm sàng"** cho bệnh nhân đó.
5. Quan sát Cột 3 (App Bệnh nhân): Luồng đi (Siêu âm, X-Quang...) sẽ ngay lập tức được AI vẽ ra và thông báo thời gian chờ cụ thể!
6. Bấm vào icon Chatbot ở góc dưới để thử đặt câu hỏi hướng dẫn.

---

## 🏗️ Kiến trúc Công nghệ (Tech Stack)

Hệ thống được thiết kế theo kiến trúc Microservices & Event-driven, đảm bảo khả năng mở rộng cực cao cho các Bệnh viện quy mô lớn.

![Architecture Flow](https://img.shields.io/badge/Architecture-Event--Driven-blueviolet) ![Status](https://img.shields.io/badge/Ready_for-Scale-success)

* **Orchestrator Backend (Go / Fiber):** Đóng vai trò là bộ não điều hướng luồng dữ liệu, xử lý REST API siêu tốc và duy trì kết nối WebSocket bền vững với hàng ngàn bệnh nhân cùng lúc.
* **AI Engine (Python / FastAPI):** 
  * Sử dụng thư viện **Google OR-Tools** cho bài toán lập lịch ràng buộc Cận lâm sàng.
  * Tích hợp **RAG Pipeline** để vận hành trợ lý ảo Chatbot.
* **Frontend (React / Vite / TailwindCSS):** Mang đến giao diện UI/UX trực quan, hiện đại. Được chia thành các Phân hệ riêng biệt (Nurse Dashboard, Doctor Dashboard, Patient App, Kiosk).
* **Database (PostgreSQL):** Lưu trữ toàn vẹn dữ liệu về Hồ sơ, Lịch hẹn và Nhật ký Di chuyển (Workflow State).
* **Deployment (Docker / Vercel / Render):** Đóng gói Container hoàn chỉnh, CI/CD tự động lên Cloud.

---

## ⚙️ Hướng dẫn Khởi chạy Local (Local Setup)

Nếu bạn muốn chạy trực tiếp mã nguồn trên máy tính cá nhân:

### 1. Database (Postgres)
Cài đặt PostgreSQL và tạo cơ sở dữ liệu tên `careflow`. Cập nhật chuỗi kết nối trong thư mục `backend/internal/config/db.go`.

### 2. Khởi động AI Engine (Python)
```bash
cd ai_engine
pip install -r requirements.txt
python server.py
# Server AI chạy tại http://localhost:8000
```

### 3. Khởi động Backend Orchestrator (Go)
```bash
cd backend
go mod tidy
go run cmd/server/main.go
# Server Go chạy tại http://localhost:8080 (REST + WebSocket)
```

### 4. Khởi động Frontend (React)
```bash
cd frontend
npm install
npm run dev
# Mở trình duyệt tại http://localhost:5173
```

---

## 🏆 Đội ngũ Phát triển
Sản phẩm được phát triển nhằm mục đích chinh phục cuộc thi **Vietnam AI Innovation Challenge (VAIC) 2026**. 
Chúng tôi tin rằng **CareFlow AI** không chỉ là một bài toán Hackathon, mà là bước tiến thực sự để định hình lại Trải nghiệm Chăm sóc Y tế tại Việt Nam.

**"Đừng bắt người bệnh phải chờ đợi hệ thống. Hãy để hệ thống phục vụ người bệnh."**
