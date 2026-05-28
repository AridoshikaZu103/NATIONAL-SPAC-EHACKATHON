"""
Vercel Serverless Function Entry Point
Exports the FastAPI app for Vercel's Python runtime.

On Vercel:
  - Frontend: served as static files from frontend/dist
  - Backend:  this file routes /api/* to FastAPI
  - Database: Vercel Postgres (set DATABASE_URL in Vercel dashboard)
"""
import sys
import os

# Add backend dir to path so all imports (routes, database, state) work
backend_dir = os.path.join(os.path.dirname(__file__), "..", "backend")
sys.path.insert(0, backend_dir)

# Set dotenv path to backend/.env (for local dev; Vercel uses dashboard env vars)
os.environ.setdefault("DOTENV_PATH", os.path.join(backend_dir, ".env"))

from main import app  # type: ignore  # resolved at runtime via sys.path.insert above
