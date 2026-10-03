import sys
import time
from pathlib import Path
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app

client = TestClient(app)

def test_phase1_auth():
    print("[PHASE 1] Starting Authentication & Error Normalization Tests...")

    # 1. Test Weak Password (< 8 chars)
    res_weak = client.post("/api/auth/register", json={
        "name": "Weak Pwd",
        "email": f"weak_{int(time.time())}@example.com",
        "password": "123",
        "confirm_password": "123"
    })
    assert res_weak.status_code == 400
    data_weak = res_weak.json()
    assert data_weak["success"] is False
    assert "8 characters" in data_weak["error"]["message"]
    print("  PASS: Weak password correctly rejected with friendly message.")

    # 2. Test Password Mismatch
    res_mismatch = client.post("/api/auth/register", json={
        "name": "Mismatch",
        "email": f"mismatch_{int(time.time())}@example.com",
        "password": "password123",
        "confirm_password": "different123"
    })
    assert res_mismatch.status_code == 400
    data_mismatch = res_mismatch.json()
    assert data_mismatch["success"] is False
    assert "Passwords do not match" in data_mismatch["error"]["message"]
    print("  PASS: Password mismatch rejected with friendly message.")

    # 3. Test Valid Registration
    email = f"user_{int(time.time())}@example.com"
    res_valid = client.post("/api/auth/register", json={
        "name": "Valid User",
        "email": email,
        "password": "password123",
        "confirm_password": "password123"
    })
    assert res_valid.status_code == 200
    data_valid = res_valid.json()
    assert "access_token" in data_valid
    token = data_valid["access_token"]
    print("  PASS: Valid registration succeeded and returned JWT token.")

    # 4. Test Duplicate Email
    res_dup = client.post("/api/auth/register", json={
        "name": "Duplicate User",
        "email": email,
        "password": "password123",
        "confirm_password": "password123"
    })
    assert res_dup.status_code == 400
    data_dup = res_dup.json()
    assert data_dup["success"] is False
    assert "already exists" in data_dup["error"]["message"]
    print("  PASS: Duplicate email rejected cleanly.")

    # 5. Test Invalid Login
    res_bad_login = client.post("/api/auth/login", json={
        "email": email,
        "password": "wrongpassword123"
    })
    assert res_bad_login.status_code == 401
    data_bad = res_bad_login.json()
    assert data_bad["success"] is False
    assert data_bad["error"]["message"] == "Incorrect email or password."
    print("  PASS: Invalid login returned standardized 401 with friendly message.")

    # 6. Test Valid Login
    res_good_login = client.post("/api/auth/login", json={
        "email": email,
        "password": "password123"
    })
    assert res_good_login.status_code == 200
    assert "access_token" in res_good_login.json()
    print("  PASS: Valid login succeeded.")

    # 7. Test Protected Route with and without token
    res_no_token = client.get("/api/auth/me")
    assert res_no_token.status_code == 401

    res_with_token = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_with_token.status_code == 200
    assert res_with_token.json()["email"] == email
    print("  PASS: Protected route verified with bearer token.")

    # 8. Test Forgot Password
    new_pwd = "newpassword456"
    res_forgot = client.post("/api/auth/forgot-password", json={
        "email": email,
        "new_password": new_pwd
    })
    assert res_forgot.status_code == 200
    assert res_forgot.json()["success"] is True

    # Test login with new password
    res_new_login = client.post("/api/auth/login", json={
        "email": email,
        "password": new_pwd
    })
    assert res_new_login.status_code == 200
    print("  PASS: Password reset flow verified.")

    print("\n[PHASE 1 COMPLETE] All Authentication & Error Normalization tests passed!")

if __name__ == "__main__":
    test_phase1_auth()
