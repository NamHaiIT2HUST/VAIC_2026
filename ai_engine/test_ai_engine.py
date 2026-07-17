import pytest
import ai_engine

def test_config_exists():
    assert "ultrasound" in ai_engine.HOSPITAL_CONFIG
    assert ai_engine.SLACK_FACTORS["ultrasound"] == 0.15

def test_duration_predictor():
    predictor = ai_engine.DurationPredictor()
    base, slack = predictor.predict("ultrasound")
    assert base == 15
    assert slack == 15 * 0.15

def test_journey_scheduler():
    scheduler = ai_engine.JourneyScheduler()
    tasks = scheduler.schedule("BN-001", ["lab", "consultation"])
    assert len(tasks) == 2
    assert tasks[0]["station"] == "lab" # lab must precede consultation
    assert tasks[1]["station"] == "consultation"
    assert tasks[1]["time_start"] >= tasks[0]["time_end"]




def test_predict_and_schedule():
    data = {"patient_id": "BN-001", "required_services": ["lab", "consultation"]}
    result = ai_engine.predict_and_schedule(data)
    assert result["patient_id"] == "BN-001"
    assert len(result["tasks"]) == 2


def test_tier_a_local_adjust():
    plan = {"tasks": [{"task_id": "lab-001", "station": "lab_1", "time_start": 10}]}
    state = {"lab_1": "BUSY", "lab_2": "FREE"}
    # deviation is 15 (>10) -> no adjust
    res = ai_engine.tier_a_local_adjust(plan, state, current_time=26)
    assert res is None
    # deviation is 5 (<10), lab_1 busy, lab_2 free -> adjust
    res = ai_engine.tier_a_local_adjust(plan, state, current_time=15)
    assert res["new_station"] == "lab_2"

def test_update_status():
    result = ai_engine.update_status("BN-001", {"event": "DONE"})
    assert result["adjusted"] is False


def test_get_dashboard_state():
    result = ai_engine.get_dashboard_state()
    assert isinstance(result["patients"], list)
