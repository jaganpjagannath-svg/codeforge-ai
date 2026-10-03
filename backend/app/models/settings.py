from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from app.database import Base

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    is_secret = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AIGenerationLog(Base):
    __tablename__ = "ai_generation_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    prompt = Column(Text, nullable=False)
    request_type = Column(String(50), nullable=False) # 'question', 'test', 'hint', 'feedback', 'test_cases'
    raw_response = Column(Text, nullable=True)
    parsed_response = Column(Text, nullable=True)
    is_successful = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
