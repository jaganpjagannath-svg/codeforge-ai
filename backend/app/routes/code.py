import json
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.content import Question, TestCase
from app.models.submission import Submission, UserTopicProgress, UserLanguageProgress
from app.schemas.execution import CodeRunRequest, CodeRunResult, SubmitRequest, SubmitResult, TestCaseResult
from app.execution.runner import execution_service
from app.execution.validator import test_case_validator
from app.ai.gemini_client import gemini_service
from app.auth.dependencies import get_optional_user, get_current_user
from app.exceptions import ResourceNotFoundError, SubmissionEligibilityError
from app.logger import app_logger

router = APIRouter(prefix="/api/code", tags=["Code Execution & Judge"])

@router.post("/run", response_model=CodeRunResult)
def run_code(
    req: CodeRunRequest,
    db: Session = Depends(get_db)
):
    """
    Executes code in an isolated sandbox.
    If question_id is provided, automatically evaluates code against all PUBLIC test cases!
    """
    # 1. If question_id provided, run against public test cases
    if req.question_id:
        question = db.query(Question).filter(Question.id == req.question_id).first()
        if question and question.test_cases:
            public_cases = [tc for tc in question.test_cases if not tc.is_hidden]
            if public_cases:
                tc_results: List[TestCaseResult] = []
                passed_count = 0
                total_time = 0.0
                max_mem = 0.0
                overall_status = "Accepted"
                last_stdout = ""
                last_stderr = ""

                for tc in public_cases:
                    run_res = execution_service.run_code(
                        code=req.code,
                        language=req.language,
                        input_data=tc.input_data,
                        timeout=5
                    )
                    total_time += run_res.execution_time_ms
                    max_mem = max(max_mem, run_res.memory_kb)
                    last_stdout = run_res.stdout
                    last_stderr = run_res.stderr

                    norm_actual = test_case_validator.normalize_output(run_res.stdout)
                    norm_expected = test_case_validator.normalize_output(tc.expected_output)

                    passed = (run_res.is_success and norm_actual == norm_expected)
                    if passed:
                        passed_count += 1
                    else:
                        if overall_status == "Accepted":
                            overall_status = run_res.status if run_res.status != "Accepted" else "Wrong Answer"

                    tc_results.append(TestCaseResult(
                        test_case_id=tc.id,
                        is_sample=tc.is_sample,
                        is_hidden=False,
                        passed=passed,
                        input_data=tc.input_data,
                        expected_output=tc.expected_output,
                        actual_output=run_res.stdout,
                        execution_time_ms=run_res.execution_time_ms,
                        error=run_res.stderr if run_res.stderr else None
                    ))

                all_passed = (passed_count == len(public_cases))
                avg_time = total_time / max(1, len(public_cases))

                return CodeRunResult(
                    status=overall_status,
                    stdout=last_stdout,
                    stderr=last_stderr,
                    execution_time_ms=round(avg_time, 2),
                    memory_kb=round(max_mem, 2),
                    is_success=all_passed,
                    public_cases_passed=passed_count,
                    total_public_cases=len(public_cases),
                    all_public_passed=all_passed,
                    test_case_results=tc_results
                )

    # 2. Otherwise run against custom input
    res = execution_service.run_code(
        code=req.code,
        language=req.language,
        input_data=req.input_data or "",
        timeout=5
    )
    return CodeRunResult(
        status=res.status,
        stdout=res.stdout,
        stderr=res.stderr,
        execution_time_ms=res.execution_time_ms,
        memory_kb=res.memory_kb,
        is_success=res.is_success,
        public_cases_passed=1 if res.is_success else 0,
        total_public_cases=1,
        all_public_passed=res.is_success,
        test_case_results=[]
    )

