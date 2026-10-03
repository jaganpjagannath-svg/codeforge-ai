import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.content import Language, Question, TestCase
from app.models.user import User
from app.models.test import Test

client = TestClient(app)

def test_01_health_and_frontend():
    """Verify health endpoint and frontend index serving"""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["ok", "healthy"]
    assert data["success"] is True

    # Frontend serving
    res = client.get("/")
    assert res.status_code == 200
    assert "CodeForge AI" in res.text

def test_02_registration_validation():
    """Verify registration validation: confirm_password and length"""
    # 1. Password mismatch
    res = client.post("/api/auth/register", json={
        "name": "Test Candidate",
        "email": "mismatch@example.com",
        "password": "Password123",
        "confirm_password": "Password456"
    })
    assert res.status_code in [400, 422]
    err_body = res.json()
    assert "Passwords do not match" in str(err_body)

    # 2. Password too short (< 8 chars)
    res = client.post("/api/auth/register", json={
        "name": "Test Candidate",
        "email": "short@example.com",
        "password": "pass",
        "confirm_password": "pass"
    })
    assert res.status_code in [400, 422]

    # 3. Successful registration
    import uuid
    uniq = str(uuid.uuid4())[:8]
    email = f"user_{uniq}@codeforge.ai"
    res = client.post("/api/auth/register", json={
        "name": f"Candidate {uniq}",
        "email": email,
        "password": "SecurePassword123",
        "confirm_password": "SecurePassword123"
    })
    assert res.status_code in [200, 201]
    reg_data = res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == email

def test_03_login_and_auth_flow():
    """Verify login and /me endpoint"""
    res = client.post("/api/auth/login", json={
        "email": "jagan@codeforge.ai",
        "password": "jagan123"
    })
    assert res.status_code == 200
    data = res.json()
    token = data["access_token"]
    assert token

    # Test /api/auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "jagan@codeforge.ai"

def test_04_languages_and_questions_listing():
    """Verify languages, topics, and questions endpoints"""
    lang_res = client.get("/api/languages")
    assert lang_res.status_code == 200
    langs = lang_res.json()
    assert len(langs) >= 10
    slugs = [l["slug"] for l in langs]
    assert "python" in slugs
    assert "javascript" in slugs
    assert "sql" in slugs

    # List questions
    q_res = client.get("/api/questions?language=python")
    assert q_res.status_code == 200
    questions = q_res.json()
    assert len(questions) > 0

    # Ensure hidden test cases are concealed in detail endpoint
    q_id = questions[0]["id"]
    detail_res = client.get(f"/api/questions/{q_id}")
    assert detail_res.status_code == 200
    q_detail = detail_res.json()
    for tc in q_detail["test_cases"]:
        if tc["is_hidden"]:
            assert tc["input_data"] == "[Hidden Test Case]"
            assert tc["expected_output"] == "[Hidden]"

