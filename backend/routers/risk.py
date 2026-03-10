from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from database import get_db
from models import User, BehavioralData, VoiceData, WearableData
from schemas import RiskPrediction
from auth_utils import get_current_user
from ai_modules.risk_fusion import RiskFusion

router = APIRouter()

@router.get("/predict_risk", response_model=RiskPrediction)
async def predict_risk(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current risk prediction based on latest data from all sources
    
    Combines:
    - Latest behavioral score (if available)
    - Latest voice score (if available)
    - Latest wearable score (if available)
    
    Returns risk level: LOW, MEDIUM, or HIGH
    """
    
    # Get latest behavioral data (last 24 hours)
    one_day_ago = datetime.utcnow() - timedelta(days=1)
    latest_behavioral = db.query(BehavioralData).filter(
        BehavioralData.user_id == current_user.id,
        BehavioralData.timestamp >= one_day_ago
    ).order_by(BehavioralData.timestamp.desc()).first()
    
    # Get latest voice data (last 24 hours)
    latest_voice = db.query(VoiceData).filter(
        VoiceData.user_id == current_user.id,
        VoiceData.timestamp >= one_day_ago
    ).order_by(VoiceData.timestamp.desc()).first()
    
    # Get latest wearable data (last 24 hours)
    latest_wearable = db.query(WearableData).filter(
        WearableData.user_id == current_user.id,
        WearableData.timestamp >= one_day_ago
    ).order_by(WearableData.timestamp.desc()).first()
    
    # Extract scores
    behavior_score = latest_behavioral.behavior_score if latest_behavioral else None
    voice_score = latest_voice.voice_score if latest_voice else None
    wearable_score = latest_wearable.wearable_score if latest_wearable else None
    
    # Calculate risk
    result = RiskFusion.calculate_risk(
        behavior_score=behavior_score,
        voice_score=voice_score,
        wearable_score=wearable_score
    )
    
    # Add recommendation
    recommendation = RiskFusion.get_recommendation(result['risk'])
    result['recommendation'] = recommendation
    
    return result

@router.get("/risk_history")
async def get_risk_history(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get risk assessment history for the specified number of days
    Returns daily risk levels based on available data
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Get all data for the period
    behavioral_data = db.query(BehavioralData).filter(
        BehavioralData.user_id == current_user.id,
        BehavioralData.timestamp >= cutoff_date
    ).order_by(BehavioralData.timestamp).all()
    
    voice_data = db.query(VoiceData).filter(
        VoiceData.user_id == current_user.id,
        VoiceData.timestamp >= cutoff_date
    ).order_by(VoiceData.timestamp).all()
    
    wearable_data = db.query(WearableData).filter(
        WearableData.user_id == current_user.id,
        WearableData.timestamp >= cutoff_date
    ).order_by(WearableData.timestamp).all()
    
    # Group by date and calculate daily risk
    history = []
    current_date = cutoff_date.date()
    end_date = datetime.utcnow().date()
    
    while current_date <= end_date:
        # Get data for this day
        day_behavioral = [d for d in behavioral_data if d.timestamp.date() == current_date]
        day_voice = [d for d in voice_data if d.timestamp.date() == current_date]
        day_wearable = [d for d in wearable_data if d.timestamp.date() == current_date]
        
        # Use latest scores from each category for the day
        behavior_score = day_behavioral[-1].behavior_score if day_behavioral else None
        voice_score = day_voice[-1].voice_score if day_voice else None
        wearable_score = day_wearable[-1].wearable_score if day_wearable else None
        
        # Calculate risk for this day
        if behavior_score or voice_score or wearable_score:
            risk_result = RiskFusion.calculate_risk(
                behavior_score=behavior_score,
                voice_score=voice_score,
                wearable_score=wearable_score
            )
            
            history.append({
                'date': current_date.isoformat(),
                'risk': risk_result['risk'],
                'behavior_score': behavior_score,
                'voice_score': voice_score,
                'wearable_score': wearable_score,
                'confidence': risk_result['confidence']
            })
        
        current_date += timedelta(days=1)
    
    return {
        'history': history,
        'total_days': len(history)
    }
