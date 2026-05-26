from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os
from api.routes import router

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Orbital Insight API",
    description="Space Situational Awareness Backend",
    version="0.1.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include orbital API routes
app.include_router(router)

@app.get("/")
async def root():
    return {"message": "Orbital Insight API v0.1.0"}

@app.get("/api/health")
async def health():
    return {"status": "healthy", "version": "0.1.0"}

if __name__ == "__main__":
    port = int(os.getenv("BACKEND_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
