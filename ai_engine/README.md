# AI Patient Journey Orchestrator (MVP)

Hệ thống **Hỗ trợ Quyết định (Decision Support Platform)** định tuyến và xếp lịch khám bệnh nhân thông minh, tích hợp Constraint Programming và AI. Mục tiêu của hệ thống là chống ùn tắc cục bộ, giảm thời gian chờ đợi (waiting time) và tối ưu hóa luồng di chuyển tại bệnh viện (Check-in → Scheduling → Routing).

## 1. Chức năng Cốt lõi (MVP Milestone 0)

Bản MVP hiện tại (Tập trung vào "Happy Path") cung cấp các năng lực lõi (Core Engine) trong file `ai_engine.py`:
- **Dự báo thời gian (Prediction Layer):** Tính toán thời gian khám dự kiến cộng thêm khoảng thời gian dự phòng (slack time) thông qua `DurationPredictor`.
- **Lập lịch tối ưu (Global Optimization):** Sử dụng `Google OR-Tools CP-SAT` để sinh lịch trình khám chi tiết (tuân thủ chặt chẽ thứ tự y khoa: Xét nghiệm $\rightarrow$ X-Quang $\rightarrow$ Khám).
- **Tự động điều chỉnh (Dynamic Coordination - Tier A):** Tự động phát hiện và chuyển hướng (re-assign) bệnh nhân sang phòng tương đương đang trống nếu phát hiện lịch hẹn bị trễ quá ngưỡng cho phép (threshold).

## 2. Hướng dẫn Sử dụng & Cài đặt

**Yêu cầu hệ thống:** Python 3.10+

**Cài đặt môi trường:**
```bash
# Cài đặt các thư viện phụ thuộc
pip install -r requirements.txt
```

**Chạy Test Tự động (TDD):**
Hệ thống được phát triển với độ bao phủ test (Test Coverage) là 100% cho Milestone 0. Để kiểm tra tính đúng đắn của logic:
```bash
pytest test_ai_engine.py -v
```

## 3. Output Dự kiến

Khi gọi hàm sinh lịch trình `predict_and_schedule` tại Tầng AI:
```python
import ai_engine
plan = ai_engine.predict_and_schedule({
    "patient_id": "BN-001",
    "required_services": ["lab", "xray", "consultation"]
})
```
**Output (JSON Plan):**
Hệ thống sẽ trả về chuỗi công việc được xếp theo đúng logic thứ tự thời gian (`time_start` và `time_end` không bị chồng chéo):
```json
{
  "patient_id": "BN-001",
  "tasks": [
    {"task_id": "lab-001", "station": "lab", "time_start": 0, "time_end": 11},
    {"task_id": "xray-001", "station": "xray", "time_start": 11, "time_end": 22},
    {"task_id": "consultation-001", "station": "consultation", "time_start": 22, "time_end": 44}
  ]
}
```

## 4. Interfaces cho các bước tiếp theo (Next Steps)

Codebase đã được thiết kế sẵn các Entry Points (Giao diện API) để chuẩn bị cho việc tích hợp UI (Frontend) và mở rộng Simulator (SimPy):

- **Giao diện Sinh Lịch:** 
  `predict_and_schedule(patient_data: dict) -> dict`
  *Backend gọi hàm này mỗi khi bệnh nhân check-in tại quầy để lấy lịch trình.*

- **Giao diện Cập nhật Trạng thái (Webhook / Trigger):** 
  `update_status(patient_id: str, event: dict) -> dict`
  *Frontend/IoT gọi hàm này khi bệnh nhân click "Bắt đầu khám" hoặc "Khám xong" trên app. Engine sẽ tự động kích hoạt Tier A (Đổi phòng) nếu phát hiện trễ giờ.*

- **Giao diện Dashboard (UI Data):** 
  `get_dashboard_state() -> dict`
  *Giao diện để màn hình Dashboard gọi polling (hoặc WebSockets) để vẽ Real-time Heatmap, theo dõi mật độ các phòng khám và trạng thái hàng đợi.*
