# AI Patient Journey Orchestrator

> Nền tảng AI điều phối toàn bộ hành trình khám bệnh ngoại trú — giảm thời gian chờ, giảm ùn tắc, tăng công suất thiết bị, và để bệnh nhân tự theo dõi được lượt của mình.

---

## 1. Vấn đề

Trong một buổi khám ngoại trú, bệnh nhân đi qua rất nhiều chặng: đặt lịch → tiếp đón → thu phí → đo sinh hiệu → khám lâm sàng → xét nghiệm / chẩn đoán hình ảnh → quay lại bác sĩ → thanh toán → lĩnh thuốc.

Các chặng này do những bộ phận khác nhau vận hành và **dữ liệu không nối với nhau**, dẫn tới:

- Bệnh nhân dồn vào cùng khung giờ, trong khi khung giờ khác trống.
- Đi nhầm khu, xếp nhầm hàng, phải quay lại nhiều lần.
- Chờ mà không biết còn bao lâu.
- Tự đi làm cận lâm sàng theo thứ tự ngẫu nhiên → chờ chồng chờ.
- Máy hỏng / cấp cứu chen ngang thì cả lịch trình vỡ, không ai báo bệnh nhân.

## 2. Giải pháp

Một **AI Coordination Engine** đọc dữ liệu từ lịch hẹn, tiếp đón, phòng khám, xét nghiệm, chẩn đoán hình ảnh và trạng thái thời gian thực của từng khu vực, rồi sinh ra **Journey Plan** cho mỗi bệnh nhân.

**Nguyên tắc cốt lõi:** AI **không** đổi bác sĩ của bệnh nhân. Bác sĩ, tính liên tục điều trị và mức ưu tiên là **ràng buộc cứng**. AI chỉ tối ưu những gì thực sự thay đổi được: thứ tự dịch vụ, khung giờ, đường đi, thời gian chờ.

## 3. Năm module chính

| Module | Làm gì |
|---|---|
| **Appointment Coordination** | Phân bổ bệnh nhân theo bác sĩ / chuyên khoa / khung giờ, tránh dồn cục |
| **Patient Routing** | Dựa trên triệu chứng, mức ưu tiên, đối tượng (BHYT/dịch vụ), dịch vụ cần làm → chỉ đúng khu vực ngay từ đầu |
| **Wait-time Estimation** | Dự báo giờ được phục vụ từ số người chờ, thời gian khám TB, trạng thái thiết bị → hiển thị qua App / màn hình LED / SMS |
| **Service Sequencing Optimizer** | Tự sắp thứ tự XN, siêu âm, XQ, CT, MRI theo hàng chờ, yêu cầu nhịn ăn, thời gian trả kết quả, trạng thái máy |
| **Real-time Adjustment** | Tính lại toàn bộ khi phòng khám quá tải, máy hỏng, bác sĩ đổi lịch, hoặc có ca cấp cứu |

### Ví dụ

Bệnh nhân cần **XN máu + siêu âm + X-quang** rồi quay lại bác sĩ.
Thay vì tự xếp hàng từng chỗ, hệ thống sắp: **lấy máu trước → chụp X-quang trong lúc máu đang chạy → siêu âm → quay lại bác sĩ khi đã đủ kết quả.** Tiết kiệm khoảng 60–70 phút.

## 4. Kiến trúc

```
HIS / LIS / RIS / PACS
        │  (event stream + REST API)
        ▼
┌─────────────────────────────────────────┐
│        AI COORDINATION ENGINE           │
│  • Patient Routing Engine               │
│  • Waiting-Time Prediction (XGBoost)    │
│  • Service Sequencing Optimizer         │
│  • Dynamic Coordination Engine          │
│  • LLM Hospital Assistant (RAG)         │
└─────────────────────────────────────────┘
        │
        ├── App Bệnh nhân (theo dõi hành trình)
        ├── Dashboard nhân viên (tiếp đón / BS / ĐD / KTV / QL)
        └── Màn hình LED sảnh chờ + SMS
```

