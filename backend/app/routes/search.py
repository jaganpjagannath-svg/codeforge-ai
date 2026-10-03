from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.content import Language, Topic, Question
from app.models.test import Test

router = APIRouter(prefix="/api/search", tags=["Global Search"])

@router.get("")
def global_search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    query_str = f"%{q.strip()}%"

    # Search Questions
    questions = db.query(Question).filter(
        (Question.title.ilike(query_str)) |
        (Question.description.ilike(query_str)) |
        (Question.language_slug.ilike(query_str))
    ).filter(Question.is_approved == True).limit(8).all()

    # Search Topics
    topics = db.query(Topic).filter(
        (Topic.name.ilike(query_str)) |
        (Topic.slug.ilike(query_str))
    ).limit(8).all()

    # Search Languages
    languages = db.query(Language).filter(
        (Language.name.ilike(query_str)) |
        (Language.slug.ilike(query_str))
    ).limit(6).all()

    # Search Tests
    tests = db.query(Test).filter(
        (Test.title.ilike(query_str)) |
        (Test.description.ilike(query_str))
    ).filter(Test.is_published == True).limit(6).all()

    return {
        "query": q,
        "questions": [
            {
                "id": item.id,
                "title": item.title,
                "language": item.language_slug,
                "difficulty": item.difficulty,
                "type": item.question_type
            }
            for item in questions
        ],
        "topics": [
            {
                "id": item.id,
                "name": item.name,
                "slug": item.slug,
                "category": item.category
            }
            for item in topics
        ],
        "languages": [
            {
                "id": item.id,
                "name": item.name,
                "slug": item.slug,
                "icon": item.icon
            }
            for item in languages
        ],
        "tests": [
            {
                "id": item.id,
                "share_code": item.share_code,
                "title": item.title,
                "duration_minutes": item.duration_minutes
            }
            for item in tests
        ]
    }
