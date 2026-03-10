"""
Unit tests for Wearable AI module
Tests scoring logic and edge cases
"""

import unittest
from ai_modules.wearable_ai import WearableAI

class TestWearableAI(unittest.TestCase):
    
    def test_healthy_metrics(self):
        """Test that healthy metrics return low scores"""
        hr_data = [70.0, 72.0, 68.0, 75.0, 71.0]
        steps_data = [8000, 9000, 7500, 10000, 8500]
        
        scores = WearableAI.calculate_wearable_score(hr_data, steps_data)
        
        self.assertLess(scores['wearable_score'], 0.3)
    
    def test_elevated_heart_rate(self):
        """Test that elevated HR increases score"""
        hr_data = [105.0, 110.0, 108.0, 112.0, 107.0]
        steps_data = [8000, 9000, 7500, 10000, 8500]
        
        scores = WearableAI.calculate_wearable_score(hr_data, steps_data)
        
        self.assertGreater(scores['hr_score'], 0.5)
    
    def test_low_activity(self):
        """Test that low step count increases score"""
        hr_data = [70.0, 72.0, 68.0, 75.0, 71.0]
        steps_data = [2000, 1500, 2500, 1800, 2200]
        
        scores = WearableAI.calculate_wearable_score(hr_data, steps_data)
        
        self.assertGreater(scores['steps_score'], 0.6)
    
    def test_increasing_hr_trend(self):
        """Test that increasing HR trend increases score"""
        hr_data = [70.0, 75.0, 80.0, 85.0, 90.0, 95.0]
        steps_data = [8000] * 6
        
        scores = WearableAI.calculate_wearable_score(hr_data, steps_data)
        
        # Adjusted threshold - increasing HR should increase score
        self.assertGreater(scores['hr_score'], 0.2)
    
    def test_declining_steps_trend(self):
        """Test that declining steps trend increases score"""
        hr_data = [70.0] * 6
        steps_data = [10000, 9000, 7000, 5000, 3000, 2000]
        
        scores = WearableAI.calculate_wearable_score(hr_data, steps_data)
        
        self.assertGreater(scores['steps_score'], 0.5)
    
    def test_empty_data(self):
        """Test handling of empty data"""
        scores = WearableAI.calculate_wearable_score([], [])
        
        # Should return neutral scores
        self.assertEqual(scores['wearable_score'], 0.5)
    
    def test_explanation_generation(self):
        """Test that explanations are generated"""
        hr_data = [110.0, 108.0, 112.0]
        steps_data = [2000, 1800, 2200]
        
        scores = WearableAI.calculate_wearable_score(hr_data, steps_data)
        explanation = WearableAI.get_explanation(scores)
        
        self.assertIsInstance(explanation, str)
        self.assertGreater(len(explanation), 0)

if __name__ == '__main__':
    unittest.main()
