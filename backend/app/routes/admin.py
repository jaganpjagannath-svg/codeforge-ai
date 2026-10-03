from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.content import Question, Language, Topic
from app.models.submission import Submission
from app.models.test import Test, TestAttempt
from app.auth.dependencies import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["Admin Operations"])

@router.get("/stats")
def get_admin_stats(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_questions = db.query(Question).count()
    ai_questions = db.query(Question).filter(Question.created_by_ai == True).count()
    pending_questions = db.query(Question).filter(Question.is_approved == False).count()
    total_submissions = db.query(Submission).count()
    accepted_submissions = db.query(Submission).filter(Submission.status == "Accepted").count()
    total_tests = db.query(Test).count()
    total_attempts = db.query(TestAttempt).count()

    acceptance_rate = round((accepted_submissions / max(1, total_submissions)) * 100, 1)

    return {
        "total_users": total_users,
        "total_questions": total_questions,
        "ai_questions": ai_questions,
        "pending_questions": pending_questions,
        "total_submissions": total_submissions,
        "accepted_submissions": accepted_submissions,
        "acceptance_rate": acceptance_rate,
        "total_tests": total_tests,
        "total_attempts": total_attempts
    }

@router.get("/questions/review")
def get_questions_for_review(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    questions = db.query(Question).order_by(Question.created_at.desc()).limit(50).all()
    return [
        {
            "id": q.id,
            "title": q.title,
            "language": q.language_slug,
            "difficulty": q.difficulty,
            "type": q.question_type,
            "is_approved": q.is_approved,
            "created_by_ai": q.created_by_ai,
            "test_cases_count": len(q.test_cases),
            "created_at": q.created_at
        }
        for q in questions
    ]

@router.post("/questions/{question_id}/approve")
def approve_question(
    question_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")
    q.is_approved = True
    db.commit()
    return {"message": "Question approved successfully.", "id": q.id}

@router.delete("/questions/{question_id}")
def delete_question(
    question_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")
    db.delete(q)
    db.commit()
    return {"message": "Question deleted successfully."}

@router.get("/users")
def get_users_list(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    users = db.query(User).order_by(User.created_at.desc()).limit(100).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "streak_days": u.streak_days,
            "submissions_count": len(u.submissions),
            "created_at": u.created_at
        }
        for u in users
    ]

@router.post("/users/{user_id}/toggle-role")
def toggle_user_role(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot alter your own role.")
    user.role = "admin" if user.role == "user" else "user"
    db.commit()
    return {"message": f"User role updated to {user.role}.", "role": user.role}
