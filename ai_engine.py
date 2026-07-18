"""
AI Engine – Bộ điều phối lộ trình khám (single source of truth).

Bao trùm 3 yêu cầu của đề bài:
  - Service-sequencing: tự sắp thứ tự xét nghiệm / chẩn đoán hình ảnh dựa trên
    result-turnaround (kết quả về lâu -> làm trước), fasting (nhịn ăn -> ưu tiên),
    và equipment status (phòng đang bận / hỏng -> né hoặc chờ).
  - Wait-time estimation: mỗi trạm trả về estimated_wait (số phút bệnh nhân phải chờ
    trước khi tới lượt), tính từ hàng đợi thực tế của phòng.
  - Real-time adjustment: khi phòng quá tải / thiết bị hỏng / có ca cấp cứu, gọi
    reoptimize_plan() để CHẠY LẠI đúng bộ solver này -> luôn chỉ có một logic.
"""

import math
from ortools.sat.python import cp_model

# station_code -> cấu hình.
#   count:          số phòng / thiết bị (dùng cho mô phỏng công suất)
#   base_duration:  thời gian thao tác trung bình (phút)
#   turnaround:     thời gian CHỜ KẾT QUẢ sau khi làm xong (phút) -> bác sĩ chỉ khám
#                   lại khi mọi kết quả đã về
#   fasting:        có cần nhịn ăn không -> nên làm sớm
#   name:           tên hiển thị tiếng Việt
HOSPITAL_CONFIG = {
    "lab":          {"count": 2, "base_duration": 10, "turnaround": 45, "fasting": True,  "name": "Xét nghiệm Sinh hóa"},
    "ultrasound":   {"count": 1, "base_duration": 15, "turnaround": 10, "fasting": True,  "name": "Siêu âm"},
    "xray":         {"count": 1, "base_duration": 10, "turnaround": 15, "fasting": False, "name": "X-Quang"},
    "ct":           {"count": 1, "base_duration": 20, "turnaround": 30, "fasting": False, "name": "Chụp CT"},
    "mri":          {"count": 1, "base_duration": 30, "turnaround": 30, "fasting": False, "name": "Chụp MRI"},
    "consultation": {"count": 3, "base_duration": 20, "turnaround": 0,  "fasting": False, "name": "Khám lâm sàng"},
}

# Slack (đệm thời gian) cho mỗi loại – mô phỏng khoảng tin cậy p90 của mô hình dự báo.
# Ảnh chụp / khám phức tạp -> biến động lớn hơn -> đệm dày hơn.
SLACK_FACTORS = {
    "lab": 0.10, "ultrasound": 0.20, "xray": 0.10,
    "ct": 0.20, "mri": 0.20, "consultation": 0.15,
}


class DurationPredictor:
    """Dự báo thời lượng + đệm cho từng trạm.

    Trong bản thật, đây là nơi cắm mô hình LightGBM (objective='quantile').
    Ở đây trả về p50 (median) làm thời lượng và (p90 - p50) làm slack động.
    """

    def predict(self, station_type: str) -> tuple[float, float]:
        cfg = HOSPITAL_CONFIG[station_type]
        base = cfg["base_duration"]
        slack = base * SLACK_FACTORS.get(station_type, 0.10)
        return base, slack


class JourneyScheduler:
    def __init__(self):
        self.predictor = DurationPredictor()

    def schedule(
        self,
        patient_id: str,
        required_services: list[str],
        busy_until: dict | None = None,
        current_time: int = 0,
    ) -> list[dict]:
        """Sinh lộ trình tối ưu cho MỘT bệnh nhân.

        busy_until:   {station_code: phút_phòng_mới_rảnh} – trạng thái thời gian thực
                      của phòng/thiết bị (bận, hỏng, quá tải). Bệnh nhân phải chờ
                      tới mốc đó mới vào được trạm.
        current_time: mốc "bây giờ" (phút). Khi khám lần đầu = 0; khi điều phối lại
                      giữa chừng thì truyền thời điểm hiện tại vào.
        """
        busy_until = busy_until or {}
        services = [s for s in required_services if s in HOSPITAL_CONFIG]
        if not services:
            return []

        model = cp_model.CpModel()
        tasks = {}
        intervals = []
        horizon = 2000

        for srv in services:
            base, slack = self.predictor.predict(srv)
            duration = math.ceil(base + slack)

            start_var = model.NewIntVar(0, horizon, f"start_{srv}")
            end_var = model.NewIntVar(0, horizon, f"end_{srv}")
            interval_var = model.NewIntervalVar(start_var, duration, end_var, f"iv_{srv}")

            # Không thể bắt đầu trước thời điểm hiện tại.
            model.Add(start_var >= current_time)

            # Equipment status: phòng bận/hỏng -> phải chờ tới khi rảnh.
            if srv in busy_until:
                model.Add(start_var >= busy_until[srv])

            tasks[srv] = {"start": start_var, "end": end_var, "duration": duration}
            intervals.append(interval_var)

        # Một bệnh nhân không thể ở hai nơi cùng lúc.
        model.AddNoOverlap(intervals)

        # Bác sĩ chỉ khám lại KHI MỌI KẾT QUẢ ĐÃ VỀ:
        # consultation.start >= mỗi_xét_nghiệm.end + turnaround(kết quả).
        # Vì tối thiểu hoá makespan, solver sẽ tự đẩy xét nghiệm có turnaround dài nhất
        # (vd: máu 45') lên làm TRƯỚC, rồi lồng các xét nghiệm khác vào lúc chờ kết quả.
        if "consultation" in services:
            consult_start = tasks["consultation"]["start"]
            for srv in services:
                if srv != "consultation":
                    turnaround = HOSPITAL_CONFIG[srv].get("turnaround", 0)
                    model.Add(consult_start >= tasks[srv]["end"] + turnaround)

        # Fasting: các xét nghiệm cần nhịn ăn nên làm trước các xét nghiệm không cần.
        fasting_tests = [s for s in services if HOSPITAL_CONFIG[s].get("fasting")]
        non_fasting_tests = [
            s for s in services
            if not HOSPITAL_CONFIG[s].get("fasting") and s != "consultation"
        ]
        for f in fasting_tests:
            for nf in non_fasting_tests:
                model.Add(tasks[nf]["start"] >= tasks[f]["end"])

        # Mục tiêu: tối thiểu hoá tổng thời gian hoàn thành (makespan).
        makespan = model.NewIntVar(0, horizon, "makespan")
        for srv in services:
            model.Add(makespan >= tasks[srv]["end"])
        model.Minimize(makespan)

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 5.0
        status = solver.Solve(model)

        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            return []

        # Gói kết quả + tính estimated_wait (thời gian chờ trống trước mỗi trạm).
        rows = []
        for srv in services:
            start = solver.Value(tasks[srv]["start"])
            end = solver.Value(tasks[srv]["end"])
            rows.append({
                "task_id": f"{srv}-001",
                "station_code": srv,
                "station": srv,  # giữ lại cho tương thích cũ
                "station_name": HOSPITAL_CONFIG[srv]["name"],
                "time_start": start,
                "time_end": end,
                "estimated_duration": end - start,
            })

        rows.sort(key=lambda x: x["time_start"])

        prev_end = current_time
        for r in rows:
            r["estimated_wait"] = max(0, r["time_start"] - prev_end)
            prev_end = r["time_end"]

        return rows


