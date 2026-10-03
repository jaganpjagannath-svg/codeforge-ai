from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.content import Question, TestCase, QuestionOption, Topic
from app.schemas.question import QuestionOut, QuestionDetailOut, TestCaseOut, OptionOut

router = APIRouter(prefix="/api/questions", tags=["Questions"])

@router.get("", response_model=List[QuestionOut])
def get_questions(
    language: Optional[str] = None,
    topic_id: Optional[int] = None,
    difficulty: Optional[str] = None,
    question_type: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Question).filter(Question.is_approved == True)

    if language:
        query = query.filter(Question.language_slug == language.lower())
    if topic_id:
        query = query.filter(Question.topic_id == topic_id)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty.lower())
    if question_type:
        query = query.filter(Question.question_type == question_type.lower())
    if search:
        s = f"%{search}%"
        query = query.filter(Question.title.ilike(s) | Question.description.ilike(s))

    return query.order_by(Question.id.asc()).offset(offset).limit(limit).all()

@router.get("/{question_id}", response_model=QuestionDetailOut)
def get_question_detail(question_id: int, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.id == question_id, Question.is_approved == True).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")

    # Only include public test cases for the user to see, hidden test cases stay protected!
    public_cases = []
    for tc in q.test_cases:
        if not tc.is_hidden:
            public_cases.append(TestCaseOut(
                id=tc.id,
                input_data=tc.input_data,
                expected_output=tc.expected_output,
                is_hidden=False,
                is_sample=tc.is_sample,
                points=tc.points
            ))
        else:
            # Conceal hidden inputs & expected outputs
            public_cases.append(TestCaseOut(
                id=tc.id,
                input_data="[Hidden Test Case]",
                expected_output="[Hidden]",
                is_hidden=True,
                is_sample=False,
                points=tc.points
            ))

    options_out = [
        OptionOut(id=opt.id, option_key=opt.option_key, text=opt.text)
        for opt in q.options
    ]

    out = QuestionDetailOut(
        id=q.id,
        title=q.title,
        slug=q.slug,
        description=q.description,
        difficulty=q.difficulty,
        language_slug=q.language_slug,
        topic_id=q.topic_id,
        question_type=q.question_type,
        input_format=q.input_format,
        output_format=q.output_format,
        constraints=q.constraints,
        starter_code=q.starter_code,
        created_by_ai=q.created_by_ai,
        is_approved=q.is_approved,
        created_at=q.created_at,
        test_cases=public_cases,
        options=options_out,
        has_hints=bool(q.hints)
    )
    return out
