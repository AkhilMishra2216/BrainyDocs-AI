"""
BrainyDocs AI — FastAPI Backend
Main entry point: CORS, routers, and startup configuration.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes.upload import router as upload_router
from routes.chat import router as chat_router
from routes.auth import router as auth_router

import models
from database import engine

models.Base.metadata.create_all(bind=engine)

load_dotenv()

app = FastAPI(
    title="BrainyDocs AI",
    description="Intelligent Knowledge Workspace – Agentic RAG Backend",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS – allow the Vite dev-server and production origins
# ---------------------------------------------------------------------------
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    os.getenv("FRONTEND_URL", "*"), # Allow Render frontend URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if os.getenv("FRONTEND_URL") else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(upload_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(auth_router, prefix="/api/auth")


@app.get("/")
async def health_check():
    return {"status": "ok", "service": "BrainyDocs AI Backend"}
