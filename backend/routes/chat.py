"""
chat.py
-------
Chat endpoint: receives a user query, runs it through the
LangGraph agentic RAG pipeline, and returns the response with sources.
"""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from rag.llm import chat_stream
from langchain_core.messages import HumanMessage, AIMessage
import json

from database import get_db
import models

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


@router.post("/chat")
async def chat_endpoint(req: ChatRequest, db: Session = Depends(get_db)):
    """
    Send a query to the BrainyDocs AI agent and stream a
    grounded response with source citations.
    """
    past_messages = db.query(models.ChatMessage).filter(models.ChatMessage.session_id == req.session_id).order_by(models.ChatMessage.timestamp.asc()).all()
    
    history_messages = []
    for msg in past_messages[-20:]:  # Load last 20 messages to prevent context limit explosion
        if msg.role == "user":
            history_messages.append(HumanMessage(content=msg.content))
        else:
            history_messages.append(AIMessage(content=msg.content))

    def stream_generator():
        final_answer = ""
        for chunk in chat_stream(query=req.query, history_messages=history_messages, mode=req.mode):
            if '{"type": "done"' in chunk:
                # Capture the full answer for the database
                try:
                    data = json.loads(chunk.replace("data: ", "").strip())
                    if "final_answer" in data:
                        final_answer = data["final_answer"]
                except Exception:
                    pass
                yield chunk
            else:
                yield chunk
        
        # Save complete interaction to Database
        if final_answer:
            db_user_msg = models.ChatMessage(session_id=req.session_id, role="user", content=req.query)
            db_ai_msg = models.ChatMessage(session_id=req.session_id, role="assistant", content=final_answer)
            db.add(db_user_msg)
            db.add(db_ai_msg)
            db.commit()

    return StreamingResponse(stream_generator(), media_type="text/event-stream")


@router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    """Retrieve chat history for a given session."""
    messages = db.query(models.ChatMessage).filter(models.ChatMessage.session_id == session_id).order_by(models.ChatMessage.timestamp.asc()).all()
    
    formatted_messages = []
    for msg in messages:
        formatted_messages.append({
            "id": msg.id,
            "role": msg.role,
            "content": msg.content,
            "timestamp": msg.timestamp.isoformat()
        })
        
    return {"messages": formatted_messages}
