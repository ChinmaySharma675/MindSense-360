from sqlalchemy import Column, String, DateTime, Float, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    behavioral_data = relationship("BehavioralData", back_populates="user", cascade="all, delete-orphan")
    voice_data = relationship("VoiceData", back_populates="user", cascade="all, delete-orphan")
    wearable_data = relationship("WearableData", back_populates="user", cascade="all, delete-orphan")

class BehavioralData(Base):
    __tablename__ = "behavioral_data"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    sleep_hours = Column(Float, nullable=False)
    screen_time_hours = Column(Float, nullable=False)
    physical_activity_minutes = Column(Float, nullable=False)
    behavior_score = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="behavioral_data")

class VoiceData(Base):
    __tablename__ = "voice_data"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    voice_score = Column(Float, nullable=False)
    stress_label = Column(String)  # "stressed" or "neutral"
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="voice_data")

class WearableData(Base):
    __tablename__ = "wearable_data"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    heart_rate = Column(Float, nullable=False)
    steps = Column(Integer, nullable=False)
    wearable_score = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="wearable_data")
