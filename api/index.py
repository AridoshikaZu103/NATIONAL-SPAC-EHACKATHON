"""
Vercel Serverless Function Entry Point
"""
import sys
import os

# Add backend dir to Python path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
sys.path.insert(0, backend_dir)

# Set working directory so .env and CSV files are found
os.chdir(backend_dir)

from main import app  # type: ignore

# Vercel discovers this 'app' variable
