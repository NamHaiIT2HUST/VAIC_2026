"""
ai_engine_advanced – GIỮ NGUYÊN tên để chatbot_engine.py và hospital_simulation.py
không phải sửa import, NHƯNG toàn bộ logic nay dùng chung ai_engine.py
(một nguồn sự thật duy nhất). Không còn hai bộ sắp lịch lệch nhau.
"""

from ai_engine import (
    HOSPITAL_CONFIG,
    SLACK_FACTORS,
    DurationPredictor,
    JourneyScheduler,
    predict_and_schedule,
    reoptimize_plan,
    tier_a_local_adjust,
)

# Bí danh cho tương thích ngược.
QuantileDurationPredictor = DurationPredictor
AdvancedJourneyScheduler = JourneyScheduler


class TierBGlobalCoordinator:
    """Tầng điều phối toàn cục: quyết định KHI NÀO chạy lại tối ưu cho nhiều bệnh nhân."""

    def __init__(self, deviation_threshold=0.2, replan_interval=30, change_cap=2):
        self.deviation_threshold = deviation_threshold
        self.replan_interval = replan_interval
        self.change_cap = change_cap

    def should_replan(self, current_time, last_plan_time, total_deviation, total_expected_duration):
        reason = None
        if current_time - last_plan_time >= self.replan_interval:
            reason = "PERIODIC_INTERVAL"
        else:
            ratio = total_deviation / total_expected_duration if total_expected_duration > 0 else 0
            if ratio > self.deviation_threshold:
                reason = f"DEVIATION_RATIO_{ratio:.2f}"
        return {"trigger": reason is not None, "reason": reason}

    def stability_check(self, old_plan, new_plan):
        """Tránh 'giật' lịch: chỉ chấp nhận nếu số trạm bị đổi giờ không quá change_cap."""
        old_map = {t.get("station_code") or t.get("station"): t.get("time_start") for t in old_plan}
        changes = 0
        for t in new_plan:
            key = t.get("station_code") or t.get("station")
            old_start = old_map.get(key)
            if old_start is not None and abs(t.get("time_start", 0) - old_start) > 5:
                changes += 1
        return changes <= self.change_cap


def trigger_reoptimization(current_state, patient_plans, current_time,
                           last_plan_time=0, total_deviation=0, total_expected=1):
    """Tầng B: đánh giá điều kiện, nếu cần thì chạy lại solver THẬT cho từng bệnh nhân.

    patient_plans: list các plan dạng {"patient_id":..., "tasks":[...]}.
    Trả về danh sách plan mới đã tối ưu (không còn chuỗi placeholder).
    """
    coordinator = TierBGlobalCoordinator()
    decision = coordinator.should_replan(current_time, last_plan_time, total_deviation, total_expected)

    if not decision["trigger"]:
        return {"replan_triggered": False, "reason": "System is stable", "new_plans": []}

    new_plans = []
    for plan in patient_plans:
        result = reoptimize_plan(plan, current_state, current_time)
        new_plans.append({
            "patient_id": plan.get("patient_id"),
            "adjusted": result["adjusted"],
            "tasks": result["new_plan"]["tasks"],
        })

    return {"replan_triggered": True, "reason": decision["reason"], "new_plans": new_plans}
