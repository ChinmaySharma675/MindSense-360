"""
Risk Fusion Engine
Combines behavioral, voice, and wearable scores into final risk assessment
"""

from typing import Dict, Optional, Tuple

class RiskFusion:
    """
    Deterministic risk fusion system
    Combines multiple AI scores into final risk classification
    """
    
    # Risk thresholds
    HIGH_THRESHOLD = 0.7
    MEDIUM_THRESHOLD = 0.6
    
    @staticmethod
    def calculate_risk(
        behavior_score: Optional[float] = None,
        voice_score: Optional[float] = None,
        wearable_score: Optional[float] = None
    ) -> Dict[str, any]:
        """
        Calculate final risk level based on available scores
        
        Fusion Rules:
        - If all scores > 0.7 → HIGH
        - If any 2 scores > 0.6 → MEDIUM
        - Else → LOW
        
        Args:
            behavior_score: Score from behavioral AI (0-1)
            voice_score: Score from voice AI (0-1)
            wearable_score: Score from wearable AI (0-1)
            
        Returns:
            Dict with risk level, scores, and explanation
        """
        # Collect available scores
        scores = {}
        if behavior_score is not None:
            scores['behavior'] = behavior_score
        if voice_score is not None:
            scores['voice'] = voice_score
        if wearable_score is not None:
            scores['wearable'] = wearable_score
        
        # Need at least one score
        if not scores:
            return {
                'risk': 'UNKNOWN',
                'behavior_score': None,
                'voice_score': None,
                'wearable_score': None,
                'explanation': 'No data available for risk assessment',
                'confidence': 0.0
            }
        
        # Apply fusion rules
        risk_level, confidence = RiskFusion._apply_fusion_rules(scores)
        
        # Generate explanation
        explanation = RiskFusion._generate_explanation(risk_level, scores)
        
        return {
            'risk': risk_level,
            'behavior_score': behavior_score,
            'voice_score': voice_score,
            'wearable_score': wearable_score,
            'explanation': explanation,
            'confidence': round(confidence, 2)
        }
    
    @staticmethod
    def _apply_fusion_rules(scores: Dict[str, float]) -> Tuple[str, float]:
        """
        Apply fusion rules to determine risk level
        
        Returns:
            Tuple of (risk_level, confidence)
        """
        num_scores = len(scores)
        score_values = list(scores.values())
        
        # Count high scores (> 0.7)
        high_scores = sum(1 for s in score_values if s > RiskFusion.HIGH_THRESHOLD)
        
        # Count medium+ scores (> 0.6)
        medium_plus_scores = sum(1 for s in score_values if s > RiskFusion.MEDIUM_THRESHOLD)
        
        # Rule 1: All scores > 0.7 → HIGH
        if num_scores >= 2 and high_scores == num_scores:
            return 'HIGH', 0.95
        
        # Rule 2: Any 2 scores > 0.6 → MEDIUM (or single score > 0.7)
        if medium_plus_scores >= 2 or (num_scores == 1 and score_values[0] > RiskFusion.HIGH_THRESHOLD):
            # Check if it should be HIGH instead
            if high_scores >= 2:
                return 'HIGH', 0.90
            return 'MEDIUM', 0.75
        
        # Rule 3: Single high score with others low
        if high_scores == 1 and num_scores > 1:
            return 'MEDIUM', 0.65
        
        # Rule 4: At least one medium score
        if medium_plus_scores >= 1:
            return 'MEDIUM', 0.60
        
        # Default: LOW
        # Calculate confidence based on how low the scores are
        avg_score = sum(score_values) / len(score_values)
        confidence = 0.80 if avg_score < 0.3 else 0.70
        
        return 'LOW', confidence
    
    @staticmethod
    def _generate_explanation(risk_level: str, scores: Dict[str, float]) -> str:
        """
        Generate human-readable explanation for the risk assessment
        """
        explanations = []
        
        # Analyze each score
        if 'behavior' in scores:
            if scores['behavior'] > 0.7:
                explanations.append("behavioral patterns show high stress")
            elif scores['behavior'] > 0.5:
                explanations.append("behavioral patterns show moderate stress")
        
        if 'voice' in scores:
            if scores['voice'] > 0.7:
                explanations.append("voice analysis indicates high stress")
            elif scores['voice'] > 0.5:
                explanations.append("voice analysis indicates moderate stress")
        
        if 'wearable' in scores:
            if scores['wearable'] > 0.7:
                explanations.append("wearable metrics show high stress")
            elif scores['wearable'] > 0.5:
                explanations.append("wearable metrics show moderate stress")
        
        # Build final explanation
        if risk_level == 'HIGH':
            base = "HIGH RISK: Multiple indicators suggest significant stress levels. "
        elif risk_level == 'MEDIUM':
            base = "MEDIUM RISK: Some indicators suggest elevated stress levels. "
        else:
            base = "LOW RISK: Indicators suggest normal stress levels. "
        
        if explanations:
            return base + "; ".join(explanations).capitalize()
        else:
            return base + "All metrics within healthy ranges"
    
    @staticmethod
    def get_recommendation(risk_level: str) -> str:
        """
        Get recommendation based on risk level
        """
        recommendations = {
            'HIGH': (
                "Consider taking immediate action: "
                "practice stress-reduction techniques, ensure adequate sleep, "
                "reduce screen time, and consider speaking with a mental health professional."
            ),
            'MEDIUM': (
                "Monitor your stress levels closely. "
                "Try to improve sleep quality, increase physical activity, "
                "and practice relaxation techniques."
            ),
            'LOW': (
                "Continue maintaining healthy habits. "
                "Keep up with regular sleep, physical activity, and balanced screen time."
            ),
            'UNKNOWN': (
                "Submit behavioral, voice, or wearable data to get personalized recommendations."
            )
        }
        
        return recommendations.get(risk_level, recommendations['UNKNOWN'])
