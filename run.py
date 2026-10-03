import os
import sys
import webbrowser
import threading
import time
from pathlib import Path

# Add backend directory to sys.path
root_dir = Path(__file__).resolve().parent
backend_dir = root_dir / "backend"
sys.path.insert(0, str(backend_dir))

def open_browser():
    time.sleep(1.5)
    url = "http://localhost:8000"
    print(f"\n[CodeForge AI] Opening platform in your browser at: {url}")
    webbrowser.open(url)

if __name__ == "__main__":
    import uvicorn

    print("=" * 65)
    print("🚀 Starting CodeForge AI - Full-Stack Learning & Assessment Platform")
    print("=" * 65)
    print("• Web Application: http://localhost:8000")
    print("• Interactive API Docs: http://localhost:8000/docs")
    print("• Demo Credentials:")
    print("    - User:  jagan@codeforge.ai / jagan123")
    print("    - Admin: admin@codeforge.ai / admin123")
    print("• Mobile & PWA:")
    print("    - Open http://<your-local-ip>:8000 on your phone")
    print("    - Click '📱 Install App' on desktop or mobile for native PWA")
    print("=" * 65 + "\n")

    threading.Thread(target=open_browser, daemon=True).start()

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
