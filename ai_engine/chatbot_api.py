from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from chatbot_engine import chat_stream

app = FastAPI()

class ChatRequest(BaseModel):
    query: str
    patient_id: str
    required_services: list[str]

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    def iter_response():
        for text in chat_stream(req.query, req.patient_id, req.required_services):
            yield text
            
    return StreamingResponse(iter_response(), media_type="text/event-stream")
