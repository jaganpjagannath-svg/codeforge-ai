from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user") # 'user' or 'admin'
    avatar_url = Column(String(500), nullable=True)
    streak_days = Column(Integer, default=1)
    last_active_date = Column(DateTime, default=datetime.utcnow)
    total_learning_seconds = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    submissions = relationship("Submission", back_populates="user", cascade="all, delete-orphan")
    topic_progress = relationship("UserTopicProgress", back_populates="user", cascade="all, delete-orphan")
    language_progress = relationship("UserLanguageProgress", back_populates="user", cascade="all, delete-orphan")
    created_tests = relationship("Test", back_populates="creator")
    test_attempts = relationship("TestAttempt", back_populates="user")
