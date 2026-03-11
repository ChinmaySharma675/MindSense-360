import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Constants for input validation
const VALIDATION_LIMITS = {
  sampleRate: { min: 8000, max: 96000 }, // 8kHz to 96kHz
  maxAudioSamples: 30 * 48000, // 30 seconds at 48kHz max
  minAudioSamples: 100, // Minimum viable audio
  maxBase64Length: 10 * 1024 * 1024, // 10MB max for base64 string
};

/**
 * Voice Stress Analysis Algorithm
 * 
 * Analyzes audio characteristics to estimate stress levels.
 * This is a simplified rule-based approach for MVP.
 * 
 * In a production system, this would use ML models analyzing:
 * - MFCC (Mel-frequency cepstral coefficients)
 * - Pitch variation and jitter
 * - Speech rate
 * - Energy/loudness patterns
 * - Formant frequencies
 * 
 * For MVP, we analyze:
 * - Audio duration (too short/long may indicate stress)
 * - Average energy level
 * - Energy variance (high variance = stress indicator)
 */

interface AudioAnalysis {
  duration: number; // seconds
  averageEnergy: number; // 0-1 normalized
  energyVariance: number; // 0-1 normalized  
  peakCount: number; // number of energy peaks
}

interface VoiceInput {
  audioData: Float32Array;
  sampleRate: number;
}

/**
 * Validates and sanitizes voice input data
 * Throws an error with a descriptive message if validation fails
 */
function validateVoiceInput(body: unknown): VoiceInput {
  // Check if body is an object
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Invalid request body: expected an object");
  }

  const data = body as Record<string, unknown>;

  // Validate sampleRate
  if (data.sampleRate === undefined || data.sampleRate === null) {
    throw new Error("Missing required field: sampleRate");
  }
  const sampleRate = Number(data.sampleRate);
  if (!Number.isFinite(sampleRate)) {
    throw new Error("Invalid sampleRate: must be a valid number");
  }
  if (sampleRate < VALIDATION_LIMITS.sampleRate.min || sampleRate > VALIDATION_LIMITS.sampleRate.max) {
    throw new Error(`Invalid sampleRate: must be between ${VALIDATION_LIMITS.sampleRate.min} and ${VALIDATION_LIMITS.sampleRate.max} Hz`);
  }

  // Validate audioData
  if (data.audioData === undefined || data.audioData === null) {
    throw new Error("Missing required field: audioData");
  }

  let audioData: Float32Array;

  if (typeof data.audioData === "string") {
    // Base64 encoded - check length first to prevent DoS
    if (data.audioData.length > VALIDATION_LIMITS.maxBase64Length) {
      throw new Error(`Audio data too large: max ${VALIDATION_LIMITS.maxBase64Length / 1024 / 1024}MB`);
    }

    try {
      const binaryString = atob(data.audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      audioData = new Float32Array(bytes.buffer);
    } catch {
      throw new Error("Invalid audioData: failed to decode base64 string");
    }
  } else if (Array.isArray(data.audioData)) {
    // Check array length first to prevent DoS
    if (data.audioData.length > VALIDATION_LIMITS.maxAudioSamples) {
      throw new Error(`Audio sample count exceeds limit: max ${VALIDATION_LIMITS.maxAudioSamples} samples`);
    }

    // Validate all elements are finite numbers
    for (let i = 0; i < data.audioData.length; i++) {
      const sample = data.audioData[i];
      if (typeof sample !== "number" || !Number.isFinite(sample)) {
        throw new Error(`Invalid audio sample at index ${i}: must be a finite number`);
      }
    }

    audioData = new Float32Array(data.audioData);
  } else {
    throw new Error("Invalid audioData format: expected base64 string or number array");
  }

  // Validate audio array constraints
  if (audioData.length < VALIDATION_LIMITS.minAudioSamples) {
    throw new Error(`Audio sample count too small: minimum ${VALIDATION_LIMITS.minAudioSamples} samples`);
  }
  if (audioData.length > VALIDATION_LIMITS.maxAudioSamples) {
    throw new Error(`Audio sample count exceeds limit: max ${VALIDATION_LIMITS.maxAudioSamples} samples`);
  }

  // Check for NaN or Infinity values in the decoded array
  for (let i = 0; i < Math.min(1000, audioData.length); i++) {
    if (!Number.isFinite(audioData[i])) {
      throw new Error("Invalid audio data: contains NaN or Infinity values");
    }
  }

  return {
    audioData,
    sampleRate: Math.round(sampleRate),
  };
}

