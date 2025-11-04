import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PostHog } from "npm:posthog-node@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Initialize PostHog
  const posthogApiKey = Deno.env.get("POSTHOG_API_KEY");
  const posthogHost =
    Deno.env.get("POSTHOG_HOST") || "https://us.i.posthog.com";
  let posthog: PostHog | null = null;

  if (posthogApiKey) {
    posthog = new PostHog(posthogApiKey, { host: posthogHost });
  }

  try {
    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    // Parse request body
    const { pdfUrl, aiNotes, userId } = await req.json();

    if (!pdfUrl) {
      return new Response(JSON.stringify({ error: "pdfUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download PDF from storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract file path from URL
    const urlParts = pdfUrl.split("/workout-plans/");
    if (urlParts.length !== 2) {
      throw new Error("Invalid PDF URL format");
    }
    const filePath = urlParts[1];

    // Download PDF
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from("workout-plans")
      .download(filePath);

    if (downloadError) {
      throw new Error(`Failed to download PDF: ${downloadError.message}`);
    }

    // Convert PDF to base64 (process in chunks to avoid stack overflow)
    const arrayBuffer = await pdfData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Process in chunks to avoid "Maximum call stack size exceeded"
    let binaryString = "";
    const chunkSize = 8192; // Process 8KB at a time
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(
        i,
        Math.min(i + chunkSize, uint8Array.length)
      );
      binaryString += String.fromCharCode(...chunk);
    }
    const base64Data = btoa(binaryString);

    // Prepare prompt for Gemini
    let prompt = `You are an expert fitness trainer analyzing a workout plan PDF. Extract the following information and return it as a JSON object:

{
  "name": "Name of the workout plan",
  "description": "Brief description of the plan",
  "num_weeks": number of weeks in the plan (default to 2 if not specified),
  "workouts": {
    "A": {
      "name": "Workout A name (e.g., 'Push Day', 'Upper Body')",
      "exercises": [
        {
          "exercise_name": "Exercise name (e.g., 'Push-ups', 'Pull-ups')",
          "sets": number of sets,
          "reps": target reps per set (ONLY for dynamic exercises - omit this field if static),
          "duration": duration in seconds per set (ONLY for static exercises - omit this field if dynamic),
          "rest_seconds": rest time in seconds between sets (default to 60 if not specified),
          "superset_group": "optional identifier for superset grouping (e.g., '1', '2', etc.)",
          "unilateral_type": "optional type for unilateral exercises ('single_arm', 'single_leg', etc.)",
          "alternating": "optional boolean: true if alternating per set, false if grouped by side"
        }
      ]
    },
    "B": { similar structure for workout B },
    "C": { similar structure for workout C if exists }
  },
  "schedule": [
    ["A", "rest", "B", "rest", "A", "rest", "rest"],  // Week 1
    ["B", "rest", "A", "rest", "B", "rest", "rest"]   // Week 2
  ]
}

IMPORTANT RULES:
1. Workout letters should be uppercase (A, B, C, etc.)
2. Rest days must be lowercase "rest"
3. Each week in schedule array should have exactly 7 days
4. If exercise names don't match exactly, use the closest common exercise name (e.g., "pushup" -> "Push-ups")
5. If sets, reps, or rest times are ranges (e.g., "3-4 sets"), use the higher number
6. If rest time is in minutes, convert to seconds (e.g., "2 min" -> 120)
7. Schedule should start from Sunday (index 0) to Saturday (index 6)
8. If the PDF doesn't specify a clear schedule, create a reasonable one based on the workouts provided

EXERCISE TYPE DETECTION:
9. STATIC vs DYNAMIC: Determine if each exercise is static (timed/isometric) or dynamic (rep-based)
   - Static exercises: planks, wall sits, wall holds, isometric holds, time-based exercises
   - Dynamic exercises: push-ups, pull-ups, squats, lunges, any rep-based movement
   - For static exercises: include ONLY "duration" field (in seconds), DO NOT include "reps" field
   - For dynamic exercises: include ONLY "reps" field, DO NOT include "duration" field
   - CRITICAL: Each exercise must have exactly ONE of these fields - never both, never neither

UNILATERAL EXERCISE DETECTION:
10. UNILATERAL EXERCISES: Detect single-side movements (one arm, one leg, etc.)
    - Look for keywords: "archer", "one arm", "one-arm", "single arm", "single leg", "pistol", "bulgarian", "lateral", "side"
    - Look for per-side notation: "3 reps each side", "10 reps per hand", "5 reps each leg"
    - Set unilateral_type: "single_arm", "single_leg", "single_side", etc.
    - ALTERNATING PATTERN: Determine if exercises alternate per set or group all sets per side
      - If alternating per set: "alternating": true (e.g., "3 sets of 5 reps each arm")
      - If grouped by side: "alternating": false (e.g., "3 sets right arm, 3 sets left arm")
      - Default to "alternating": true if unilateral but pattern unclear

SUPERSET DETECTION:
11. Look for exercises grouped as "supersets", "superseries", "SS", or similar terms in ANY language
12. Exercises in a superset should be assigned the same superset_group identifier (use "1", "2", "3", etc.)
13. Supersets typically have 2 exercises but can have more (default to 2, but detect more if specified)
14. Exercises in the same superset MUST have the same number of sets, but CAN have different rep amounts
15. Example: Superset with 3 sets of 8 pull-ups + 3 sets of 10 push-ups is valid
16. Only assign superset_group if exercises are explicitly marked as supersets in the PDF
17. Regular exercises (not in supersets) should NOT have a superset_group field`;

    // Add user-provided AI notes if present
    if (aiNotes && aiNotes.trim()) {
      prompt += `\n\nADDITIONAL USER INSTRUCTIONS:\n${aiNotes.trim()}\n\nFollow these additional instructions carefully when analyzing the PDF.`;
    }

    prompt += `\n\nReturn ONLY the JSON object, no additional text or explanation.`;

    // Track start time for latency measurement
    const startTime = Date.now();

    // Call Gemini API
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data,
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    const text = response.text();

    // Calculate latency in seconds
    const latency = (Date.now() - startTime) / 1000;

    // Extract usage metadata from Gemini response
    const usageMetadata = response.usageMetadata || {};
    const inputTokens = usageMetadata.promptTokenCount || 0;
    const outputTokens = usageMetadata.candidatesTokenCount || 0;

    // Calculate cost based on Gemini 2.5 Flash pricing
    // Input: $0.075 per 1M tokens, Output: $0.30 per 1M tokens
    const inputCost = (inputTokens / 1000000) * 0.075;
    const outputCost = (outputTokens / 1000000) * 0.3;
    const totalCost = inputCost + outputCost;

    // Parse JSON from response
    let parsedData;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      parsedData = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Validate and transform the response
    const validatedData = await validateAndTransformPlanData(
      parsedData,
      supabase,
      genAI
    );

    // Capture PostHog analytics event
    if (posthog) {
      try {
        posthog.capture({
          distinctId: userId || "anonymous",
          event: "$ai_generation",
          properties: {
            $ai_model: "gemini-2.5-flash",
            $ai_latency: latency,
            $ai_input_tokens: inputTokens,
            $ai_output_tokens: outputTokens,
            $ai_total_cost_usd: totalCost,
            analysis_type: "pdf_workout_plan",
            has_ai_notes: !!(aiNotes && aiNotes.trim()),
            num_workouts: Object.keys(validatedData.workouts || {}).length,
            num_weeks: validatedData.num_weeks,
          },
        });
        await posthog.shutdown();
      } catch (phError) {
        console.error("PostHog error:", phError);
        // Don't fail the request if PostHog fails
      }
    }

    return new Response(JSON.stringify(validatedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-workout-plan:", error);

    // Ensure PostHog is shut down even on error
    if (posthog) {
      try {
        await posthog.shutdown();
      } catch (phError) {
        console.error("PostHog shutdown error:", phError);
      }
    }

    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred during PDF analysis",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Match exercise by name or create new exercise in database
 */
async function matchOrCreateExercise(
  exerciseName: string,
  supabase: any,
  genAI: any
): Promise<{ exercise_id: string; type: "static" | "dynamic" }> {
  try {
    // First, try to find existing exercise by name (case-insensitive partial match)
    const { data: existingExercises, error: searchError } = await supabase
      .from("exercises")
      .select("exercise_id, name, type")
      .ilike("name", `%${exerciseName.toLowerCase()}%`);

    if (searchError) {
      console.error("Error searching for exercise:", searchError);
      throw searchError;
    }

    // If found, return the first match
    if (existingExercises && existingExercises.length > 0) {
      const match = existingExercises[0];
      console.log(`Found existing exercise: ${match.name} (${match.type})`);
      return {
        exercise_id: match.exercise_id,
        type: match.type as "static" | "dynamic",
      };
    }

    // If not found, use AI to determine exercise type and create it
    console.log(`Creating new exercise: ${exerciseName}`);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const typePrompt = `Determine if this exercise is static (timed/isometric) or dynamic (rep-based):

Exercise: "${exerciseName}"

Rules:
- Static exercises: planks, wall sits, wall holds, isometric holds, time-based exercises
- Dynamic exercises: push-ups, pull-ups, squats, lunges, any rep-based movement

Respond with only "static" or "dynamic".`;

    const result = await model.generateContent(typePrompt);
    const response = await result.response;
    let exerciseType = response.text().trim().toLowerCase();

    if (exerciseType !== "static" && exerciseType !== "dynamic") {
      console.warn(
        `Unexpected exercise type: ${exerciseType}, defaulting to dynamic`
      );
      exerciseType = "dynamic";
    }

    // Create new exercise in database
    const { data: newExercise, error: createError } = await supabase
      .from("exercises")
      .insert({
        name: exerciseName,
        description: `Auto-generated exercise: ${exerciseName}`,
        type: exerciseType,
      })
      .select("exercise_id, type")
      .single();

    if (createError) {
      console.error("Error creating exercise:", createError);
      throw createError;
    }

    console.log(`Created new exercise: ${exerciseName} (${exerciseType})`);
    return {
      exercise_id: newExercise.exercise_id,
      type: newExercise.type as "static" | "dynamic",
    };
  } catch (error) {
    console.error("Error in matchOrCreateExercise:", error);
    // Fallback: return a default dynamic exercise
    return {
      exercise_id: "00000000-0000-0000-0000-000000000000", // Placeholder UUID
      type: "dynamic",
    };
  }
}

/**
 * Validate and transform plan data to ensure it matches our schema
 */
async function validateAndTransformPlanData(
  data: any,
  supabase: any,
  genAI: any
): Promise<any> {
  if (!data.name || typeof data.name !== "string") {
    throw new Error("Plan name is required");
  }

  if (!data.workouts || typeof data.workouts !== "object") {
    throw new Error("Workouts object is required");
  }

  if (!data.schedule || !Array.isArray(data.schedule)) {
    throw new Error("Schedule array is required");
  }

  // Validate schedule format
  for (let i = 0; i < data.schedule.length; i++) {
    if (!Array.isArray(data.schedule[i])) {
      throw new Error(`Schedule week ${i + 1} must be an array`);
    }
    if (data.schedule[i].length !== 7) {
      throw new Error(`Schedule week ${i + 1} must have exactly 7 days`);
    }
  }

  // Validate workouts
  const validatedWorkouts: any = {};

  for (const [letter, workout] of Object.entries(data.workouts)) {
    if (typeof workout !== "object" || !workout) {
      throw new Error(`Workout ${letter} must be an object`);
    }

    const w = workout as any;

    if (!w.name || typeof w.name !== "string") {
      throw new Error(`Workout ${letter} must have a name`);
    }

    if (!Array.isArray(w.exercises)) {
      throw new Error(`Workout ${letter} must have an exercises array`);
    }

    // Validate exercises
    const validatedExercises = await Promise.all(
      w.exercises.map(async (ex: any, index: number) => {
        if (!ex.exercise_name || typeof ex.exercise_name !== "string") {
          throw new Error(
            `Exercise ${index + 1} in workout ${letter} must have a name`
          );
        }

        // Match or create exercise in database
        const exerciseMatch = await matchOrCreateExercise(
          ex.exercise_name,
          supabase,
          genAI
        );

        const exercise: any = {
          exercise_id: exerciseMatch.exercise_id,
          exercise_name: ex.exercise_name,
          sets: Number(ex.sets) || 3,
          rest_seconds: Number(ex.rest_seconds) || 60,
        };

        // Handle reps vs duration based on exercise type
        if (exerciseMatch.type === "static") {
          // Static exercise: use duration, not reps
          exercise.duration = Number(ex.duration) || 30; // Default 30 seconds
          exercise.reps = null;
        } else {
          // Dynamic exercise: use reps, not duration
          exercise.reps = Number(ex.reps) || 10;
          exercise.duration = null;
        }

        // Include superset_group if present
        if (ex.superset_group) {
          exercise.superset_group = String(ex.superset_group);
        }

        // Include unilateral fields if present
        if (ex.unilateral_type) {
          exercise.unilateral_type = String(ex.unilateral_type);
        }
        if (ex.alternating !== undefined) {
          exercise.alternating = Boolean(ex.alternating);
        }

        return exercise;
      })
    );

    validatedWorkouts[letter.toUpperCase()] = {
      name: w.name,
      exercises: validatedExercises,
    };
  }

  return {
    name: data.name,
    description: data.description || "",
    num_weeks: Number(data.num_weeks) || 2,
    workouts: validatedWorkouts,
    schedule: data.schedule,
  };
}
