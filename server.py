from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from ai_engine import predict_and_schedule, reoptimize_plan
from chatbot_engine import chat_stream

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
    busy_until: dict = {}
    current_time: int = 0


class AdjustRequest(BaseModel):
    patient_plan: dict
    current_state: dict = {}
    current_time: int = 0


@app.post("/api/ai/schedule")
def schedule(data: PatientData):
    # Sinh lộ trình (có xét trạng thái phòng nếu được truyền vào).
    return predict_and_schedule(data.model_dump())


@app.post("/api/ai/adjust")
def adjust(data: AdjustRequest):
    # Điều phối lại thời gian thực -> shape: {"adjusted": bool, "new_plan": {"tasks":[...]}}
    return reoptimize_plan(data.patient_plan, data.current_state, data.current_time)


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
