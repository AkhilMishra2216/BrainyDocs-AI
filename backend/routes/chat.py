"""
chat.py
-------
Chat endpoint: receives a user query, runs it through the
LangGraph agentic RAG pipeline, and returns the response with sources.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from rag.llm import chat

router = APIRouter(tags=["chat"])


class ChatRequest(BaseModel):
    query: str
    session_id: str = "default"
    mode: str = "normal"  # "normal" | "eli5" | "deep"


class SourceItem(BaseModel):
    id: int
    content: str
    metadata: dict


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceItem] = []


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    """
    Send a query to the BrainyDocs AI agent and receive a
    grounded response with source citations.
    """
    result = chat(
        query=req.query,
        session_id=req.session_id,
        mode=req.mode,
    )
    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
    )
