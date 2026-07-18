import pytest
import os
from chatbot_engine import ingest_knowledge_base

def test_ingest_knowledge_base(tmp_path):
    md_path = tmp_path / "test.md"
    md_path.write_text("Quy định siêu âm: Nhịn ăn 6 tiếng.")
    index_path = tmp_path / "faiss.index"
    meta_path = tmp_path / "meta.json"
    
    ingest_knowledge_base(str(md_path), str(index_path), str(meta_path))
    
    assert os.path.exists(index_path)
    assert os.path.exists(meta_path)

from chatbot_engine import build_hybrid_context

def test_build_hybrid_context(tmp_path):
    md_path = tmp_path / "test.md"
    md_path.write_text("Quy định siêu âm: Nhịn ăn 6 tiếng.\n\nX-Quang: Không nhịn ăn.")
    index_path = tmp_path / "faiss.index"
    meta_path = tmp_path / "meta.json"
    
    ingest_knowledge_base(str(md_path), str(index_path), str(meta_path))
    
    context = build_hybrid_context("siêu âm", str(index_path), str(meta_path), "BN-001", ["ultrasound"])
    assert "Nhịn ăn 6 tiếng" in context
    assert "ultrasound" in context.lower()
