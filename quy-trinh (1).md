# Quy trình nghiệp vụ — AI Patient Journey Orchestrator

> Tài liệu do **Member 5 (BA2 – UX/UI & QA)** biên soạn.
> Nguồn tham chiếu: QĐ 1313/QĐ-BYT (quy trình khám bệnh tại Khoa Khám bệnh) và QT.25.01 — Quy trình đón tiếp bệnh nhân và khám chữa bệnh ngoại trú tại Khu Tự nguyện 1, CS1, Bệnh viện Tim Hà Nội.
> Toàn bộ sơ đồ viết bằng **Mermaid** — GitHub tự render, không cần Figma.

---

## 1. Nhân vật (Actors)

| Ký hiệu | Vai trò | Dùng giao diện nào |
|---|---|---|
| BN | Bệnh nhân / người nhà | App bệnh nhân + màn hình LED sảnh + SMS |
| TĐ | Nhân viên tiếp đón / tư vấn | Web Dashboard – màn hình Tiếp đón |
| KT | Nhân viên kế toán / thu phí | Web Dashboard – màn hình Thu phí |
| ĐD | Điều dưỡng bàn phân phòng / trả kết quả | Web Dashboard – màn hình Điều phối |
| HDV | Hướng dẫn viên hành lang | App HDV (mobile web) |
| BS | Bác sĩ phòng khám | Web Dashboard – màn hình Phòng khám |
| KTV | Kỹ thuật viên CLS (XN, SA, XQ, CT, MRI) | Web Dashboard – màn hình CLS |
| QL | Quản lý bệnh viện | Web Dashboard – màn hình Giám sát |
| **AI** | AI Coordination Engine | Chạy nền, không có người dùng trực tiếp |

---

## 2. Quy trình HIỆN TẠI (AS-IS) — và các điểm nghẽn

```mermaid
flowchart TD
    A[BN đặt lịch online<br/>hoặc lấy số trực tiếp] --> B[Xếp hàng quầy tiếp đón<br/>khai thông tin, xuất trình BHYT/CCCD]
    B --> C[Quầy kế toán:<br/>thu phí / tiếp nhận BHYT]
    C --> D[Bàn đo dấu hiệu sinh tồn<br/>HA, chiều cao, cân nặng]
    D --> E[Bàn phân phòng<br/>phát số phòng khám]
    E --> F[Ngồi chờ gọi số<br/>tại sảnh phòng khám]
    F --> G[Bác sĩ khám lâm sàng]
    G --> H{Có chỉ định<br/>cận lâm sàng?}
    H -- Không --> N[Kê đơn]
    H -- Có --> I[BN tự đi làm từng chỉ định<br/>XN máu → SA tim → XQ → điện tim → ABI...]
    I --> J[Chờ đủ kết quả<br/>trả về phòng khám]
    J --> K[Quay lại phòng khám<br/>chờ gọi số lần 2]
    K --> L[Bác sĩ kết luận]
    L --> N
    N --> O[Bàn hẹn khám lại /<br/>thủ tục hành chính]
    O --> P[Kế toán duyệt đơn,<br/>thu phí chênh lệch]
    P --> Q[Quầy thuốc: lĩnh thuốc,<br/>ký nhận]
    Q --> R([Kết thúc])

    style B fill:#ffdddd
    style F fill:#ffdddd
    style I fill:#ffdddd
    style J fill:#ffdddd
    style K fill:#ffdddd
```

**5 điểm nghẽn (ô màu đỏ) — chính là 5 bài toán đề bài yêu cầu:**

| # | Điểm nghẽn | Hậu quả | Module AI xử lý |
|---|---|---|---|
| 1 | BN dồn vào cùng khung giờ (7h–9h), khung giờ khác trống | Quá tải đầu giờ, phòng khám nhàn buổi chiều | Appointment Coordination |
| 2 | Đi nhầm khu, xếp nhầm hàng, phải quay lại | Mất 15–30 phút/lượt | Patient Routing |
| 3 | Chờ mà không biết bao lâu nữa đến lượt | Lo lắng, không dám rời ghế, không dám đi ăn | Wait-time Estimation |
| 4 | Tự đi làm CLS theo thứ tự ngẫu nhiên | Ví dụ: đi siêu âm trước, XN máu sau → chờ thêm 45' kết quả máu | Service Sequencing |
| 5 | Máy hỏng / bác sĩ bận / cấp cứu chen ngang | Cả lịch trình vỡ, không ai báo BN | Real-time Adjustment |

