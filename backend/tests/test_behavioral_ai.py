"""
Unit tests for Behavioral AI module
Tests scoring logic and edge cases
"""

import unittest
from ai_modules.behavioral_ai import BehavioralAI

class TestBehavioralAI(unittest.TestCase):
    
    def test_healthy_patterns(self):
        """Test that healthy patterns return low scores"""
        sleep_data = [8.0, 7.5, 8.0, 7.0, 8.5]
        screen_data = [4.0, 5.0, 3.5, 4.5, 4.0]
        activity_data = [60, 45, 90, 75, 60]
        
        scores = BehavioralAI.calculate_behavior_score(
            sleep_data, screen_data, activity_data
        )
        
        # Healthy patterns should return low scores (including 0.0)
        self.assertLess(scores['behavior_score'], 0.3)
        self.assertGreaterEqual(scores['behavior_score'], 0.0)
    
    def test_poor_sleep(self):
        """Test that poor sleep increases score"""
        sleep_data = [4.0, 5.0, 4.5, 5.5, 4.0]
        screen_data = [4.0, 5.0, 3.5, 4.5, 4.0]
        activity_data = [60, 45, 90, 75, 60]
        
        scores = BehavioralAI.calculate_behavior_score(
            sleep_data, screen_data, activity_data
        )
        
        self.assertGreater(scores['sleep_score'], 0.3)
    
    def test_high_screen_time(self):
        """Test that high screen time increases score"""
        sleep_data = [8.0, 7.5, 8.0, 7.0, 8.5]
        screen_data = [10.0, 12.0, 11.0, 13.0, 12.5]
        activity_data = [60, 45, 90, 75, 60]
        
        scores = BehavioralAI.calculate_behavior_score(
            sleep_data, screen_data, activity_data
        )
        
        self.assertGreater(scores['screen_score'], 0.4)
    
    def test_low_activity(self):
        """Test that low activity increases score"""
        sleep_data = [8.0, 7.5, 8.0, 7.0, 8.5]
        screen_data = [4.0, 5.0, 3.5, 4.5, 4.0]
        activity_data = [10, 5, 15, 8, 12]
        
        scores = BehavioralAI.calculate_behavior_score(
            sleep_data, screen_data, activity_data
        )
        
        self.assertGreater(scores['activity_score'], 0.5)
    
    def test_worsening_trend(self):
        """Test that worsening trends increase score"""
        # Sleep getting worse
        sleep_data = [8.0, 7.5, 7.0, 6.0, 5.0, 4.5, 4.0]
        screen_data = [4.0] * 7
        activity_data = [60] * 7
        
        scores = BehavioralAI.calculate_behavior_score(
            sleep_data, screen_data, activity_data
        )
        
        # Adjusted threshold - worsening sleep should increase score
        self.assertGreater(scores['behavior_score'], 0.2)
    
    def test_empty_data(self):
        """Test handling of empty data"""
        scores = BehavioralAI.calculate_behavior_score([], [], [])
        
        # Should return neutral scores
        self.assertGreaterEqual(scores['behavior_score'], 0.0)
        self.assertLessEqual(scores['behavior_score'], 1.0)
    
    def test_explanation_generation(self):
        """Test that explanations are generated"""
        sleep_data = [4.0, 5.0, 4.5]
        screen_data = [12.0, 11.0, 13.0]
        activity_data = [10, 15, 8]
        
        scores = BehavioralAI.calculate_behavior_score(
            sleep_data, screen_data, activity_data
        )
        
        explanation = BehavioralAI.get_explanation(scores)
        
        self.assertIsInstance(explanation, str)
        self.assertGreater(len(explanation), 0)

if __name__ == '__main__':
    unittest.main()
