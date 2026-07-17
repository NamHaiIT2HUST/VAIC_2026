import ai_engine
import pprint

print("=========================================================================")
print("USE CASE 1: DỰ BÁO THỜI GIAN CHỜ (WAITING TIME) TRONG CP-SAT (TẦNG 3)")
print("=========================================================================")
# Ở bản Happy Path hiện tại, các phòng luôn rỗng nên thời gian chờ = 0.
# Để kiểm nghiệm thực tế, ta mô phỏng: Phòng X-Quang hiện đang kẹt, 30 phút nữa mới trống.
# CP-SAT sẽ tự động tính toán 'thời gian chờ' (waiting time) cho bệnh nhân.

class RealisticJourneyScheduler(ai_engine.JourneyScheduler):
    def schedule_with_busy_stations(self, patient_id: str, required_services: list[str], busy_until: dict) -> list[dict]:
        import math
        from ortools.sat.python import cp_model
        
        model = cp_model.CpModel()
        tasks = {}
        priority = {"lab": 1, "xray": 2, "ultrasound": 3, "consultation": 4}
        sorted_services = sorted(required_services, key=lambda s: priority.get(s, 99))
        
        for idx, srv in enumerate(sorted_services):
            base, slack = self.predictor.predict(srv)
            duration = math.ceil(base + slack)
            
            start_var = model.NewIntVar(0, 1440, f'start_{srv}')
            end_var = model.NewIntVar(0, 1440, f'end_{srv}')
            model.Add(end_var == start_var + duration)
            
            # CONSTRAINT MỚI: Trạm bị bận, bệnh nhân PHẢI CHỜ đến khi trạm trống
            if srv in busy_until:
                model.Add(start_var >= busy_until[srv])
                
            tasks[srv] = {"start": start_var, "end": end_var, "duration": duration}
            
            if idx > 0:
                prev_srv = sorted_services[idx - 1]
                model.Add(start_var >= tasks[prev_srv]["end"])
                
        last_srv = sorted_services[-1]
        model.Minimize(tasks[last_srv]["end"])
        
        solver = cp_model.CpSolver()
        status = solver.Solve(model)
        
        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            result = []
            for idx, srv in enumerate(sorted_services):
                start = solver.Value(tasks[srv]["start"])
                # Tính thời gian chờ (gap giữa lúc kết thúc task trước và lúc bắt đầu task này)
                waiting_time = 0
                if idx > 0:
                    prev_end = solver.Value(tasks[sorted_services[idx-1]]["end"])
                    waiting_time = start - prev_end
                elif start > 0:
                    waiting_time = start # Phải chờ ngay từ lúc đến
                
                result.append({
                    "station": srv,
                    "time_start": start,
                    "time_end": solver.Value(tasks[srv]["end"]),
                    "waiting_time_min": waiting_time
                })
            return result
        return []

scheduler = RealisticJourneyScheduler()
# Kịch bản: Bệnh nhân làm Lab (mất ~11p) rồi sang X-Ray. 
# Khổ nỗi X-Ray 30 phút nữa mới rảnh.
plan = scheduler.schedule_with_busy_stations("BN-001", ["lab", "xray", "consultation"], busy_until={"xray": 30})

print("Kịch bản: Phòng X-Ray kẹt 30 phút.")
print("Lịch trình được CP-SAT tối ưu và sinh ra khoảng 'Waiting Time' chính xác:\n")
pprint.pprint(plan)


print("\n\n=========================================================================")
print("USE CASE 2: XỬ LÝ THỜI GIAN CHỜ PHÁT SINH THỰC TẾ VỚI TIER A (TẦNG 4)")
print("=========================================================================")
# Kịch bản: BN có lịch khám Siêu âm (ultrasound_1) lúc phút 20.
# Tuy nhiên hiện tại là phút 28 (BN đã phải chờ 8 phút do phòng siêu âm kẹt đột xuất).
# Hệ thống Tier A quét thấy ultrasound_2 đang trống. Nó sẽ lập tức "vớt" BN sang ultrasound_2 để cắt thời gian chờ.

plan_tier_a = {
    "patient_id": "BN-002", 
    "tasks": [
        {"task_id": "us-001", "station": "ultrasound_1", "time_start": 20}
    ]
}

# Trạng thái bệnh viện thực tế (ultrasound_1 đang bận, ultrasound_2 rảnh)
hospital_state = {
    "ultrasound_1": "BUSY",
    "ultrasound_2": "FREE"
}

# Gọi hàm Tier A xử lý ở phút 28 (Trễ 8 phút)
adjustment = ai_engine.tier_a_local_adjust(
    patient_plan=plan_tier_a, 
    current_state=hospital_state, 
    threshold_minutes=10, 
    current_time=28
)

print("Kịch bản: BN trễ 8 phút so với lịch hẹn tại ultrasound_1 (BUSY). ultrasound_2 (FREE).")
print("Phản hồi từ Tier A Engine (Tự động Re-assign để cắt thời gian chờ):")
pprint.pprint(adjustment)
