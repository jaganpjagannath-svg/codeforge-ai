from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

class TestCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    language_slug: str
    difficulty: str = "mixed"
    duration_minutes: int = Field(30, ge=5, le=180)
    passing_score_percent: int = Field(60, ge=10, le=100)
    is_randomized: bool = True
    question_ids: List[int] = []

class TestQuestionDetail(BaseModel):
    id: int
    question_id: int
    title: str
    description: str
    difficulty: str
    question_type: str
    points: int
    display_order: int
    starter_code: Optional[str] = None
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    constraints: Optional[str] = None
    options: Optional[List[Dict[str, Any]]] = None # For MCQs, keys and text only
    public_test_cases: Optional[List[Dict[str, Any]]] = None # Public test cases only

class TestDetailOut(BaseModel):
    id: int
    share_code: str
    title: str
    description: Optional[str] = None
    language_slug: str
    difficulty: str
    duration_minutes: int
    passing_score_percent: int
    is_randomized: bool
    questions_count: int
    created_at: datetime
    questions: Optional[List[TestQuestionDetail]] = None

    class Config:
        from_attributes = True

class TestAttemptStart(BaseModel):
    candidate_name: str = Field(..., min_length=2)
    candidate_email: EmailStr

class TestAttemptAnswer(BaseModel):
    question_id: int
    answer: str # Code for coding, option_key for MCQ, text for concept

class TestAttemptSubmit(BaseModel):
    answers: Dict[int, str] # question_id -> answer string
    time_taken_seconds: int = 0

class CandidateResultOut(BaseModel):
    attempt_id: int
    test_title: str
    candidate_name: str
    score: float
    total_possible_score: float
    percentage: float
    passed: bool
    time_taken_seconds: int
    status: str
    question_breakdown: List[Dict[str, Any]]
    completed_at: datetime

class TestCreatorAnalytics(BaseModel):
    test_id: int
    share_code: str
    title: str
    total_participants: int
    passed_count: int
    average_score: float
    average_time_seconds: int
    participants: List[Dict[str, Any]]
