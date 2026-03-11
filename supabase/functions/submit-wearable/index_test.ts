import {
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

// Extract the scoring algorithm for testing
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

Deno.test("Wearable Score - Optimal inputs should produce low score", () => {
  const score = calculateWearableScore({
    heart_rate: 70, // optimal
    steps: 10000, // healthy
  });
  assertEquals(score, 0);
});

Deno.test("Wearable Score - High stress indicators should produce high score", () => {
  const score = calculateWearableScore({
    heart_rate: 120, // elevated (40 above 80 = max 1.0)
    steps: 0, // sedentary
  });
  assertEquals(score, 1);
});

Deno.test("Wearable Score - Low heart rate should increase score", () => {
  const score = calculateWearableScore({
    heart_rate: 45, // 15 below 60
    steps: 10000,
  });
  // heartRateScore = 15/30 = 0.5
  // stepsScore = 0
  // weighted = 0.5 * 0.55 + 0 * 0.45 = 0.275 ≈ 0.28
  assertEquals(score, 0.28);
});

Deno.test("Wearable Score - Heart rate in optimal range should not contribute", () => {
  const score60 = calculateWearableScore({ heart_rate: 60, steps: 10000 });
  const score70 = calculateWearableScore({ heart_rate: 70, steps: 10000 });
  const score80 = calculateWearableScore({ heart_rate: 80, steps: 10000 });
  
  assertEquals(score60, 0);
  assertEquals(score70, 0);
  assertEquals(score80, 0);
});

Deno.test("Wearable Score - Steps above 10000 should not go negative", () => {
  const score = calculateWearableScore({
    heart_rate: 70,
    steps: 20000, // very active
  });
  assertEquals(score >= 0, true);
  assertEquals(score, 0);
});

Deno.test("Wearable Score - Moderate inputs should produce moderate score", () => {
  const score = calculateWearableScore({
    heart_rate: 100, // 20 above optimal
    steps: 5000, // moderate
  });
  // heartRateScore = 20/40 = 0.5
  // stepsScore = 1 - 0.5 = 0.5
  // weighted = 0.5 * 0.55 + 0.5 * 0.45 = 0.275 + 0.225 = 0.5
  assertEquals(score, 0.5);
});