def test_05_code_run_and_submit_eligibility():
    """
    CRITICAL RULE TEST (Section 25 & 26):
    Submit MUST be rejected if required public test cases do not pass!
    Submit MUST succeed when required public test cases pass!
    """
    # Login
    login_res = client.post("/api/auth/login", json={
        "email": "jagan@codeforge.ai",
        "password": "jagan123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Find Two Sum or question 1
    q_res = client.get("/api/questions?language=python")
    questions = q_res.json()
    q_id = questions[0]["id"]

    # 1. Run WRONG code
    wrong_code = "print('incorrect output')"
    run_res = client.post("/api/code/run", json={
        "code": wrong_code,
        "language": "python",
        "question_id": q_id
    })
    assert run_res.status_code == 200
    run_data = run_res.json()
    assert run_data["all_public_passed"] is False

    # 2. Try to SUBMIT the wrong code -> MUST BE REJECTED with 400 SubmissionEligibilityError
    submit_fail = client.post("/api/code/submit", json={
        "code": wrong_code,
        "language": "python",
        "question_id": q_id
    }, headers=headers)
    assert submit_fail.status_code == 400
    fail_data = submit_fail.json()
    assert "error" in fail_data
    assert "public test case" in fail_data["error"]["message"].lower()

    # 3. Run CORRECT code (fetch reference solution from db)
    db = SessionLocal()
    q_db = db.query(Question).filter(Question.id == q_id).first()
    correct_code = q_db.reference_solution
    db.close()

    run_pass = client.post("/api/code/run", json={
        "code": correct_code,
        "language": "python",
        "question_id": q_id
    })
    assert run_pass.status_code == 200
    assert run_pass.json()["all_public_passed"] is True

    # 4. SUBMIT the correct code -> MUST SUCCEED with 200 OK
    submit_ok = client.post("/api/code/submit", json={
        "code": correct_code,
        "language": "python",
        "question_id": q_id
    }, headers=headers)
    assert submit_ok.status_code == 200
    ok_data = submit_ok.json()
    assert ok_data["status"] == "Accepted"
    assert ok_data["score"] > 0

def test_06_ai_endpoints():
    """Verify AI intent parsing, hints, and question generation"""
    # Intent parser
    intent_res = client.post("/api/ai/parse-intent", json={
        "prompt": "Create an easy python challenge about list filtering"
    })
    assert intent_res.status_code == 200
    intent = intent_res.json()
    assert intent["language"] == "python"

    # AI Hint
    hint_res = client.post("/api/ai/hint", json={
        "question_id": 1,
        "hint_level": 1,
        "user_code": "def solution():\n    pass"
    })
    assert hint_res.status_code == 200
    hint_data = hint_res.json()
    assert "hint" in hint_data
    assert len(hint_data["hint"]) > 5

    # AI Question Generation
    gen_res = client.post("/api/ai/generate-question", json={
        "language": "python",
        "topic": "strings",
        "difficulty": "easy",
        "question_type": "coding"
    })
    assert gen_res.status_code == 200
    new_q = gen_res.json()
    assert new_q["id"] > 0
    assert len(new_q["test_cases"]) > 0

def test_07_assessments_lifecycle():
    """Verify test creation, start, question testing, submit, and creator analytics"""
    # 1. Create Assessment
    create_res = client.post("/api/tests", json={
        "title": "Automated Certification Assessment",
        "description": "Standard Python Certification",
        "language_slug": "python",
        "difficulty": "intermediate",
        "duration_minutes": 45,
        "passing_score_percent": 60,
        "is_randomized": True
    })
    assert create_res.status_code == 200
    test_data = create_res.json()
    share_code = test_data["share_code"]
    assert share_code

    # 2. Get Test by Share Code
    get_res = client.get(f"/api/tests/{share_code}")
    assert get_res.status_code == 200
    detail = get_res.json()
    assert detail["title"] == "Automated Certification Assessment"
    assert len(detail["questions"]) > 0

    # 3. Start Candidate Attempt
    start_res = client.post(f"/api/tests/{share_code}/start", json={
        "candidate_name": "Alice Candidate",
        "candidate_email": "alice@example.com"
    })
    assert start_res.status_code == 200
    attempt_id = start_res.json()["attempt_id"]

    # 4. Prepare answers (use reference solutions where available)
    db = SessionLocal()
    answers = {}
    for tq in detail["questions"]:
        qid = tq["question_id"]
        q_obj = db.query(Question).filter(Question.id == qid).first()
        if q_obj.question_type == "coding":
            answers[str(qid)] = q_obj.reference_solution or "print('ok')"
        elif q_obj.question_type == "mcq":
            correct_opt = next((opt.option_key for opt in q_obj.options if opt.is_correct), "A")
            answers[str(qid)] = correct_opt
        else:
            answers[str(qid)] = "Sample explanation text for conceptual question"
    db.close()

    # 5. Submit candidate attempt
    submit_attempt_res = client.post(f"/api/tests/{share_code}/submit/{attempt_id}", json={
        "answers": answers,
        "time_taken_seconds": 120
    })
    assert submit_attempt_res.status_code == 200
    result = submit_attempt_res.json()
    assert result["score"] >= 0
    assert "question_breakdown" in result
    assert len(result["question_breakdown"]) == len(detail["questions"])

    # 6. Check Creator Analytics
    analytics_res = client.get(f"/api/tests/{share_code}/analytics")
    assert analytics_res.status_code == 200
    analytics = analytics_res.json()
    assert analytics["total_participants"] >= 1
    assert len(analytics["participants"]) >= 1
    assert analytics["participants"][0]["candidate_email"] == "alice@example.com"

def test_08_admin_endpoints():
    """Verify admin endpoints and stats"""
    login_res = client.post("/api/auth/login", json={
        "email": "admin@codeforge.ai",
        "password": "admin123"
    })
    assert login_res.status_code == 200
    admin_token = login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin stats
    stats_res = client.get("/api/admin/stats", headers=admin_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_users" in stats
    assert "total_questions" in stats
    assert "total_submissions" in stats
