from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List

from database import get_db
from models import User, WearableData
from schemas import WearableDataCreate, WearableDataResponse
from auth_utils import get_current_user
from ai_modules.wearable_ai import WearableAI

router = APIRouter()

@router.post("/submit_wearable", response_model=WearableDataResponse, status_code=status.HTTP_201_CREATED)
async def submit_wearable_data(
    data: WearableDataCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit wearable data (heart rate, steps)
    Automatically calculates wearable score using AI
    """
    
    # Get recent wearable data for trend analysis (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_data = db.query(WearableData).filter(
        WearableData.user_id == current_user.id,
        WearableData.timestamp >= seven_days_ago
    ).order_by(WearableData.timestamp).all()
    
    # Extract historical values
    hr_history = [d.heart_rate for d in recent_data]
    steps_history = [d.steps for d in recent_data]
    
    # Add current values
    hr_history.append(data.heart_rate)
    steps_history.append(data.steps)
    
    # Calculate AI score
    scores = WearableAI.calculate_wearable_score(
        hr_data=hr_history,
        steps_data=steps_history
    )
    
    # Create new wearable data entry
    new_data = WearableData(
        user_id=current_user.id,
        heart_rate=data.heart_rate,
        steps=data.steps,
        wearable_score=scores['wearable_score']
    )
    
    db.add(new_data)
    db.commit()
    db.refresh(new_data)
    
    return new_data

@router.get("/wearable_history", response_model=List[WearableDataResponse])
async def get_wearable_history(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get wearable data history for the current user
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    data = db.query(WearableData).filter(
        WearableData.user_id == current_user.id,
        WearableData.timestamp >= cutoff_date
    ).order_by(WearableData.timestamp.desc()).all()
    
    return data
