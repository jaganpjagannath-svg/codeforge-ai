import json
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.content import Question, Language, Topic
from app.models.user import User
from app.models.test import Test

client = TestClient(app)

def test_full_master_scenario():
    """
    Executes the 40-step master scenario specified in prompt Section 24:
    1-5: Register, Logout, Login
    6-7: No [object Object] or raw errors
    8-11: Dashboard, Practice, Languages, Topics
    12: Question generation
    13-25: Editor, Language change, Run code, Submit disabled check, Fix code, Run code, Submit enabled, Verify score & progress
    26-32: Create assessment, Share link, Start test, Submit answers, Results
    33-36: PWA, Manifest, Service worker, Health
    """
    # Step 1: Open application & verify static delivery
    index_res = client.get("/")
    assert index_res.status_code == 200
    assert "CodeForge AI" in index_res.text
    assert "[object Object]" not in index_res.text

    # Step 2 & 3: Register a new user
    uniq = str(uuid.uuid4())[:8]
    test_email = f"master_{uniq}@codeforge.ai"
    test_password = "SecurePassword123"

    reg_res = client.post("/api/auth/register", json={
        "name": f"Master Tester {uniq}",
        "email": test_email,
        "password": test_password,
        "confirm_password": test_password
    })
    assert reg_res.status_code in [200, 201]
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == test_email
    assert "[object Object]" not in json.dumps(reg_data)

    # Step 4: Logout (client drops token, verified on client-side)
    # Step 5: Login again
    login_res = client.post("/api/auth/login", json={
        "email": test_email,
        "password": test_password
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    token = login_data["access_token"]
    assert token
    headers = {"Authorization": f"Bearer {token}"}

    # Step 6 & 7: Verify no [object Object] and no raw API errors
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert "[object Object]" not in json.dumps(me_res.json())

    # Step 8: Open Dashboard
    dash_res = client.get("/api/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert "stats" in dash_data
    assert "progress_cards" in dash_data
    assert "[object Object]" not in json.dumps(dash_data)

    # Step 9-11: Open Practice & Select Language / Topic
    langs_res = client.get("/api/languages")
    assert langs_res.status_code == 200
    langs = langs_res.json()
    assert len(langs) >= 10
    assert any(l["slug"] == "python" for l in langs)

    q_list_res = client.get("/api/questions?language=python")
    assert q_list_res.status_code == 200
    questions = q_list_res.json()
    assert len(questions) > 0
    target_q = questions[0]
    q_id = target_q["id"]

    # Step 12: Generate question via AI
    ai_gen_res = client.post("/api/ai/generate-question", json={
        "language": "python",
        "topic": "arrays",
        "difficulty": "easy",
        "question_type": "coding"
    })
    assert ai_gen_res.status_code == 200
    ai_q = ai_gen_res.json()
    assert ai_q["id"] > 0
    assert len(ai_q["test_cases"]) > 0

    # Step 13-17: Run wrong code and check test results
    wrong_code = "def solution():\n    return 'wrong output'"
    run_wrong = client.post("/api/code/run", json={
        "code": wrong_code,
        "language": "python",
        "question_id": q_id
    })
    assert run_wrong.status_code == 200
    wrong_data = run_wrong.json()
    assert wrong_data["all_public_passed"] is False

    # Step 18: Confirm Submit is REJECTED when public test cases failed
    submit_fail = client.post("/api/code/submit", json={
        "code": wrong_code,
        "language": "python",
        "question_id": q_id
    }, headers=headers)
    assert submit_fail.status_code == 400
    fail_body = submit_fail.json()
    assert fail_body["success"] is False
    assert "error" in fail_body
    assert "[object Object]" not in json.dumps(fail_body)

    # Step 19-21: Fix code (use reference solution) and run again
    db = SessionLocal()
    q_db = db.query(Question).filter(Question.id == q_id).first()
    correct_code = q_db.reference_solution
    db.close()

    run_correct = client.post("/api/code/run", json={
        "code": correct_code,
        "language": "python",
        "question_id": q_id
    })
    assert run_correct.status_code == 200
    correct_data = run_correct.json()
    assert correct_data["all_public_passed"] is True
    assert correct_data["public_cases_passed"] == correct_data["total_public_cases"]

    # Step 22-25: Submit becomes eligible -> Submit solution -> Verify score
    submit_success = client.post("/api/code/submit", json={
        "code": correct_code,
        "language": "python",
        "question_id": q_id
    }, headers=headers)
    assert submit_success.status_code == 200
    ok_data = submit_success.json()
    assert ok_data["status"] == "Accepted"
    assert ok_data["score"] > 0
    assert "[object Object]" not in json.dumps(ok_data)

    # Step 26-28: Create assessment & generate share link
    create_test_res = client.post("/api/tests", json={
        "title": f"Master Assessment {uniq}",
        "description": "Comprehensive evaluation challenge",
        "language_slug": "python",
        "difficulty": "intermediate",
        "duration_minutes": 30,
        "passing_score_percent": 60,
        "is_randomized": True
    }, headers=headers)
    assert create_test_res.status_code == 200
    test_out = create_test_res.json()
    share_code = test_out["share_code"]
    assert share_code

    # Step 29: Open share link
    get_test_res = client.get(f"/api/tests/{share_code}")
    assert get_test_res.status_code == 200
    test_detail = get_test_res.json()
    assert test_detail["share_code"] == share_code
    assert len(test_detail["questions"]) > 0

    # Step 30: Start test
    start_test_res = client.post(f"/api/tests/{share_code}/start", json={
        "candidate_name": "Bob Candidate",
        "candidate_email": f"bob_{uniq}@example.com"
    })
    assert start_test_res.status_code == 200
    attempt_id = start_test_res.json()["attempt_id"]

    # Step 31-32: Submit answers and verify results
    answers = {}
    db = SessionLocal()
    for tq in test_detail["questions"]:
        qid = tq["question_id"]
        q_item = db.query(Question).filter(Question.id == qid).first()
        if q_item.question_type == "coding":
            answers[str(qid)] = q_item.reference_solution or "print('ok')"
        elif q_item.question_type in ["mcq", "output_prediction"]:
            c_opt = next((o.option_key for o in q_item.options if o.is_correct), "A")
            answers[str(qid)] = c_opt
        else:
            answers[str(qid)] = "Sample explanation text"
    db.close()

    submit_exam_res = client.post(f"/api/tests/{share_code}/submit/{attempt_id}", json={
        "answers": answers,
        "time_taken_seconds": 180
    })
    assert submit_exam_res.status_code == 200
    exam_result = submit_exam_res.json()
    assert exam_result["score"] >= 0
    assert len(exam_result["question_breakdown"]) == len(test_detail["questions"])

    # Verify Creator Analytics
    analytics_res = client.get(f"/api/tests/{share_code}/analytics", headers=headers)
    assert analytics_res.status_code == 200
    analytics = analytics_res.json()
    assert analytics["total_participants"] >= 1

    # Step 33-36: PWA, Manifest, Service Worker, and Health endpoints
    pwa_manifest = client.get("/manifest.json")
    assert pwa_manifest.status_code == 200
    manifest_data = pwa_manifest.json()
    assert "name" in manifest_data
    assert "start_url" in manifest_data

    sw_res = client.get("/sw.js")
    assert sw_res.status_code == 200
    assert "install" in sw_res.text

    # Section 26.10: GET /health
    health_res = client.get("/health")
    assert health_res.status_code == 200
    h_data = health_res.json()
    assert h_data["success"] is True
    assert h_data["status"] == "healthy"
