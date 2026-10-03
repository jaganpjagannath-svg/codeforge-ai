"""
CodeForge AI - Production Entry Point for Render
Allows:
- gunicorn main:app -k uvicorn.workers.UvicornWorker
- uvicorn main:app --host 0.0.0.0 --port $PORT
- python main.py
"""
import os
import sys

from app import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)
