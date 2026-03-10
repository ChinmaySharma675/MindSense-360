"""
Voice AI Module
Analyzes voice recordings for stress detection
Extracts MFCC, pitch, and energy features
Privacy-first: raw audio is never stored
"""

import numpy as np
import librosa
from typing import Dict, Tuple, Optional
import io

class VoiceAI:
    """
    Deterministic voice stress detection system
    Analyzes acoustic features without storing raw audio
    """
    
    # Audio processing parameters
    SAMPLE_RATE = 22050
    DURATION_MIN = 5  # Minimum 5 seconds
    DURATION_MAX = 30  # Maximum 30 seconds
    
    # Feature thresholds for stress detection
    STRESS_PITCH_VARIANCE_THRESHOLD = 50.0  # Higher variance = stress
    STRESS_ENERGY_THRESHOLD = 0.02  # Higher energy = stress
    NORMAL_PITCH_RANGE = (85, 255)  # Hz (male: 85-180, female: 165-255)
    
    @staticmethod
    def load_audio(audio_bytes: bytes) -> Tuple[np.ndarray, int]:
        """
        Load audio from bytes
        
        Args:
            audio_bytes: Raw audio file bytes
            
        Returns:
            Tuple of (audio_array, sample_rate)
        """
        try:
            # Load audio from bytes
            audio, sr = librosa.load(io.BytesIO(audio_bytes), sr=VoiceAI.SAMPLE_RATE)
            return audio, sr
        except Exception as e:
            raise ValueError(f"Failed to load audio: {str(e)}")
    
    @staticmethod
    def validate_audio(audio: np.ndarray, sr: int) -> bool:
        """
        Validate audio duration and quality
        """
        duration = len(audio) / sr
        
        if duration < VoiceAI.DURATION_MIN:
            raise ValueError(f"Audio too short: {duration:.1f}s (minimum {VoiceAI.DURATION_MIN}s)")
        
        if duration > VoiceAI.DURATION_MAX:
            raise ValueError(f"Audio too long: {duration:.1f}s (maximum {VoiceAI.DURATION_MAX}s)")
        
        return True
    
    @staticmethod
    def extract_mfcc_features(audio: np.ndarray, sr: int) -> Dict[str, float]:
        """
        Extract MFCC (Mel-frequency cepstral coefficients) features
        MFCCs capture the spectral envelope of speech
        """
        # Extract MFCCs
        mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13)
        
        # Calculate statistics
        mfcc_mean = np.mean(mfccs, axis=1)
        mfcc_std = np.std(mfccs, axis=1)
        
        return {
            'mfcc_mean': float(np.mean(mfcc_mean)),
            'mfcc_std': float(np.mean(mfcc_std)),
            'mfcc_variance': float(np.var(mfcc_mean))
        }
    
    @staticmethod
    def extract_pitch_features(audio: np.ndarray, sr: int) -> Dict[str, float]:
        """
        Extract pitch (fundamental frequency) features
        Stressed speech often has higher pitch variance
        """
        # Extract pitch using piptrack
        pitches, magnitudes = librosa.piptrack(y=audio, sr=sr)
        
        # Get pitch values (filter out zeros)
        pitch_values = []
        for t in range(pitches.shape[1]):
            index = magnitudes[:, t].argmax()
            pitch = pitches[index, t]
            if pitch > 0:
                pitch_values.append(pitch)
        
        if len(pitch_values) == 0:
            # No pitch detected (silence or noise)
            return {
                'pitch_mean': 0.0,
                'pitch_std': 0.0,
                'pitch_variance': 0.0
            }
        
        pitch_array = np.array(pitch_values)
        
        return {
            'pitch_mean': float(np.mean(pitch_array)),
            'pitch_std': float(np.std(pitch_array)),
            'pitch_variance': float(np.var(pitch_array))
        }
    
    @staticmethod
    def extract_energy_features(audio: np.ndarray) -> Dict[str, float]:
        """
        Extract energy features
        Stressed speech often has higher energy
        """
        # Calculate RMS energy
        rms = librosa.feature.rms(y=audio)[0]
        
        return {
            'energy_mean': float(np.mean(rms)),
            'energy_std': float(np.std(rms)),
            'energy_max': float(np.max(rms))
        }
    
    @staticmethod
    def calculate_voice_score(
        mfcc_features: Dict[str, float],
        pitch_features: Dict[str, float],
        energy_features: Dict[str, float]
    ) -> Dict[str, float]:
        """
        Calculate voice stress score based on extracted features
        
        Returns:
            Dict with voice_score and stress_label
        """
        score = 0.0
        
        # Pitch variance scoring (stressed speech has higher variance)
        pitch_variance = pitch_features['pitch_variance']
        if pitch_variance > VoiceAI.STRESS_PITCH_VARIANCE_THRESHOLD:
            pitch_score = min(pitch_variance / 100.0, 1.0)
        else:
            pitch_score = pitch_variance / VoiceAI.STRESS_PITCH_VARIANCE_THRESHOLD * 0.5
        
        # Energy scoring (stressed speech has higher energy)
        energy_mean = energy_features['energy_mean']
        if energy_mean > VoiceAI.STRESS_ENERGY_THRESHOLD:
            energy_score = min(energy_mean / 0.05, 1.0)
        else:
            energy_score = energy_mean / VoiceAI.STRESS_ENERGY_THRESHOLD * 0.5
        
        # MFCC variance scoring (stressed speech has different spectral characteristics)
        mfcc_variance = mfcc_features['mfcc_variance']
        mfcc_score = min(abs(mfcc_variance) / 50.0, 1.0)
        
        # Weighted combination
        weights = {
            'pitch': 0.4,
            'energy': 0.35,
            'mfcc': 0.25
        }
        
        score = (
            pitch_score * weights['pitch'] +
            energy_score * weights['energy'] +
            mfcc_score * weights['mfcc']
        )
        
        # Determine stress label
        if score > 0.6:
            stress_label = "stressed"
        else:
            stress_label = "neutral"
        
        return {
            'voice_score': round(score, 3),
            'stress_label': stress_label,
            'pitch_score': round(pitch_score, 3),
            'energy_score': round(energy_score, 3),
            'mfcc_score': round(mfcc_score, 3)
        }
    
    @staticmethod
    def analyze_voice(audio_bytes: bytes) -> Dict[str, float]:
        """
        Complete voice analysis pipeline
        
        Args:
            audio_bytes: Raw audio file bytes
            
        Returns:
            Dict with voice_score and stress_label
        """
        # Load audio
        audio, sr = VoiceAI.load_audio(audio_bytes)
        
        # Validate
        VoiceAI.validate_audio(audio, sr)
        
        # Extract features
        mfcc_features = VoiceAI.extract_mfcc_features(audio, sr)
        pitch_features = VoiceAI.extract_pitch_features(audio, sr)
        energy_features = VoiceAI.extract_energy_features(audio)
        
        # Calculate score
        result = VoiceAI.calculate_voice_score(
            mfcc_features, pitch_features, energy_features
        )
        
        return result
    
    @staticmethod
    def get_explanation(score: float, stress_label: str) -> str:
        """
        Generate human-readable explanation
        """
        if stress_label == "stressed":
            return "Voice analysis indicates elevated stress levels based on pitch variance and energy patterns"
        else:
            return "Voice analysis indicates normal stress levels"
