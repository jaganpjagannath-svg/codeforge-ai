from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class AIQuestionGenerateRequest(BaseModel):
    prompt: Optional[str] = None # e.g. "Generate a Python loops beginner question"
    language: Optional[str] = "python"
    topic: Optional[str] = "loops"
    difficulty: Optional[str] = "easy"
    question_type: Optional[str] = "coding" # 'coding', 'mcq', 'output_prediction', 'debugging', 'conceptual', 'interview'

class AITestCaseItem(BaseModel):
    input: str
    expected_output: str
    is_hidden: bool = False
    explanation: Optional[str] = None

class AIMCQOption(BaseModel):
    key: str # 'A', 'B', 'C', 'D'
    text: str
    is_correct: bool
    explanation: Optional[str] = None

class AIQuestionResponse(BaseModel):
    title: str
    description: str
    difficulty: str = "easy"
    language: str
    topic: str
    question_type: str = "coding"
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    constraints: Optional[str] = None
    starter_code: Optional[str] = None
    reference_solution: Optional[str] = None
    solution_explanation: Optional[str] = None
    hints: List[str] = []
    test_cases: List[AITestCaseItem] = []
    options: Optional[List[AIMCQOption]] = None

class AIHintRequest(BaseModel):
    question_id: int
    hint_level: int = Field(1, ge=1, le=5) # 1: Conceptual, 2: Approach, 3: Algorithm, 4: Pseudocode, 5: Detailed
    user_code: Optional[str] = None

class AIHintResponse(BaseModel):
    level: int
    level_title: str
    hint: str
    has_next: bool

class AIFeedbackResponse(BaseModel):
    overall_assessment: str
    strengths: List[str] = []
    potential_bugs: List[str] = []
    code_quality_score: int = 80 # 0 to 100
    time_complexity: str = "O(n)"
    space_complexity: str = "O(1)"
    optimization_suggestions: List[str] = []
    concept_explanation: str = ""
    next_learning_step: str = ""

class AITestGenerateRequest(BaseModel):
    title: str
    language: str
    topics: List[str] = []
    difficulty: str = "beginner"
    num_questions: int = Field(5, ge=1, le=20)
    duration_minutes: int = 30
    question_types: List[str] = ["coding", "mcq"]
    passing_score: int = 60
