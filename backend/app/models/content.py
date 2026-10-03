from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base

class Language(Base):
    __tablename__ = "languages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    slug = Column(String(50), unique=True, index=True, nullable=False)
    category = Column(String(50), default="language") # 'language', 'domain', 'theory'
    icon = Column(String(50), default="code")
    starter_code_template = Column(Text, nullable=True)
    file_extension = Column(String(10), default=".txt")
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)

    # Relationships
    topics = relationship("Topic", back_populates="language", cascade="all, delete-orphan")

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    language_id = Column(Integer, ForeignKey("languages.id"), nullable=True)
    parent_id = Column(Integer, ForeignKey("topics.id"), nullable=True) # Hierarchical support
    name = Column(String(100), nullable=False)
    slug = Column(String(100), index=True, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), default="fundamentals") # 'fundamentals', 'intermediate', 'advanced'
    display_order = Column(Integer, default=0)

    # Relationships
    language = relationship("Language", back_populates="topics")
    parent = relationship("Topic", remote_side=[id], backref="subtopics")
    questions = relationship("Question", back_populates="topic")
    user_progress = relationship("UserTopicProgress", back_populates="topic")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(250), index=True)
    description = Column(Text, nullable=False)
    difficulty = Column(String(20), default="easy") # 'easy', 'medium', 'hard'
    language_slug = Column(String(50), index=True, nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    question_type = Column(String(50), default="coding") # 'coding', 'mcq', 'output_prediction', 'debugging', 'conceptual', 'interview'
    input_format = Column(Text, nullable=True)
    output_format = Column(Text, nullable=True)
    constraints = Column(Text, nullable=True)
    starter_code = Column(Text, nullable=True)
    reference_solution = Column(Text, nullable=True) # Protected! Never shown to candidate during test
    explanation = Column(Text, nullable=True)
    hints = Column(Text, nullable=True) # JSON array of 5 hint levels
    is_approved = Column(Boolean, default=True) # For admin moderation
    created_by_ai = Column(Boolean, default=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    topic = relationship("Topic", back_populates="questions")
    test_cases = relationship("TestCase", back_populates="question", cascade="all, delete-orphan")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="question", cascade="all, delete-orphan")

class QuestionOption(Base):
    __tablename__ = "question_options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    option_key = Column(String(5), nullable=False) # 'A', 'B', 'C', 'D'
    text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    explanation = Column(Text, nullable=True)

    question = relationship("Question", back_populates="options")

class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    input_data = Column(Text, nullable=False, default="")
    expected_output = Column(Text, nullable=False, default="")
    is_hidden = Column(Boolean, default=False) # False = public, True = hidden test case
    is_sample = Column(Boolean, default=True)
    points = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.utcnow)

    question = relationship("Question", back_populates="test_cases")
