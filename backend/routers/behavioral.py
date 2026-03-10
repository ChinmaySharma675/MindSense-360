from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List

from database import get_db
from models import User, BehavioralData
from schemas import BehavioralDataCreate, BehavioralDataResponse
from auth_utils import get_current_user
from ai_modules.behavioral_ai import BehavioralAI

router = APIRouter()

@router.post("/submit_behavior", response_model=BehavioralDataResponse, status_code=status.HTTP_201_CREATED)
async def submit_behavioral_data(
    data: BehavioralDataCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit behavioral data (sleep, screen time, physical activity)
    Automatically calculates behavior score using AI
    """
    
    # Get recent behavioral data for trend analysis (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_data = db.query(BehavioralData).filter(
        BehavioralData.user_id == current_user.id,
        BehavioralData.timestamp >= seven_days_ago
    ).order_by(BehavioralData.timestamp).all()
    
    # Extract historical values
    sleep_history = [d.sleep_hours for d in recent_data]
    screen_history = [d.screen_time_hours for d in recent_data]
    activity_history = [d.physical_activity_minutes for d in recent_data]
    
    # Add current values
    sleep_history.append(data.sleep_hours)
    screen_history.append(data.screen_time_hours)
    activity_history.append(data.physical_activity_minutes)
    
    # Calculate AI score
    scores = BehavioralAI.calculate_behavior_score(
        sleep_data=sleep_history,
        screen_time_data=screen_history,
        activity_data=activity_history
    )
    
    # Create new behavioral data entry
    new_data = BehavioralData(
        user_id=current_user.id,
        sleep_hours=data.sleep_hours,
        screen_time_hours=data.screen_time_hours,
        physical_activity_minutes=data.physical_activity_minutes,
        behavior_score=scores['behavior_score']
    )
    
    db.add(new_data)
    db.commit()
    db.refresh(new_data)
    
    return new_data

@router.get("/behavioral_history", response_model=List[BehavioralDataResponse])
async def get_behavioral_history(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get behavioral data history for the current user
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    data = db.query(BehavioralData).filter(
        BehavioralData.user_id == current_user.id,
        BehavioralData.timestamp >= cutoff_date
    ).order_by(BehavioralData.timestamp.desc()).all()
    
    return data
