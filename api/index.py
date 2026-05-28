"""
Vercel Serverless Function Entry Point
Exports the FastAPI app for Vercel's Python runtime
"""
import sys
import os

# Add backend dir to path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from main import app
