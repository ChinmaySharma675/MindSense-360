"""
Unit tests for Voice AI module
Tests audio processing and scoring logic
"""

import unittest
import numpy as np
from ai_modules.voice_ai import VoiceAI

class TestVoiceAI(unittest.TestCase):
    
    def test_feature_extraction_functions(self):
        """Test that feature extraction functions work"""
        # Create synthetic audio (1 second of sine wave)
        sr = 22050
        duration = 1.0
        frequency = 440  # A4 note
        t = np.linspace(0, duration, int(sr * duration))
        audio = np.sin(2 * np.pi * frequency * t)
        
        # Test MFCC extraction
        mfcc_features = VoiceAI.extract_mfcc_features(audio, sr)
        self.assertIn('mfcc_mean', mfcc_features)
        self.assertIn('mfcc_std', mfcc_features)
        self.assertIn('mfcc_variance', mfcc_features)
        
        # Test pitch extraction
        pitch_features = VoiceAI.extract_pitch_features(audio, sr)
        self.assertIn('pitch_mean', pitch_features)
        self.assertIn('pitch_std', pitch_features)
        self.assertIn('pitch_variance', pitch_features)
        
        # Test energy extraction
        energy_features = VoiceAI.extract_energy_features(audio)
        self.assertIn('energy_mean', energy_features)
        self.assertIn('energy_std', energy_features)
        self.assertIn('energy_max', energy_features)
    
    def test_score_calculation(self):
        """Test that score calculation returns valid scores"""
        mfcc_features = {
            'mfcc_mean': 10.0,
            'mfcc_std': 5.0,
            'mfcc_variance': 25.0
        }
        pitch_features = {
            'pitch_mean': 150.0,
            'pitch_std': 20.0,
            'pitch_variance': 30.0
        }
        energy_features = {
            'energy_mean': 0.01,
            'energy_std': 0.005,
            'energy_max': 0.02
        }
        
        result = VoiceAI.calculate_voice_score(
            mfcc_features, pitch_features, energy_features
        )
        
        self.assertIn('voice_score', result)
        self.assertIn('stress_label', result)
        self.assertGreaterEqual(result['voice_score'], 0.0)
        self.assertLessEqual(result['voice_score'], 1.0)
        self.assertIn(result['stress_label'], ['stressed', 'neutral'])
    
    def test_high_stress_indicators(self):
        """Test that high stress indicators increase score"""
        mfcc_features = {
            'mfcc_mean': 10.0,
            'mfcc_std': 5.0,
            'mfcc_variance': 80.0  # High variance
        }
        pitch_features = {
            'pitch_mean': 150.0,
            'pitch_std': 30.0,
            'pitch_variance': 120.0  # Very high variance (stress)
        }
        energy_features = {
            'energy_mean': 0.04,  # High energy (stress)
            'energy_std': 0.01,
            'energy_max': 0.08
        }
        
        result = VoiceAI.calculate_voice_score(
            mfcc_features, pitch_features, energy_features
        )
        
        # High stress indicators should result in higher score
        self.assertGreater(result['voice_score'], 0.5)
        self.assertEqual(result['stress_label'], 'stressed')
    
    def test_low_stress_indicators(self):
        """Test that low stress indicators result in low score"""
        mfcc_features = {
            'mfcc_mean': 10.0,
            'mfcc_std': 5.0,
            'mfcc_variance': 15.0  # Low variance
        }
        pitch_features = {
            'pitch_mean': 150.0,
            'pitch_std': 10.0,
            'pitch_variance': 20.0  # Low variance (calm)
        }
        energy_features = {
            'energy_mean': 0.01,  # Normal energy
            'energy_std': 0.003,
            'energy_max': 0.015
        }
        
        result = VoiceAI.calculate_voice_score(
            mfcc_features, pitch_features, energy_features
        )
        
        # Low stress indicators should result in lower score
        self.assertLess(result['voice_score'], 0.6)
        self.assertEqual(result['stress_label'], 'neutral')
    
    def test_explanation_generation(self):
        """Test that explanations are generated"""
        explanation_stressed = VoiceAI.get_explanation(0.8, 'stressed')
        explanation_neutral = VoiceAI.get_explanation(0.3, 'neutral')
        
        self.assertIsInstance(explanation_stressed, str)
        self.assertIsInstance(explanation_neutral, str)
        self.assertGreater(len(explanation_stressed), 0)
        self.assertGreater(len(explanation_neutral), 0)

if __name__ == '__main__':
    unittest.main()
