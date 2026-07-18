import pytest
import simpy
from hospital_simulation import HospitalEnvironment
from ai_engine_advanced import HOSPITAL_CONFIG

def test_hospital_environment_init():
    env = simpy.Environment()
    hospital = HospitalEnvironment(env, HOSPITAL_CONFIG)
    assert 'lab' in hospital.resources
    assert hospital.resources['lab'].capacity == HOSPITAL_CONFIG['lab']['count']
    assert hospital.resources['consultation'].capacity == HOSPITAL_CONFIG['consultation']['count']

from hospital_simulation import patient_journey
import ai_engine_advanced

def test_patient_journey():
    env = simpy.Environment()
    hospital = HospitalEnvironment(env, ai_engine_advanced.HOSPITAL_CONFIG)
    metrics = {"completed_patients": 0}
    
    # We yield the process so the environment runs it
    env.process(patient_journey(env, "Patient_1", hospital, ["lab"], metrics))
    env.run()
    
    assert metrics["completed_patients"] == 1

from hospital_simulation import run_simulation

def test_run_simulation():
    # 5 patients arriving exactly every 2 mins
    results = run_simulation(num_patients=5, interarrival_time=2)
    assert results["total_patients"] == 5
    assert results["total_sim_time"] > 0


