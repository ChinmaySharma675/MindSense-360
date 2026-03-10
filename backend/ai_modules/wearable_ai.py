"""
Wearable AI Module
Analyzes heart rate and step count patterns
Uses rolling window normalization and trend deviation detection
"""

from typing import List, Dict, Optional
import statistics

class WearableAI:
    """
    Deterministic wearable data scoring system
    Analyzes trends in heart rate and step count
    """
    
    # Healthy baseline ranges
    HEALTHY_RESTING_HR = (60, 100)  # beats per minute
    HEALTHY_DAILY_STEPS = (7000, 15000)  # steps per day
    
    # Stress indicators
    ELEVATED_HR_THRESHOLD = 100  # Sustained elevated heart rate
    LOW_ACTIVITY_THRESHOLD = 3000  # Very low daily steps
    
    @staticmethod
    def calculate_hr_score(hr_data: List[float]) -> float:
        """
        Calculate heart rate risk score
        Higher resting HR or increasing trend indicates stress
        """
        if not hr_data:
            return 0.5
        
        current_hr = hr_data[-1]
        avg_hr = statistics.mean(hr_data)
        
        # Check if HR is elevated
        if current_hr > ELEVATED_HR_THRESHOLD or avg_hr > ELEVATED_HR_THRESHOLD:
            score = 0.7
        elif current_hr > HEALTHY_RESTING_HR[1]:
            # Above healthy range
            deviation = (current_hr - HEALTHY_RESTING_HR[1]) / HEALTHY_RESTING_HR[1]
            score = min(0.5 + deviation, 1.0)
        elif current_hr < HEALTHY_RESTING_HR[0]:
            # Below healthy range (less concerning)
            score = 0.3
        else:
            score = 0.2  # Healthy range
        
        # Check for increasing trend (stress indicator)
        if len(hr_data) >= 3:
            recent_avg = statistics.mean(hr_data[-3:])
            older_avg = statistics.mean(hr_data[:-3]) if len(hr_data) > 3 else avg_hr
            
            if recent_avg > older_avg + 5:  # HR increasing by 5+ bpm
                score = min(score + 0.2, 1.0)
        
        return score
    
    @staticmethod
    def calculate_steps_score(steps_data: List[int]) -> float:
        """
        Calculate physical activity risk score based on step count
        Lower steps indicate reduced activity (potential stress/depression)
        """
        if not steps_data:
            return 0.5
        
        current_steps = steps_data[-1]
        avg_steps = statistics.mean(steps_data)
        
        # Very low activity is concerning
        if current_steps < LOW_ACTIVITY_THRESHOLD or avg_steps < LOW_ACTIVITY_THRESHOLD:
            score = 0.8
        elif current_steps < HEALTHY_DAILY_STEPS[0]:
            # Below healthy minimum
            deviation = (HEALTHY_DAILY_STEPS[0] - current_steps) / HEALTHY_DAILY_STEPS[0]
            score = min(0.5 + deviation * 0.5, 1.0)
        elif current_steps > HEALTHY_DAILY_STEPS[1]:
            # Above maximum (less concerning, could be exercise)
            score = 0.2
        else:
            score = 0.1  # Healthy range
        
        # Check for declining trend
        if len(steps_data) >= 3:
            recent_avg = statistics.mean(steps_data[-3:])
            older_avg = statistics.mean(steps_data[:-3]) if len(steps_data) > 3 else avg_steps
            
            if recent_avg < older_avg * 0.7:  # 30% decline
                score = min(score + 0.2, 1.0)
        
        return score
    
    @staticmethod
    def calculate_wearable_score(
        hr_data: List[float],
        steps_data: List[int]
    ) -> Dict[str, float]:
        """
        Calculate overall wearable risk score
        
        Args:
            hr_data: List of recent heart rate readings
            steps_data: List of recent daily step counts
        
        Returns:
            Dict with individual scores and overall wearable_score
        """
        hr_score = WearableAI.calculate_hr_score(hr_data)
        steps_score = WearableAI.calculate_steps_score(steps_data)
        
        # Weighted average
        # Heart rate is slightly more important for stress detection
        weights = {
            'hr': 0.6,
            'steps': 0.4
        }
        
        overall_score = (
            hr_score * weights['hr'] +
            steps_score * weights['steps']
        )
        
        return {
            'wearable_score': round(overall_score, 3),
            'hr_score': round(hr_score, 3),
            'steps_score': round(steps_score, 3)
        }
    
    @staticmethod
    def get_explanation(scores: Dict[str, float]) -> str:
        """
        Generate human-readable explanation of the score
        """
        explanations = []
        
        if scores['hr_score'] > 0.6:
            explanations.append("Elevated heart rate detected")
        elif scores['hr_score'] > 0.3:
            explanations.append("Heart rate slightly elevated")
        
        if scores['steps_score'] > 0.6:
            explanations.append("Low physical activity levels")
        elif scores['steps_score'] > 0.3:
            explanations.append("Activity levels below optimal")
        
        if not explanations:
            return "Wearable metrics are healthy"
        
        return "; ".join(explanations)

