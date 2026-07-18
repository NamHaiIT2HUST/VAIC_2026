import faiss
import json
import os
from sentence_transformers import SentenceTransformer

def ingest_knowledge_base(md_path: str, index_path: str, metadata_path: str):
    if not os.path.exists(md_path):
        return
        
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Basic chunking by newlines
    chunks = [c.strip() for c in content.split('\n\n') if len(c.strip()) > 10]
    
    model = SentenceTransformer('all-MiniLM-L6-v2')
    embeddings = model.encode(chunks)
    
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    
    faiss.write_index(index, index_path)
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(chunks, f, ensure_ascii=False)

from ai_engine_advanced import AdvancedJourneyScheduler

def build_hybrid_context(query: str, index_path: str, metadata_path: str, patient_id: str, required_services: list[str]) -> str:
    # 1. Retrieve RAG Docs
    model = SentenceTransformer('all-MiniLM-L6-v2')
    query_vec = model.encode([query])
    
    index = faiss.read_index(index_path)
    with open(metadata_path, 'r', encoding='utf-8') as f:
        chunks = json.load(f)
        
    D, I = index.search(query_vec, k=2)
    retrieved_docs = [chunks[i] for i in I[0] if i < len(chunks) and i >= 0]
    
    # 2. Retrieve AI Engine Schedule
    scheduler = AdvancedJourneyScheduler()
    plan = scheduler.schedule(patient_id, required_services)
    
    # 3. Combine
    context = f"--- KIẾN THỨC Y KHOA ---\n" + "\n".join(retrieved_docs) + "\n\n"
    context += f"--- LỊCH TRÌNH CỦA BỆNH NHÂN ---\n" + json.dumps(plan, ensure_ascii=False)
    return context

from litellm import completion
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """Bạn là trợ lý ảo bệnh viện.
Chỉ trả lời dựa trên KIẾN THỨC Y KHOA và LỊCH TRÌNH CỦA BỆNH NHÂN được cung cấp.
Không tự đưa ra chẩn đoán y khoa. Nếu câu hỏi yêu cầu chẩn đoán, hãy khuyên bệnh nhân hỏi bác sĩ."""

def chat_stream(query: str, patient_id: str, required_services: list[str], index_path="faiss.index", meta_path="meta.json"):
    context = build_hybrid_context(query, index_path, meta_path, patient_id, required_services)
    
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT + "\n\n" + context},
        {"role": "user", "content": query}
    ]
    
    response = completion(
        model="openai/gpt-3.5-turbo",
        api_base="https://mkp-api.fptcloud.com/chat/completions",
        messages=messages,
        stream=True
    )
    
    for chunk in response:
        if chunk.choices and len(chunk.choices) > 0:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
