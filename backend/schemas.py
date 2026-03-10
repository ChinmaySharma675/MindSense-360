from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
import uuid

# User Schemas
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Behavioral Data Schemas
class BehavioralDataCreate(BaseModel):
    sleep_hours: float = Field(..., ge=0, le=24)
    screen_time_hours: float = Field(..., ge=0, le=24)
    physical_activity_minutes: float = Field(..., ge=0)

class BehavioralDataResponse(BaseModel):
    id: int
    sleep_hours: float
    screen_time_hours: float
    physical_activity_minutes: float
    behavior_score: Optional[float]
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Voice Data Schemas
class VoiceDataResponse(BaseModel):
    id: int
    voice_score: float
    stress_label: Optional[str]
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Wearable Data Schemas
class WearableDataCreate(BaseModel):
    heart_rate: float = Field(..., ge=30, le=220)
    steps: int = Field(..., ge=0)

class WearableDataResponse(BaseModel):
    id: int
    heart_rate: float
    steps: int
    wearable_score: Optional[float]
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Risk Prediction Schema
class RiskPrediction(BaseModel):
    risk: str  # "LOW", "MEDIUM", "HIGH", "UNKNOWN"
    behavior_score: Optional[float]
    voice_score: Optional[float]
    wearable_score: Optional[float]
    explanation: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    recommendation: Optional[str] = None
