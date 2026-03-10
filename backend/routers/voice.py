from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from database import get_db
from models import User, VoiceData
from schemas import VoiceDataResponse
from auth_utils import get_current_user
from ai_modules.voice_ai import VoiceAI

router = APIRouter()

@router.post("/upload_voice", response_model=VoiceDataResponse, status_code=status.HTTP_201_CREATED)
async def upload_voice(
    audio_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and analyze voice recording for stress detection
    
    Privacy-safe: Raw audio is deleted immediately after processing
    Accepts: .wav, .mp3, .m4a, .flac
    Duration: 5-30 seconds
    """
    
    # Validate file type
    allowed_types = ['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/flac']
    if audio_file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: WAV, MP3, M4A, FLAC"
        )
    
    try:
        # Read audio bytes
        audio_bytes = await audio_file.read()
        
        # Analyze voice (raw audio never stored)
        result = VoiceAI.analyze_voice(audio_bytes)
        
        # Immediately clear audio from memory
        del audio_bytes
        
        # Store only the score and label
        new_data = VoiceData(
            user_id=current_user.id,
            voice_score=result['voice_score'],
            stress_label=result['stress_label']
        )
        
        db.add(new_data)
        db.commit()
        db.refresh(new_data)
        
        return new_data
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voice analysis failed: {str(e)}"
        )

@router.get("/voice_history", response_model=List[VoiceDataResponse])
async def get_voice_history(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get voice analysis history for the current user
    """
    data = db.query(VoiceData).filter(
        VoiceData.user_id == current_user.id
    ).order_by(VoiceData.timestamp.desc()).limit(limit).all()
    
    return data
