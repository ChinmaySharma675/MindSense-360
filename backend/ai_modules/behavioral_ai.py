"""
Behavioral AI Module
Analyzes sleep, screen time, and physical activity patterns
Uses rolling window trend analysis for deterministic scoring
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
import statistics

class BehavioralAI:
    """
    Deterministic behavioral scoring system
    Analyzes trends in sleep, screen time, and physical activity
    """
    
    # Healthy baseline ranges (configurable)
    HEALTHY_SLEEP_HOURS = (7, 9)
    HEALTHY_SCREEN_TIME_HOURS = (0, 6)
    HEALTHY_ACTIVITY_MINUTES = (30, 120)
    
    # Rolling window size (days)
    WINDOW_SIZE = 7
    
    @staticmethod
    def calculate_deviation_score(value: float, healthy_range: tuple) -> float:
        """
        Calculate how much a value deviates from healthy range
        Returns score between 0 (healthy) and 1 (unhealthy)
        """
        min_healthy, max_healthy = healthy_range
        
        if min_healthy <= value <= max_healthy:
            # Within healthy range
            return 0.0
        elif value < min_healthy:
            # Below minimum (e.g., too little sleep)
            deviation = (min_healthy - value) / min_healthy
            return min(deviation, 1.0)
        else:
            # Above maximum (e.g., too much screen time)
            deviation = (value - max_healthy) / max_healthy
            return min(deviation, 1.0)
    
    @staticmethod
    def calculate_trend_score(recent_values: List[float], healthy_range: tuple) -> float:
        """
        Calculate trend score based on recent pattern
        Considers both current deviation and worsening trends
        """
        if not recent_values:
            return 0.5  # Neutral score if no data
        
        # Get current deviation
        current_value = recent_values[-1]
        current_deviation = BehavioralAI.calculate_deviation_score(current_value, healthy_range)
        
        # If we have enough data, check for worsening trend
        if len(recent_values) >= 3:
            # Calculate if trend is worsening
            first_half = recent_values[:len(recent_values)//2]
            second_half = recent_values[len(recent_values)//2:]
            
            first_avg = statistics.mean(first_half)
            second_avg = statistics.mean(second_half)
            
            first_deviation = BehavioralAI.calculate_deviation_score(first_avg, healthy_range)
            second_deviation = BehavioralAI.calculate_deviation_score(second_avg, healthy_range)
            
            # If trend is worsening, increase score
            if second_deviation > first_deviation:
                trend_penalty = 0.2
                current_deviation = min(current_deviation + trend_penalty, 1.0)
        
        return current_deviation
    
    @staticmethod
    def calculate_behavior_score(
        sleep_data: List[float],
        screen_time_data: List[float],
        activity_data: List[float]
    ) -> Dict[str, float]:
        """
        Calculate overall behavioral risk score
        
        Args:
            sleep_data: List of recent sleep hours (most recent last)
            screen_time_data: List of recent screen time hours
            activity_data: List of recent physical activity minutes
        
        Returns:
            Dict with individual scores and overall behavior_score
        """
        # Calculate individual component scores
        sleep_score = BehavioralAI.calculate_trend_score(
            sleep_data, BehavioralAI.HEALTHY_SLEEP_HOURS
        )
        
        screen_score = BehavioralAI.calculate_trend_score(
            screen_time_data, BehavioralAI.HEALTHY_SCREEN_TIME_HOURS
        )
        
        activity_score = BehavioralAI.calculate_trend_score(
            activity_data, BehavioralAI.HEALTHY_ACTIVITY_MINUTES
        )
        
        # Weighted average (can be adjusted)
        # Sleep is most important, then activity, then screen time
        weights = {
            'sleep': 0.4,
            'screen': 0.3,
            'activity': 0.3
        }
        
        overall_score = (
            sleep_score * weights['sleep'] +
            screen_score * weights['screen'] +
            activity_score * weights['activity']
        )
        
        return {
            'behavior_score': round(overall_score, 3),
            'sleep_score': round(sleep_score, 3),
            'screen_score': round(screen_score, 3),
            'activity_score': round(activity_score, 3)
        }
    
    @staticmethod
    def get_explanation(scores: Dict[str, float]) -> str:
        """
        Generate human-readable explanation of the score
        """
        explanations = []
        
        if scores['sleep_score'] > 0.6:
            explanations.append("Sleep patterns are concerning")
        elif scores['sleep_score'] > 0.3:
            explanations.append("Sleep could be improved")
        
        if scores['screen_score'] > 0.6:
            explanations.append("High screen time detected")
        elif scores['screen_score'] > 0.3:
            explanations.append("Moderate screen time")
        
        if scores['activity_score'] > 0.6:
            explanations.append("Low physical activity")
        elif scores['activity_score'] > 0.3:
            explanations.append("Physical activity could increase")
        
        if not explanations:
            return "Behavioral patterns are healthy"
        
        return "; ".join(explanations)