def predict_and_schedule(patient_data: dict) -> dict:
    """Khi bệnh nhân check-in / bác sĩ chỉ định -> sinh lộ trình."""
    scheduler = JourneyScheduler()
    tasks = scheduler.schedule(
        patient_data.get("patient_id"),
        patient_data.get("required_services", []),
        busy_until=patient_data.get("busy_until") or {},
        current_time=patient_data.get("current_time", 0),
    )
    return {"patient_id": patient_data.get("patient_id"), "tasks": tasks}


# ---------------------------------------------------------------------------
# REAL-TIME ADJUSTMENT
# ---------------------------------------------------------------------------
def _parse_current_state(current_state: dict, current_time: int) -> dict:
    """Chuyển trạng thái phòng thời gian thực -> busy_until (mốc phút phòng rảnh).

    Chấp nhận nhiều định dạng cho linh hoạt:
      {"xray": "DOWN"}                         -> thiết bị hỏng
      {"xray": {"status": "BUSY", "busy_until": 30}}
      {"xray": {"status": "DOWN"}}             -> hỏng, coi như trễ 60'
      {"xray": 30}                             -> rảnh sau phút 30
    """
    DOWN_DELAY = 60  # thiết bị hỏng: đẩy trạm này ra sau ~60' để làm việc khác trước
    busy_until = {}
    for code, val in (current_state or {}).items():
        if code not in HOSPITAL_CONFIG:
            continue
        if isinstance(val, (int, float)):
            busy_until[code] = int(val)
        elif isinstance(val, str):
            if val.upper() in ("DOWN", "BUSY", "OVERLOADED"):
                busy_until[code] = current_time + DOWN_DELAY
        elif isinstance(val, dict):
            if "busy_until" in val and val["busy_until"] is not None:
                busy_until[code] = int(val["busy_until"])
            elif str(val.get("status", "")).upper() in ("DOWN", "BUSY", "OVERLOADED"):
                busy_until[code] = current_time + DOWN_DELAY
    return busy_until


def reoptimize_plan(patient_plan: dict, current_state: dict, current_time: int = 0) -> dict:
    """Điều phối lại khi có sự cố (phòng quá tải, thiết bị hỏng, ca cấp cứu chen ngang).

    Chạy LẠI đúng JourneyScheduler với trạng thái phòng mới -> đảm bảo chỉ có một
    logic sắp lịch duy nhất. Trả về đúng shape mà backend Go đang chờ:
        {"adjusted": bool, "new_plan": {"tasks": [...]}}
    """
    old_tasks = patient_plan.get("tasks", []) or []

    # Lấy danh sách trạm CHƯA hoàn thành từ kế hoạch cũ (hỗ trợ cả station_code & station).
    services = []
    for t in old_tasks:
        code = t.get("station_code") or t.get("station")
        if code and code in HOSPITAL_CONFIG:
            services.append(code)

    if not services:
        return {"adjusted": False, "new_plan": {"tasks": []}}

    busy_until = _parse_current_state(current_state, current_time)

    scheduler = JourneyScheduler()
    new_rows = scheduler.schedule(
        patient_plan.get("patient_id", "UNKNOWN"),
        services,
        busy_until=busy_until,
        current_time=current_time,
    )

    new_plan = {"tasks": new_rows}

    # Có thực sự thay đổi so với kế hoạch cũ không? (đổi thứ tự hoặc đổi thời gian chờ)
    old_order = [t.get("station_code") or t.get("station") for t in old_tasks]
    new_order = [r["station_code"] for r in new_rows]
    old_waits = [t.get("estimated_wait") for t in old_tasks]
    new_waits = [r["estimated_wait"] for r in new_rows]

    adjusted = bool(busy_until) and (old_order != new_order or old_waits != new_waits)

    return {"adjusted": adjusted, "new_plan": new_plan}


# Tương thích ngược: tên hàm cũ vẫn còn, nay uỷ quyền cho reoptimize_plan.
def tier_a_local_adjust(patient_plan, current_state, threshold_minutes=10, current_time=0):
    return reoptimize_plan(patient_plan, current_state, current_time)
