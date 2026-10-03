from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class CodeRunRequest(BaseModel):
    code: str
    language: str
    input_data: Optional[str] = ""
    question_id: Optional[int] = None

class TestCaseResult(BaseModel):
    test_case_id: Optional[int] = None
    is_sample: bool = False
    is_hidden: bool = False
    passed: bool
    input_data: Optional[str] = None # Only for public tests
    expected_output: Optional[str] = None # Only for public tests
    actual_output: Optional[str] = None # Only for public tests
    execution_time_ms: float = 0.0
    error: Optional[str] = None

class CodeRunResult(BaseModel):
    status: str # 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error'
    stdout: str = ""
    stderr: str = ""
    execution_time_ms: float = 0.0
    memory_kb: float = 0.0
    is_success: bool = True
    public_cases_passed: int = 0
    total_public_cases: int = 0
    all_public_passed: bool = True
    test_case_results: List[TestCaseResult] = []

class SubmitRequest(BaseModel):
    question_id: int
    code: str
    language: str

class SubmitResult(BaseModel):
    submission_id: Optional[int] = None
    status: str # 'Accepted', 'Wrong Answer', etc.
    score: float
    test_cases_passed: int
    total_test_cases: int
    execution_time_ms: float
    memory_kb: float
    test_results: List[TestCaseResult]
    ai_feedback: Optional[Dict[str, Any]] = None
    streak_updated: bool = False
    new_streak: int = 1
