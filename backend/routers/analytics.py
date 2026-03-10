"""
Analytics Router
Handles endpoints for administrator analytics and data aggregation.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime, timedelta

from database import get_db
from models import User, BehavioralData, VoiceData, WearableData
from ai_modules.risk_fusion import RiskFusion
from auth_utils import get_current_user

router = APIRouter()

@router.get("/overview")
async def get_analytics_overview(
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # Uncomment for auth (simplified for demo)
):
    """
    Get high-level statistics for the admin dashboard.
    """
    # Total Users
    total_users = db.query(User).count()
    
    # Calculate risk for all users (latest data)
    # Note: In a real production app, this would be pre-calculated or cached
    risk_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0, "UNKNOWN": 0}
    
    users = db.query(User).all()

    
    for user in users:
        # Fetch latest data for each user
        behavior = db.query(BehavioralData).filter(BehavioralData.user_id == user.id)\
            .order_by(BehavioralData.timestamp.desc()).first()
            
        voice = db.query(VoiceData).filter(VoiceData.user_id == user.id)\
            .order_by(VoiceData.timestamp.desc()).first()
            
        wearable = db.query(WearableData).filter(WearableData.user_id == user.id)\
            .order_by(WearableData.timestamp.desc()).first()
            
        # Check recency (e.g., within last 24 hours)
        # Simplified: just use whatever latest data is available
        
        b_score = behavior.behavior_score if behavior else None
        v_score = voice.voice_score if voice else None
        w_score = wearable.wearable_score if wearable else None
        
        prediction = RiskFusion.calculate_risk(b_score, v_score, w_score)
        risk_counts[prediction['risk']] += 1

    return {
        "total_users": total_users,
        "risk_distribution": risk_counts,
        "timestamp": datetime.utcnow()
    }

@router.get("/trends")
async def get_analytics_trends(
    days: int = 7,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)
):
    """
    Get daily average scores for the population over the last N days.
    """
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    trends = []
    
    # Iterate through each day
    for i in range(days):
        current_day = start_date + timedelta(days=i)
        next_day = current_day + timedelta(days=1)
        
        # Calculate averages for this day
        avg_behavior = db.query(func.avg(BehavioralData.behavior_score))\
            .filter(BehavioralData.timestamp >= current_day, BehavioralData.timestamp < next_day)\
            .scalar() or 0
            
        avg_voice = db.query(func.avg(VoiceData.voice_score))\
            .filter(VoiceData.timestamp >= current_day, VoiceData.timestamp < next_day)\
            .scalar() or 0
            
        avg_wearable = db.query(func.avg(WearableData.wearable_score))\
            .filter(WearableData.timestamp >= current_day, WearableData.timestamp < next_day)\
            .scalar() or 0
            
        trends.append({
            "date": current_day.date().isoformat(),
            "avg_behavior_score": round(avg_behavior, 2),
            "avg_voice_score": round(avg_voice, 2),
            "avg_wearable_score": round(avg_wearable, 2)
        })
        
    return trends

@router.get("/correlations")
async def get_analytics_correlations(
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get raw data points for scatter plot correlations (anonymized).
    """
    # Fetch latest data points joined by user
    # Simplified approach: fetch distinct data points
    
    data_points = []
    
    behavioral_records = db.query(BehavioralData).order_by(BehavioralData.timestamp.desc()).limit(limit).all()
    
    for record in behavioral_records:
        data_points.append({
            "type": "behavioral",
            "sleep": record.sleep_hours,
            "screen_time": record.screen_time_hours,
            "activity": record.physical_activity_minutes,
            "score": record.behavior_score
        })
        
    return data_points
