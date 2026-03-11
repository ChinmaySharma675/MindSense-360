import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

// Extract the scoring algorithm for testing
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

Deno.test("Behavior Score - Optimal inputs should produce low score", () => {
  const score = calculateBehaviorScore({
    sleep_duration: 8, // optimal
    screen_time: 0, // minimal
    physical_activity: 10000, // healthy
  });
  assertEquals(score, 0);
});

Deno.test("Behavior Score - Poor inputs should produce high score", () => {
  const score = calculateBehaviorScore({
    sleep_duration: 3, // very poor (5 hours deviation = max 1.0)
    screen_time: 10, // high (max score)
    physical_activity: 0, // sedentary
  });
  assertEquals(score, 1);
});

Deno.test("Behavior Score - Medium inputs should produce medium score", () => {
  const score = calculateBehaviorScore({
    sleep_duration: 6, // slightly below optimal
    screen_time: 5, // moderate
    physical_activity: 5000, // moderate
  });
  // sleepScore = 2/5 = 0.4
  // screenScore = 5/10 = 0.5
  // activityScore = 1 - 0.5 = 0.5
  // weighted = 0.4*0.4 + 0.5*0.3 + 0.5*0.3 = 0.16 + 0.15 + 0.15 = 0.46
  assertEquals(score, 0.46);
});

Deno.test("Behavior Score - Score should be between 0 and 1", () => {
  // Test edge cases
  const extremeHigh = calculateBehaviorScore({
    sleep_duration: 0,
    screen_time: 24,
    physical_activity: 0,
  });
  const extremeLow = calculateBehaviorScore({
    sleep_duration: 8,
    screen_time: 0,
    physical_activity: 50000,
  });
  
  assertEquals(extremeHigh <= 1, true);
  assertEquals(extremeLow >= 0, true);
});

Deno.test("Behavior Score - Should clamp excessive values", () => {
  // Screen time capped at 10 for max score
  const highScreen = calculateBehaviorScore({
    sleep_duration: 8,
    screen_time: 20, // excessive
    physical_activity: 10000,
  });
  // screenScore should be capped at 1.0
  assertEquals(highScreen, 0.3); // only screen time contributes
});

Deno.test("Behavior Score - Sleep deviation works symmetrically", () => {
  const tooLittle = calculateBehaviorScore({
    sleep_duration: 6, // 2 hours below optimal
    screen_time: 0,
    physical_activity: 10000,
  });
  const tooMuch = calculateBehaviorScore({
    sleep_duration: 10, // 2 hours above optimal
    screen_time: 0,
    physical_activity: 10000,
  });
  assertEquals(tooLittle, tooMuch);
});
