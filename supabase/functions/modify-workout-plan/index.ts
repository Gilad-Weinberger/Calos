import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PostHog } from "npm:posthog-node@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Plan {
  plan_id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  plan_type: "repeat" | "once";
  num_weeks: number;
  workouts: WorkoutDefinitions;
  schedule: string[][];
  start_date: string;
  created_at: string;
  updated_at: string;
}

interface WorkoutDefinitions {
  [key: string]: WorkoutDefinition;
}

interface WorkoutDefinition {
  name: string;
  exercises: ExerciseDefinition[];
}

interface ExerciseDefinition {
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps?: number;
  duration?: number;
  rest_seconds: number;
  superset_group?: string;
  unilateral_type?: string;
  alternating?: boolean;
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
    const { currentPlan, userPrompt, userId } = await req.json();

    if (!currentPlan) {
      return new Response(
        JSON.stringify({ error: "currentPlan is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!userPrompt || typeof userPrompt !== "string") {
      return new Response(JSON.stringify({ error: "userPrompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const plan = currentPlan as Plan;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build modification prompt
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const prompt = `You are an expert workout plan modifier. A user has requested changes to their existing workout plan. Analyze the current plan and apply the requested modifications.

CURRENT PLAN:
- Plan Name: ${plan.name}
- Plan Type: ${plan.plan_type} ${
      plan.plan_type === "repeat"
        ? "(recurring plan - repeats every cycle)"
        : "(one-time plan - runs once and ends)"
    }
- Number of Weeks: ${plan.num_weeks}
- Start Date: ${plan.start_date}

CURRENT WORKOUTS:
${JSON.stringify(plan.workouts, null, 2)}

CURRENT SCHEDULE:
${plan.schedule
  .map(
    (week, idx) =>
      `Week ${idx + 1}: ${week
        .map((day, dayIdx) => `${dayNames[dayIdx]}=${day}`)
        .join(", ")}`
  )
  .join("\n")}

USER'S MODIFICATION REQUEST:
"${userPrompt}"

MODIFICATION RULES:
1. Apply ONLY the changes requested by the user
2. Preserve all unchanged aspects of the plan
3. DO NOT change plan_type (must remain "${plan.plan_type}")
4. ${
      plan.plan_type === "repeat"
        ? "DO NOT change num_weeks, even if requested (recurring plans have fixed cycle length)"
        : "You CAN change num_weeks, only if requested (one-time plans are flexible)"
    }
5. If adding/modifying exercises, ensure they are appropriate for the plan
6. If changing schedule, maintain 7 days per week (Sunday to Saturday)
7. Use "rest" for rest days (lowercase)
8. Use uppercase letters for workout references (A, B, C, etc.)
9. For static exercises (planks, holds): include ONLY "duration" in seconds
10. For dynamic exercises (push-ups, pull-ups): include ONLY "reps"
11. If the request is unclear or impossible, make reasonable assumptions

OUTPUT FORMAT (JSON only, no additional text):
{
  "workouts": {
    // Include ALL workouts (modified and unmodified)
    // Same structure as current plan
  },
  "schedule": [
    // Include ALL weeks
    // Each week has exactly 7 days
  ],
  "num_weeks": ${plan.num_weeks}, // ${
    plan.plan_type === "once" ? "Can be changed if requested" : "DO NOT CHANGE"
  }
  "start_date": "${plan.start_date}" // Can be changed if requested
}

EXAMPLES OF MODIFICATIONS:
- "Add more leg exercises" → Add exercises like squats, lunges to relevant workouts
- "Change to Mon/Wed/Fri schedule" → Rearrange schedule to workout on those days
- "Make it 6 weeks instead" → ${
      plan.plan_type === "once"
        ? "Extend schedule to 6 weeks"
        : "NOT ALLOWED for repeat plans"
    }
- "Remove pull-ups" → Remove pull-up exercises from all workouts
- "Start next Monday" → Update start_date to next Monday's date

Return ONLY the JSON object with the modified plan data, no additional text or explanation.`;

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

    // Log the parsed data for debugging
    console.log("Parsed AI response:", JSON.stringify(parsedData, null, 2));

    // Validate that plan_type wasn't changed
    if (
      plan.plan_type === "repeat" &&
      parsedData.num_weeks !== plan.num_weeks
    ) {
      console.warn(
        "AI attempted to change num_weeks for repeat plan, reverting to original"
      );
      parsedData.num_weeks = plan.num_weeks;
    }

    // Ensure schedule exists and has proper structure
    if (!parsedData.schedule) {
      console.warn(
        "AI response missing schedule, using original plan schedule"
      );
      parsedData.schedule = plan.schedule;
    }

    // Ensure all schedule weeks are arrays
    if (Array.isArray(parsedData.schedule)) {
      parsedData.schedule = parsedData.schedule.map(
        (week: any, idx: number) => {
          if (!Array.isArray(week)) {
            console.warn(
              `Schedule week ${idx + 1} is not an array, attempting to fix`
            );
            // Try to convert to array if it's an object or string
            if (typeof week === "object" && week !== null) {
              // If it's an object, try to extract values
              const weekArray = Object.values(week);
              if (weekArray.length === 7) {
                return weekArray;
              }
            }
            // Fallback to original plan's week if available
            if (plan.schedule && plan.schedule[idx]) {
              console.warn(`Using original plan's week ${idx + 1}`);
              return plan.schedule[idx];
            }
            // Ultimate fallback: rest week
            console.warn(`Creating default rest week for week ${idx + 1}`);
            return ["rest", "rest", "rest", "rest", "rest", "rest", "rest"];
          }
          return week;
        }
      );
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
            generation_type: "ai_plan_modification",
            plan_type: plan.plan_type,
            num_workouts: Object.keys(validatedData.workouts || {}).length,
            num_weeks: validatedData.num_weeks,
            user_prompt_length: userPrompt.length,
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
    console.error("Error in modify-workout-plan:", error);

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
        error: error.message || "An error occurred during plan modification",
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
  if (!data.workouts || typeof data.workouts !== "object") {
    console.error("Validation error: workouts object missing or invalid", data);
    throw new Error("Workouts object is required");
  }

  if (!data.schedule || !Array.isArray(data.schedule)) {
    console.error("Validation error: schedule missing or not an array", data);
    throw new Error("Schedule array is required");
  }

  if (!data.num_weeks || typeof data.num_weeks !== "number") {
    console.error("Validation error: num_weeks missing or invalid", data);
    throw new Error("num_weeks is required");
  }

  // Validate schedule format
  for (let i = 0; i < data.schedule.length; i++) {
    if (!Array.isArray(data.schedule[i])) {
      console.error(
        `Validation error: Schedule week ${i + 1} is not an array`,
        {
          weekData: data.schedule[i],
          weekType: typeof data.schedule[i],
        }
      );
      throw new Error(`Schedule week ${i + 1} must be an array`);
    }
    if (data.schedule[i].length !== 7) {
      console.error(
        `Validation error: Schedule week ${i + 1} doesn't have 7 days`,
        {
          actualLength: data.schedule[i].length,
          weekData: data.schedule[i],
        }
      );
      throw new Error(`Schedule week ${i + 1} must have exactly 7 days`);
    }
  }

  // Validate schedule has correct number of weeks
  if (data.schedule.length !== data.num_weeks) {
    console.error("Validation error: schedule length mismatch", {
      expected: data.num_weeks,
      actual: data.schedule.length,
    });
    throw new Error(
      `Schedule must have ${data.num_weeks} weeks, but has ${data.schedule.length}`
    );
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
    workouts: validatedWorkouts,
    schedule: data.schedule,
    num_weeks: Number(data.num_weeks),
    start_date: data.start_date,
  };
}
