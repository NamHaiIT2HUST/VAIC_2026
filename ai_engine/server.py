from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
from ai_engine import predict_and_schedule, tier_a_local_adjust

app = FastAPI(title="AI Patient Orchestrator API")

class PatientData(BaseModel):
    patient_id: str
    required_services: list[str]

class AdjustRequest(BaseModel):
    patient_plan: dict
    current_state: dict
    threshold_minutes: int = 10
    current_time: int = 0

@app.post("/api/ai/schedule")
def schedule(data: PatientData):
    result = predict_and_schedule(data.model_dump())
    return result

@app.post("/api/ai/adjust")
def adjust(data: AdjustRequest):
    result = tier_a_local_adjust(
        data.patient_plan, 
        data.current_state, 
        data.threshold_minutes, 
        data.current_time
    )
    return {"adjusted": result is not None, "new_plan": result}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
