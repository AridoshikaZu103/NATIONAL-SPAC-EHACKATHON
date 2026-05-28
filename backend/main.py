import sys
import os

# Ensure backend directory is on the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

@asynccontextmanager
async def lifespan(app):
    """Connect to PostgreSQL on startup, disconnect on shutdown"""
    try:
        from database import Database
        await Database.connect()
    except Exception as e:
        print(f"DB connect warning: {e}")
    yield
    try:
        from database import Database
        await Database.disconnect()
    except Exception:
        pass

app = FastAPI(
    title="Orbital Insight API",
    description="Space Situational Awareness Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routes
try:
    from api.routes import router
    app.include_router(router)
except Exception as e:
    print(f"Route import error: {e}")

@app.get("/")
async def root():
    return {"status": "healthy", "service": "Orbital Insight API", "version": "1.0.0"}

@app.get("/api/health")
async def health():
    return {"status": "healthy", "version": "1.0.0"}

# Local dev only
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", os.getenv("BACKEND_PORT", 8000)))
    uvicorn.run(app, host="0.0.0.0", port=port)
