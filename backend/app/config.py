import os
from pathlib import Path
from dotenv import load_dotenv

# Base Directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env from backend and root workspace if present
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

def get_database_url() -> str:
    url = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/codemind.db")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url

class Settings:
    PROJECT_NAME: str = "CodeForge AI"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "AI-Powered Programming Learning & Assessment Platform"
    
    # Base paths
    BASE_DIR: Path = BASE_DIR
    FRONTEND_DIR: Path = BASE_DIR.parent / "frontend"
    
    # Database
    DATABASE_URL: str = get_database_url()
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "codeforge_super_secure_secret_key_2026_x789")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Gemini AI
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    # Code Execution Sandbox
    DEFAULT_TIMEOUT_SECONDS: int = int(os.getenv("DEFAULT_TIMEOUT_SECONDS", "5"))
    MAX_MEMORY_MB: int = int(os.getenv("MAX_MEMORY_MB", "128"))
    
    # Admin seed credentials
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@codeforge.ai")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin123")
    
settings = Settings()
