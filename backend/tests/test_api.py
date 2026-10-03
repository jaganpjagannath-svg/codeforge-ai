import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure app is discoverable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app
from app.execution.runner import execution_service
from app.ai.intent_parser import parse_natural_language_intent
from app.execution.validator import test_case_validator

client = TestClient(app)

def test_healthcheck():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_auth_flow():
    email = f"test_{int(__import__('time').time())}@example.com"
    reg_res = client.post("/api/auth/register", json={
        "name": "Test Runner",
        "email": email,
        "password": "password123"
    })
    assert reg_res.status_code == 200
    data = reg_res.json()
    assert "access_token" in data
    token = data["access_token"]

    # Verify protected /me endpoint
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

    # Test login
    login_res = client.post("/api/auth/login", json={
        "email": email,
        "password": "password123"
    })
    assert login_res.status_code == 200

def test_languages_and_hierarchical_topics():
    res = client.get("/api/languages")
    assert res.status_code == 200
    langs = res.json()
    assert len(langs) >= 10
    slugs = [l["slug"] for l in langs]
    assert "python" in slugs
    assert "java" in slugs
    assert "cpp" in slugs

    # Topics tree
    topics_res = client.get("/api/languages/python/topics")
    assert topics_res.status_code == 200
    tree = topics_res.json()
    assert len(tree) > 0

def test_questions_and_test_case_concealment():
    res = client.get("/api/questions?language=python")
    assert res.status_code == 200
    qs = res.json()
    assert len(qs) > 0

    first_q_id = qs[0]["id"]
    detail_res = client.get(f"/api/questions/{first_q_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()

    # Check that hidden test cases do not reveal expected output
    for tc in detail["test_cases"]:
        if tc["is_hidden"]:
            assert tc["expected_output"] == "[Hidden]"
            assert tc["input_data"] == "[Hidden Test Case]"

def test_sandbox_code_execution():
    # Python normal execution
    py_code = "print(sum([1, 2, 3, 4, 5]))"
    res = execution_service.run_code(py_code, "python", timeout=3)
    assert res.status == "Accepted"
    assert res.stdout.strip() == "15"
    assert res.execution_time_ms > 0

    # Python timeout execution
    infinite_loop = "while True: pass"
    res_tle = execution_service.run_code(infinite_loop, "python", timeout=1)
    assert res_tle.status == "Time Limit Exceeded"

    # SQL execution
    sql_setup = "CREATE TABLE users (id INT, name TEXT); INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob');"
    sql_code = "SELECT name FROM users WHERE id = 2;"
    sql_res = execution_service.run_code(sql_code, "sql", input_data=sql_setup)
    assert sql_res.status == "Accepted"
    assert "Bob" in sql_res.stdout

def test_ai_intent_parser():
    p1 = parse_natural_language_intent("Generate questions using Python fundamentals.")
    assert p1["language"] == "python"
    assert p1["topic"] in ["fundamentals", "loops"]

    p2 = parse_natural_language_intent("Generate a DSA array medium-level coding problem.")
    assert p2["language"] == "dsa"
    assert p2["topic"] == "arrays"
    assert p2["difficulty"] == "medium"
    assert p2["question_type"] == "coding"

    p3 = parse_natural_language_intent("Give me 5 Java OOP questions.")
    assert p3["language"] == "java"
    assert p3["topic"] == "oop"
    assert p3["num_questions"] == 5

def test_shareable_assessment():
    res = client.get("/api/tests")
    assert res.status_code == 200
    tests = res.json()
    assert len(tests) > 0

    share_code = tests[0]["share_code"]
    test_detail = client.get(f"/api/tests/{share_code}")
    assert test_detail.status_code == 200
    data = test_detail.json()
    assert data["share_code"] == share_code
    assert data["questions_count"] > 0

if __name__ == "__main__":
    print("Running test suite...")
    test_healthcheck()
    test_auth_flow()
    test_languages_and_hierarchical_topics()
    test_questions_and_test_case_concealment()
    test_sandbox_code_execution()
    test_ai_intent_parser()
    test_shareable_assessment()
    print("[SUCCESS] All 7 test suites passed successfully!")
