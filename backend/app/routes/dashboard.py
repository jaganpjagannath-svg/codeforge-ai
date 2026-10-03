from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.content import Question, Language, Topic
from app.models.submission import Submission, UserLanguageProgress, UserTopicProgress
from app.models.test import TestAttempt
from app.ai.gemini_client import gemini_service
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["Dashboard & Analytics"])

@router.get("/dashboard")
def get_dashboard_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. User stats
    total_submissions = db.query(Submission).filter(Submission.user_id == current_user.id).count()
    solved_submissions = db.query(Submission).filter(
        Submission.user_id == current_user.id,
        Submission.status == "Accepted"
    ).count()

    total_attempts = db.query(TestAttempt).filter(TestAttempt.user_id == current_user.id).count()

    # Average score
    all_subs = db.query(Submission).filter(Submission.user_id == current_user.id).all()
    avg_score = round(sum(s.score for s in all_subs) / max(1, len(all_subs)), 1) if all_subs else 0.0

    # Format learning time
    hrs = current_user.total_learning_seconds // 3600
    mins = (current_user.total_learning_seconds % 3600) // 60
    learning_time_str = f"{hrs}h {mins}m" if hrs > 0 else f"{max(12, mins)}m"

    # 2. Dynamic Language Progress Cards
    target_languages = [
        {"slug": "python", "name": "Python", "icon": "python", "color": "#3b82f6"},
        {"slug": "java", "name": "Java", "icon": "coffee", "color": "#ef4444"},
        {"slug": "c", "name": "C", "icon": "terminal", "color": "#64748b"},
        {"slug": "cpp", "name": "C++", "icon": "cpu", "color": "#06b6d4"},
        {"slug": "javascript", "name": "JavaScript", "icon": "code", "color": "#eab308"},
        {"slug": "sql", "name": "SQL", "icon": "database", "color": "#8b5cf6"},
        {"slug": "ai_ml", "name": "AI/ML", "icon": "brain", "color": "#ec4899"},
        {"slug": "dsa", "name": "DSA", "icon": "git-branch", "color": "#10b981"},
    ]

    lang_progress_cards = []
    for l in target_languages:
        prog = db.query(UserLanguageProgress).filter(
            UserLanguageProgress.user_id == current_user.id,
            UserLanguageProgress.language_slug == l["slug"]
        ).first()

        solved = prog.questions_solved if prog else 0
        attempted = prog.questions_attempted if prog else 0
        mastery = prog.mastery_percentage if prog else (15.0 if l["slug"] == "python" else 0.0)

        lang_progress_cards.append({
            "slug": l["slug"],
            "name": l["name"],
            "icon": l["icon"],
            "color": l["color"],
            "solved": solved,
            "attempted": attempted,
            "mastery_percent": round(mastery, 1)
        })

    # 3. Recent Activity
    recent_subs = db.query(Submission).filter(
        Submission.user_id == current_user.id
    ).order_by(Submission.created_at.desc()).limit(8).all()

    recent_activity = []
    for s in recent_subs:
        q = s.question
        recent_activity.append({
            "id": s.id,
            "question_id": q.id if q else None,
            "title": q.title if q else "Coding Challenge",
            "language": s.language,
            "status": s.status,
            "score": s.score,
            "test_cases_passed": f"{s.test_cases_passed}/{s.total_test_cases}",
            "created_at": s.created_at
        })

    # 4. Continue Learning (last worked on)
    continue_item = None
    if recent_subs:
        last_q = recent_subs[0].question
        if last_q:
            continue_item = {
                "question_id": last_q.id,
                "title": last_q.title,
                "language": last_q.language_slug,
                "topic": last_q.topic.name if last_q.topic else "General",
                "difficulty": last_q.difficulty
            }
    else:
        # Default recommendation to start
        first_q = db.query(Question).first()
        if first_q:
            continue_item = {
                "question_id": first_q.id,
                "title": first_q.title,
                "language": first_q.language_slug,
                "topic": first_q.topic.name if first_q.topic else "Fundamentals",
                "difficulty": first_q.difficulty
            }

    # 5. AI Learning Recommendation
    prog_summary = [
        {"topic": c["name"], "mastery": c["mastery_percent"]}
        for c in lang_progress_cards
    ]
    ai_rec = gemini_service.generate_recommendations(prog_summary, db=db)

    return {
        "user": {
            "name": current_user.name,
            "streak_days": current_user.streak_days,
            "learning_time": learning_time_str,
            "avatar_url": current_user.avatar_url
        },
        "stats": {
            "questions_solved": solved_submissions,
            "total_attempted": total_submissions,
            "tests_attempted": total_attempts,
            "average_score": avg_score
        },
        "progress_cards": lang_progress_cards,
        "recent_activity": recent_activity,
        "continue_learning": continue_item,
        "ai_recommendation": ai_rec
    }

@router.get("/history")
def get_submission_history(
    language: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Submission).filter(Submission.user_id == current_user.id)
    if language:
        query = query.filter(Submission.language == language.lower())
    if status:
        query = query.filter(Submission.status == status)

    subs = query.order_by(Submission.created_at.desc()).limit(100).all()
    res = []
    for s in subs:
        q = s.question
        res.append({
            "id": s.id,
            "question_id": s.question_id,
            "question_title": q.title if q else "Problem",
            "language": s.language,
            "difficulty": q.difficulty if q else "easy",
            "status": s.status,
            "score": s.score,
            "test_cases_passed": f"{s.test_cases_passed}/{s.total_test_cases}",
            "execution_time_ms": s.execution_time_ms,
            "memory_kb": s.memory_kb,
            "created_at": s.created_at
        })
    return res