## 5. Cấu trúc thư mục

```
/frontend/            Dashboard + App bệnh nhân
/backend/app/api/     REST API
/backend/app/models/  Model dữ liệu
/ai_engine/           Sequencing Optimizer + Waiting-Time Prediction
/database/            Thiết kế bảng, migration
/data/
   clinical_rules.json      Ràng buộc cứng do chuyên gia y khoa chốt
   rag_documents/           Quy trình bệnh viện dùng cho RAG
   mock_patients.csv        Dữ liệu bệnh viện giả lập
/docs/
   README.md                File này
   wireframes/quy-trinh.md  Sơ đồ quy trình AS-IS / TO-BE / screen flow
   qa/test-plan.md          Test case + mẫu báo lỗi
   presentation/            Slide + kịch bản demo
```

## 6. Công nghệ

| Lớp | Công nghệ |
|---|---|
| Frontend | React + TailwindCSS |
| Backend | FastAPI (Python) |
| Database | PostgreSQL |
| AI – dự báo chờ | XGBoost / LightGBM |
| AI – xếp thứ tự | Thuật toán tối ưu có ràng buộc (heuristic + greedy) |
| AI – trợ lý | LLM + RAG (FPT AI Cloud) |
| Realtime | WebSocket |

## 7. Chạy thử (local)

```bash
# 1. Backend
cd backend
pip install -r requirements.txt
cp .env.example .env          # điền thông tin DB và API key
uvicorn app.main:app --reload --port 8000

# 2. Sinh dữ liệu giả lập
python data/generate_mock.py

# 3. Frontend
cd ../frontend
npm install
npm run dev                   # mở http://localhost:5173
```

| Địa chỉ | Nội dung |
|---|---|
| `http://localhost:5173` | App bệnh nhân + Dashboard |
| `http://localhost:8000/docs` | Tài liệu API tự sinh (Swagger) |

## 8. Phân công

| Thành viên | Vai trò | Nhánh Git |
|---|---|---|
| Tech Lead | Fullstack Dev & AI Integrator | `feat/frontend-core`, `feat/fpt-ai` |
| Member 2 | Y sinh (Domain Expert) | `data/clinical-rules` |
| Member 3 | Y sinh + AI Engineer | `feat/ai-optimizer` |
| Member 4 | BA1 – Product Owner / Pitching | `docs/pitch-deck` |
| Member 5 | BA2 – UX/UI & QA | `docs/ui-ux-readme` |
| Member 6 | MIS – Database / Data Engineer | `feat/database-mock` |

## 9. Đo hiệu quả

| Mục tiêu | Chỉ số |
|---|---|
| Giảm thời gian chờ | Thời gian chờ trung bình / bệnh nhân (phút) |
| Giảm ùn tắc | Số bệnh nhân chờ đồng thời theo khu vực |
| Tăng công suất | % thời gian phòng khám / thiết bị được sử dụng |
| Bệnh nhân chủ động | % bệnh nhân mở App theo dõi hành trình |

## 10. Dữ liệu & quyền riêng tư

- Prototype chạy **hoàn toàn trên dữ liệu giả lập** (`/data/mock_patients.csv`), không dùng dữ liệu bệnh nhân thật.
- Dữ liệu được ẩn danh; phân quyền theo vai trò (RBAC).
- Triển khai thật sẽ tuân thủ quy định của Việt Nam về hồ sơ bệnh án điện tử và bảo vệ dữ liệu cá nhân.

## 11. Tài liệu tham chiếu

- Quyết định 1313/QĐ-BYT — Hướng dẫn quy trình khám bệnh tại Khoa Khám bệnh.
- QT.25.01 — Quy trình đón tiếp bệnh nhân và khám chữa bệnh ngoại trú tại Khu Tự nguyện 1, Cơ sở 1, Bệnh viện Tim Hà Nội (ban hành 05/12/2024).
