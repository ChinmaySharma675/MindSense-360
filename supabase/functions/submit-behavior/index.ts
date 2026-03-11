import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BehaviorInput {
  sleep_duration: number; // hours (0-24)
  screen_time: number; // hours (0-24)
  physical_activity: number; // steps (0-100000)
}

// Constants for input validation
const VALIDATION_LIMITS = {
  sleep: { min: 0, max: 24 },
  screen: { min: 0, max: 24 },
  activity: { min: 0, max: 100000 },
};

/**
 * Validates and sanitizes behavior input data
 * Throws an error with a descriptive message if validation fails
 */
function validateBehaviorInput(body: unknown): BehaviorInput {
  // Check if body is an object
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Invalid request body: expected an object");
  }

  const data = body as Record<string, unknown>;

  // Validate sleep_duration
  if (data.sleep_duration === undefined || data.sleep_duration === null) {
    throw new Error("Missing required field: sleep_duration");
  }
  const sleep = Number(data.sleep_duration);
  if (!Number.isFinite(sleep)) {
    throw new Error("Invalid sleep_duration: must be a valid number (not NaN or Infinity)");
  }
  if (sleep < VALIDATION_LIMITS.sleep.min || sleep > VALIDATION_LIMITS.sleep.max) {
    throw new Error(`Invalid sleep_duration: must be between ${VALIDATION_LIMITS.sleep.min} and ${VALIDATION_LIMITS.sleep.max} hours`);
  }

  // Validate screen_time
  if (data.screen_time === undefined || data.screen_time === null) {
    throw new Error("Missing required field: screen_time");
  }
  const screen = Number(data.screen_time);
  if (!Number.isFinite(screen)) {
    throw new Error("Invalid screen_time: must be a valid number (not NaN or Infinity)");
  }
  if (screen < VALIDATION_LIMITS.screen.min || screen > VALIDATION_LIMITS.screen.max) {
    throw new Error(`Invalid screen_time: must be between ${VALIDATION_LIMITS.screen.min} and ${VALIDATION_LIMITS.screen.max} hours`);
  }

  // Validate physical_activity
  if (data.physical_activity === undefined || data.physical_activity === null) {
    throw new Error("Missing required field: physical_activity");
  }
  const activity = Number(data.physical_activity);
  if (!Number.isFinite(activity)) {
    throw new Error("Invalid physical_activity: must be a valid number (not NaN or Infinity)");
  }
  if (activity < VALIDATION_LIMITS.activity.min || activity > VALIDATION_LIMITS.activity.max) {
    throw new Error(`Invalid physical_activity: must be between ${VALIDATION_LIMITS.activity.min} and ${VALIDATION_LIMITS.activity.max} steps`);
  }

  // Return sanitized values with reasonable precision (2 decimal places for hours)
  return {
    sleep_duration: Math.round(sleep * 100) / 100,
    screen_time: Math.round(screen * 100) / 100,
    physical_activity: Math.round(activity), // Steps should be integers
  };
}

/**
 * Behavioral AI Scoring Algorithm
 * 
 * Scores each metric on a 0-1 scale where:
 * - Higher score = higher stress/risk indicator
 * - Lower score = healthier behavior
 * 
 * Combined using weighted average:
 * - Sleep: 40% (most impactful on mental health)
 * - Screen time: 30% 
 * - Activity: 30%
 */
function calculateBehaviorScore(data: BehaviorInput): number {
  // Sleep score: 7-9 hours is optimal, deviation increases risk
  // <5 or >10 hours = high risk
  const optimalSleep = 8;
  const sleepDeviation = Math.abs(data.sleep_duration - optimalSleep);
  const sleepScore = Math.min(1, sleepDeviation / 5); // 5+ hours deviation = max risk

  // Screen time score: More screen time = higher risk
  // 0-2 hours = low risk, 8+ hours = high risk
  const screenScore = Math.min(1, data.screen_time / 10);

  // Activity score: Less activity = higher risk
  // 10000+ steps = low risk, 0 steps = high risk
  const activityScore = Math.max(0, 1 - data.physical_activity / 10000);

  // Weighted average
  const weightedScore =
    sleepScore * 0.4 + screenScore * 0.3 + activityScore * 0.3;

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
    let validatedInput: BehaviorInput;
    try {
      validatedInput = validateBehaviorInput(body);
    } catch (validationError) {
      console.warn("Validation failed:", validationError);
      return new Response(
        JSON.stringify({ error: (validationError as Error).message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Validated behavior data:", validatedInput);

    // Calculate behavior score
    const behaviorScore = calculateBehaviorScore(validatedInput);
    console.log("Calculated behavior score:", behaviorScore);

    // Store in database
    const { data, error } = await supabase.from("behavior_data").insert({
      user_id: user.id,
      sleep_duration: validatedInput.sleep_duration,
      screen_time: validatedInput.screen_time,
      physical_activity: validatedInput.physical_activity,
      behavior_score: behaviorScore,
    }).select().single();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save behavior data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Saved behavior data:", data);

    return new Response(
      JSON.stringify({
        success: true,
        behavior_score: behaviorScore,
        data: {
          sleep_duration: validatedInput.sleep_duration,
          screen_time: validatedInput.screen_time,
          physical_activity: validatedInput.physical_activity,
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