---

## 3. Quy trình MỚI (TO-BE) — có AI Orchestrator

```mermaid
flowchart TD
    subgraph P1[GIAI ĐOẠN 1 — TRƯỚC KHI ĐẾN VIỆN]
        A1[BN đặt lịch trên App/Web<br/>chọn bác sĩ + triệu chứng] --> A2{{AI: Appointment Coordination<br/>Gợi ý khung giờ ít tải<br/>Giữ nguyên bác sĩ BN chọn}}
        A2 --> A3[BN xác nhận<br/>Nhận mã QR + khung giờ]
        A3 --> A4{{AI: dự đoán gói dịch vụ<br/>Sinh Journey Plan nháp}}
        A4 --> A5[App nhắc trước 1 ngày:<br/>giờ đến, nhịn ăn hay không,<br/>giấy tờ cần mang]
    end

    A5 --> B1

    subgraph P2[GIAI ĐOẠN 2 — TIẾP ĐÓN]
        B1[BN quét QR tại quầy/kiosk] --> B2{{AI: Patient Routing<br/>Phân loại: BHYT/dịch vụ,<br/>ưu tiên, tái khám/khám mới}}
        B2 --> B3[Hệ thống chỉ luồng cụ thể:<br/>Quầy số mấy → Bàn DHST →<br/>Phòng khám số mấy]
        B3 --> B4[App hiện: 'Bạn thứ 7,<br/>dự kiến vào khám 8:42']
    end

    B4 --> C1

    subgraph P3[GIAI ĐOẠN 3 — KHÁM & CẬN LÂM SÀNG]
        C1[Bác sĩ khám, ra chỉ định CLS<br/>trên phần mềm] --> C2{{AI: Service Sequencing Optimizer<br/>Input: hàng chờ mỗi máy, thời gian trả KQ,<br/>yêu cầu nhịn ăn, tình trạng thiết bị}}
        C2 --> C3[Journey Plan đẩy về App BN<br/>+ máy điều dưỡng + HDV]
        C3 --> C4[BN đi theo lộ trình:<br/>1. Lấy máu 8:50<br/>2. XQ 9:00 lúc máu đang chạy<br/>3. Siêu âm 9:20<br/>4. Về phòng khám 9:45]
        C4 --> C5{Có sự cố?<br/>máy hỏng / quá tải /<br/>cấp cứu chen ngang}
        C5 -- Có --> C6{{AI: Real-time Adjustment<br/>Tính lại thứ tự, đổi máy khác,<br/>đẩy notification cho BN}}
        C6 --> C4
        C5 -- Không --> C7[Đủ kết quả → AI báo<br/>'Mời BN quay lại phòng khám']
    end

    C7 --> D1

    subgraph P4[GIAI ĐOẠN 4 — KẾT LUẬN & RA VỀ]
        D1[Bác sĩ đọc KQ, kết luận, kê đơn] --> D2[App hiện đường đi:<br/>Kế toán → Quầy thuốc]
        D2 --> D3[Kế toán duyệt đơn]
        D3 --> D4[Lĩnh thuốc, ký nhận]
        D4 --> D5([Kết thúc — App hiện<br/>tổng thời gian & lịch tái khám])
    end

    style A2 fill:#d4edda
    style A4 fill:#d4edda
    style B2 fill:#d4edda
    style C2 fill:#d4edda
    style C6 fill:#d4edda
```

> **Nguyên tắc bất di bất dịch (ràng buộc cứng):** AI **không** đổi bác sĩ của bệnh nhân. AI chỉ tối ưu những gì *xung quanh* buổi khám: thứ tự dịch vụ, khung giờ, đường đi, thời gian chờ.

---

## 4. Ví dụ minh hoạ — chính là ví dụ trong đề bài

**Bệnh nhân cần: XN máu + Siêu âm + X-quang, rồi quay lại bác sĩ.**

