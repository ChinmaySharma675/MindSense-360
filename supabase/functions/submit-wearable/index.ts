import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WearableInput {
  heart_rate: number; // bpm (30-220)
  steps: number; // daily steps (0-100000)
}

// Constants for input validation
const VALIDATION_LIMITS = {
  heartRate: { min: 30, max: 220 }, // Physiologically reasonable range
  steps: { min: 0, max: 100000 }, // Max ~100k steps/day is extreme but possible
};

/**
 * Validates and sanitizes wearable input data
 * Throws an error with a descriptive message if validation fails
 */
function validateWearableInput(body: unknown): WearableInput {
  // Check if body is an object
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Invalid request body: expected an object");
  }

  const data = body as Record<string, unknown>;

  // Validate heart_rate
  if (data.heart_rate === undefined || data.heart_rate === null) {
    throw new Error("Missing required field: heart_rate");
  }
  const heartRate = Number(data.heart_rate);
  if (!Number.isFinite(heartRate)) {
    throw new Error("Invalid heart_rate: must be a valid number (not NaN or Infinity)");
  }
  if (heartRate < VALIDATION_LIMITS.heartRate.min || heartRate > VALIDATION_LIMITS.heartRate.max) {
    throw new Error(`Invalid heart_rate: must be between ${VALIDATION_LIMITS.heartRate.min} and ${VALIDATION_LIMITS.heartRate.max} bpm`);
  }

  // Validate steps
  if (data.steps === undefined || data.steps === null) {
    throw new Error("Missing required field: steps");
  }
  const steps = Number(data.steps);
  if (!Number.isFinite(steps)) {
    throw new Error("Invalid steps: must be a valid number (not NaN or Infinity)");
  }
  if (steps < VALIDATION_LIMITS.steps.min || steps > VALIDATION_LIMITS.steps.max) {
    throw new Error(`Invalid steps: must be between ${VALIDATION_LIMITS.steps.min} and ${VALIDATION_LIMITS.steps.max}`);
  }

  // Return sanitized values as integers
  return {
    heart_rate: Math.round(heartRate),
    steps: Math.round(steps),
  };
}

/**
 * Wearable AI Scoring Algorithm
 * 
 * Scores wearable metrics on a 0-1 scale where:
 * - Higher score = higher stress/risk indicator
 * - Lower score = healthier metrics
 * 
 * Heart Rate Analysis:
 * - Resting HR 60-80 bpm is optimal
 * - <50 or >100 bpm at rest indicates potential stress/health issues
 * 
 * Activity (Steps):
 * - 10000+ steps = active lifestyle (low risk)
 * - <2000 steps = sedentary (high risk)
 */
function calculateWearableScore(data: WearableInput): number {
  // Heart rate score: deviation from optimal range increases risk
  // Optimal range: 60-80 bpm
  let heartRateScore: number;
  if (data.heart_rate >= 60 && data.heart_rate <= 80) {
    heartRateScore = 0; // Optimal
  } else if (data.heart_rate < 60) {
    // Below optimal - could indicate issues or very fit
    heartRateScore = Math.min(1, (60 - data.heart_rate) / 30);
  } else {
    // Above optimal - stress indicator
    heartRateScore = Math.min(1, (data.heart_rate - 80) / 40);
  }

  // Steps score: less activity = higher risk
  // 10000+ steps = 0 risk, 0 steps = 1 risk
  const stepsScore = Math.max(0, 1 - data.steps / 10000);

  // Weighted average - heart rate slightly more important for stress
  const weightedScore = heartRateScore * 0.55 + stepsScore * 0.45;

  // Round to 2 decimal places
  return Math.round(weightedScore * 100) / 100;
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

    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate input with comprehensive checks
    let validatedInput: WearableInput;
    try {
      validatedInput = validateWearableInput(body);
    } catch (validationError) {
      console.warn("Validation failed:", validationError);
      return new Response(
        JSON.stringify({ error: (validationError as Error).message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Validated wearable data:", validatedInput);

    // Calculate wearable score
    const wearableScore = calculateWearableScore(validatedInput);
    console.log("Calculated wearable score:", wearableScore);

    // Store in database
    const { data, error } = await supabase.from("wearable_data").insert({
      user_id: user.id,
      heart_rate: validatedInput.heart_rate,
      steps: validatedInput.steps,
      wearable_score: wearableScore,
    }).select().single();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save wearable data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Saved wearable data:", data);

    return new Response(
      JSON.stringify({
        success: true,
        wearable_score: wearableScore,
        data: {
          heart_rate: validatedInput.heart_rate,
          steps: validatedInput.steps,
        },
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
