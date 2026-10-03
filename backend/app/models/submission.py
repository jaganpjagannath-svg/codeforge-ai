from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    code = Column(Text, nullable=False)
    language = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False) # 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error'
    score = Column(Float, default=0.0) # 0 to 100
    execution_time_ms = Column(Float, default=0.0)
    memory_kb = Column(Float, default=0.0)
    test_cases_passed = Column(Integer, default=0)
    total_test_cases = Column(Integer, default=0)
    test_results = Column(Text, nullable=True) # JSON array of test outcomes
    ai_feedback = Column(Text, nullable=True) # JSON with quality, time/space complexity, hints
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="submissions")
    question = relationship("Question", back_populates="submissions")

class UserTopicProgress(Base):
    __tablename__ = "user_topic_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    questions_attempted = Column(Integer, default=0)
    questions_solved = Column(Integer, default=0)
    mastery_percentage = Column(Float, default=0.0)
    last_practiced_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="topic_progress")
    topic = relationship("Topic", back_populates="user_progress")

class UserLanguageProgress(Base):
    __tablename__ = "user_language_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    language_slug = Column(String(50), nullable=False, index=True)
    questions_attempted = Column(Integer, default=0)
    questions_solved = Column(Integer, default=0)
    mastery_percentage = Column(Float, default=0.0)
    xp = Column(Integer, default=0)
    last_practiced_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="language_progress")
