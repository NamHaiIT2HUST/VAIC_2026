import math
from ortools.sat.python import cp_model

HOSPITAL_CONFIG = {
    "ultrasound": {"count": 1, "base_duration": 15, "turnaround": 10, "name": "Siêu âm"},
    "lab": {"count": 1, "base_duration": 10, "turnaround": 45, "name": "Xét nghiệm Sinh hóa"},
    "xray": {"count": 1, "base_duration": 10, "turnaround": 15, "name": "X-Quang"},
    "consultation": {"count": 3, "base_duration": 20,"turnaround": 0, "name": "Khám lâm sàng"},
}

SLACK_FACTORS = {
    "ultrasound": 0.15,
    "lab": 0.10,
    "xray": 0.05,
    "consultation": 0.10,
}

class DurationPredictor:
    def predict(self, station_type: str) -> tuple[float, float]:
        """Returns (predicted_duration_min, slack_duration_min)"""
        base = HOSPITAL_CONFIG[station_type]["base_duration"]
        slack = base * SLACK_FACTORS[station_type]
        return base, slack

class JourneyScheduler:
    def __init__(self):
        self.predictor = DurationPredictor()

    def schedule(self, patient_id: str, required_services: list[str]) -> list[dict]:
        model = cp_model.CpModel()
        tasks = {}
        intervals = []
        
        for srv in required_services:
            base, slack = self.predictor.predict(srv)
            duration = math.ceil(base + slack)
            
            start_var = model.NewIntVar(0, 1440, f'start_{srv}')
            end_var = model.NewIntVar(0, 1440, f'end_{srv}')
            interval_var = model.NewIntervalVar(start_var, duration, end_var, f'interval_{srv}')
            
            tasks[srv] = {"start": start_var, "end": end_var, "duration": duration}
            intervals.append(interval_var)
            
        model.AddNoOverlap(intervals)
        
        if "consultation" in required_services:
            consult_start = tasks["consultation"]["start"]
            for srv in required_services:
                if srv != "consultation":
                    turnaround = HOSPITAL_CONFIG[srv].get("turnaround", 0)
                    model.Add(consult_start >= tasks[srv]["end"] + turnaround)
                    
        fasting_services = [s for s in required_services if HOSPITAL_CONFIG[s].get("fasting")]
        non_fasting_tests = [s for s in required_services if not HOSPITAL_CONFIG[s].get("fasting") and s != "consultation"]
        
        for fsrv in fasting_services:
            for nfsrv in non_fasting_tests:
                model.Add(tasks[nfsrv]["start"] >= tasks[fsrv]["end"])
                
        # Objective: minimize makespan
        makespan = model.NewIntVar(0, 2000, 'makespan')
        for srv in required_services:
            model.Add(makespan >= tasks[srv]["end"])
        model.Minimize(makespan)
        
        solver = cp_model.CpSolver()
        status = solver.Solve(model)
        
        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            result = []
            for srv in required_services:
                result.append({
                    "task_id": f"{srv}-001",
                    "station": srv,
                    "time_start": solver.Value(tasks[srv]["start"]),
                    "time_end": solver.Value(tasks[srv]["end"])
                })
            result.sort(key=lambda x: x["time_start"])
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
    
    next_task = tasks[0]
    planned_station = next_task["station"]
    deviation = abs(current_time - next_task["time_start"])
    
    if deviation > threshold_minutes:
        return None
        
    # Check if equivalent is free (e.g., if planned is lab_1, check lab_2)
    # Simple hardcoded mock logic for equivalence
    base_type = planned_station.split("_")[0] if "_" in planned_station else planned_station
    
    for alt_station, status in current_state.items():
        if alt_station.startswith(base_type) and status == "FREE" and alt_station != planned_station:
            next_task["station"] = alt_station
            return {
                "patient_id": patient_plan.get("patient_id"),
                "old_station": planned_station,
                "new_station": alt_station
            }
    return None

def update_status(patient_id, event):

    """
    Khi BN hoàn thành 1 trạm -> cập nhật + kiểm tra Tier A
    """
    return {"next_task": None, "adjusted": False, "adjustment_reason": ""}

def get_dashboard_state():
    """
    Dashboard polling -> trạng thái toàn bệnh viện
    """
    return {"patients": [], "stations": [], "metrics": {}}
