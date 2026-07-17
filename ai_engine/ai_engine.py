"""
AI Patient Journey Orchestrator - MVP Engine
"""
import math
from ortools.sat.python import cp_model

HOSPITAL_CONFIG = {
    "ultrasound": {"count": 1, "base_duration": 15},
    "lab": {"count": 1, "base_duration": 10},
    "xray": {"count": 1, "base_duration": 10},
    "consultation": {"count": 3, "base_duration": 20},
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
                
        # Objective: minimize makespan (end of last task)
        last_srv = sorted_services[-1]
        model.Minimize(tasks[last_srv]["end"])
        
        solver = cp_model.CpSolver()
        status = solver.Solve(model)
        
        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            result = []
            for srv in sorted_services:
                result.append({
                    "task_id": f"{srv}-001",
                    "station": srv,
                    "time_start": solver.Value(tasks[srv]["start"]),
                    "time_end": solver.Value(tasks[srv]["end"])
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
    
    next_task = tasks[0] # Simplification for MVP
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
