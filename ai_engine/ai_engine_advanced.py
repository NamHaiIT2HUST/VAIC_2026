import math
import numpy as np
from ortools.sat.python import cp_model

HOSPITAL_CONFIG = {
    "ultrasound": {"count": 1, "base_duration": 15, "turnaround": 10, "fasting": True},
    "lab": {"count": 1, "base_duration": 10, "turnaround": 45, "fasting": True},
    "xray": {"count": 1, "base_duration": 10, "turnaround": 15, "fasting": False},
    "consultation": {"count": 3, "base_duration": 20, "turnaround": 0, "fasting": False},
}

class QuantileDurationPredictor:
    def predict_quantiles(self, station_type: str) -> dict:
        """Returns quantiles for alpha = [0.1, 0.5, 0.9]"""
        base = HOSPITAL_CONFIG[station_type]["base_duration"]
        # In real life, LightGBM (objective='quantile', alpha=0.x) would output this.
        # We mock higher variance for complex imaging or consultations
        variance = 0.2 if station_type in ["ultrasound", "consultation", "mri", "ct"] else 0.1
        
        # Asymmetric tail: delay is more likely than being early
        p50 = base
        p10 = base * (1 - variance)
        p90 = base * (1 + variance * 1.5)
        
        return {"p10": p10, "p50": p50, "p90": p90}

    def predict(self, station_type: str) -> tuple[float, float]:
        quantiles = self.predict_quantiles(station_type)
        base = quantiles["p50"]
        # CI-driven dynamic slack: distance between upper bound and median
        slack = quantiles["p90"] - quantiles["p50"] 
        return base, slack

class AdvancedJourneyScheduler:
    def __init__(self):
        self.predictor = QuantileDurationPredictor()

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

class TierBGlobalCoordinator:
    def __init__(self, deviation_threshold=0.2, replan_interval=30, change_cap=2):
        self.deviation_threshold = deviation_threshold
        self.replan_interval = replan_interval
        self.change_cap = change_cap

    def coverage_probability(self, plan_durations: list[float], actual_durations: list[float]) -> float:
        """Metric to evaluate if predicted duration covered the actual duration"""
        if not plan_durations:
            return 1.0
        covered = sum(1 for p, a in zip(plan_durations, actual_durations) if a <= p)
        return covered / len(plan_durations)

    def stability_check(self, old_plan: list[dict], new_plan: list[dict]) -> bool:
        """Checks if the new plan causes too much chaos (nervousness)"""
        old_map = {t["station"]: t["time_start"] for t in old_plan}
        changes = 0
        for t in new_plan:
            old_start = old_map.get(t["station"])
            if old_start is not None and abs(t["time_start"] - old_start) > 5:
                changes += 1
        return changes <= self.change_cap

    def should_replan(self, current_time: int, last_plan_time: int, total_deviation: int, total_expected_duration: int) -> dict:
        """Determines if global replan is triggered based on interval or deviation threshold"""
        reason = None
        if current_time - last_plan_time >= self.replan_interval:
            reason = "PERIODIC_INTERVAL"
        else:
            deviation_ratio = total_deviation / total_expected_duration if total_expected_duration > 0 else 0
            if deviation_ratio > self.deviation_threshold:
                reason = f"DEVIATION_RATIO_{deviation_ratio:.2f}"
                
        return {"trigger": reason is not None, "reason": reason}

# Tier B: TRIGGER RE-OPTIMIZATION (MVP Implementation)
def trigger_reoptimization(current_state, patient_plans, current_time, last_plan_time, total_deviation, total_expected):
    """
    Kích hoạt Tier B Coordinator trong bản Advanced để đánh giá và chạy lại CP-SAT toàn cục.
    """
    coordinator = TierBGlobalCoordinator()
    decision = coordinator.should_replan(current_time, last_plan_time, total_deviation, total_expected)
    
    if decision["trigger"]:
        # Pseudo-logic: call AdvancedJourneyScheduler for all patients
        return {"replan_triggered": True, "reason": decision["reason"], "new_plans": "RE-OPTIMIZED_PLANS"}
    
    return {"replan_triggered": False, "reason": "System is stable"}
