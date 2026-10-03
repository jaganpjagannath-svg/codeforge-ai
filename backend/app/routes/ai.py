import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.content import Question, TestCase, QuestionOption, Topic, Language
from app.schemas.ai import (
    AIQuestionGenerateRequest,
    AIQuestionResponse,
    AIHintRequest,
    AIHintResponse,
    AIFeedbackResponse,
    AITestGenerateRequest
)
from app.schemas.question import QuestionDetailOut, TestCaseOut, OptionOut
from app.ai.gemini_client import gemini_service
from app.ai.intent_parser import parse_natural_language_intent
from app.execution.validator import test_case_validator
from app.auth.dependencies import get_optional_user

router = APIRouter(prefix="/api/ai", tags=["AI Intelligence"])

@router.post("/parse-intent")
def parse_intent(data: Dict[str, str] = Body(...)):
    prompt = data.get("prompt", "")
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required.")
    return parse_natural_language_intent(prompt)

@router.post("/generate-question", response_model=QuestionDetailOut)
def generate_question(
    req: AIQuestionGenerateRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Generates an intelligent programming question using Gemini and validates test cases"""
    # 1. If natural language prompt was provided, parse intent
    lang = req.language or "python"
    topic = req.topic or "loops"
    diff = req.difficulty or "easy"
    q_type = req.question_type or "coding"

    if req.prompt:
        intent = parse_natural_language_intent(req.prompt)
        lang = intent.get("language", lang)
        topic = intent.get("topic", topic)
        diff = intent.get("difficulty", diff)
        q_type = intent.get("question_type", q_type)

    # 2. Invoke Gemini AI service
    ai_raw = gemini_service.generate_question(
        language=lang,
        topic=topic,
        difficulty=diff,
        question_type=q_type,
        db=db
    )

    # 3. Find or map topic
    topic_obj = db.query(Topic).filter(Topic.slug == topic.lower()).first()
    topic_id = topic_obj.id if topic_obj else None

    # 4. Validate test cases with reference solution
    ref_solution = ai_raw.get("reference_solution", "")
    raw_test_cases = ai_raw.get("test_cases", [])
    valid_test_cases, val_logs = test_case_validator.validate_and_refine_test_cases(
        language=lang,
        reference_solution=ref_solution,
        raw_test_cases=raw_test_cases
    )

    # 5. Persist question in DB
    new_q = Question(
        title=ai_raw.get("title", f"AI Generated {topic.capitalize()} Challenge"),
        slug=ai_raw.get("title", "challenge").lower().replace(" ", "-")[:200],
        description=ai_raw.get("description", "Solve the given challenge."),
        difficulty=ai_raw.get("difficulty", diff),
        language_slug=lang,
        topic_id=topic_id,
        question_type=ai_raw.get("question_type", q_type),
        input_format=ai_raw.get("input_format"),
        output_format=ai_raw.get("output_format"),
        constraints=ai_raw.get("constraints"),
        starter_code=ai_raw.get("starter_code"),
        reference_solution=ref_solution,
        explanation=ai_raw.get("solution_explanation"),
        hints=json.dumps(ai_raw.get("hints", [])),
        is_approved=True,
        created_by_ai=True,
        created_by_user_id=current_user.id if current_user else None
    )
    db.add(new_q)
    db.flush()

    # Save validated test cases
    saved_tc_outs = []
    for tc in valid_test_cases:
        db_tc = TestCase(
            question_id=new_q.id,
            input_data=tc["input_data"],
            expected_output=tc["expected_output"],
            is_hidden=tc["is_hidden"],
            is_sample=tc["is_sample"],
            points=tc["points"]
        )
        db.add(db_tc)
        db.flush()
        saved_tc_outs.append(TestCaseOut(
            id=db_tc.id,
            input_data="[Hidden Test Case]" if db_tc.is_hidden else db_tc.input_data,
            expected_output="[Hidden]" if db_tc.is_hidden else db_tc.expected_output,
            is_hidden=db_tc.is_hidden,
            is_sample=db_tc.is_sample,
            points=db_tc.points
        ))

    # Save options if MCQ
    saved_opt_outs = []
    for opt in ai_raw.get("options", []):
        db_opt = QuestionOption(
            question_id=new_q.id,
            option_key=opt.get("key", "A"),
            text=opt.get("text", ""),
            is_correct=bool(opt.get("is_correct", False)),
            explanation=opt.get("explanation")
        )
        db.add(db_opt)
        db.flush()
        saved_opt_outs.append(OptionOut(
            id=db_opt.id,
            option_key=db_opt.option_key,
            text=db_opt.text
        ))

    db.commit()
    db.refresh(new_q)

    return QuestionDetailOut(
        id=new_q.id,
        title=new_q.title,
        slug=new_q.slug,
        description=new_q.description,
        difficulty=new_q.difficulty,
        language_slug=new_q.language_slug,
        topic_id=new_q.topic_id,
        question_type=new_q.question_type,
        input_format=new_q.input_format,
        output_format=new_q.output_format,
        constraints=new_q.constraints,
        starter_code=new_q.starter_code,
        created_by_ai=new_q.created_by_ai,
        is_approved=new_q.is_approved,
        created_at=new_q.created_at,
        test_cases=saved_tc_outs,
        options=saved_opt_outs,
        has_hints=bool(new_q.hints)
    )

@router.post("/hint", response_model=AIHintResponse)
def get_ai_hint(
    req: AIHintRequest,
    db: Session = Depends(get_db)
):
    question = db.query(Question).filter(Question.id == req.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found.")

    # Check if pre-cached in question.hints
    if question.hints:
        try:
            cached_hints = json.loads(question.hints)
            if isinstance(cached_hints, list) and len(cached_hints) >= req.hint_level:
                hint_text = cached_hints[req.hint_level - 1]
                hint_titles = {
                    1: "Level 1: Conceptual Clue",
                    2: "Level 2: Approach Clue",
                    3: "Level 3: Algorithm Clue",
                    4: "Level 4: Pseudocode Outline",
                    5: "Level 5: Comprehensive Walkthrough"
                }
                return AIHintResponse(
                    level=req.hint_level,
                    level_title=hint_titles.get(req.hint_level, f"Level {req.hint_level}"),
                    hint=hint_text,
                    has_next=req.hint_level < len(cached_hints)
                )
        except Exception:
            pass

    # Call Gemini for dynamic context-aware hint
    dynamic_hint = gemini_service.generate_hints(
        question_title=question.title,
        question_desc=question.description,
        hint_level=req.hint_level,
        user_code=req.user_code or "",
        db=db
    )
    return AIHintResponse(
        level=dynamic_hint.get("level", req.hint_level),
        level_title=dynamic_hint.get("level_title", f"Level {req.hint_level} Hint"),
        hint=dynamic_hint.get("hint", "Consider the time and space complexity."),
        has_next=dynamic_hint.get("has_next", req.hint_level < 5)
    )

@router.post("/feedback", response_model=AIFeedbackResponse)
def get_code_feedback(
    data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    code = data.get("code", "")
    language = data.get("language", "python")
    title = data.get("title", "Coding Problem")
    desc = data.get("description", "")
    status = data.get("status", "Accepted")

    fb = gemini_service.generate_feedback(
        code=code,
        language=language,
        question_title=title,
        question_desc=desc,
        status=status,
        db=db
    )
    return AIFeedbackResponse(
        overall_assessment=fb.get("overall_assessment", ""),
        strengths=fb.get("strengths", []),
        potential_bugs=fb.get("potential_bugs", []),
        code_quality_score=fb.get("code_quality_score", 85),
        time_complexity=fb.get("time_complexity", "O(N)"),
        space_complexity=fb.get("space_complexity", "O(1)"),
        optimization_suggestions=fb.get("optimization_suggestions", []),
        concept_explanation=fb.get("concept_explanation", ""),
        next_learning_step=fb.get("next_learning_step", "")
    )