```mermaid
gantt
    title Trước và sau khi có AI (BN vào khám 8:30)
    dateFormat HH:mm
    axisFormat %H:%M

    section Hiện tại (tự đi)
    Chờ siêu âm       :a1, 08:40, 40m
    Siêu âm           :a2, after a1, 15m
    Chờ X-quang       :a3, after a2, 25m
    X-quang           :a4, after a3, 10m
    Chờ lấy máu       :a5, after a4, 20m
    Lấy máu           :a6, after a5, 5m
    Chờ KQ máu        :a7, after a6, 45m
    Chờ gọi số lần 2  :a8, after a7, 20m

    section Có AI (theo Journey Plan)
    Lấy máu ngay      :b1, 08:40, 10m
    X-quang (máu đang chạy) :b2, after b1, 15m
    Siêu âm           :b3, after b2, 25m
    Đệm / KQ về đủ    :b4, after b3, 10m
    Vào gặp bác sĩ    :b5, after b4, 0m
```

Ý tưởng cốt lõi: **việc gì trả kết quả lâu nhất thì làm trước** (XN máu ~45'), rồi chèn các việc ngắn vào lúc chờ. Tiết kiệm ~60–70 phút.

---

## 5. Sơ đồ luồng màn hình (Screen Flow) — thay cho wireframe Figma

### 5.1. App Bệnh nhân

```mermaid
flowchart LR
    S0[Đăng nhập / OTP] --> S1[Trang chủ]
    S1 --> S2[Đặt lịch khám]
    S2 --> S2a[Chọn chuyên khoa + bác sĩ]
    S2a --> S2b[AI gợi ý khung giờ<br/>xanh = vắng, đỏ = đông]
    S2b --> S2c[Xác nhận → Mã QR]
    S1 --> S3[**Hành trình của tôi**<br/>MÀN HÌNH CHÍNH]
    S3 --> S3a[Thanh tiến trình:<br/>Tiếp đón ✓ → Khám ✓ →<br/>CLS ⏳ → Kết luận → Thuốc]
    S3 --> S3b[Việc tiếp theo:<br/>Phòng 305, còn 6 người,<br/>dự kiến 9:12]
    S3 --> S3c[Bản đồ chỉ đường trong viện]
    S3 --> S3d[🔔 Thông báo thay đổi<br/>'Máy SA số 2 hỏng,<br/>bạn chuyển sang phòng 210']
    S1 --> S4[Lịch sử khám + Đơn thuốc]
```

**Mô tả 3 màn hình quan trọng nhất (để Tech Lead code, để BA1 demo):**

**M1 — Chọn khung giờ (Appointment Coordination)**
```
┌──────────────────────────────┐
│  BS. Nguyễn Văn A – Tim mạch │
│  Thứ 3, 12/08               │
├──────────────────────────────┤
│  07:30 🔴 Rất đông (~45' chờ)│
│  08:30 🔴 Đông    (~35' chờ) │
│  09:30 🟡 Vừa     (~15' chờ) │
│  10:30 🟢 Vắng    (~5'  chờ) │  ← AI gợi ý
│  14:00 🟢 Vắng    (~5'  chờ) │
├──────────────────────────────┤
│  💡 Chọn 10:30 để tiết kiệm  │
│     khoảng 40 phút chờ       │
│         [ XÁC NHẬN ]         │
└──────────────────────────────┘
```

**M2 — Hành trình của tôi (Journey Tracker)**
```
┌──────────────────────────────┐
│  Hành trình hôm nay   ⏱ 47'  │
├──────────────────────────────┤
│  ✓ Tiếp đón          08:12   │
│  ✓ Đo sinh hiệu      08:20   │
│  ✓ Khám – BS. A      08:35   │
│  ▶ ĐANG LÀM: Lấy máu         │
│      Tầng 1, quầy 3          │
│  ○ X-quang     ~09:00 P.108  │
│  ○ Siêu âm tim ~09:20 P.210  │
│  ○ Gặp lại BS  ~09:50 P.305  │
├──────────────────────────────┤
│  [ XEM ĐƯỜNG ĐI ]            │
└──────────────────────────────┘
```

**M3 — Màn hình LED sảnh chờ**
```
┌───────────────────────────────────────┐
│  PHÒNG KHÁM 305 – BS. NGUYỄN VĂN A    │
│                                       │
│      ĐANG KHÁM:  3 0 5 – 0 1 2        │
│                                       │
│  Tiếp theo: 013, 014, 015             │
│  Số 020 → dự kiến 09:35               │
└───────────────────────────────────────┘
```

### 5.2. Dashboard nhân viên

```mermaid
flowchart LR
    T0[Đăng nhập theo vai trò] --> T1{Vai trò?}
    T1 -- Tiếp đón --> T2[Quét QR / tra cứu BN<br/>→ AI gợi ý luồng đi]
    T1 -- Bác sĩ --> T3[Danh sách BN chờ<br/>+ Ra chỉ định CLS<br/>→ AI sinh Journey Plan]
    T1 -- Điều dưỡng --> T4[Bảng điều phối:<br/>ai đang ở đâu, KQ nào đã về]
    T1 -- KTV CLS --> T5[Hàng chờ máy<br/>+ Nút báo 'Máy hỏng']
    T5 --> T5a{{AI tự tính lại<br/>toàn bộ BN bị ảnh hưởng}}
    T1 -- Quản lý --> T6[Heatmap tắc nghẽn<br/>+ Tỷ lệ sử dụng thiết bị<br/>+ Thời gian chờ TB]
```

**M4 — Bảng điều phối của Điều dưỡng (màn hình "wow" khi demo)**
```
┌──────────────────────────────────────────────────────┐
│  ĐIỀU PHỐI – KHU TỰ NGUYỆN 1        🟢 Bình thường   │
├──────────────────────────────────────────────────────┤
│  Khu vực      | Đang chờ | Chờ TB | Thiết bị        │
│  XN máu       |    8     |  12'   | 🟢 2/2 hoạt động│
│  Siêu âm tim  |   14     |  38'   | 🔴 1/2 (SA2 hỏng)│
│  X-quang      |    3     |   6'   | 🟢 1/1          │
│  Phòng khám305|    6     |  22'   | 🟢              │
├──────────────────────────────────────────────────────┤
│  ⚠️ AI đề xuất: chuyển 5 BN từ SA tim sang khung     │
│     10:30 và làm XQ trước.  [ ÁP DỤNG ] [ BỎ QUA ]   │
└──────────────────────────────────────────────────────┘
```

---

## 6. Luồng xử lý sự cố (Real-time Adjustment) — sequence diagram

```mermaid
sequenceDiagram
    participant KTV as KTV Siêu âm
    participant SYS as Hệ thống
    participant AI as AI Engine
    participant DD as Điều dưỡng
    participant BN as App Bệnh nhân

    KTV->>SYS: Bấm "Máy SA2 hỏng, dự kiến 60'"
    SYS->>AI: Sự kiện EQUIPMENT_DOWN
    AI->>AI: Tìm 14 BN có SA tim trong Journey Plan
    AI->>AI: Tính lại thứ tự: đảo XQ/XN lên trước,<br/>dồn SA sang máy SA1 + khung giờ mới
    AI->>DD: Đề xuất phương án (chờ duyệt)
    DD->>AI: Bấm "Áp dụng"
    AI->>BN: Push: "Lịch của bạn đã đổi:<br/>đi X-quang P.108 trước, siêu âm lúc 10:15"
    AI->>SYS: Cập nhật hàng chờ tất cả khu vực
    Note over DD,BN: Không ai phải chạy đi thông báo thủ công
```

---

## 7. Ràng buộc cứng (Hard constraints) — AI KHÔNG được vi phạm

1. Không đổi bác sĩ mà bệnh nhân đã chọn (tính liên tục điều trị).
2. Bệnh nhân ưu tiên (theo QĐ 154 của BVT) luôn được xếp trước.
3. Ca cấp cứu chen ngang tuyệt đối, mọi lịch khác giãn ra.
4. Chỉ định nhịn ăn (XN máu, siêu âm bụng) phải xếp trước các dịch vụ khác trong buổi sáng.
5. Không đảo thứ tự nếu chỉ định có ràng buộc y khoa (ví dụ: siêu âm bụng phải làm khi bàng quang căng).
6. Kết quả CLS phải về đủ mới cho BN vào gặp bác sĩ kết luận.

> Danh sách này Member 2 (Domain Expert) chốt và ghi vào `/data/clinical_rules.json`. Member 5 chỉ mô tả để thiết kế giao diện.

---

## 8. Chỉ số đo (khớp tiêu chí chấm)

| Tiêu chí đề bài | Chỉ số hiển thị trên Dashboard |
|---|---|
| Giảm thời gian chờ trung bình | Thời gian chờ TB / bệnh nhân (phút) |
| Giảm ùn tắc | Số BN chờ cùng lúc theo khu vực (heatmap) |
| Tăng công suất phòng khám & thiết bị | % thời gian máy hoạt động / tổng giờ mở |
| BN chủ động theo dõi | % BN mở App xem Journey ≥ 1 lần |
