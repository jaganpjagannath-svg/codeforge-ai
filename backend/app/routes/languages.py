from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.content import Language, Topic, Question
from app.schemas.question import LanguageOut, TopicTreeOut, TopicOut

router = APIRouter(prefix="/api/languages", tags=["Languages & Topics"])

@router.get("", response_model=List[LanguageOut])
def get_languages(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Language).filter(Language.is_active == True)
    if category:
        query = query.filter(Language.category == category)
    langs = query.order_by(Language.display_order.asc(), Language.name.asc()).all()

    # Populate topics count
    result = []
    for l in langs:
        count = db.query(Topic).filter(Topic.language_id == l.id).count()
        item = LanguageOut.model_validate(l)
        item.topics_count = count
        result.append(item)
    return result

@router.get("/{slug}/topics", response_model=List[TopicTreeOut])
def get_language_topics(slug: str, db: Session = Depends(get_db)):
    lang = db.query(Language).filter(Language.slug == slug.lower()).first()
    if not lang:
        # Check domain like dsa or ai_ml
        pass

    lang_id = lang.id if lang else None

    # Fetch root topics (parent_id is None)
    query = db.query(Topic)
    if lang_id:
        query = query.filter((Topic.language_id == lang_id) | (Topic.language_id.is_(None)))
    else:
        query = query.filter(Topic.slug.ilike(f"%{slug}%"))

    root_topics = query.filter(Topic.parent_id.is_(None)).order_by(Topic.display_order.asc(), Topic.name.asc()).all()

    def build_tree(topic: Topic) -> TopicTreeOut:
        q_count = db.query(Question).filter(Question.topic_id == topic.id).count()
        sub_list = []
        # Find children
        children = db.query(Topic).filter(Topic.parent_id == topic.id).order_by(Topic.display_order.asc()).all()
        for child in children:
            sub_list.append(build_tree(child))

        res = TopicTreeOut(
            id=topic.id,
            name=topic.name,
            slug=topic.slug,
            category=topic.category,
            description=topic.description,
            display_order=topic.display_order,
            language_id=topic.language_id,
            parent_id=topic.parent_id,
            questions_count=q_count,
            subtopics=sub_list
        )
        return res

    return [build_tree(t) for t in root_topics]

@router.get("/topics/{topic_id}", response_model=TopicOut)
def get_topic_detail(topic_id: int, db: Session = Depends(get_db)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found.")
    q_count = db.query(Question).filter(Question.topic_id == topic.id).count()
    out = TopicOut.model_validate(topic)
    out.questions_count = q_count
    return out
