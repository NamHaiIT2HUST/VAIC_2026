# AI PATIENT JOURNEY ORCHESTRATOR — TECHNICAL WORKFLOW

> **Version:** 2.0 (MVP-Simplified) · **Date:** 2026-07-17
> **Target:** VAIC 2026 Competition — AI-First Prototype
> **Role scope:** AI Engineer / AI Optimizer / Software Engineer
>
> ⚠️ **MVP Philosophy:** Document này phân biệt rõ giữa **[MVP CODE]** (những gì thực sự code) và **[PROPOSAL ONLY]** (những gì chỉ mô tả trong slide để lấy điểm học thuật). Mọi quyết định thiết kế đều ưu tiên **"chạy được end-to-end" hơn "tối ưu trên giấy"**.

---

## MỤC LỤC

1. [Tổng quan & Triết lý Thiết kế](#1-tổng-quan--triết-lý-thiết-kế)
2. [Quy trình Khám Bệnh Thực tế & Mapping sang AI System](#2-quy-trình-khám-bệnh-thực-tế--mapping-sang-ai-system)
3. [Kiến trúc 4 Tầng Chi Tiết](#3-kiến-trúc-4-tầng-chi-tiết)
4. [Workflow Kỹ thuật End-to-End](#4-workflow-kỹ-thuật-end-to-end)
5. [Giao ước Giao tiếp giữa các Tầng (Interface Contracts)](#5-giao-ước-giao-tiếp-giữa-các-tầng-interface-contracts)
6. [Mô hình Toán học & Thuật toán Chi Tiết](#6-mô-hình-toán-học--thuật-toán-chi-tiết)
7. [Hệ thống Đánh giá (Evaluation Engine)](#7-hệ-thống-đánh-giá-evaluation-engine)
8. [Lộ trình Hiện thực hóa MVP](#8-lộ-trình-hiện-thực-hóa-mvp)

---

## 1. Tổng quan & Triết lý Thiết kế

### 1.1 Định vị Giải pháp

**AI Patient Journey Orchestrator** là một **Hệ thống Hỗ trợ Quyết định (Decision Support Platform) hướng hành trình**, hoạt động theo cơ chế vòng lặp khép kín (closed-loop).

- **KHÔNG** can thiệp vào quyết định lâm sàng của bác sĩ.
- **KHÔNG** thay thế hệ thống quản lý bệnh viện (HMS/HIS) hiện tại.
- **CÓ** hoạt động như một lớp điều phối thông minh phía trên (Orchestration Layer), tiếp nhận dữ liệu từ HIS/LIS/RIS để liên tục tối ưu hóa luồng di chuyển bệnh nhân.

### 1.2 Nguyên tắc Cốt lõi

| Nguyên tắc | Giải thích |
|-------------|-----------|
| **Physician Continuity is Sacred** | Quyền lựa chọn bác sĩ quen của bệnh nhân tái khám là ràng buộc cứng, không phải biến tối ưu |
| **Optimize the Journey, Not the Clinician** | Tối ưu mọi thứ *xung quanh* buổi khám: thứ tự xét nghiệm, thời gian chờ, đường đi |
| **AI Augments, Not Replaces** | Hệ thống gợi ý, con người quyết định cuối cùng |
| **Stability Over Optimality** | Lịch trình ổn định 90% tốt hơn lịch trình tối ưu nhưng thay đổi liên tục |

### 1.3 Cổng Check-in: Hai Luồng Nghiệp Vụ

```
                    Bệnh nhân đến viện
                          │
                ┌─────────┴─────────┐
                ▼                   ▼
        ┌──────────────┐    ┌──────────────┐
        │  KHÁM MỚI    │    │  TÁI KHÁM    │
        └──────┬───────┘    └──────┬───────┘
               │                   │
               ▼                   ▼
      Symptom Triage AI     Ưu tiên BS quen
      (sàng lọc triệu      (hard constraint)
       chứng → gợi ý              │
       chuyên khoa +               │
       BS có wait time      Nếu wait > ngưỡng
       thấp nhất)           ──────────────────►  Thương lượng động:
               │                                 Gợi ý BS cùng trình độ
               │                                 có lịch trống hơn
               ▼                                        │
        ┌──────────────────────────────────────────────┐
        │      AI Journey Plan Generated (CP-SAT)      │
        │   → Lịch trình cá nhân hóa cho bệnh nhân    │
        └──────────────────────────────────────────────┘
```

---

## 2. Quy trình Khám Bệnh Thực tế & Mapping sang AI System

> Phần này mapping trực tiếp từ quy trình khám bệnh thực tế tại bệnh viện Việt Nam sang các module AI tương ứng.

### 2.1 BƯỚC 1: TIẾP NHẬN THÔNG TIN (Check-in)

#### Quy trình thực tế

| Hình thức | Bệnh nhân cung cấp | Bệnh nhân nhận được |
|-----------|--------------------|--------------------|
| **Online** (App/Web/Tổng đài) | Họ tên, CCCD, BHYT, lịch sử điều trị, triệu chứng, chuyên khoa, giấy hẹn tái khám | Phiếu xác nhận (mã QR), khung giờ hẹn, số phòng khám |
| **Offline** (Tại sảnh) | Số thứ tự, thẻ BHYT gốc, CCCD, giấy hẹn tái khám, mô tả triệu chứng | Phiếu khám bệnh (số thứ tự + buồng khám) |

#### AI System Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│  CHECK-IN EVENT                                                  │
│                                                                  │
│  Input Data Capture:                                             │
│  ├─ patient_id, patient_type (NEW | RETURNING)                  │
│  ├─ symptoms[] (nếu khám mới)                                   │
│  ├─ preferred_doctor_id (nếu tái khám)                          │
│  ├─ insurance_type (BHYT | Self-pay | Transfer)                 │
│  ├─ referral_docs (giấy chuyển viện, giấy hẹn tái khám)        │
│  └─ registration_channel (ONLINE | OFFLINE)                     │
│                                                                  │
│  AI Actions Triggered:                                           │
│  ├─ [Tầng 2] LightGBM: Dự báo wait_time tại các khoa liên quan│
│  ├─ [Tầng 3] CP-SAT: Sinh lịch trình tối ưu cho bệnh nhân     │
│  └─ [Output] Journey Plan → App/SMS/Màn hình                   │
│                                                                  │
│  Output cho bệnh nhân:                                           │
│  ├─ Lịch trình cá nhân hóa (danh sách trạm + khung giờ dự kiến)│
│  ├─ Estimated total journey time                                 │
│  └─ Bản đồ di chuyển gợi ý trong bệnh viện                    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 BƯỚC 2: KHÁM CHỮA BỆNH (Examination Flow)

Quy trình thực tế có **3 trường hợp** với độ phức tạp tăng dần. Đây chính là nơi AI mang lại giá trị lớn nhất:

#### Trường hợp 1: Chỉ khám lâm sàng đơn thuần (~2 giờ)

```
Check-in → Chờ gọi tên → Khám BS → Đơn thuốc → Thanh toán → Nhận thuốc
```

- **AI Value:** Tối thiểu — chỉ dự báo wait time tại phòng khám.
- **CP-SAT tasks:** 1 task duy nhất (consultation), không cần sequencing.

#### Trường hợp 2: Khám + Xét nghiệm (~3 giờ)

```
Check-in → Khám BS (lần 1) → Lấy mẫu XN → [Chờ kết quả XN] → Khám BS (lần 2) → Thanh toán → Nhận thuốc
```

- **AI Value:** Trung bình — Dự báo thời gian trả kết quả XN, tối ưu thời điểm lấy mẫu.
- **CP-SAT tasks:** 3 tasks với dependency: `consultation_1 → lab_sample → [turnaround] → consultation_2`
- **Ràng buộc cứng:** `start(consultation_2) ≥ start(lab_sample) + turnaround_time(lab)`
- **Cơ hội tối ưu:** Nếu turnaround > 30 phút, BN có thể tranh thủ làm task khác (nếu có).

#### Trường hợp 3: Khám + Xét nghiệm + Chẩn đoán Hình ảnh (~3-4 giờ) ⭐ AI HIGH VALUE

```
Check-in → Khám BS (lần 1) → [Xét nghiệm + X-quang + Siêu âm + ...] → Khám BS (lần 2) → Thanh toán → Nhận thuốc
```

- **AI Value:** **RẤT CAO** — Đây là bài toán Job-Shop Scheduling kinh điển.
- **CP-SAT tasks:** N tasks với partial-order dependencies phức tạp.

**Ví dụ minh họa cụ thể (từ Goal.md):**

Bệnh nhân cần: Xét nghiệm máu + Siêu âm + X-quang → Quay về khám BS.

```
                    ┌─────────────────────────────────────────┐
                    │     KHÔNG có AI (Quy trình hiện tại)    │
                    └─────────────────────────────────────────┘

  08:00   08:30       09:00       09:40    10:10    10:40
    │───────│───────────│───────────│────────│────────│
    Xếp hàng  Xếp hàng    Xếp hàng   Chờ      Khám
    XN máu    Siêu âm     X-quang    kết quả   BS
    (lấy mẫu) (làm SA)   (chụp XQ)   XN

    Tổng: ~2h40 (phần lớn là chờ đợi + di chuyển lặp lại)


                    ┌─────────────────────────────────────────┐
                    │        CÓ AI Orchestrator (CP-SAT)       │
                    └─────────────────────────────────────────┘

  08:00  08:10    08:15  08:30    08:35  08:50    09:10
    │──────│────────│──────│────────│──────│────────│
    XN máu  Di     X-quang  Di     Siêu    Chờ     Khám
    (lấy   chuyển  (chụp   chuyển  âm     kết quả  BS
    mẫu)          XQ khi          (làm    XN
                  chờ KQ XN)      SA)    (đã xong)

    Tổng: ~1h10 (XN máu đầu tiên → tranh thủ XQ trong lúc chờ → SA → KQ XN sẵn sàng)
```

**Logic tối ưu của CP-SAT:**
1. **XN máu trước** vì turnaround_time dài nhất (~40 phút xử lý mẫu).
2. **X-quang trong lúc chờ KQ XN** vì không có dependency với XN máu, và kết quả trả ngay.
3. **Siêu âm sau** (nếu có yêu cầu nhịn ăn, phải ưu tiên sớm hơn — hard constraint).
4. **Khám BS lần 2** chỉ khi TẤT CẢ kết quả đã sẵn sàng.

#### Constraint Dependency Graph (DAG)

```
           ┌──────────┐
           │ Khám BS  │ (Lần 1: Chỉ định XN + CĐHA)
           │ (lần 1)  │
           └────┬─────┘
                │ generates tasks[]
       ┌────────┼────────┐
       ▼        ▼        ▼
  ┌────────┐ ┌───────┐ ┌───────┐
  │XN Máu  │ │X-quang│ │Siêu âm│
  │        │ │       │ │       │
  │t=10min │ │t=15min│ │t=15min│
  └───┬────┘ └───┬───┘ └───┬───┘
      │          │         │
      │ turnaround         │ Fasting constraint:
      │ 40 min             │ nếu siêu âm bụng,
      │          │         │ phải làm trước
      ▼          ▼         ▼ khi ăn
  ┌────────────────────────────┐
  │  ALL results ready?        │ ← Join node
  └────────────┬───────────────┘
               ▼
         ┌──────────┐
         │ Khám BS  │ (Lần 2: Đọc kết quả + kê đơn)
         │ (lần 2)  │
         └────┬─────┘
              ▼
      ┌──────────────┐
      │  Thanh toán   │
      └──────┬───────┘
              ▼
      ┌──────────────┐
      │  Nhận thuốc   │
      └──────────────┘
```

### 2.3 BƯỚC 3 & 4: THANH TOÁN + NHẬN THUỐC

```
┌─────────────────────────────────────────────────────────┐
│  POST-CONSULTATION FLOW                                  │
│                                                          │
│  Thanh toán viện phí:                                    │
│  ├─ Input: Phiếu thanh toán từ BS                       │
│  ├─ BHYT → Đồng chi trả                                │
│  └─ Không BHYT → Toàn bộ viện phí                      │
│                                                          │
│  Nhận thuốc:                                             │
│  ├─ Input: Đơn thuốc đã ký + phiếu đã thanh toán       │
│  ├─ Dược sĩ chuẩn bị + tư vấn                          │
│  └─ BN ký nhận sổ cấp phát → Hoàn tất hành trình       │
│                                                          │
│  AI Value: Thấp (sequential, ít cơ hội tối ưu)         │
│  → Chỉ dự báo wait_time tại quầy thanh toán + quầy thuốc│
│  → Gợi ý quầy ít người                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Kiến trúc 4 Tầng Chi Tiết

```
   ┌──────────────────────────────────────────────────────────┐
   │           Tầng 1: Hospital Digital Twin (SimPy)          │
   │     Mô phỏng vật lý ảo: mặt bằng, phòng, máy, BS      │
   │     Sinh synthetic data + môi trường test thuật toán     │
   └──────────────────────────┬───────────────────────────────┘
                              │ Luồng sự kiện mô phỏng
                              ▼
   ┌──────────────────────────────────────────────────────────┐
   │          Tầng 2: Prediction Layer (LightGBM)             │
   │     Dự báo service_duration + confidence interval       │
   │     Rolling-window parameters (KHÔNG dùng static avg)   │
   └──────────────────────────┬───────────────────────────────┘
                              │ predicted_durations[] + CI
                              ▼
   ┌──────────────────────────────────────────────────────────┐
   │     Tầng 3: Global Optimization Layer (CP-SAT)           │
   │     Job-Shop Scheduling mở rộng                          │
   │     Hard constraints (y tế) + Soft objectives (hiệu quả)│
   └──────────────────────────┬───────────────────────────────┘
                              │ planned_schedule[] với time_windows
                              ▼
   ┌──────────────────────────────────────────────────────────┐
   │    Tầng 4: Dynamic Coordination Layer (Local Repair)     │
   │    Tier A: Heuristic cục bộ (< 1s, biến động nhỏ)      │
   │    Tier B: Trigger CP-SAT re-run (sự cố nghiêm trọng)  │
   └──────────────────────────┬───────────────────────────────┘
                              │ next_action[patient]
                              ▼
   ┌──────────────────────────────────────────────────────────┐
   │      Evaluation & Analytics Engine (Song song)           │
   │      So sánh FIFO vs Rule-based vs AI Orchestrator      │
   └──────────────────────────────────────────────────────────┘
```

### 3.1 Tầng 1: Hospital Digital Twin (SimPy)

**Mục đích:** Nền tảng vật lý ảo — vừa là nguồn sinh dữ liệu training, vừa là môi trường test.

**Thành phần mô phỏng:**

| Thành phần | Tham số | Phân phối xác suất |
|------------|---------|-------------------|
| Dòng bệnh nhân đến | Arrival rate λ(t) | Non-homogeneous Poisson (đỉnh 7:30-9:30, thấp sau 11:00) |
| Thời gian khám BS | Service time μ | Log-Normal (lệch phải, phản ánh ca phức tạp) |
| Thời gian XN máu | Processing time | Normal(μ=40min, σ=10min) |
| Thời gian X-quang | Processing time | Normal(μ=15min, σ=5min) |
| Thời gian Siêu âm | Processing time | Normal(μ=20min, σ=7min) |
| Sự cố bất thường | Machine failure, BS vắng, cấp cứu | Exponential (rare events) |

**Cấu hình MVP tối thiểu:**
- 3 phòng khám lâm sàng (3 BS)
- 1 phòng xét nghiệm máu (2 quầy lấy mẫu)
- 1 phòng X-quang (1 máy)
- 1 phòng Siêu âm (1 máy)
- 1 quầy thanh toán
- 1 quầy thuốc

**Output:**
- `event_log.csv`: Bản ghi toàn bộ sự kiện `{patient_id, event_type, station, timestamp}`
- `queue_snapshots.csv`: Trạng thái hàng đợi mỗi phút
- `hospital_graph`: Ma trận khoảng cách giữa các phòng

### 3.2 Tầng 2: Prediction Layer (LightGBM)

**Mục đích:** Dự báo `service_duration` tại mỗi trạm, cung cấp tham số cho CP-SAT.

**QUAN TRỌNG — Thiết kế chống rò rỉ dữ liệu:**
- **KHÔNG** dự đoán queue_length (gây circular dependency với CP-SAT).
- **CÓ** dự đoán `service_duration` (thời gian xử lý thực tế tại trạm) + CI.

**Feature Engineering:**

```
Features (Input cho LightGBM):
├─ Time features:
│  ├─ hour_of_day, day_of_week, is_morning_peak (7:30-9:30)
│  └─ minutes_since_shift_start (proxy cho doctor fatigue)
│
├─ Queue state features (rolling window 30 phút):
│  ├─ rolling_arrival_rate_λ(t, Δt=30min)
│  ├─ rolling_service_rate_μ(t, Δt=30min)
│  ├─ utilization_ratio_ρ = λ/(c×μ)  [c = số server]
│  └─ current_queue_depth tại station
│
├─ Station features:
│  ├─ station_type (lab | xray | ultrasound | consultation)
│  ├─ num_active_servers (số BS/máy đang hoạt động)
│  └─ equipment_age_category (proxy cho reliability)
│
└─ Patient features:
   ├─ patient_type (NEW | RETURNING)
   ├─ num_tasks_remaining
   └─ priority_level (normal | urgent | emergency)

Target (Output):
└─ predicted_service_duration (phút)  ← MỘT con số duy nhất
```

**Kỹ thuật quan trọng:**
- **[MVP CODE] Standard Regression** (objective = MAE/MSE) → output 1 predicted_duration duy nhất. Không dùng quantile regression.
- **[MVP CODE] Heuristic Slack** thay cho CI: `slack = predicted_duration × SLACK_FACTOR[station_type]`. Ví dụ: Siêu âm +15%, XN máu +10%, X-quang +5%. Hằng số này được hardcode và tunable.
- **[PROPOSAL ONLY] Quantile Regression** (alpha=0.1, 0.5, 0.9) để có CI tự nhiên — mô tả trong slide nhưng KHÔNG implement trong MVP.
- **[MVP CODE] Rolling-window λ/μ**: Tính trên cửa sổ 30 phút gần nhất, KHÔNG dùng trung bình ngày.
- **[PROPOSAL ONLY] Fatigue decay factor**: `μ_effective(t) = μ_base × exp(-α × hours_worked)` — mô tả trong slide, MVP dùng static μ.

### 3.3 Tầng 3: Global Optimization Layer (CP-SAT)

**Mục đích:** Bộ não tối ưu hóa toàn cục — giải bài toán Job-Shop Scheduling mở rộng.

#### Decision Variables

```
Với mỗi bệnh nhân p ∈ P, mỗi task j ∈ J(p):
  - start[p][j]    : IntervalVar — thời điểm bắt đầu task j
  - station[p][j]   : IntVar — phòng/máy được assign (nếu có nhiều phòng cùng loại)
  - duration[p][j]  : Từ Tầng 2 (predicted_service_duration)
```

#### Hard Constraints (Ràng buộc cứng — KHÔNG được vi phạm)

```python
# 1. Precedence (thứ tự y tế bắt buộc)
# Ví dụ: Khám BS lần 2 chỉ sau khi CÓ kết quả XN
model.Add(start[p][consultation_2] >= start[p][lab] + duration[p][lab] + turnaround[lab])

# 2. Resource capacity (mỗi máy/phòng phục vụ 1 BN tại 1 thời điểm)
model.AddNoOverlap([interval[p][j] for all p,j assigned to station s])

# 3. Doctor preference (BN tái khám → fix doctor)
if patient.type == RETURNING:
    model.Add(station[p][consultation] == patient.preferred_doctor_station)
```

#### Soft Constraints (Ràng buộc mềm — thông qua slack variables + penalty)

```python
# Fasting constraint chuyển thành soft (tránh infeasible)
# Siêu âm bụng nên trước 10:00 (giả sử BN nhịn ăn từ đêm)
fasting_slack = model.NewIntVar(0, MAX_SLACK, 'fasting_slack')
model.Add(start[p][ultrasound] + fasting_slack <= FASTING_DEADLINE)
# Penalty: fasting_slack × HEAVY_PENALTY trong objective
```

#### Multi-Objective Function

```
Minimize:
    w₁ × Σ idle_wait[p]           # Tổng thời gian chờ rỗi
  + w₂ × Σ makespan[p]            # Tổng thời gian hành trình
  + w₃ × Var(utilization[s])      # Cân bằng tải giữa stations
  + w₄ × Σ travel_distance[p]     # Tổng quãng đường di chuyển
  + w₅ × Σ floor_changes[p]       # Số lần đổi tầng
  + w₆ × Σ fasting_slack[p] × PENALTY  # Phạt vi phạm nhịn ăn
```

**Trọng số gợi ý (tunable):** `w₁ = 10, w₂ = 5, w₃ = 3, w₄ = 2, w₅ = 1, w₆ = 100`

#### Travel Time: Dijkstra làm Utility Function

```python
# Pre-compute 1 lần khi khởi tạo (KHÔNG phải module riêng biệt)
travel_time_matrix = {}
for s1 in stations:
    for s2 in stations:
        travel_time_matrix[s1][s2] = dijkstra(hospital_graph, s1, s2)

# Feed vào CP-SAT constraints
model.Add(start[p][j+1] >= start[p][j] + duration[p][j] + travel_time_matrix[station_j][station_j1])
```

#### Output

```
PlannedSchedule cho mỗi bệnh nhân:
  BN Nguyễn Văn A (Trường hợp 3: Khám + XN + CĐHA):
  ├─ 08:00-08:10  Xét nghiệm máu     @ Phòng XN-2    (XN trước vì turnaround dài)
  ├─ 08:15-08:30  X-quang              @ Phòng XQ-1    (Tranh thủ lúc chờ KQ XN)
  ├─ 08:35-08:50  Siêu âm              @ Phòng SA-1    (Nhịn ăn OK, làm trước 10:00)
  ├─ 09:10-09:25  Khám BS Trần (lần 2) @ Phòng 405     (KQ XN đã sẵn sàng lúc 08:50)
  ├─ 09:30-09:35  Thanh toán            @ Quầy TT-2
  └─ 09:35-09:45  Nhận thuốc            @ Quầy Thuốc-1
```

### 3.4 Tầng 4: Dynamic Coordination Layer

**Mục đích:** Xử lý biến động thời gian thực mà KHÔNG gây "schedule nervousness".

#### Tier A: Local Heuristic (< 1 giây, biến động nhỏ) — **[MVP CODE: Simplified]**

**Kích hoạt khi:** `|actual_time - planned_time| < THRESHOLD` (ví dụ: 10 phút)

**[MVP CODE] Implementation cực kỳ đơn giản — 1 hàm Python duy nhất:**

```python
def tier_a_local_adjust(patient_plan, current_state, threshold_minutes=10):
    """Tier A: Kiểm tra phòng tiếp theo, đổi nếu có phòng tương đương trống."""
    next_task = patient_plan.get_next_task()
    if next_task is None:
        return None  # Không còn task

    planned_station = next_task.station_id
    deviation = abs(current_time() - next_task.time_window_start).minutes

    if deviation > threshold_minutes:
        return None  # Vượt ngưỡng → để Tier B xử lý

    # Kiểm tra phòng tương đương (cùng loại) có trống không
    equivalent_stations = get_equivalent_stations(planned_station)
    for alt_station in equivalent_stations:
        if is_station_free(alt_station, current_state):
            next_task.station_id = alt_station  # Đổi station ngay
            return LocalAdjustment(
                patient_id=patient_plan.patient_id,
                adjustment_type="REASSIGN",
                original_station=planned_station,
                new_station=alt_station
            )

    return None  # Không có phòng trống → giữ nguyên hàng đợi
```

**KHÔNG implement trong MVP:**
- ~~Local Search / Tabu Move~~
- ~~Task swap logic phức tạp~~
- ~~Redis state locking~~ (dùng Python dict đơn giản)

**[PROPOSAL ONLY]** Mô tả trong slide: Swap 2 tasks không dependency, shift time_window, Redis locking.

#### Tier B: Global Re-optimization (Trigger CP-SAT)

**Kích hoạt khi (OR logic):**

| Trigger | Ví dụ |
|---------|-------|
| Sự cố nghiêm trọng | Máy X-quang hỏng, BS vắng đột xuất |
| Ca cấp cứu chiếm resource | Emergency case chen vào phòng SA |
| Tích lũy nhiều deviation | > 20% BN bị trễ > THRESHOLD |
| Periodic | Mỗi 15-30 phút (configurable) |

**Anti-Nervousness Safeguards:**

```
├─ Minimum re-plan interval: 10 phút
│   (Không re-run CP-SAT liên tục)
├─ Scope hạn chế: CHỈ re-optimize BN chưa hoàn thành
│   (BN đã làm xong 3/4 tasks → giữ nguyên)
├─ Stability score: Chỉ apply schedule mới nếu
│   new_objective < current × (1 - improvement_threshold)
│   (Không đổi nếu cải thiện < 5%)
└─ Change cap: Tối đa thay đổi K% BN mỗi lần re-plan
    (Tránh domino effect)
```

---

## 4. Workflow Kỹ thuật End-to-End

### 4.1 Luồng xử lý chính (Happy Path)

```
   ┌─────────────┐
   │  BN Check-in │
   └──────┬──────┘
          │ {patient_id, type, symptoms, preferred_doctor, tasks_needed}
          ▼
   ┌────────────────────────────────────┐
   │  [Tầng 2] LightGBM Predict        │
   │  → predicted_durations[] (1 value) │
   │  + heuristic slack per station     │
   └──────────────┬─────────────────────┘
                  │
                  ▼
   ┌────────────────────────────────────┐
   │  [Tầng 3] CP-SAT Optimize         │
   │  → Incremental: thêm BN mới vào   │
   │    schedule hiện tại (warm-start)  │
   │  → Output: journey_plan[BN]        │
   └──────────────┬─────────────────────┘
                  │
                  ▼
   ┌────────────────────────────────────┐
   │  Gửi journey_plan → BN            │
   │  (App / SMS / Màn hình TV)         │
   └──────────────┬─────────────────────┘
                  │
                  ▼
   ┌────────────────────────────────────────────────────────┐
   │  BN thực hiện theo plan:                               │
   │                                                        │
   │  Tại mỗi trạm:                                        │
   │  ├─ BN check-in tại trạm → Event phát sinh            │
   │  ├─ [Tầng 4 Tier A] So sánh actual vs planned         │
   │  │  ├─ OK (trong slack) → Tiếp tục theo plan          │
   │  │  ├─ Lệch nhẹ → Local adjustment (swap/reassign)   │
   │  │  └─ Lệch nghiêm trọng → Flag cho Tier B           │
   │  └─ BN hoàn thành trạm → Event phát sinh              │
   │                                                        │
   │  Nếu Tier B triggered:                                 │
   │  ├─ [Tầng 2] Re-predict với state mới                 │
   │  └─ [Tầng 3] CP-SAT re-run (scoped, safeguarded)     │
   └────────────────────────────────────────────────────────┘
                  │
                  ▼
   ┌────────────────────────────────────┐
   │  BN hoàn tất hành trình            │
   │  → Log journey metrics             │
   │  → Feed back vào training data     │
   └────────────────────────────────────┘
```

### 4.2 Luồng xử lý sự cố (Exception Path)

```
  ╔═══════════════════════════════════════╗
  ║  SỰ CỐ: Máy X-quang hỏng lúc 09:15  ║
  ╚═══════════════════╤═══════════════════╝
                      │
                      ▼
  ┌─────────────────────────────────────────┐
  │  Event: {type: MACHINE_DOWN,            │
  │          station: XQ-1,                 │
  │          timestamp: 09:15}              │
  └──────────────────┬──────────────────────┘
                     │
                     ▼
  ┌─────────────────────────────────────────┐
  │  [Tầng 4] Severity Assessment:          │
  │  ├─ affected_patients = BN có XQ-1      │
  │  │   trong planned_schedule chưa làm    │
  │  ├─ count = 8 BN                        │
  │  └─ severity = HIGH → Trigger Tier B    │
  └──────────────────┬──────────────────────┘
                     │
                     ▼
  ┌─────────────────────────────────────────┐
  │  [Tầng 3] CP-SAT Re-run:               │
  │  ├─ Remove XQ-1 khỏi available stations │
  │  ├─ Re-optimize 8 BN affected           │
  │  │  (các BN khác giữ nguyên schedule)   │
  │  ├─ Apply stability safeguards          │
  │  └─ Output: updated_schedule[]          │
  └──────────────────┬──────────────────────┘
                     │
                     ▼
  ┌─────────────────────────────────────────┐
  │  Notify affected patients:              │
  │  "Phòng X-quang đang bảo trì.          │
  │   Lịch trình đã được cập nhật:          │
  │   Bạn sẽ chuyển sang Siêu âm trước,   │
  │   X-quang sẽ được sắp lại lúc 10:30." │
  └─────────────────────────────────────────┘
```

---

## 5. Giao ước Giao tiếp giữa các Tầng (Interface Contracts)

| Giao diện | Format | Tần suất | Latency Target |
|-----------|--------|----------|----------------|
| **HIS → Event Bus** | `EventJSON {patient_id, event_type, station, timestamp}` | Real-time (mỗi event) | < 500ms |
| **Event Bus → State Store** | Aggregated queue state update | Continuous | < 200ms |
| **Tầng 2 → Tầng 3** | `PredictionResponse {station_id, predicted_duration, slack_duration}[]` | Mỗi 5-15 phút hoặc on-demand | < 2s |
| **Tầng 3 → Tầng 4** | `PlannedSchedule {patient_id, tasks: [{task_id, station, time_start, time_end}]}[]` | Mỗi 15-30 phút hoặc triggered | < 30s (CP-SAT solve) |
| **Tầng 4 Tier A** | `LocalAdjustment {patient_id, swapped_tasks?, new_station?}` | Per-event | < 1s |
| **Tầng 4 → Tầng 3** | `ReplanRequest {trigger_reason, affected_stations[], severity}` | When threshold exceeded | N/A |

### Data Structures (Python Pseudocode)

```python
@dataclass
class PatientCheckInEvent:
    patient_id: str
    patient_type: Literal["NEW", "RETURNING"]
    symptoms: list[str]              # Nếu khám mới
    preferred_doctor_id: str | None  # Nếu tái khám
    insurance_type: Literal["BHYT", "SELF_PAY", "TRANSFER"]
    required_services: list[str]     # ["lab", "xray", "ultrasound", "consultation"]
    priority: Literal["NORMAL", "URGENT", "EMERGENCY"]
    registration_channel: Literal["ONLINE", "OFFLINE"]
    timestamp: datetime

@dataclass
class PredictionResponse:
    station_id: str
    predicted_duration_min: float
    slack_duration_min: float     # Heuristic: predicted × SLACK_FACTOR[station_type]
    timestamp: datetime

# Heuristic slack factors (hardcoded, tunable)
SLACK_FACTORS = {
    "ultrasound": 0.15,   # +15% cho siêu âm (biến động cao)
    "lab": 0.10,          # +10% cho xét nghiệm
    "xray": 0.05,         # +5% cho X-quang (ổn định hơn)
    "consultation": 0.10, # +10% cho khám BS
}

@dataclass
class TaskAssignment:
    task_id: str
    task_type: str                # "lab", "xray", "ultrasound", "consultation"
    station_id: str               # Phòng cụ thể
    time_window_start: datetime
    time_window_end: datetime
    dependencies: list[str]       # task_ids phải hoàn thành trước

@dataclass
class PlannedSchedule:
    patient_id: str
    tasks: list[TaskAssignment]
    estimated_total_duration: float  # phút
    estimated_completion_time: datetime

@dataclass
class LocalAdjustment:
    patient_id: str
    adjustment_type: Literal["REASSIGN"]  # MVP: chỉ hỗ trợ REASSIGN
    original_station: str
    new_station: str

@dataclass
class ReplanRequest:
    trigger_reason: Literal["MACHINE_DOWN", "DOCTOR_ABSENT", "EMERGENCY", "THRESHOLD_EXCEEDED", "PERIODIC"]
    affected_stations: list[str]
    affected_patient_count: int
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    timestamp: datetime
```

---

## 6. Mô hình Toán học & Thuật toán Chi Tiết

### 6.1 Tầng 2 — LightGBM Training Pipeline **[MVP CODE]**

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  SimPy Data  │───▶│  Feature     │───▶│  LightGBM    │───▶│  Evaluation  │
│  (event_log) │    │  Engineering │    │  Training     │    │  (MAE, MAPE) │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘

[MVP CODE] Training config:
├─ Objective: regression (MAE)  ← ĐƠN GIẢN, 1 model duy nhất
├─ Output: 1 predicted_duration per station
├─ Slack: predicted_duration × SLACK_FACTORS[station_type]  ← Heuristic hằng số
├─ Train/Val/Test: 70/15/15 (time-based split, KHÔNG random)
└─ Metrics: MAE, MAPE

[PROPOSAL ONLY] Mô tả trong slide:
├─ Quantile regression (alpha=0.1, 0.5, 0.9)
├─ CI-driven dynamic slack
└─ Coverage probability metric
```

### 6.2 Tầng 3 — CP-SAT Formulation Tóm tắt

```
Bài toán: Extended Flexible Job-Shop Scheduling Problem (FJSP)

Sets:
  P = {p₁, p₂, ..., pₙ}           : Tập bệnh nhân
  J(p) = {j₁, j₂, ..., jₘ}        : Tập tasks của bệnh nhân p
  S = {s₁, s₂, ..., sₖ}           : Tập stations (phòng/máy)
  S(j) ⊆ S                         : Tập stations có thể thực hiện task j

Parameters:
  d[p][j]     : Predicted duration (từ Tầng 2)
  slack[p][j] : Heuristic slack = d[p][j] × SLACK_FACTOR[type(j)]
  travel[s₁][s₂] : Thời gian di chuyển (Dijkstra pre-computed)
  turnaround[j]   : Thời gian trả kết quả (XN, CĐHA)
  prec(p)     : DAG dependency constraints cho BN p

Variables:
  start[p][j]    ∈ ℤ⁺   : Thời điểm bắt đầu
  assign[p][j][s] ∈ {0,1} : Assignment to station
  slack[p][j]    ∈ ℤ⁺    : Buffer variable cho soft constraints

Constraints:
  (1) Precedence:     start[p][j'] ≥ start[p][j] + d[p][j] + travel + turnaround
                      ∀ (j→j') ∈ prec(p)
  (2) No-overlap:     NoOverlap({interval[p][j] : assign[p][j][s]=1}) ∀s
  (3) Assignment:     Σₛ assign[p][j][s] = 1   ∀p,j
  (4) Doctor fix:     assign[p][consult][s_preferred] = 1  nếu RETURNING

Objective:
  Min  w₁·Σ(idle_wait) + w₂·Σ(makespan) + w₃·Var(util)
     + w₄·Σ(travel) + w₅·Σ(floor_changes) + w₆·Σ(slack·PENALTY)
```

### 6.3 Tầng 4 — Two-Tier Decision Logic **[MVP CODE]**

```python
# ============================================================
# Tier A: SIMPLE STATION REASSIGNMENT (MVP Implementation)
# ============================================================
def tier_a_local_adjust(patient_plan, current_state, threshold_minutes=10):
    """MVP Tier A: Chỉ làm 1 việc duy nhất — đổi sang phòng tương đương nếu trống."""
    next_task = patient_plan.get_next_task()
    if next_task is None:
        return None

    deviation = abs(current_time() - next_task.time_window_start).minutes
    if deviation > threshold_minutes:
        return None  # Vượt ngưỡng → Tier B

    # Tìm phòng cùng loại đang trống
    for alt in get_equivalent_stations(next_task.station_id):
        if is_station_free(alt, current_state):
            next_task.station_id = alt
            return {"patient_id": patient_plan.patient_id,
                    "old_station": next_task.station_id,
                    "new_station": alt}
    return None  # Giữ nguyên


# ============================================================
# Tier B: TRIGGER RE-OPTIMIZATION (MVP Implementation)
# ============================================================
def handle_event(event, current_schedule, state):
    patient = current_schedule.get(event.patient_id)
    if patient is None:
        return

    # Thử Tier A trước
    adjustment = tier_a_local_adjust(patient, state)
    if adjustment:
        log_adjustment(adjustment)
        return

    # Tier B: Chỉ trigger khi sự cố nghiêm trọng
    if event.type in ["MACHINE_DOWN", "DOCTOR_ABSENT", "EMERGENCY"]:
        affected = [p for p in current_schedule.values()
                    if event.station in p.remaining_stations()]
        new_schedule = cpsat_replan(affected_patients=affected,
                                    unavailable=[event.station])
        apply_and_notify(new_schedule)
```

> **[PROPOSAL ONLY]** Mô tả trong slide: stability_check, deviation_ratio threshold, periodic re-plan interval, change cap safeguards.

---

## 7. Hệ thống Đánh giá (Evaluation Engine)

### 7.1 Ba Chế độ So sánh

| Chế độ | Mô tả | Vai trò |
|--------|--------|---------|
| **Baseline 1: FIFO** | Đến trước phục vụ trước, không tối ưu | Lower bound (worst case) |
| **Baseline 2: Rule-based** | Heuristic đơn giản (ví dụ: ưu tiên task có turnaround dài trước) | Mid-range comparison |
| **Our: AI Orchestrator** | Full pipeline: LightGBM + CP-SAT + Dynamic | Target (our solution) |

### 7.2 Metrics Đánh giá

```
┌─────────────────────────────────────────────────────────────────┐
│  PATIENT-CENTRIC METRICS                                        │
│  ├─ Average Wait Time (phút): Σ idle_wait / N                  │
│  ├─ Average Journey Time (phút): Σ (checkout - checkin) / N    │
│  ├─ Wait Time Distribution: P50, P75, P90, P95                 │
│  └─ Patient Satisfaction Score: f(wait_time, # of backtrack)   │
│                                                                  │
│  HOSPITAL-CENTRIC METRICS                                       │
│  ├─ Equipment Utilization (%): Σ busy_time / Σ available_time  │
│  ├─ Doctor Utilization (%): Σ consultation_time / Σ shift_time │
│  ├─ Throughput: Patients served / hour                          │
│  └─ Congestion Index: max(queue_length) across stations        │
│                                                                  │
│  SYSTEM METRICS                                                  │
│  ├─ CP-SAT Solve Time (giây)                                   │
│  ├─ Prediction Accuracy: MAE, MAPE của LightGBM                │
│  ├─ Schedule Stability: % BN bị thay đổi plan / lần re-plan   │
│  └─ Tier A vs Tier B trigger ratio                              │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Visualization cho Demo

```
Biểu đồ bắt buộc cho Presentation:
├─ [Bar Chart] Average Wait Time: FIFO vs Rule-based vs AI
├─ [Box Plot] Wait Time Distribution cho mỗi chế độ
├─ [Line Chart] Queue Length over Time (cho thấy congestion smoothing)
├─ [Heatmap] Station Utilization qua các khung giờ
├─ [Gantt Chart] Ví dụ journey timeline của 1 BN (FIFO vs AI)
└─ [Scatter Plot] Predicted vs Actual service duration (model accuracy)
```

---

## 8. Lộ trình Hiện thực hóa MVP

### 8.0 ⭐ CHIẾN LƯỢC MVP: HAPPY PATH FIRST

> **Lời khuyên cốt lõi:** Tập trung toàn bộ nguồn lực để làm chạy được luồng Happy Path của **01 bệnh nhân** từ giao diện Check-in → Sinh lịch trình tự động → Cập nhật trạng thái qua từng phòng trên Dashboard. Khi luồng này đã thông suốt, chỉ cần cấu hình vòng lặp SimPy để sinh thêm 20-30 bệnh nhân ảo chạy ngầm nhằm tạo ra các số liệu hợp lý.

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  MILESTONE 0 (Ưu tiên tuyệt đối):                          ║
  ║                                                              ║
  ║  1 BN check-in trên UI                                      ║
  ║      → Backend gọi ai_engine.predict_and_schedule()          ║
  ║      → Nhận về journey_plan JSON                             ║
  ║      → Hiển thị timeline trên Dashboard                      ║
  ║      → BN click "Hoàn thành" tại mỗi trạm                  ║
  ║      → Dashboard cập nhật real-time                          ║
  ║                                                              ║
  ║  Khi Milestone 0 DONE → Scale lên 20-30 BN ảo (SimPy loop) ║
  ╚══════════════════════════════════════════════════════════════╝
```

### 8.1 Phân chia Công việc (3 Bước Cuốn chiếu)

```
┌──────────────────────────────────────────────────────────────────┐
│  BƯỚC 1: Xây dựng Hospital Simulator (SimPy)                    │
│  ────────────────────────────────────────────                    │
│  Deliverable: Code trong ai_engine.py (phần simulator)          │
│                                                                  │
│  Tasks:                                                          │
│  ├─ Định nghĩa hospital_config (3 phòng khám, 1 XN, 1 XQ, 1 SA)│
│  ├─ Implement patient arrival process (Non-homogeneous Poisson) │
│  ├─ Implement service processes (Log-Normal durations)          │
│  ├─ Implement disruption events (machine failure, emergency)    │
│  ├─ Generate event_log records (in-memory, DataFrame)           │
│  └─ Validate: phân phối arrival/service khớp dữ liệu tham khảo│
│                                                                  │
│  Tech: Python, SimPy, NumPy, Pandas                             │
│  Estimated Time: 3-5 ngày                                       │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  BƯỚC 2: Training + Optimization Pipeline                        │
│  ────────────────────────────────────────                        │
│  Deliverable: Code trong ai_engine.py (phần ML + optimization)  │
│                                                                  │
│  Tasks:                                                          │
│  ├─ Feature engineering từ event records                        │
│  ├─ Train LightGBM (standard regression, MAE objective)        │
│  ├─ Evaluate: MAE, MAPE                                        │
│  ├─ Build CP-SAT model (Google OR-Tools)                        │
│  │   ├─ Variables, constraints, objective (như Section 6.2)     │
│  │   ├─ Test trên 1 BN trước → scale lên N BN                 │
│  │   └─ Đảm bảo solve time < 5s cho ~50 BN concurrent         │
│  ├─ Implement Tier A (simple station reassignment function)     │
│  └─ Expose: predict_and_schedule() → JSON cho Backend          │
│                                                                  │
│  Tech: LightGBM, Google OR-Tools (CP-SAT), Pandas, NumPy       │
│  Estimated Time: 5-7 ngày                                       │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  BƯỚC 3: Evaluation + Demo Preparation                           │
│  ──────────────────────────────────────                          │
│  Deliverable: Jupyter Notebook — evaluation.ipynb (riêng biệt)  │
│                                                                  │
│  Tasks:                                                          │
│  ├─ Implement 3 baselines: FIFO, Rule-based, AI Orchestrator   │
│  ├─ Run simulation cho cùng patient flow trên 3 chế độ         │
│  ├─ Generate comparison charts (Bar, Box, Gantt, Heatmap)       │
│  └─ Compile kết quả cho slides/demo                             │
│                                                                  │
│  Tech: Matplotlib, Seaborn, Plotly (interactive)                │
│  Estimated Time: 3-5 ngày                                       │
└──────────────────────────────────────────────────────────────────┘
```

### 8.2 Tech Stack Tổng hợp (AI Engineer Scope)

| Layer | Công nghệ | Vai trò |
|-------|-----------|---------|
| Simulator | **SimPy** + NumPy | Hospital Digital Twin |
| ML Prediction | **LightGBM** (regression, MAE) | Service duration prediction |
| Optimization | **Google OR-Tools** (CP-SAT) | Global scheduling |
| Graph Routing | **NetworkX** + Dijkstra (hoặc hardcode matrix) | Travel time computation |
| Data Processing | **Pandas** | Feature engineering |
| Visualization | **Matplotlib** + **Seaborn** + **Plotly** | Evaluation charts |
| Caching/State | **Python dict** (không Redis cho MVP) | State management |
| Notebook | **Jupyter** | Evaluation + Demo charts |

### 8.3 Cấu trúc File MVP — **GỘP TẤT CẢ VÀO 1 FILE**

> ⚠️ **Nguyên tắc:** KHÔNG chia nhỏ thành hàng chục file. Toàn bộ AI logic nằm trong `ai_engine.py`. Backend chỉ cần `import ai_engine` và gọi hàm.

```
VAIC2026/
├── docs/
│   └── AI_Patient_Journey_Orchestrator_Technical_Workflow.md  ← File này
│
├── ai_engine.py                  ← ⭐ FILE DUY NHẤT chứa toàn bộ AI logic
│   │
│   │  Bên trong file này chứa:
│   │  ┌─────────────────────────────────────────────────────┐
│   │  │  # ============ SECTION 1: CONFIG ===============  │
│   │  │  HOSPITAL_CONFIG = {...}                            │
│   │  │  SLACK_FACTORS = {...}                              │
│   │  │  TRAVEL_TIME_MATRIX = {...}                         │
│   │  │                                                     │
│   │  │  # ============ SECTION 2: SIMULATOR ============  │
│   │  │  class HospitalSimulator:  # SimPy engine           │
│   │  │                                                     │
│   │  │  # ============ SECTION 3: PREDICTION ===========  │
│   │  │  class DurationPredictor:  # LightGBM wrapper       │
│   │  │      def train(event_log_df) → model                │
│   │  │      def predict(features) → predicted_duration     │
│   │  │                                                     │
│   │  │  # ============ SECTION 4: OPTIMIZATION =========  │
│   │  │  class JourneyScheduler:  # CP-SAT wrapper          │
│   │  │      def schedule(patients, predictions) → plans    │
│   │  │                                                     │
│   │  │  # ============ SECTION 5: COORDINATION =========  │
│   │  │  def tier_a_local_adjust(plan, state) → adjustment  │
│   │  │  def handle_event(event, schedule, state) → action  │
│   │  │                                                     │
│   │  │  # ============ SECTION 6: API ENTRY POINT ======  │
│   │  │  def predict_and_schedule(patient_data) → JSON      │
│   │  │  def update_status(patient_id, event) → JSON        │
│   │  │  def get_dashboard_state() → JSON                   │
│   │  └─────────────────────────────────────────────────────┘
│
├── evaluation.ipynb              ← Jupyter Notebook cho Bước 3 (charts, comparison)
│
├── data/
│   └── synthetic/                # SimPy generated data (CSV nếu cần persist)
│
├── models/
│   └── lgbm_duration.pkl         # Trained LightGBM model (saved)
│
├── Goal.md
├── AI_Patient_Journey_Orchestrator.md
└── med_process.md
```

### 8.4 API Interface cho Backend

Backend chỉ cần gọi 3 hàm duy nhất từ `ai_engine.py`:

```python
# ============================================================
# Backend integration — 3 hàm duy nhất
# ============================================================
import ai_engine

# 1. Khi BN check-in → sinh lịch trình
journey_plan = ai_engine.predict_and_schedule({
    "patient_id": "BN-001",
    "patient_type": "RETURNING",
    "preferred_doctor_id": "BS-TRAN",
    "required_services": ["lab", "xray", "ultrasound", "consultation"],
    "priority": "NORMAL"
})
# Returns: {"patient_id": "BN-001", "tasks": [{"task_id": ..., "station": ..., "time_start": ..., "time_end": ...}, ...]}

# 2. Khi BN hoàn thành 1 trạm → cập nhật + kiểm tra Tier A
update_result = ai_engine.update_status("BN-001", {
    "event_type": "TASK_COMPLETE",
    "task_id": "lab-001",
    "actual_end_time": "2026-07-17T08:12:00"
})
# Returns: {"next_task": {...}, "adjusted": true/false, "adjustment_reason": "..."}

# 3. Dashboard polling → trạng thái toàn bệnh viện
dashboard = ai_engine.get_dashboard_state()
# Returns: {"patients": [...], "stations": [...], "metrics": {...}}
```

---

> **Tài liệu tham khảo nội bộ:**
> - [Goal.md](file:///D:/Code/VAIC2026/Goal.md) — Đề bài cuộc thi VAIC 2026
> - [AI_Patient_Journey_Orchestrator.md](file:///D:/Code/VAIC2026/AI_Patient_Journey_Orchestrator.md) — Kiến trúc ban đầu
> - [med_process.md](file:///D:/Code/VAIC2026/med_process.md) — Quy trình khám bệnh thực tế
