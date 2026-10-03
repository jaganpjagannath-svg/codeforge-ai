from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field

class TestCaseBase(BaseModel):
    input_data: str
    expected_output: str
    is_hidden: bool = False
    is_sample: bool = True
    points: int = 10

class TestCaseCreate(TestCaseBase):
    pass

class TestCaseOut(BaseModel):
    id: int
    input_data: Optional[str] = None # Hidden tests have input obscured or None
    expected_output: Optional[str] = None # Hidden tests never reveal expected output
    is_hidden: bool
    is_sample: bool
    points: int

    class Config:
        from_attributes = True

class OptionBase(BaseModel):
    option_key: str
    text: str
    is_correct: bool = False
    explanation: Optional[str] = None

class OptionCreate(OptionBase):
    pass

class OptionOut(BaseModel):
    id: int
    option_key: str
    text: str

    class Config:
        from_attributes = True

class OptionDetailOut(OptionOut):
    is_correct: bool
    explanation: Optional[str] = None

class QuestionBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: str
    difficulty: str = "easy"
    language_slug: str
    topic_id: Optional[int] = None
    question_type: str = "coding"
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    constraints: Optional[str] = None
    starter_code: Optional[str] = None
    reference_solution: Optional[str] = None
    explanation: Optional[str] = None
    hints: Optional[str] = None

class QuestionCreate(QuestionBase):
    test_cases: Optional[List[TestCaseCreate]] = None
    options: Optional[List[OptionCreate]] = None

class QuestionOut(BaseModel):
    id: int
    title: str
    slug: Optional[str] = None
    description: str
    difficulty: str
    language_slug: str
    topic_id: Optional[int] = None
    question_type: str
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    constraints: Optional[str] = None
    starter_code: Optional[str] = None
    created_by_ai: bool = False
    is_approved: bool = True
    created_at: datetime

    class Config:
        from_attributes = True

class QuestionDetailOut(QuestionOut):
    test_cases: List[TestCaseOut] = []
    options: List[OptionOut] = []
    has_hints: bool = True

class TopicBase(BaseModel):
    name: str
    slug: str
    category: str = "fundamentals"
    description: Optional[str] = None
    display_order: int = 0
    language_id: Optional[int] = None
    parent_id: Optional[int] = None

class TopicOut(TopicBase):
    id: int
    questions_count: Optional[int] = 0

    class Config:
        from_attributes = True

class TopicTreeOut(TopicOut):
    subtopics: List["TopicTreeOut"] = []

TopicTreeOut.model_rebuild()

class LanguageOut(BaseModel):
    id: int
    name: str
    slug: str
    category: str
    icon: str
    starter_code_template: Optional[str] = None
    file_extension: str
    is_active: bool
    display_order: int
    topics_count: Optional[int] = 0

    class Config:
        from_attributes = True
