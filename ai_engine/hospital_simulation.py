import simpy
from ai_engine_advanced import HOSPITAL_CONFIG

class HospitalEnvironment:
    def __init__(self, env: simpy.Environment, config: dict):
        self.env = env
        self.resources = {
            station: simpy.Resource(env, capacity=specs["count"])
            for station, specs in config.items()
        }

from ai_engine_advanced import AdvancedJourneyScheduler, HOSPITAL_CONFIG

def patient_journey(env: simpy.Environment, name: str, hospital: HospitalEnvironment, required_services: list[str], metrics: dict):
    scheduler = AdvancedJourneyScheduler()
    # 1. Ask engine for schedule
    plan = scheduler.schedule(name, required_services)
    
    # 2. Follow the plan
    for task in plan:
        station = task["station"]
        expected_duration = task["time_end"] - task["time_start"]
        
        # Request resource
        with hospital.resources[station].request() as request:
            yield request
            # Simulate the service time
            yield env.timeout(expected_duration)
            
    # Record completion
    if "completed_patients" not in metrics:
        metrics["completed_patients"] = 0
    metrics["completed_patients"] += 1

import random

def patient_generator(env: simpy.Environment, hospital: HospitalEnvironment, num_patients: int, interarrival_time: int, metrics: dict):
    possible_services = [["lab", "consultation"], ["ultrasound", "consultation"], ["lab", "xray", "consultation"]]
    for i in range(num_patients):
        services = random.choice(possible_services)
        env.process(patient_journey(env, f"Patient_{i+1}", hospital, services, metrics))
        yield env.timeout(interarrival_time)

def run_simulation(num_patients: int, interarrival_time: int) -> dict:
    env = simpy.Environment()
    hospital = HospitalEnvironment(env, HOSPITAL_CONFIG)
    metrics = {"completed_patients": 0}
    
    env.process(patient_generator(env, hospital, num_patients, interarrival_time, metrics))
    env.run()
    
    return {
        "total_patients": metrics["completed_patients"],
        "total_sim_time": env.now
    }

