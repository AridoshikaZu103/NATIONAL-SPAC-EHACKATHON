"""
Vercel Serverless Function Entry Point
Routes /api/* requests to the FastAPI backend.
"""
import sys
import os

# Add backend dir to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from main import app  # type: ignore