function analyzeAudioBuffer(audioData: Float32Array, sampleRate: number): AudioAnalysis {
  const duration = audioData.length / sampleRate;
  
  // Calculate RMS energy in windows
  const windowSize = Math.floor(sampleRate * 0.05); // 50ms windows
  const energyValues: number[] = [];
  
  for (let i = 0; i < audioData.length - windowSize; i += windowSize) {
    let sum = 0;
    for (let j = 0; j < windowSize; j++) {
      sum += audioData[i + j] * audioData[i + j];
    }
    const rms = Math.sqrt(sum / windowSize);
    energyValues.push(rms);
  }
  
  if (energyValues.length === 0) {
    return { duration, averageEnergy: 0, energyVariance: 0, peakCount: 0 };
  }
  
  // Calculate average energy
  const avgEnergy = energyValues.reduce((a, b) => a + b, 0) / energyValues.length;
  
  // Calculate variance
  const variance = energyValues.reduce((sum, e) => sum + Math.pow(e - avgEnergy, 2), 0) / energyValues.length;
  const normalizedVariance = Math.min(1, variance * 100); // Scale to 0-1
  
  // Count peaks (energy significantly above average)
  const threshold = avgEnergy * 1.5;
  let peakCount = 0;
  for (let i = 1; i < energyValues.length - 1; i++) {
    if (energyValues[i] > threshold && 
        energyValues[i] > energyValues[i-1] && 
        energyValues[i] > energyValues[i+1]) {
      peakCount++;
    }
  }
  
  return {
    duration,
    averageEnergy: Math.min(1, avgEnergy * 10), // Normalize to 0-1
    energyVariance: normalizedVariance,
    peakCount,
  };
}

