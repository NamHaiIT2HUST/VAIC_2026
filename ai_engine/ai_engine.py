import math
from ortools.sat.python import cp_model

HOSPITAL_CONFIG = {
    "ultrasound": {"count": 1, "base_duration": 15, "name": "Siêu âm"},
    "lab": {"count": 1, "base_duration": 10, "name": "Xét nghiệm Sinh hóa"},
    "xray": {"count": 1, "base_duration": 10, "name": "X-Quang"},
    "consultation": {"count": 3, "base_duration": 20, "name": "Khám lâm sàng"},
}

SLACK_FACTORS = {
    "ultrasound": 0.15,
    "lab": 0.10,
    "xray": 0.05,
    "consultation": 0.10,
}

class DurationPredictor:
    def predict(self, station_type: str) -> tuple[float, float]:
        base = HOSPITAL_CONFIG.get(station_type, {"base_duration": 15})["base_duration"]
        slack = base * SLACK_FACTORS.get(station_type, 0.1)
        return base, slack

class JourneyScheduler:
    def __init__(self):
        self.predictor = DurationPredictor()

    def schedule(self, patient_id: str, required_services: list[str]) -> list[dict]:
        model = cp_model.CpModel()
        tasks = {}
        
        # Priority: lab > xray > ultrasound > consultation
        priority = {"lab": 1, "xray": 2, "ultrasound": 3, "consultation": 4}
        sorted_services = sorted(required_services, key=lambda s: priority.get(s, 99))
        
        for idx, srv in enumerate(sorted_services):
            base, slack = self.predictor.predict(srv)
            duration = math.ceil(base + slack)
            
            start_var = model.NewIntVar(0, 1440, f'start_{srv}')
            end_var = model.NewIntVar(0, 1440, f'end_{srv}')
            model.Add(end_var == start_var + duration)
            
            tasks[srv] = {"start": start_var, "end": end_var, "duration": duration}
            
            # Precedence constraint
            if idx > 0:
                prev_srv = sorted_services[idx - 1]
                model.Add(start_var >= tasks[prev_srv]["end"])
                
        # Objective: minimize makespan
        if sorted_services:
            last_srv = sorted_services[-1]
            model.Minimize(tasks[last_srv]["end"])
        
        solver = cp_model.CpSolver()
        status = solver.Solve(model)
        
        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            result = []
            for srv in sorted_services:
                result.append({
                    "station_code": srv,
                    "station_name": HOSPITAL_CONFIG.get(srv, {}).get("name", srv),
                    "estimated_wait": solver.Value(tasks[srv]["start"]),
                    "estimated_duration": tasks[srv]["duration"]
                })
            return result
        return []

def predict_and_schedule(patient_data):
    """
    Khi BN check-in -> sinh lịch trình
    """
    scheduler = JourneyScheduler()
    tasks = scheduler.schedule(
        patient_data.get("patient_id"), 
        patient_data.get("required_services", [])
    )
    return {"patient_id": patient_data.get("patient_id"), "tasks": tasks}

def tier_a_local_adjust(patient_plan, current_state, threshold_minutes=10, current_time=0):
    tasks = patient_plan.get("tasks", [])
    if not tasks: return None
    
    # Giả lập sự kiện máy X-Quang hỏng -> Ưu tiên chuyển Siêu âm lên trước
    # Tìm index của xray và ultrasound
    xray_idx = -1
    us_idx = -1
    for i, t in enumerate(tasks):
        if t["station_code"] == "xray":
            xray_idx = i
        elif t["station_code"] == "ultrasound":
            us_idx = i
            
    if xray_idx != -1 and us_idx != -1 and xray_idx < us_idx:
        # Swap X-Ray và Ultrasound
        tasks[xray_idx], tasks[us_idx] = tasks[us_idx], tasks[xray_idx]
        
        # Cập nhật lại thời gian chờ cho hợp lý
        current_wait = 0
        for t in tasks:
            t["estimated_wait"] = current_wait
            current_wait += t["estimated_duration"] + 5 # 5 mins wait buffer
            
        return {
            "patient_id": patient_plan.get("patient_id"),
            "old_order": [t["station_code"] for t in patient_plan.get("tasks")],
            "new_order": [t["station_code"] for t in tasks],
            "tasks": tasks
        }
        
    return None

def update_status(patient_id, event):
    return {"next_task": None, "adjusted": False, "adjustment_reason": ""}

def get_dashboard_state():
    return {"patients": [], "stations": [], "metrics": {}}
