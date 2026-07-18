from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn
from ai_engine import predict_and_schedule, tier_a_local_adjust
from chatbot_engine import chat_stream
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Patient Orchestrator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

class ChatRequest(BaseModel):
    query: str
    patient_id: str
    required_services: list[str] = []

@app.post("/api/ai/chat")
async def chat_endpoint(req: ChatRequest):
    def iter_response():
        for text in chat_stream(req.query, req.patient_id, req.required_services):
            yield text
            
    return StreamingResponse(iter_response(), media_type="text/event-stream")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
