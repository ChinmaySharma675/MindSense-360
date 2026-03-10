"""
Unit tests for Risk Fusion Engine
Tests fusion logic and edge cases
"""

import unittest
from ai_modules.risk_fusion import RiskFusion

class TestRiskFusion(unittest.TestCase):
    
    def test_all_high_scores(self):
        """Test that all high scores result in HIGH risk"""
        result = RiskFusion.calculate_risk(
            behavior_score=0.8,
            voice_score=0.75,
            wearable_score=0.85
        )
        
        self.assertEqual(result['risk'], 'HIGH')
        self.assertGreater(result['confidence'], 0.8)
    
    def test_two_high_scores(self):
        """Test that two high scores result in HIGH risk"""
        result = RiskFusion.calculate_risk(
            behavior_score=0.8,
            voice_score=0.75,
            wearable_score=0.3
        )
        
        self.assertEqual(result['risk'], 'HIGH')
    
    def test_two_medium_scores(self):
        """Test that two medium+ scores result in MEDIUM risk"""
        result = RiskFusion.calculate_risk(
            behavior_score=0.65,
            voice_score=0.68,
            wearable_score=0.3
        )
        
        self.assertEqual(result['risk'], 'MEDIUM')
    
    def test_single_high_score(self):
        """Test that single high score with others low results in MEDIUM"""
        result = RiskFusion.calculate_risk(
            behavior_score=0.8,
            voice_score=0.3,
            wearable_score=0.2
        )
        
        self.assertEqual(result['risk'], 'MEDIUM')
    
    def test_all_low_scores(self):
        """Test that all low scores result in LOW risk"""
        result = RiskFusion.calculate_risk(
            behavior_score=0.2,
            voice_score=0.3,
            wearable_score=0.25
        )
        
        self.assertEqual(result['risk'], 'LOW')
    
    def test_single_score_high(self):
        """Test single high score alone"""
        result = RiskFusion.calculate_risk(
            behavior_score=0.75
        )
        
        self.assertEqual(result['risk'], 'MEDIUM')
    
    def test_single_score_low(self):
        """Test single low score alone"""
        result = RiskFusion.calculate_risk(
            behavior_score=0.3
        )
        
        self.assertEqual(result['risk'], 'LOW')
    
    def test_no_scores(self):
        """Test handling of no scores"""
        result = RiskFusion.calculate_risk()
        
        self.assertEqual(result['risk'], 'UNKNOWN')
        self.assertEqual(result['confidence'], 0.0)
    
    def test_explanation_generation(self):
        """Test that explanations are generated"""
        result = RiskFusion.calculate_risk(
            behavior_score=0.8,
            voice_score=0.75,
            wearable_score=0.3
        )
        
        self.assertIn('explanation', result)
        self.assertIsInstance(result['explanation'], str)
        self.assertGreater(len(result['explanation']), 0)
    
    def test_recommendation_generation(self):
        """Test that recommendations are generated"""
        rec_high = RiskFusion.get_recommendation('HIGH')
        rec_medium = RiskFusion.get_recommendation('MEDIUM')
        rec_low = RiskFusion.get_recommendation('LOW')
        
        self.assertIsInstance(rec_high, str)
        self.assertIsInstance(rec_medium, str)
        self.assertIsInstance(rec_low, str)
        self.assertGreater(len(rec_high), 0)
    
    def test_partial_scores(self):
        """Test with only some scores available"""
        # Only behavioral and voice
        result1 = RiskFusion.calculate_risk(
            behavior_score=0.7,
            voice_score=0.65
        )
        self.assertIn(result1['risk'], ['LOW', 'MEDIUM', 'HIGH'])
        
        # Only wearable
        result2 = RiskFusion.calculate_risk(
            wearable_score=0.4
        )
        self.assertIn(result2['risk'], ['LOW', 'MEDIUM', 'HIGH'])

if __name__ == '__main__':
    unittest.main()
