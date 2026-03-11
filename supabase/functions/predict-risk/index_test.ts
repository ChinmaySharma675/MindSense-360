import {
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

// Extract the risk calculation logic for testing
interface ScoreData {
  behavior_score: number | null;
  voice_score: number | null;
  wearable_score: number | null;
}

interface RiskResult {
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  scores: ScoreData;
  contributing_factors: string[];
  recommendations: string[];
  confidence: number;
}

function calculateRiskLevel(scores: ScoreData): RiskResult {
  const validScores: { name: string; value: number }[] = [];
  
  if (scores.behavior_score !== null) {
    validScores.push({ name: "behavioral", value: scores.behavior_score });
  }
  if (scores.voice_score !== null) {
    validScores.push({ name: "voice", value: scores.voice_score });
  }
  if (scores.wearable_score !== null) {
    validScores.push({ name: "wearable", value: scores.wearable_score });
  }

  if (validScores.length === 0) {
    return {
      risk_level: "LOW",
      scores,
      contributing_factors: [],
      recommendations: ["Start logging your daily data to get personalized insights."],
      confidence: 0,
    };
  }

  const confidence = validScores.length / 3;
  const highRiskFactors = validScores.filter((s) => s.value > 0.7);
  const mediumRiskFactors = validScores.filter((s) => s.value > 0.6);

  let risk_level: "LOW" | "MEDIUM" | "HIGH";
  
  if (highRiskFactors.length === validScores.length && validScores.length > 0) {
    risk_level = "HIGH";
  } else if (mediumRiskFactors.length >= 2) {
    risk_level = "MEDIUM";
  } else {
    risk_level = "LOW";
  }

  const contributing_factors: string[] = [];
  
  if (scores.behavior_score !== null && scores.behavior_score > 0.5) {
    if (scores.behavior_score > 0.7) {
      contributing_factors.push("Poor sleep or high screen time detected");
    } else if (scores.behavior_score > 0.5) {
      contributing_factors.push("Behavioral patterns show some stress indicators");
    }
  }
  
  if (scores.voice_score !== null && scores.voice_score > 0.5) {
    if (scores.voice_score > 0.7) {
      contributing_factors.push("Voice analysis indicates high stress levels");
    } else if (scores.voice_score > 0.5) {
      contributing_factors.push("Voice patterns suggest mild tension");
    }
  }
  
  if (scores.wearable_score !== null && scores.wearable_score > 0.5) {
    if (scores.wearable_score > 0.7) {
      contributing_factors.push("Elevated heart rate or low activity detected");
    } else if (scores.wearable_score > 0.5) {
      contributing_factors.push("Physical metrics show room for improvement");
    }
  }

  const recommendations: string[] = [];
  
  if (risk_level === "HIGH") {
    recommendations.push("Consider taking a break and practicing deep breathing");
    recommendations.push("Reach out to a friend, family member, or counselor");
  }
  
  if (scores.behavior_score !== null && scores.behavior_score > 0.5) {
    recommendations.push("Try to get 7-9 hours of sleep tonight");
    recommendations.push("Reduce screen time, especially before bed");
  }
  
  if (scores.wearable_score !== null && scores.wearable_score > 0.5) {
    recommendations.push("Take a 10-minute walk to boost your mood");
  }
  
  if (scores.voice_score !== null && scores.voice_score > 0.5) {
    recommendations.push("Practice speaking slowly and taking deep breaths");
  }

  if (recommendations.length === 0) {
    recommendations.push("Keep up the good work! Your metrics look healthy.");
  }

  return {
    risk_level,
    scores,
    contributing_factors,
    recommendations: recommendations.slice(0, 3),
    confidence,
  };
}

// Tests for Risk Fusion Engine

Deno.test("Risk Level - No data should return LOW with zero confidence", () => {
  const result = calculateRiskLevel({
    behavior_score: null,
    voice_score: null,
    wearable_score: null,
  });
  
  assertEquals(result.risk_level, "LOW");
  assertEquals(result.confidence, 0);
  assertEquals(result.recommendations.length > 0, true);
});

Deno.test("Risk Level - All low scores should return LOW", () => {
  const result = calculateRiskLevel({
    behavior_score: 0.3,
    voice_score: 0.2,
    wearable_score: 0.4,
  });
  
  assertEquals(result.risk_level, "LOW");
  assertEquals(result.confidence, 1);
});

Deno.test("Risk Level - All high scores (>0.7) should return HIGH", () => {
  const result = calculateRiskLevel({
    behavior_score: 0.8,
    voice_score: 0.75,
    wearable_score: 0.9,
  });
  
  assertEquals(result.risk_level, "HIGH");
  assertEquals(result.contributing_factors.length > 0, true);
});

Deno.test("Risk Level - Two scores >0.6 should return MEDIUM", () => {
  const result = calculateRiskLevel({
    behavior_score: 0.65,
    voice_score: 0.7,
    wearable_score: 0.3,
  });
  
  assertEquals(result.risk_level, "MEDIUM");
});

Deno.test("Risk Level - One high score with others low should return LOW", () => {
  const result = calculateRiskLevel({
    behavior_score: 0.9,
    voice_score: 0.2,
    wearable_score: 0.1,
  });
  
  // Only one score above threshold, not enough for MEDIUM
  assertEquals(result.risk_level, "LOW");
});

Deno.test("Risk Level - Partial data should adjust confidence", () => {
  const oneScore = calculateRiskLevel({
    behavior_score: 0.5,
    voice_score: null,
    wearable_score: null,
  });
  
  const twoScores = calculateRiskLevel({
    behavior_score: 0.5,
    voice_score: 0.5,
    wearable_score: null,
  });
  
  assertEquals(oneScore.confidence, 1/3);
  assertEquals(twoScores.confidence, 2/3);
});

Deno.test("Risk Level - Should include contributing factors for elevated scores", () => {
  const result = calculateRiskLevel({
    behavior_score: 0.8,
    voice_score: 0.6,
    wearable_score: 0.8,
  });
  
  assertEquals(result.contributing_factors.length >= 2, true);
});

Deno.test("Risk Level - HIGH risk should have counselor recommendation", () => {
  const result = calculateRiskLevel({
    behavior_score: 0.9,
    voice_score: 0.85,
    wearable_score: 0.8,
  });
  
  const hasCounselorRec = result.recommendations.some(r => 
    r.toLowerCase().includes("counselor") || r.toLowerCase().includes("friend")
  );
  assertEquals(hasCounselorRec, true);
});

Deno.test("Risk Level - Recommendations should be limited to 3", () => {
  const result = calculateRiskLevel({
    behavior_score: 0.9,
    voice_score: 0.9,
    wearable_score: 0.9,
  });
  
  assertEquals(result.recommendations.length <= 3, true);
});
