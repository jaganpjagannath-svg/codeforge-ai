from datetime import datetime
import secrets
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base

def generate_share_code():
    return secrets.token_hex(4) # 8-character clean share code e.g. "a3f89b21"

class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, index=True)
    share_code = Column(String(50), unique=True, index=True, default=generate_share_code)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    language_slug = Column(String(50), nullable=False)
    difficulty = Column(String(20), default="mixed") # 'beginner', 'intermediate', 'advanced', 'mixed'
    duration_minutes = Column(Integer, default=30)
    passing_score_percent = Column(Integer, default=60)
    is_randomized = Column(Boolean, default=True)
    max_attempts = Column(Integer, default=1)
    is_published = Column(Boolean, default=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="created_tests")
    test_questions = relationship("TestQuestion", back_populates="test", cascade="all, delete-orphan", order_by="TestQuestion.display_order")
    attempts = relationship("TestAttempt", back_populates="test", cascade="all, delete-orphan")

class TestQuestion(Base):
    __tablename__ = "test_questions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    points = Column(Integer, default=10)
    display_order = Column(Integer, default=0)

    # Relationships
    test = relationship("Test", back_populates="test_questions")
    question = relationship("Question")

class TestAttempt(Base):
    __tablename__ = "test_attempts"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Optional for guests
    candidate_name = Column(String(100), nullable=False)
    candidate_email = Column(String(255), nullable=False)
    score = Column(Float, default=0.0)
    total_possible_score = Column(Float, default=100.0)
    percentage = Column(Float, default=0.0)
    passed = Column(Boolean, default=False)
    time_taken_seconds = Column(Integer, default=0)
    status = Column(String(30), default="in_progress") # 'in_progress', 'completed', 'timed_out'
    answers = Column(Text, nullable=True) # JSON map of question_id -> candidate answers
    question_results = Column(Text, nullable=True) # JSON details of scoring
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    test = relationship("Test", back_populates="attempts")
    user = relationship("User", back_populates="test_attempts")
