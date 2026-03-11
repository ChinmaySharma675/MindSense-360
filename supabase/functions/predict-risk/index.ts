import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Risk Fusion Engine
 * 
 * Combines behavioral, voice, and wearable scores into a final risk assessment.
 * 
 * Risk Level Rules (from PRD):
 * - All scores > 0.7 → HIGH
 * - Any 2 scores > 0.6 → MEDIUM
 * - Else → LOW
 * 
 * Additional insights:
 * - Identifies which factors are contributing most to risk
 * - Provides actionable recommendations
 */

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
  confidence: number; // 0-1 based on data availability
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

  // If no data, return low risk with zero confidence
  if (validScores.length === 0) {
    return {
      risk_level: "LOW",
      scores,
      contributing_factors: [],
      recommendations: ["Start logging your daily data to get personalized insights."],
      confidence: 0,
    };
  }

  // Calculate confidence based on data completeness
  const confidence = validScores.length / 3;

  // Identify high-risk factors (>0.7)
  const highRiskFactors = validScores.filter((s) => s.value > 0.7);
  
  // Identify medium-risk factors (>0.6)
  const mediumRiskFactors = validScores.filter((s) => s.value > 0.6);

  // Determine risk level based on PRD rules
  let risk_level: "LOW" | "MEDIUM" | "HIGH";
  
  if (highRiskFactors.length === validScores.length && validScores.length > 0) {
    // All available scores are high
    risk_level = "HIGH";
  } else if (mediumRiskFactors.length >= 2) {
    // At least 2 scores above 0.6
    risk_level = "MEDIUM";
  } else {
    risk_level = "LOW";
  }

  // Identify contributing factors
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

  // Generate recommendations
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
    recommendations: recommendations.slice(0, 3), // Max 3 recommendations
    confidence,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Calculating risk for user: ${user.id}`);

    // Fetch latest scores in parallel
    const [behaviorRes, voiceRes, wearableRes] = await Promise.all([
      supabase
        .from("behavior_data")
        .select("behavior_score")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("voice_scores")
        .select("voice_score")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("wearable_data")
        .select("wearable_score")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const scores: ScoreData = {
      behavior_score: behaviorRes.data?.behavior_score ?? null,
      voice_score: voiceRes.data?.voice_score ?? null,
      wearable_score: wearableRes.data?.wearable_score ?? null,
    };

    console.log("Latest scores:", scores);

    // Calculate risk
    const result = calculateRiskLevel(scores);
    console.log("Risk result:", result);

    // Store in database
    const { error: insertError } = await supabase.from("risk_results").insert({
      user_id: user.id,
      risk_level: result.risk_level,
      behavior_score: scores.behavior_score,
      voice_score: scores.voice_score,
      wearable_score: scores.wearable_score,
    });

    if (insertError) {
      console.error("Database error:", insertError);
      // Don't fail the request, just log the error
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});