import sys
import os
import traceback

# Ensure backend directory is on the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Orbital Insight API",
    description="Space Situational Awareness Backend",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Try to load routes — capture error for debugging on Vercel
_route_error = None
try:
    from api.routes import router
    app.include_router(router)
except Exception as e:
    _route_error = traceback.format_exc()
    print(f"ROUTE IMPORT ERROR:\n{_route_error}")

# Try to connect database on startup
@app.on_event("startup")
async def startup():
    try:
        from database import Database
        await Database.connect()
    except Exception as e:
        print(f"DB warning: {e}")

@app.on_event("shutdown")
async def shutdown():
    try:
        from database import Database
        await Database.disconnect()
    except Exception:
        pass

@app.get("/")
async def root():
    return {
        "status": "healthy" if not _route_error else "routes_failed",
        "service": "Orbital Insight API",
        "version": "1.0.0",
        "routes_loaded": _route_error is None,
        "error": _route_error[:500] if _route_error else None,
    }

@app.get("/api/health")
async def health():
    return {"status": "healthy", "version": "1.0.0", "routes_loaded": _route_error is None}

@app.get("/api/debug")
async def debug():
    """Shows the import error if routes failed to load"""
    return {
        "routes_loaded": _route_error is None,
        "error": _route_error,
        "python_version": sys.version,
        "cwd": os.getcwd(),
        "files": os.listdir(os.path.dirname(os.path.abspath(__file__))),
        "sys_path": sys.path[:5],
    }

# Local dev only
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", os.getenv("BACKEND_PORT", 8000)))
    uvicorn.run(app, host="0.0.0.0", port=port)
