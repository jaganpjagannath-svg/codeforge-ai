from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, UserUpdate, PasswordChange, TokenResponse, UserOut
from app.auth.security import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_user
from app.exceptions import ValidationError, AuthenticationError, ResourceNotFoundError
from app.logger import app_logger

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    clean_email = user_in.email.lower().strip()
    clean_name = user_in.name.strip()

    # Rule 6: Validate email and password rules
    if len(user_in.password) < 8:
        raise ValidationError(
            message="Password must contain at least 8 characters.",
            code="WEAK_PASSWORD"
        )

    if user_in.confirm_password and user_in.password != user_in.confirm_password:
        raise ValidationError(
            message="Passwords do not match.",
            code="PASSWORD_MISMATCH"
        )

    # Check if email exists
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise ValidationError(
            message="An account with this email already exists.",
            code="ACCOUNT_EXISTS"
        )

    # First registered user can be admin, or default to regular user
    user_count = db.query(User).count()
    role = "admin" if user_count == 0 else "user"

    new_user = User(
        name=clean_name,
        email=clean_email,
        password_hash=hash_password(user_in.password),
        role=role,
        avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={clean_email}",
        streak_days=1,
        last_active_date=datetime.utcnow(),
        total_learning_seconds=0
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    app_logger.info(f"Registered new user {new_user.id} ({role})")

    token = create_access_token({"sub": str(new_user.id), "email": new_user.email, "role": new_user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=TokenResponse)
def login(creds: UserLogin, db: Session = Depends(get_db)):
    clean_email = creds.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    
    if not user or not verify_password(creds.password, user.password_hash):
        raise AuthenticationError(
            message="Incorrect email or password.",
            code="INVALID_CREDENTIALS"
        )

    # Update streak
    now = datetime.utcnow()
    if user.last_active_date:
        diff_days = (now.date() - user.last_active_date.date()).days
        if diff_days == 1:
            user.streak_days += 1
        elif diff_days > 1:
            user.streak_days = 1
    user.last_active_date = now
    db.commit()
    db.refresh(user)

    app_logger.info(f"User {user.id} logged in successfully")

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserOut)
def update_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if update_data.name:
        current_user.name = update_data.name.strip()
    if update_data.avatar_url:
        current_user.avatar_url = update_data.avatar_url.strip()
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/change-password")
def change_password(
    pwd_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(pwd_data.current_password, current_user.password_hash):
        raise ValidationError(
            message="Current password does not match.",
            code="INVALID_CURRENT_PASSWORD"
        )
    if len(pwd_data.new_password) < 8:
        raise ValidationError(
            message="New password must contain at least 8 characters.",
            code="WEAK_PASSWORD"
        )
    if pwd_data.confirm_password and pwd_data.new_password != pwd_data.confirm_password:
        raise ValidationError(
            message="Passwords do not match.",
            code="PASSWORD_MISMATCH"
        )

    current_user.password_hash = hash_password(pwd_data.new_password)
    db.commit()
    return {"success": True, "message": "Password changed successfully."}

@router.post("/forgot-password")
def forgot_password(
    email: str = Body(..., embed=True),
    new_password: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    clean_email = email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise ResourceNotFoundError(
            message="No account found with this email address.",
            code="USER_NOT_FOUND"
        )

    if len(new_password) < 8:
        raise ValidationError(
            message="New password must contain at least 8 characters.",
            code="WEAK_PASSWORD"
        )

    user.password_hash = hash_password(new_password)
    db.commit()
    return {"success": True, "message": "Password reset successfully. You can now log in."}

@router.post("/logout")
def logout():
    return {"success": True, "message": "Successfully logged out."}
