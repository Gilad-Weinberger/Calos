import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { pdfUrl, aiNotes } = await req.json();

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
          "reps": target reps per set (if there is a range, use the higher number),
          "rest_seconds": rest time in seconds between sets (default to 60 if not specified),
          "superset_group": "optional identifier for superset grouping (e.g., '1', '2', etc.)"
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

SUPERSET DETECTION:
9. Look for exercises grouped as "supersets", "superseries", "SS", or similar terms in ANY language
10. Exercises in a superset should be assigned the same superset_group identifier (use "1", "2", "3", etc.)
11. Supersets typically have 2 exercises but can have more (default to 2, but detect more if specified)
12. Exercises in the same superset MUST have the same number of sets, but CAN have different rep amounts
13. Example: Superset with 3 sets of 8 pull-ups + 3 sets of 10 push-ups is valid
14. Only assign superset_group if exercises are explicitly marked as supersets in the PDF
15. Regular exercises (not in supersets) should NOT have a superset_group field`;

    // Add user-provided AI notes if present
    if (aiNotes && aiNotes.trim()) {
      prompt += `\n\nADDITIONAL USER INSTRUCTIONS:\n${aiNotes.trim()}\n\nFollow these additional instructions carefully when analyzing the PDF.`;
    }

    prompt += `\n\nReturn ONLY the JSON object, no additional text or explanation.`;

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
    const validatedData = validateAndTransformPlanData(parsedData);

    return new Response(JSON.stringify(validatedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-workout-plan:", error);
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
 * Validate and transform plan data to ensure it matches our schema
 */
function validateAndTransformPlanData(data: any): any {
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
    const validatedExercises = w.exercises.map((ex: any, index: number) => {
      if (!ex.exercise_name || typeof ex.exercise_name !== "string") {
        throw new Error(
          `Exercise ${index + 1} in workout ${letter} must have a name`
        );
      }

      const exercise: any = {
        exercise_name: ex.exercise_name,
        sets: Number(ex.sets) || 3,
        reps: Number(ex.reps) || 10,
        rest_seconds: Number(ex.rest_seconds) || 60,
      };

      // Include superset_group if present
      if (ex.superset_group) {
        exercise.superset_group = String(ex.superset_group);
      }

      return exercise;
    });

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