function calculateVoiceStressScore(analysis: AudioAnalysis): { 
  score: number; 
  emotionLabel: string;
  characteristics: {
    speechPattern: string;
    energyLevel: string;
    consistency: string;
    indication: string;
  }
} {
  // Duration factor: optimal is 10-15 seconds
  // Too short (<5s) or too long (>20s) may indicate issues
  let durationScore = 0;
  if (analysis.duration < 3) {
    durationScore = 0.3; // Very short - might indicate reluctance
  } else if (analysis.duration < 5) {
    durationScore = 0.2;
  } else if (analysis.duration <= 15) {
    durationScore = 0; // Optimal range
  } else if (analysis.duration <= 20) {
    durationScore = 0.1;
  } else {
    durationScore = 0.2; // Very long
  }
  
  // Energy variance: higher variance often indicates stress
  // Calm speech has more consistent energy
  const varianceScore = analysis.energyVariance * 0.8;
  
  // Peak frequency: many peaks might indicate agitation
  // Normalize by duration
  const peaksPerSecond = analysis.peakCount / Math.max(1, analysis.duration);
  const peakScore = Math.min(1, peaksPerSecond / 3) * 0.5;
  
  // Low energy might indicate fatigue/depression
  // Very high energy might indicate stress/agitation
  let energyScore = 0;
  let energyLevel = "normal";
  if (analysis.averageEnergy < 0.1) {
    energyScore = 0.4; // Very low - possible fatigue
    energyLevel = "very_low";
  } else if (analysis.averageEnergy < 0.3) {
    energyScore = 0.1; // Low-normal
    energyLevel = "low";
  } else if (analysis.averageEnergy <= 0.6) {
    energyScore = 0; // Normal range
    energyLevel = "normal";
  } else if (analysis.averageEnergy <= 0.8) {
    energyScore = 0.2; // High
    energyLevel = "high";
  } else {
    energyScore = 0.4; // Very high - possible stress
    energyLevel = "very_high";
  }
  
  // Weighted combination
  const rawScore = 
    durationScore * 0.15 +
    varianceScore * 0.35 +
    peakScore * 0.25 +
    energyScore * 0.25;
  
  const score = Math.round(Math.min(1, Math.max(0, rawScore)) * 100) / 100;
  
  // Determine detailed emotion label and characteristics
  let emotionLabel: string;
  let speechPattern: string;
  let consistency: string;
  let indication: string;
  
  if (score <= 0.15) {
    emotionLabel = "very_calm";
    speechPattern = "Smooth and steady";
    consistency = "Very consistent";
    indication = "Relaxed state";
  } else if (score <= 0.30) {
    emotionLabel = "calm";
    speechPattern = "Stable and clear";
    consistency = "Consistent";
    indication = "Comfortable";
  } else if (score <= 0.40) {
    emotionLabel = "neutral";
    speechPattern = "Normal variation";
    consistency = "Moderately stable";
    indication = "Balanced";
  } else if (score <= 0.50) {
    emotionLabel = "slightly_concerned";
    speechPattern = "Minor fluctuations";
    consistency = "Somewhat variable";
    indication = "Mild concern";
  } else if (score <= 0.60) {
    emotionLabel = "anxious";
    speechPattern = "Uneven patterns";
    consistency = "Variable";
    indication = "Anxiety present";
  } else if (score <= 0.70) {
    emotionLabel = "stressed";
    speechPattern = "Irregular energy";
    consistency = "Inconsistent";
    indication = "Elevated stress";
  } else if (score <= 0.80) {
    emotionLabel = "very_stressed";
    speechPattern = "Highly irregular";
    consistency = "Very inconsistent";
    indication = "High stress levels";
  } else if (score <= 0.90) {
    emotionLabel = "distressed";
    speechPattern = "Erratic patterns";
    consistency = "Unstable";
    indication = "Significant distress";
  } else {
    emotionLabel = "severe_distress";
    speechPattern = "Very erratic";
    consistency = "Highly unstable";
    indication = "Severe distress detected";
  }
  
  return { 
    score, 
    emotionLabel,
    characteristics: {
      speechPattern,
      energyLevel,
      consistency,
      indication
    }
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
    let validatedInput: VoiceInput;
    try {
      validatedInput = validateVoiceInput(body);
    } catch (validationError) {
      console.warn("Validation failed:", validationError);
      return new Response(
        JSON.stringify({ error: (validationError as Error).message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analyzing audio: ${validatedInput.audioData.length} samples at ${validatedInput.sampleRate}Hz`);

    // Analyze audio
    const analysis = analyzeAudioBuffer(validatedInput.audioData, validatedInput.sampleRate);
    console.log("Audio analysis:", analysis);

    // Calculate stress score
    const { score, emotionLabel, characteristics } = calculateVoiceStressScore(analysis);
    console.log(`Voice score: ${score}, emotion: ${emotionLabel}`);

    // Store in database (raw audio is NOT stored for privacy)
    const { data, error } = await supabase.from("voice_scores").insert({
      user_id: user.id,
      voice_score: score,
      emotion_label: emotionLabel,
    }).select().single();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save voice analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Saved voice analysis:", data);

    return new Response(
      JSON.stringify({
        success: true,
        voice_score: score,
        emotion_label: emotionLabel,
        characteristics,
        analysis: {
          duration: Math.round(analysis.duration * 10) / 10,
          energy_level: Math.round(analysis.averageEnergy * 100),
          variance: Math.round(analysis.energyVariance * 100),
          peak_count: analysis.peakCount,
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
