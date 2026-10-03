import os
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.settings import SystemSetting
from app.models.user import User
from app.ai.gemini_client import gemini_service
from app.config import settings
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/settings", tags=["Settings"])

def mask_key(k: str) -> str:
    if not k or len(k) < 8:
        return "••••••••"
    return k[:6] + "••••••••" + k[-4:]

@router.get("/gemini")
def get_gemini_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    key = gemini_service.get_api_key(db)
    is_configured = bool(key and len(key) > 5)
    masked = mask_key(key) if is_configured else ""

    return {
        "is_configured": is_configured,
        "masked_key": masked,
        "model": settings.GEMINI_MODEL,
        "mode": "live_gemini" if is_configured else "offline_resilient"
    }

@router.post("/gemini")
def update_gemini_key(
    data: Dict[str, str] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_key = data.get("api_key", "").strip()
    if not new_key:
        raise HTTPException(status_code=400, detail="API key is required.")

    # Save to database
    setting = db.query(SystemSetting).filter(SystemSetting.key == "GEMINI_API_KEY").first()
    if not setting:
        setting = SystemSetting(
            key="GEMINI_API_KEY",
            value=new_key,
            description="Google Gemini API Key",
            is_secret=True
        )
        db.add(setting)
    else:
        setting.value = new_key
    db.commit()

    # Also update runtime env so all threads see it immediately
    os.environ["GEMINI_API_KEY"] = new_key

    # Test the key
    test_result = gemini_service.test_connection(new_key)

    return {
        "message": "Gemini API key saved successfully.",
        "masked_key": mask_key(new_key),
        "test_connection": test_result
    }

@router.post("/gemini/test")
def test_gemini_connection(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    key = gemini_service.get_api_key(db)
    if not key:
        return {
            "success": False,
            "message": "No Gemini API key configured. Operating in Offline Resilient mode."
        }
    return gemini_service.test_connection(key)