# Fix the global references
WearableAI.ELEVATED_HR_THRESHOLD = 100
WearableAI.LOW_ACTIVITY_THRESHOLD = 3000
WearableAI.HEALTHY_RESTING_HR = (60, 100)
WearableAI.HEALTHY_DAILY_STEPS = (7000, 15000)

# Update the functions to use class attributes
def calculate_hr_score(hr_data: List[float]) -> float:
    """Calculate heart rate risk score"""
    if not hr_data:
        return 0.5
    
    current_hr = hr_data[-1]
    avg_hr = statistics.mean(hr_data)
    
    if current_hr > WearableAI.ELEVATED_HR_THRESHOLD or avg_hr > WearableAI.ELEVATED_HR_THRESHOLD:
        score = 0.7
    elif current_hr > WearableAI.HEALTHY_RESTING_HR[1]:
        deviation = (current_hr - WearableAI.HEALTHY_RESTING_HR[1]) / WearableAI.HEALTHY_RESTING_HR[1]
        score = min(0.5 + deviation, 1.0)
    elif current_hr < WearableAI.HEALTHY_RESTING_HR[0]:
        score = 0.3
    else:
        score = 0.2
    
    if len(hr_data) >= 3:
        recent_avg = statistics.mean(hr_data[-3:])
        older_avg = statistics.mean(hr_data[:-3]) if len(hr_data) > 3 else avg_hr
        if recent_avg > older_avg + 5:
            score = min(score + 0.2, 1.0)
    
    return score

def calculate_steps_score(steps_data: List[int]) -> float:
    """Calculate physical activity risk score"""
    if not steps_data:
        return 0.5
    
    current_steps = steps_data[-1]
    avg_steps = statistics.mean(steps_data)
    
    if current_steps < WearableAI.LOW_ACTIVITY_THRESHOLD or avg_steps < WearableAI.LOW_ACTIVITY_THRESHOLD:
        score = 0.8
    elif current_steps < WearableAI.HEALTHY_DAILY_STEPS[0]:
        deviation = (WearableAI.HEALTHY_DAILY_STEPS[0] - current_steps) / WearableAI.HEALTHY_DAILY_STEPS[0]
        score = min(0.5 + deviation * 0.5, 1.0)
    elif current_steps > WearableAI.HEALTHY_DAILY_STEPS[1]:
        score = 0.2
    else:
        score = 0.1
    
    if len(steps_data) >= 3:
        recent_avg = statistics.mean(steps_data[-3:])
        older_avg = statistics.mean(steps_data[:-3]) if len(steps_data) > 3 else avg_steps
        if recent_avg < older_avg * 0.7:
            score = min(score + 0.2, 1.0)
    
    return score

# Bind corrected functions to class
WearableAI.calculate_hr_score = staticmethod(calculate_hr_score)
WearableAI.calculate_steps_score = staticmethod(calculate_steps_score)