@router.post("/submit", response_model=SubmitResult)
def submit_code(
    req: SubmitRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Submits code to judge against public and hidden test cases.
    SERVER-SIDE VALIDATION: Rejects submission if any required public test case fails!
    """
    question = db.query(Question).filter(Question.id == req.question_id).first()
    if not question:
        raise ResourceNotFoundError(message="Question not found.")

    test_cases = question.test_cases
    if not test_cases:
        # If question has no test cases yet, run once
        run_res = execution_service.run_code(req.code, req.language, "", timeout=5)
        if not run_res.is_success:
            raise SubmissionEligibilityError("Code must compile and run successfully before submission.")
        overall_status = run_res.status
        is_acc = run_res.is_success
        tc_results = [TestCaseResult(
            passed=is_acc,
            input_data="Default",
            expected_output="",
            actual_output=run_res.stdout,
            execution_time_ms=run_res.execution_time_ms,
            error=run_res.stderr if not is_acc else None
        )]
        passed_count = 1 if is_acc else 0
        total_count = 1
        avg_time = run_res.execution_time_ms
        avg_mem = run_res.memory_kb
    else:
        # STEP 1: Verify all public test cases pass (RULE #25 & #26)
        public_cases = [tc for tc in test_cases if not tc.is_hidden]
        for idx, tc in enumerate(public_cases):
            run_res = execution_service.run_code(req.code, req.language, tc.input_data, timeout=5)
            norm_actual = test_case_validator.normalize_output(run_res.stdout)
            norm_expected = test_case_validator.normalize_output(tc.expected_output)
            if not run_res.is_success or norm_actual != norm_expected:
                app_logger.warning(f"Submission rejected: Public test case #{idx+1} failed.")
                raise SubmissionEligibilityError(
                    "All required public test cases must pass before submitting your solution. Please test and debug using 'Run Code'."
                )

        # STEP 2: Evaluate ALL test cases (both public AND hidden test cases)
        tc_results = []
        passed_count = 0
        total_count = len(test_cases)
        total_time = 0.0
        max_mem = 0.0
        overall_status = "Accepted"

        for tc in test_cases:
            run_res = execution_service.run_code(
                code=req.code,
                language=req.language,
                input_data=tc.input_data,
                timeout=5
            )
            total_time += run_res.execution_time_ms
            max_mem = max(max_mem, run_res.memory_kb)

            norm_actual = test_case_validator.normalize_output(run_res.stdout)
            norm_expected = test_case_validator.normalize_output(tc.expected_output)

            passed = (run_res.is_success and norm_actual == norm_expected)
            if passed:
                passed_count += 1
            else:
                if overall_status == "Accepted":
                    if run_res.status != "Accepted":
                        overall_status = run_res.status # TLE, Runtime Error, etc.
                    else:
                        overall_status = "Wrong Answer"

            # Hide hidden test details from client response (Rule #21)
            tc_results.append(TestCaseResult(
                test_case_id=tc.id,
                is_sample=tc.is_sample,
                is_hidden=tc.is_hidden,
                passed=passed,
                input_data="[Hidden Test Case]" if tc.is_hidden else tc.input_data,
                expected_output="[Hidden]" if tc.is_hidden else tc.expected_output,
                actual_output="[Hidden]" if tc.is_hidden else run_res.stdout,
                execution_time_ms=run_res.execution_time_ms,
                error=run_res.stderr if not tc.is_hidden and run_res.stderr else None
            ))

        avg_time = total_time / max(1, total_count)
        avg_mem = max_mem

    score = round((passed_count / total_count) * 100.0, 1)

    # Trigger AI code review
    ai_feedback = gemini_service.generate_feedback(
        code=req.code,
        language=req.language,
        question_title=question.title,
        question_desc=question.description,
        status=overall_status,
        db=db
    )

    submission_id = None
    streak_updated = False
    new_streak = 1

    # If user is authenticated, record submission and update progress
    if current_user:
        sub = Submission(
            user_id=current_user.id,
            question_id=question.id,
            code=req.code,
            language=req.language,
            status=overall_status,
            score=score,
            execution_time_ms=avg_time,
            memory_kb=avg_mem,
            test_cases_passed=passed_count,
            total_test_cases=total_count,
            test_results=json.dumps([r.model_dump() for r in tc_results]),
            ai_feedback=json.dumps(ai_feedback)
        )
        db.add(sub)

        # Update Topic Progress
        if question.topic_id:
            topic_prog = db.query(UserTopicProgress).filter(
                UserTopicProgress.user_id == current_user.id,
                UserTopicProgress.topic_id == question.topic_id
            ).first()
            if not topic_prog:
                topic_prog = UserTopicProgress(
                    user_id=current_user.id,
                    topic_id=question.topic_id,
                    questions_attempted=1,
                    questions_solved=1 if overall_status == "Accepted" else 0,
                    mastery_percentage=100.0 if overall_status == "Accepted" else 0.0,
                    last_practiced_at=datetime.utcnow()
                )
                db.add(topic_prog)
            else:
                topic_prog.questions_attempted += 1
                if overall_status == "Accepted":
                    topic_prog.questions_solved += 1
                topic_prog.mastery_percentage = min(100.0, round((topic_prog.questions_solved / max(1, topic_prog.questions_attempted)) * 100.0, 1))
                topic_prog.last_practiced_at = datetime.utcnow()

        # Update Language Progress
        lang_prog = db.query(UserLanguageProgress).filter(
            UserLanguageProgress.user_id == current_user.id,
            UserLanguageProgress.language_slug == req.language.lower()
        ).first()
        if not lang_prog:
            lang_prog = UserLanguageProgress(
                user_id=current_user.id,
                language_slug=req.language.lower(),
                questions_attempted=1,
                questions_solved=1 if overall_status == "Accepted" else 0,
                mastery_percentage=100.0 if overall_status == "Accepted" else 0.0,
                xp=50 if overall_status == "Accepted" else 10,
                last_practiced_at=datetime.utcnow()
            )
            db.add(lang_prog)
        else:
            lang_prog.questions_attempted += 1
            if overall_status == "Accepted":
                lang_prog.questions_solved += 1
                lang_prog.xp += 50
            else:
                lang_prog.xp += 10
            lang_prog.mastery_percentage = min(100.0, round((lang_prog.questions_solved / max(1, lang_prog.questions_attempted)) * 100.0, 1))
            lang_prog.last_practiced_at = datetime.utcnow()

        # Update User Streak
        now = datetime.utcnow()
        if current_user.last_active_date:
            days = (now.date() - current_user.last_active_date.date()).days
            if days == 1:
                current_user.streak_days += 1
                streak_updated = True
        current_user.last_active_date = now
        current_user.total_learning_seconds += int(avg_time / 1000) + 15
        new_streak = current_user.streak_days

        db.commit()
        db.refresh(sub)
        submission_id = sub.id

        app_logger.info(f"Submission recorded for user {current_user.id} on question {question.id}: {overall_status} ({score}%)")

    return SubmitResult(
        submission_id=submission_id,
        status=overall_status,
        score=score,
        test_cases_passed=passed_count,
        total_test_cases=total_count,
        execution_time_ms=avg_time,
        memory_kb=avg_mem,
        test_results=tc_results,
        ai_feedback=ai_feedback,
        streak_updated=streak_updated,
        new_streak=new_streak
    )
