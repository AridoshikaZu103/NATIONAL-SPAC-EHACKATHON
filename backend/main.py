import sys
import os

# Ensure backend directory is on the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
from dotenv import load_dotenv

from api.routes import router
from database import Database

# Load environment variables
load_dotenv()

@asynccontextmanager
async def lifespan(app):
    """Connect to Neon PostgreSQL on startup, disconnect on shutdown"""
    await Database.connect()
    yield
    await Database.disconnect()

app = FastAPI(
    title="Orbital Insight API",
    description="Space Situational Awareness Backend",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend (Vercel + local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include orbital API routes
app.include_router(router)

@app.get("/api/health")
async def health():
    return {"status": "healthy", "version": "1.0.0"}

# Serve Frontend Static Files for Docker Deployment
# Must be added AFTER API routes to avoid shadowing
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/")
    async def root():
        return {"message": "Orbital Insight API v1.0.0 (Frontend not built)"}

if __name__ == "__main__":
    port = int(os.getenv("BACKEND_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
