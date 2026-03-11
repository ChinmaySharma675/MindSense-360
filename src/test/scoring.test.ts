import { describe, it, expect } from 'vitest';

// Replicate the scoring algorithms for frontend testing
// These should match the edge function implementations

interface BehaviorInput {
  sleep_duration: number;
  screen_time: number;
  physical_activity: number;
}

function calculateBehaviorScore(data: BehaviorInput): number {
  const optimalSleep = 8;
  const sleepDeviation = Math.abs(data.sleep_duration - optimalSleep);
  const sleepScore = Math.min(1, sleepDeviation / 5);
  const screenScore = Math.min(1, data.screen_time / 10);
  const activityScore = Math.max(0, 1 - data.physical_activity / 10000);
  const weightedScore =
    sleepScore * 0.4 + screenScore * 0.3 + activityScore * 0.3;
  return Math.round(weightedScore * 100) / 100;
}

interface WearableInput {
  heart_rate: number;
  steps: number;
}

function calculateWearableScore(data: WearableInput): number {
  let heartRateScore: number;
  if (data.heart_rate >= 60 && data.heart_rate <= 80) {
    heartRateScore = 0;
  } else if (data.heart_rate < 60) {
    heartRateScore = Math.min(1, (60 - data.heart_rate) / 30);
  } else {
    heartRateScore = Math.min(1, (data.heart_rate - 80) / 40);
  }
  const stepsScore = Math.max(0, 1 - data.steps / 10000);
  const weightedScore = heartRateScore * 0.55 + stepsScore * 0.45;
  return Math.round(weightedScore * 100) / 100;
}

describe('Behavioral Score Algorithm', () => {
  it('should return 0 for optimal inputs', () => {
    const score = calculateBehaviorScore({
      sleep_duration: 8,
      screen_time: 0,
      physical_activity: 10000,
    });
    expect(score).toBe(0);
  });

  it('should return 1 for worst case inputs', () => {
    const score = calculateBehaviorScore({
      sleep_duration: 3,
      screen_time: 10,
      physical_activity: 0,
    });
    expect(score).toBe(1);
  });

  it('should return values between 0 and 1', () => {
    const testCases = [
      { sleep_duration: 5, screen_time: 3, physical_activity: 3000 },
      { sleep_duration: 10, screen_time: 8, physical_activity: 1000 },
      { sleep_duration: 7, screen_time: 2, physical_activity: 8000 },
    ];

    testCases.forEach(input => {
      const score = calculateBehaviorScore(input);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  it('should weight sleep as 40%', () => {
    // Compare scores with only sleep varying
    const baseLine = calculateBehaviorScore({
      sleep_duration: 8,
      screen_time: 0,
      physical_activity: 10000,
    });
    const poorSleep = calculateBehaviorScore({
      sleep_duration: 3,
      screen_time: 0,
      physical_activity: 10000,
    });
    // Sleep deviation of 5 = max score of 1 * 0.4 = 0.4
    expect(poorSleep - baseLine).toBe(0.4);
  });
});

describe('Wearable Score Algorithm', () => {
  it('should return 0 for optimal heart rate and high steps', () => {
    const score = calculateWearableScore({
      heart_rate: 70,
      steps: 10000,
    });
    expect(score).toBe(0);
  });

  it('should return 1 for high stress indicators', () => {
    const score = calculateWearableScore({
      heart_rate: 120,
      steps: 0,
    });
    expect(score).toBe(1);
  });

  it('should treat 60-80 bpm as optimal range', () => {
    const scores = [60, 65, 70, 75, 80].map(hr =>
      calculateWearableScore({ heart_rate: hr, steps: 10000 })
    );
    scores.forEach(score => expect(score).toBe(0));
  });

  it('should increase score for low heart rate', () => {
    const low = calculateWearableScore({ heart_rate: 45, steps: 10000 });
    const optimal = calculateWearableScore({ heart_rate: 70, steps: 10000 });
    expect(low).toBeGreaterThan(optimal);
  });

  it('should increase score for high heart rate', () => {
    const high = calculateWearableScore({ heart_rate: 100, steps: 10000 });
    const optimal = calculateWearableScore({ heart_rate: 70, steps: 10000 });
    expect(high).toBeGreaterThan(optimal);
  });
});

describe('Risk Level Classification', () => {
  type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

  function determineRiskLevel(
    behavior: number | null,
    voice: number | null,
    wearable: number | null
  ): RiskLevel {
    const scores = [behavior, voice, wearable].filter(s => s !== null) as number[];
    
    if (scores.length === 0) return 'LOW';
    
    const highCount = scores.filter(s => s > 0.7).length;
    const mediumCount = scores.filter(s => s > 0.6).length;
    
    if (highCount === scores.length) return 'HIGH';
    if (mediumCount >= 2) return 'MEDIUM';
    return 'LOW';
  }

  it('should return LOW for no data', () => {
    expect(determineRiskLevel(null, null, null)).toBe('LOW');
  });

  it('should return LOW for all low scores', () => {
    expect(determineRiskLevel(0.3, 0.4, 0.2)).toBe('LOW');
  });

  it('should return HIGH when all scores > 0.7', () => {
    expect(determineRiskLevel(0.8, 0.75, 0.9)).toBe('HIGH');
  });

  it('should return MEDIUM when 2+ scores > 0.6', () => {
    expect(determineRiskLevel(0.65, 0.7, 0.3)).toBe('MEDIUM');
  });

  it('should return LOW when only one score is high', () => {
    expect(determineRiskLevel(0.9, 0.3, 0.2)).toBe('LOW');
  });
});
