import json
import random
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.content import Question, TestCase, QuestionOption
from app.models.test import Test, TestQuestion, TestAttempt
from app.schemas.test import (
    TestCreate,
    TestDetailOut,
    TestQuestionDetail,
    TestAttemptStart,
    TestAttemptSubmit,
    CandidateResultOut,
    TestCreatorAnalytics
)
from app.execution.runner import execution_service
from app.execution.validator import test_case_validator
from app.auth.dependencies import get_current_user, get_optional_user

router = APIRouter(prefix="/api/tests", tags=["Assessments & Tests"])

@router.post("", response_model=Dict[str, Any])
def create_test(
    req: TestCreate,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Creates a new assessment with shareable code"""
    new_test = Test(
        title=req.title.strip(),
        description=req.description,
        language_slug=req.language_slug.lower(),
        difficulty=req.difficulty,
        duration_minutes=req.duration_minutes,
        passing_score_percent=req.passing_score_percent,
        is_randomized=req.is_randomized,
        creator_id=current_user.id if current_user else None
    )
    db.add(new_test)
    db.flush()

    # If question_ids provided, attach them
    q_ids = req.question_ids
    if not q_ids:
        # Pick 5 default questions matching language/difficulty
        matched = db.query(Question).filter(
            Question.language_slug == req.language_slug.lower()
        ).limit(5).all()
        q_ids = [q.id for q in matched]
        # If still empty, grab any questions
        if not q_ids:
            any_q = db.query(Question).limit(5).all()
            q_ids = [q.id for q in any_q]

    for idx, qid in enumerate(q_ids):
        tq = TestQuestion(
            test_id=new_test.id,
            question_id=qid,
            points=20,
            display_order=idx + 1
        )
        db.add(tq)

    db.commit()
    db.refresh(new_test)

    return {
        "id": new_test.id,
        "share_code": new_test.share_code,
        "title": new_test.title,
        "share_url": f"/test/{new_test.share_code}",
        "duration_minutes": new_test.duration_minutes,
        "questions_count": len(q_ids)
    }

@router.get("", response_model=List[Dict[str, Any]])
def list_tests(db: Session = Depends(get_db)):
    tests = db.query(Test).filter(Test.is_published == True).order_by(Test.created_at.desc()).all()
    res = []
    for t in tests:
        q_count = len(t.test_questions)
        attempt_count = len(t.attempts)
        res.append({
            "id": t.id,
            "share_code": t.share_code,
            "title": t.title,
            "description": t.description,
            "language_slug": t.language_slug,
            "difficulty": t.difficulty,
            "duration_minutes": t.duration_minutes,
            "passing_score_percent": t.passing_score_percent,
            "questions_count": q_count,
            "attempts_count": attempt_count,
            "created_at": t.created_at
        })
    return res

@router.get("/{share_code}", response_model=TestDetailOut)
def get_test_by_share_code(share_code: str, db: Session = Depends(get_db)):
    test = db.query(Test).filter(Test.share_code == share_code.strip()).first()
    if not test:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    test_questions = []
    tqs = list(test.test_questions)
    if test.is_randomized:
        random.seed(share_code)
        random.shuffle(tqs)

    for idx, tq in enumerate(tqs):
        q = tq.question
        # Provide only public sample cases
        sample_cases = [
            {"input": tc.input_data, "expected_output": tc.expected_output}
            for tc in q.test_cases if not tc.is_hidden
        ]
        # Provide MCQ options with randomized order
        opts = [
            {"key": opt.option_key, "text": opt.text}
            for opt in q.options
        ]
        if test.is_randomized and opts:
            random.shuffle(opts)

        test_questions.append(TestQuestionDetail(
            id=tq.id,
            question_id=q.id,
            title=q.title,
            description=q.description,
            difficulty=q.difficulty,
            question_type=q.question_type,
            points=tq.points,
            display_order=idx + 1,
            starter_code=q.starter_code,
            input_format=q.input_format,
            output_format=q.output_format,
            constraints=q.constraints,
            options=opts if opts else None,
            public_test_cases=sample_cases if sample_cases else None
        ))

    return TestDetailOut(
        id=test.id,
        share_code=test.share_code,
        title=test.title,
        description=test.description,
        language_slug=test.language_slug,
        difficulty=test.difficulty,
        duration_minutes=test.duration_minutes,
        passing_score_percent=test.passing_score_percent,
        is_randomized=test.is_randomized,
        questions_count=len(test_questions),
        created_at=test.created_at,
        questions=test_questions
    )

@router.post("/{share_code}/start")
def start_test_attempt(
    share_code: str,
    req: TestAttemptStart,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    test = db.query(Test).filter(Test.share_code == share_code.strip()).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found.")

    attempt = TestAttempt(
        test_id=test.id,
        user_id=current_user.id if current_user else None,
        candidate_name=req.candidate_name.strip(),
        candidate_email=req.candidate_email.lower().strip(),
        status="in_progress",
        started_at=datetime.utcnow()
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {
        "attempt_id": attempt.id,
        "test_title": test.title,
        "duration_minutes": test.duration_minutes,
        "started_at": attempt.started_at,
        "expires_at": attempt.started_at + timedelta(minutes=test.duration_minutes)
    }

@router.post("/{share_code}/submit/{attempt_id}", response_model=CandidateResultOut)
def submit_test_attempt(
    share_code: str,
    attempt_id: int,
    req: TestAttemptSubmit,
    db: Session = Depends(get_db)
):
    attempt = db.query(TestAttempt).filter(
        TestAttempt.id == attempt_id,
        TestAttempt.test_id == Test.id,
        Test.share_code == share_code
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found.")

    test = attempt.test
    now = datetime.utcnow()
    elapsed_seconds = int((now - attempt.started_at).total_seconds())

    # Check timeout (with 3-minute grace period for network jitter)
    max_allowed = (test.duration_minutes * 60) + 180
    is_timed_out = elapsed_seconds > max_allowed

    # Grade questions
    total_possible = 0.0
    total_obtained = 0.0
    breakdown = []

    for tq in test.test_questions:
        q = tq.question
        q_points = tq.points
        total_possible += q_points
        user_ans = req.answers.get(q.id, "")

        if q.question_type == "coding":
            # Run code against ALL test cases
            tc_list = q.test_cases
            if not tc_list:
                run_res = execution_service.run_code(user_ans, q.language_slug)
                passed = run_res.is_success
                passed_count = 1 if passed else 0
                tc_total = 1
            else:
                passed_count = 0
                tc_total = len(tc_list)
                for tc in tc_list:
                    res = execution_service.run_code(user_ans, q.language_slug, tc.input_data)
                    norm_a = test_case_validator.normalize_output(res.stdout)
                    norm_e = test_case_validator.normalize_output(tc.expected_output)
                    if res.is_success and norm_a == norm_e:
                        passed_count += 1

            q_score = (passed_count / max(1, tc_total)) * q_points
            total_obtained += q_score
            breakdown.append({
                "question_id": q.id,
                "title": q.title,
                "type": "coding",
                "test_cases_passed": f"{passed_count}/{tc_total}",
                "points_earned": round(q_score, 1),
                "max_points": q_points,
                "is_correct": passed_count == tc_total
            })

        elif q.question_type in ["mcq", "output_prediction"]:
            # Check selected option
            correct_opt = next((opt for opt in q.options if opt.is_correct), None)
            is_correct = bool(correct_opt and user_ans.strip().upper() == correct_opt.option_key.upper())
            q_score = q_points if is_correct else 0.0
            total_obtained += q_score
            breakdown.append({
                "question_id": q.id,
                "title": q.title,
                "type": q.question_type,
                "candidate_answer": user_ans,
                "points_earned": q_score,
                "max_points": q_points,
                "is_correct": is_correct
            })

        else: # Debugging or conceptual
            # Give points if non-empty code provided
            is_attempted = bool(user_ans and len(user_ans.strip()) > 10)
            q_score = q_points * 0.8 if is_attempted else 0.0
            total_obtained += q_score
            breakdown.append({
                "question_id": q.id,
                "title": q.title,
                "type": q.question_type,
                "points_earned": q_score,
                "max_points": q_points,
                "is_correct": is_attempted
            })

    percentage = round((total_obtained / max(1.0, total_possible)) * 100.0, 1)
    passed = percentage >= test.passing_score_percent

    attempt.score = total_obtained
    attempt.total_possible_score = total_possible
    attempt.percentage = percentage
    attempt.passed = passed
    attempt.time_taken_seconds = elapsed_seconds
    attempt.status = "timed_out" if is_timed_out else "completed"
    attempt.answers = json.dumps(req.answers)
    attempt.question_results = json.dumps(breakdown)
    attempt.completed_at = now

    db.commit()

    return CandidateResultOut(
        attempt_id=attempt.id,
        test_title=test.title,
        candidate_name=attempt.candidate_name,
        score=total_obtained,
        total_possible_score=total_possible,
        percentage=percentage,
        passed=passed,
        time_taken_seconds=elapsed_seconds,
        status=attempt.status,
        question_breakdown=breakdown,
        completed_at=attempt.completed_at
    )

@router.get("/{share_code}/analytics", response_model=TestCreatorAnalytics)
def get_test_analytics(share_code: str, db: Session = Depends(get_db)):
    test = db.query(Test).filter(Test.share_code == share_code.strip()).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found.")

    attempts = test.attempts
    total_participants = len(attempts)
    passed_count = sum(1 for a in attempts if a.passed)
    avg_score = round(sum(a.percentage for a in attempts) / max(1, total_participants), 1)
    avg_time = int(sum(a.time_taken_seconds for a in attempts) / max(1, total_participants))

    participant_list = [
        {
            "id": a.id,
            "candidate_name": a.candidate_name,
            "candidate_email": a.candidate_email,
            "score": a.score,
            "percentage": a.percentage,
            "passed": a.passed,
            "time_taken_seconds": a.time_taken_seconds,
            "status": a.status,
            "completed_at": a.completed_at
        }
        for a in attempts
    ]

    return TestCreatorAnalytics(
        test_id=test.id,
        share_code=test.share_code,
        title=test.title,
        total_participants=total_participants,
        passed_count=passed_count,
        average_score=avg_score,
        average_time_seconds=avg_time,
        participants=participant_list
    )
