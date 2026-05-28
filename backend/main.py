import sys
import os

# Ensure backend directory is on the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.routes import router
from database import Database

# Load environment variables
load_dotenv()

@asynccontextmanager
async def lifespan(app):
    """Connect to PostgreSQL on startup, disconnect on shutdown"""
    try:
        await Database.connect()
    except Exception as e:
        print(f"Database connection warning: {e}")
    yield
    try:
        await Database.disconnect()
    except Exception:
        pass

app = FastAPI(
    title="Orbital Insight API",
    description="Space Situational Awareness Backend",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend (separate Vercel project + local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include orbital API routes
app.include_router(router)

@app.get("/")
async def root():
    return {"status": "healthy", "service": "Orbital Insight API", "version": "1.0.0"}

@app.get("/api/health")
async def health():
    return {"status": "healthy", "version": "1.0.0"}

# Local dev only
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
