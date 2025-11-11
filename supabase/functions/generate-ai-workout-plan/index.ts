import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PostHog } from "npm:posthog-node@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FormData {
  planTarget: "calisthenics" | "specific_exercise" | null;
  specificExercise: string;
  maxReps: {
    pushups: number;
    pullups: number;
    dips: number;
    squats: number;
  };
  age: number | null;
  height: number | null;
  heightUnit: "cm" | "ft";
  weight: number | null;
  weightUnit: "kg" | "lbs";
  activityLevel: "beginner" | "intermediate" | "advanced" | null;
  currentWorkoutDays: number | null;
  workoutsPerWeek: number | null;
  availableDays: number[]; // Array of day indices (0=Sunday, 6=Saturday)
  startDate: string | null; // ISO date string
}

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
    const { formData, userId } = await req.json();

    if (!formData) {
      return new Response(JSON.stringify({ error: "formData is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = formData as FormData;

    // Validate required fields
    if (!data.planTarget) {
      return new Response(
        JSON.stringify({ error: "Plan target is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!data.activityLevel) {
      return new Response(
        JSON.stringify({ error: "Activity level is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (data.height === null || data.height <= 0) {
      return new Response(JSON.stringify({ error: "Height is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!data.weight || data.weight <= 0) {
      return new Response(JSON.stringify({ error: "Weight is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (
      data.currentWorkoutDays === null ||
      data.currentWorkoutDays < 0 ||
      data.currentWorkoutDays > 7
    ) {
      return new Response(
        JSON.stringify({
          error: "Current workout days must be between 0 and 7",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!data.workoutsPerWeek || data.workoutsPerWeek < 1) {
      return new Response(
        JSON.stringify({ error: "Workouts per week is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (
      !data.availableDays ||
      data.availableDays.length < data.workoutsPerWeek
    ) {
      return new Response(
        JSON.stringify({
          error: "Available days must be at least equal to workouts per week",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build master prompt
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const availableDaysNames = data.availableDays
      .sort((a, b) => a - b)
      .map((dayIndex) => dayNames[dayIndex])
      .join(", ");

    let prompt = `You are an expert calisthenics trainer creating a personalized workout plan. Generate a complete workout plan based on the following user information:

USER INFORMATION:
- Goal: ${
      data.planTarget === "calisthenics"
        ? "Start calisthenics journey"
        : `Learn specific exercise: ${data.specificExercise}`
    }
- Current Max Reps:
  * Push-ups: ${data.maxReps.pushups}
  * Pull-ups: ${data.maxReps.pullups}
  * Dips: ${data.maxReps.dips}
  * Squats: ${data.maxReps.squats}
- Age: ${data.age || "Not specified"}
- Height: ${data.height} ${data.heightUnit}
- Weight: ${data.weight || "Not specified"} ${data.weightUnit}
- Activity Level: ${data.activityLevel}
- Current Weekly Training Frequency: ${data.currentWorkoutDays} day${
      data.currentWorkoutDays === 1 ? "" : "s"
    }
- Desired Workouts Per Week: ${data.workoutsPerWeek}
- Available Days: ${availableDaysNames}
- Start Date: ${data.startDate || "Not specified"}

REQUIREMENTS:
1. Create a progressive workout plan suitable for the user's activity level
2. Plan should be ${data.planTarget === "calisthenics" ? "a comprehensive calisthenics program" : `focused on learning ${data.specificExercise}`}
3. Number of weeks: 4-6 weeks (choose based on user's goals and level)
4. Create ${data.workoutsPerWeek} different workouts (labeled A, B, C, etc.)
5. Schedule workouts only on available days: ${availableDaysNames}
6. Use rest days for non-available days
7. Exercises should be appropriate for the user's current max reps
8. Respect the user's current training frequency (${data.currentWorkoutDays} day${
      data.currentWorkoutDays === 1 ? "" : "s"
    }) when progressing
9. Include progressive overload (gradually increase difficulty over weeks)
10. For beginners, start easier and progress slowly
11. For intermediate/advanced, include more challenging variations

OUTPUT FORMAT (JSON only, no additional text):
{
  "name": "Plan name (e.g., '4-Week Calisthenics Beginner Program' or 'Handstand Mastery Plan')",
  "description": "Brief description of the plan and its goals",
  "num_weeks": number of weeks (4-6),
  "workouts": {
    "A": {
      "name": "Workout A name (e.g., 'Upper Body Strength', 'Push Focus')",
      "exercises": [
        {
          "exercise_name": "Exercise name (use common names like 'Push-ups', 'Pull-ups', 'Dips', 'Squats', etc.)",
          "sets": number of sets,
          "reps": target reps per set (ONLY for dynamic exercises - omit if static),
          "duration": duration in seconds per set (ONLY for static exercises - omit if dynamic),
          "rest_seconds": rest time in seconds between sets (default 60),
          "superset_group": "optional identifier for superset grouping (e.g., '1', '2')",
          "unilateral_type": "optional type for unilateral exercises ('single_arm', 'single_leg', etc.)",
          "alternating": "optional boolean: true if alternating per set, false if grouped by side"
        }
      ]
    },
    "B": { similar structure },
    "C": { similar structure if needed }
  },
  "schedule": [
    ["A", "rest", "B", "rest", "A", "rest", "rest"],  // Week 1 (Sunday to Saturday)
    ["B", "rest", "A", "rest", "B", "rest", "rest"]   // Week 2
  ]
}

CRITICAL RULES:
1. Workout letters must be uppercase (A, B, C, etc.)
2. Rest days must be lowercase "rest"
3. Each week in schedule must have exactly 7 days (Sunday=index 0, Saturday=index 6)
4. Schedule workouts ONLY on available days: ${availableDaysNames}
5. Use "rest" for all non-available days
6. Exercise names must match common calisthenics exercises (e.g., "Push-ups", "Pull-ups", "Dips", "Squats", "Planks", "Wall Sits", etc.)
7. For static exercises (planks, wall sits, isometric holds): include ONLY "duration" field, DO NOT include "reps"
8. For dynamic exercises (push-ups, pull-ups, squats): include ONLY "reps" field, DO NOT include "duration"
9. Each exercise must have exactly ONE of these fields (reps OR duration) - never both, never neither
10. Start with exercises appropriate for the user's current max reps
11. Progress difficulty over weeks (increase reps, add variations, etc.)
12. Number of workouts should match workoutsPerWeek (${data.workoutsPerWeek})
13. Distribute workouts evenly across available days
14. Ensure proper rest between workout days

EXERCISE SELECTION GUIDELINES:
- If user can do 0-5 push-ups: Start with knee push-ups or wall push-ups
- If user can do 6-15 push-ups: Use regular push-ups, progress to diamond or decline
- If user can do 16+ push-ups: Include advanced variations (archer, one-arm prep, etc.)
- Similar progression for pull-ups, dips, and squats
- Include core exercises (planks, leg raises, etc.)
- Include flexibility/mobility work if appropriate

Return ONLY the JSON object, no additional text or explanation.`;

    // Track start time for latency measurement
    const startTime = Date.now();

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Calculate latency in seconds
    const latency = (Date.now() - startTime) / 1000;

    // Extract usage metadata from Gemini response
    const usageMetadata = response.usageMetadata || {};
    const inputTokens = usageMetadata.promptTokenCount || 0;
    const outputTokens = usageMetadata.candidatesTokenCount || 0;

    // Calculate cost based on Gemini 2.5 Flash pricing
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
            generation_type: "ai_workout_plan",
            activity_level: data.activityLevel,
            workouts_per_week: data.workoutsPerWeek,
            num_workouts: Object.keys(validatedData.workouts || {}).length,
            num_weeks: validatedData.num_weeks,
          },
        });
        await posthog.shutdown();
      } catch (phError) {
        console.error("PostHog error:", phError);
      }
    }

    return new Response(JSON.stringify(validatedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-ai-workout-plan:", error);

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
        error: error.message || "An error occurred during plan generation",
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
          exercise.reps = undefined;
        } else {
          // Dynamic exercise: use reps, not duration
          exercise.reps = Number(ex.reps) || 10;
          exercise.duration = undefined;
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
    num_weeks: Number(data.num_weeks) || 4,
    workouts: validatedWorkouts,
    schedule: data.schedule,
  };
}
