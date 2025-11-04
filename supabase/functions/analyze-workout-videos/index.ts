// Follow this setup guide to integrate the Deno runtime into your Supabase Edge Functions:
// https://supabase.com/docs/guides/functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";
import { PostHog } from "npm:posthog-node@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Maximum video size allowed (20MB for compressed videos - Gemini API limit)
const MAX_VIDEO_SIZE_BYTES = 20 * 1024 * 1024;

interface VideoAnalysisRequest {
  videoUrls: string[];
}

interface GeminiAnalysisResult {
  exercise_name: string;
  exercise_type: "dynamic" | "static";
  reps_or_duration: number;
  confidence: number;
}

interface GroupedExercise {
  exercise_id: string;
  exercise_name: string;
  exercise_type: "static" | "dynamic";
  video_urls: string[];
  reps: number[];
  confidence: number;
  sets: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("=== Edge Function Invoked ===");
  console.log("Method:", req.method);
  console.log("Headers:", Object.fromEntries(req.headers.entries()));

  // Initialize PostHog
  const posthogApiKey = Deno.env.get("POSTHOG_API_KEY");
  const posthogHost =
    Deno.env.get("POSTHOG_HOST") || "https://us.i.posthog.com";
  let posthog: PostHog | null = null;

  if (posthogApiKey) {
    posthog = new PostHog(posthogApiKey, { host: posthogHost });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    console.log("Environment check:");
    console.log("- SUPABASE_URL:", supabaseUrl ? "✓ Set" : "✗ Missing");
    console.log(
      "- SUPABASE_SERVICE_ROLE_KEY:",
      supabaseServiceKey ? "✓ Set" : "✗ Missing"
    );
    console.log("- GEMINI_API_KEY:", geminiApiKey ? "✓ Set" : "✗ Missing");

    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY is not configured",
          error_code: "MISSING_API_KEY",
          details:
            "Please set the GEMINI_API_KEY secret using: supabase secrets set GEMINI_API_KEY=your_key",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase environment variables not set properly");
      return new Response(
        JSON.stringify({
          error: "Supabase configuration missing",
          error_code: "MISSING_SUPABASE_CONFIG",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client with service role key for storage access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body received:", JSON.stringify(requestBody));
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
          error_code: "INVALID_JSON",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { videoUrls, userId } = requestBody as VideoAnalysisRequest & {
      userId?: string;
    };

    if (!videoUrls || videoUrls.length === 0) {
      console.error("No video URLs provided in request");
      return new Response(
        JSON.stringify({
          error: "No video URLs provided",
          error_code: "NO_VIDEO_URLS",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing ${videoUrls.length} video(s)`);
    videoUrls.forEach((url, idx) => {
      console.log(`Video ${idx + 1}: ${url}`);
    });

    // Initialize Gemini AI
    console.log("Initializing Gemini AI...");
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    console.log("Gemini AI initialized successfully");

    // Analyze each video
    const analysisResults: {
      videoUrl: string;
      analysis: GeminiAnalysisResult;
    }[] = [];

    // Track analytics for each video
    const videoAnalytics: {
      videoIndex: number;
      latency: number;
      inputTokens: number;
      outputTokens: number;
      cost: number;
    }[] = [];

    for (let videoIndex = 0; videoIndex < videoUrls.length; videoIndex++) {
      const videoUrl = videoUrls[videoIndex];
      try {
        console.log(`\n--- Processing video: ${videoUrl} ---`);

        // Extract file path from URL
        const urlParts = videoUrl.split("/workout-videos/");
        if (urlParts.length !== 2) {
          console.error(`Invalid video URL format: ${videoUrl}`);
          console.error(
            "Expected format: https://.../storage/v1/object/public/workout-videos/{userId}/{filename}"
          );
          continue;
        }

        const filePath = urlParts[1];
        console.log(`Extracted file path: ${filePath}`);

        // Check file size before downloading to avoid memory issues
        const pathParts = filePath.split("/");
        const userId = pathParts[0];
        const fileName = pathParts[pathParts.length - 1];

        console.log(
          `Checking file size for userId: ${userId}, fileName: ${fileName}`
        );

        const { data: fileList, error: listError } = await supabase.storage
          .from("workout-videos")
          .list(userId, {
            search: fileName,
          });

        if (listError) {
          console.error(`Storage list error for ${filePath}:`, listError);
          console.error("Error details:", JSON.stringify(listError));
          continue;
        }

        if (!fileList || fileList.length === 0) {
          console.error(`No files found for path ${filePath}`);
          console.error(
            `Search params: userId=${userId}, fileName=${fileName}`
          );
          continue;
        }

        const fileInfo = fileList[0];
        const fileSize = fileInfo.metadata?.size || 0;

        console.log(
          `Video size: ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)} MB)`
        );

        if (fileSize > MAX_VIDEO_SIZE_BYTES) {
          console.error(
            `Video ${filePath} is too large: ${(fileSize / 1024 / 1024).toFixed(2)} MB (max: 20 MB after compression)`
          );
          continue;
        }

        // Download video from Supabase Storage
        console.log(`Downloading video from storage: ${filePath}`);
        const { data: videoData, error: downloadError } = await supabase.storage
          .from("workout-videos")
          .download(filePath);

        if (downloadError) {
          console.error(`Error downloading video ${filePath}:`, downloadError);
          console.error(
            "Download error details:",
            JSON.stringify(downloadError)
          );
          continue;
        }

        if (!videoData) {
          console.error(`No video data returned for ${filePath}`);
          continue;
        }

        console.log("Video downloaded successfully, converting to buffer...");

        // Convert blob to array buffer
        const arrayBuffer = await videoData.arrayBuffer();

        console.log(
          `Video buffer size: ${arrayBuffer.byteLength} bytes (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB)`
        );

        // Convert ArrayBuffer to base64 for inline data (per Gemini API docs)
        console.log("Converting video to base64...");
        const uint8Array = new Uint8Array(arrayBuffer);

        // Convert to base64 in chunks to avoid stack overflow
        let binaryString = "";
        const chunkSize = 8192; // Process 8KB at a time
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.subarray(i, i + chunkSize);
          binaryString += String.fromCharCode(...chunk);
        }
        const base64String = btoa(binaryString);
        console.log("Base64 conversion complete");

        // Create the prompt for analysis
        const prompt = `You are an expert calisthenics coach analyzing workout videos. Carefully identify the EXACT exercise being performed, including its specific VARIATION and PROGRESSION level.

VARIATIONS = Different ways to perform the same base movement (e.g., wide grip vs close grip, overhand vs underhand)
PROGRESSIONS = Easier to harder versions of movements (e.g., incline → standard → decline → one-arm)

Analyze this workout video and provide a JSON response with the following structure:
{
  "exercise_name": "exact name of the exercise variation/progression",
  "exercise_type": "dynamic" or "static",
  "reps_or_duration": number (reps for dynamic exercises, seconds for static exercises),
  "confidence": number between 0-1
}

CRITICAL RULE - STATIC vs DYNAMIC:
- STATIC = Holding a single position without movement (measure in SECONDS). The person stays in one position.
- DYNAMIC = Repeated movements through a range of motion (count REPS). The person moves up and down or back and forth.

** WATCH THE ENTIRE VIDEO: If you see ANY repetitive movement (going up/down, in/out), it is DYNAMIC, NOT static! **

⚠️ IMPORTANT - SETUP vs ACTUAL EXERCISE:
Many exercises start AFTER an initial setup/transition period. Do NOT count setup movements:
- L-sit: Raising legs into L position = SETUP (ignore). Holding L position = ACTUAL EXERCISE (count seconds)
- Front Lever: Pulling body up into horizontal = SETUP (ignore). Holding horizontal = ACTUAL EXERCISE (count seconds)  
- Plank: Getting down into plank position = SETUP (ignore). Holding plank = ACTUAL EXERCISE (count seconds)
- Handstand: Kicking up into position = SETUP (ignore). Holding inverted = ACTUAL EXERCISE (count seconds)
- For STATIC: Start counting seconds ONLY when person is stable in the final position
- For DYNAMIC: Count ONLY complete repetitions (ignore initial positioning)

CRITICAL: Identify the SPECIFIC exercise variation AND progression level, not just the base movement. Consider:

HANDSTAND VARIATIONS & PROGRESSIONS (CRITICAL - distinguish static holds from push-ups):
==================================================================================
⚠️ MOST IMPORTANT: Check if person is MOVING or HOLDING STILL!

STATIC HANDSTANDS (just holding position - NO up/down movement):
- "Back to Wall Handstand" - holding inverted position with back to wall, NO bending arms
- "Chest to Wall Handstand" - holding inverted position facing wall, NO bending arms  
- "Freestanding Handstand" - holding handstand without wall, NO bending arms
- If seeing NO arm bending/no movement = STATIC, measure hold time in SECONDS

DYNAMIC HANDSTAND PUSH-UPS (bending arms up and down - REPETITIVE movement):
- "Back to Wall Handstand Push-ups" - doing push-ups in handstand with back to wall
- "Chest to Wall Handstand Push-ups" - doing push-ups in handstand facing wall
- "Freestanding Handstand Push-ups" - push-ups in handstand without wall support
- "Handstand Push-ups" - general term if wall position unclear
- If seeing arms BENDING and EXTENDING repeatedly = DYNAMIC, count REPS

OTHER HANDSTAND EXERCISES:
- "Pike Push-ups" - NOT inverted, hips high with feet on ground (looks like inverted V)
- "Elevated Pike Push-ups" - pike push-ups with feet elevated on box/chair

PUSH-UP VARIATIONS & PROGRESSIONS (identify hand position, body angle, and arm position):
- "Incline Push-ups" - hands elevated (easier)
- "Standard Push-ups" or "Push-ups" - standard position
- "Wide Push-ups" - hands wider than shoulders
- "Diamond Push-ups" - hands forming diamond
- "Decline Push-ups" - feet elevated (harder)
- "Pike Push-ups" - hips high, targeting shoulders
- "Elevated Pike Push-ups" - pike with feet elevated
- PROGRESSIONS: "Incline" → "Standard" → "Decline" → "Archer" → "One-Arm" (easier to harder)
- VARIATIONS: "Wide" vs "Diamond" vs "Archer" vs "Typewriter" (different styles)
- "Pseudo Planche Push-ups" - hands by hips, leaning forward (advanced progression)
- "One-Arm Push-ups" - only one arm pushing (hardest progression)

PULL-UP VARIATIONS & PROGRESSIONS (check grip, width, and technique):
- PROGRESSIONS: "Assisted" → "Pull-ups" → "Archer" → "One-Arm" (easier to harder)
- VARIATIONS - Grip: "Pull-ups" (overhand) vs "Chin-ups" (underhand) vs "Commando" (parallel)
- VARIATIONS - Width: "Wide Grip" vs "Close Grip" vs standard
- "L-sit Pull-ups" - legs held in L position (harder variation)
- "One-Arm Pull-ups" - pulling with one arm (hardest progression)
- "Muscle-up" vs "Strict Muscle-up" vs "Slow Muscle-up" - transition over bar (advanced)

DIP VARIATIONS & PROGRESSIONS:
- PROGRESSIONS: "Bench Dips" → "Assisted" → "Parallel Bar Dips" → "Ring Dips" (easier to harder)
- VARIATIONS: "Parallel Bar" vs "Ring Dips" (stability difference) vs "Korean Dips" (hand position)
- "Weighted Dips" - with added weight (advanced progression)

SQUAT VARIATIONS & PROGRESSIONS:
- PROGRESSIONS: "Bodyweight Squats" → "Bulgarian Split" → "Pistol Squats" (easier to harder)
- VARIATIONS: "Jump Squats" (explosive) vs "Sissy Squats" (knee-forward) vs "Cossack Squats" (lateral)
- "Shrimp Squats" - single leg with rear leg bent behind (alternative single-leg progression)

CORE EXERCISES - VARIATIONS & PROGRESSIONS (distinguish static holds from dynamic):
- STATIC (NO movement - hold position): "Plank", "L-sit", "V-sit" - person holds still, measure SECONDS
- DYNAMIC (repetitive movement): "Knee Raises", "Leg Raises", "Sit-ups", "Crunches" - person moves repeatedly, count REPS
- PROGRESSIONS (Static): "Plank" → "Extended Plank" or "Tuck L-sit" → "L-sit" → "V-sit"
- PROGRESSIONS (Dynamic): "Knee Raises" → "Hanging Knee Raises" → "Hanging Leg Raises" → "Toes to Bar" → "Dragon Flags"
- VARIATIONS: "Plank" vs "Forearm Plank" vs "Side Plank" (different positions, all STATIC)
- "L-sit" variations: on floor vs parallettes vs hanging (all STATIC holds)

STATIC HOLDS - VARIATIONS & PROGRESSIONS (NO movement - measure time in SECONDS):
⚠️ These exercises have NO repetitive movement - person just holds position!
⚠️ IGNORE setup movements (getting into position) - count ONLY the stable hold time!

- PROGRESSIONS: "Dead Hang" → "Plank" → "L-sit" → "Handstand" → "Front Lever" → "Planche" (difficulty order)
- "Dead Hang" - hanging from bar without moving, measure SECONDS (ignore jump up to bar)
- Any "Plank" variation - holding plank position without moving, measure SECONDS (ignore getting down into plank)
- "L-sit" variations - holding L position without moving, measure SECONDS (ignore raising legs to get into L)
- "Handstand" variations (NO push-ups) - holding inverted position, measure SECONDS (ignore kick-up into handstand)
- "Front Lever" or "Back Lever" - holding horizontal on bar, measure SECONDS (ignore pull-up into lever position)
- "Human Flag" - holding horizontal on vertical pole, measure SECONDS (ignore climbing into position)
- "Wall Sits" - holding squat against wall, measure SECONDS (ignore sliding down into position)

ROW VARIATIONS & PROGRESSIONS:
- PROGRESSIONS: "Incline Rows" → "Horizontal Rows" → "Archer Rows" → "One-Arm Rows" (easier to harder)
- VARIATIONS: "Wide Grip" vs "Close Grip" vs standard grip width
- "Australian Pull-ups" - alternative name for horizontal rows

ADVANCED STATIC SKILLS - VARIATIONS & PROGRESSIONS:
- PLANCHE PROGRESSIONS: "Frog Stand" → "Planche Lean" → "Tuck Planche" → "Advanced Tuck" → "Straddle Planche" → "Full Planche"
- FRONT LEVER PROGRESSIONS: "Tuck Front Lever" → "Advanced Tuck" → "One-Leg" → "Straddle Front Lever" → "Full Front Lever"
- Identify LEG POSITION: Tuck (knees to chest) vs Straddle (legs wide apart) vs Full (legs together straight)
- "Back Lever" - lever on back side of bar
- "Human Flag" - body horizontal on vertical pole

IMPORTANT TIPS:
- WATCH THE ENTIRE VIDEO: Many exercises start AFTER an initial setup/transition period
- For STATIC exercises: Start counting ONLY when stable in final position (ignore setup movements like raising legs, pulling into position, kicking up, etc.)
- For DYNAMIC exercises: Count ONLY complete repetitions (ignore initial positioning)
- WATCH CAREFULLY: Is the person MOVING repeatedly or HOLDING STILL (after setup)?
- For DYNAMIC exercises: Count each complete repetition carefully (full range of motion). Example: arms bending and extending = reps
- For STATIC exercises: Measure the total hold time in seconds AFTER getting into position. Example: holding position without movement = seconds
- Always identify both the BASE MOVEMENT and the SPECIFIC VARIATION/PROGRESSION
- Example: Don't say "push-ups" if you see "archer push-ups" or "diamond push-ups"
- Example: Don't say "handstand" if you see "back to wall handstand" vs "freestanding handstand"

⚠️ COMMON MISTAKES TO AVOID:
- "Back to Wall Handstand Push-ups" (DYNAMIC - arms bending) ≠ "Back to Wall Handstand" (STATIC - just holding)
- "Plank" (STATIC - holding position) ≠ "Push-ups" (DYNAMIC - moving up and down)
- "L-sit" (STATIC - holding L) ≠ "Leg Raises" (DYNAMIC - legs moving up and down)
- "Dead Hang" (STATIC - just hanging) ≠ "Pull-ups" (DYNAMIC - pulling up and down)
- DON'T count setup movements: If person raises legs into L-sit then holds = measure the HOLD time only, not the leg raise

Return ONLY valid JSON. Use the most specific exercise name that matches what you see.`;

        // Track start time for latency measurement
        const startTime = Date.now();

        // Generate content with video using inline data (official Gemini API format)
        console.log(
          "Calling Gemini API for video analysis with inline data..."
        );
        let result;
        try {
          result = await model.generateContent([
            {
              inlineData: {
                mimeType: "video/mp4",
                data: base64String,
              },
            },
            { text: prompt },
          ]);
        } catch (geminiError) {
          console.error("Gemini API call failed:", geminiError);
          console.error(
            "Gemini error details:",
            geminiError instanceof Error
              ? geminiError.message
              : String(geminiError)
          );
          throw geminiError;
        }

        console.log("Gemini API call successful, parsing response...");
        const response = await result.response;
        const text = response.text();
        console.log(`Gemini response for ${videoUrl}:`, text);

        // Calculate latency and extract usage metadata
        const latency = (Date.now() - startTime) / 1000;
        const usageMetadata = response.usageMetadata || {};
        const inputTokens = usageMetadata.promptTokenCount || 0;
        const outputTokens = usageMetadata.candidatesTokenCount || 0;

        // Calculate cost based on Gemini 2.5 Flash pricing
        const inputCost = (inputTokens / 1000000) * 0.075;
        const outputCost = (outputTokens / 1000000) * 0.3;
        const totalCost = inputCost + outputCost;

        // Store analytics for this video
        videoAnalytics.push({
          videoIndex,
          latency,
          inputTokens,
          outputTokens,
          cost: totalCost,
        });

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error("Could not extract JSON from Gemini response");
          console.error("Full response text:", text);
          continue;
        }

        let analysis;
        try {
          analysis = JSON.parse(jsonMatch[0]) as GeminiAnalysisResult;
          console.log("Parsed analysis:", JSON.stringify(analysis));
        } catch (parseError) {
          console.error("Failed to parse JSON:", parseError);
          console.error("JSON string:", jsonMatch[0]);
          continue;
        }

        analysisResults.push({
          videoUrl,
          analysis,
        });
        console.log(`✓ Successfully analyzed video ${videoUrl}`);
      } catch (error) {
        console.error(`Error analyzing video ${videoUrl}:`, error);
        if (error instanceof Error) {
          console.error("Error stack:", error.stack);
        }
        // Continue with next video
      }
    }

    console.log(
      `\n=== Analysis Complete: ${analysisResults.length}/${videoUrls.length} videos processed ===`
    );

    if (analysisResults.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Failed to analyze any videos",
          error_code: "NO_ANALYSIS_RESULTS",
          details:
            "All videos failed to process. Check that videos are valid, under 20MB after compression, and in MP4 format.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get all exercises from database to match detected exercises
    console.log("\n--- Fetching exercises from database ---");
    const { data: exercises, error: exercisesError } = await supabase
      .from("exercises")
      .select("exercise_id, name, type");

    if (exercisesError) {
      console.error("Error fetching exercises from database:", exercisesError);
      console.error("Exercise error details:", JSON.stringify(exercisesError));
      throw exercisesError;
    }

    console.log(`Found ${exercises?.length || 0} exercises in database`);

    // Group videos by detected exercise
    console.log("\n--- Matching detected exercises to database ---");
    const exerciseGroups = new Map<string, GroupedExercise>();

    for (const { videoUrl, analysis } of analysisResults) {
      console.log(
        `Matching detected exercise: "${analysis.exercise_name}" (type: ${analysis.exercise_type})`
      );

      // Find matching exercise in database (case-insensitive)
      const matchedExercise = exercises?.find(
        (ex) =>
          ex.name
            .toLowerCase()
            .includes(analysis.exercise_name.toLowerCase()) ||
          analysis.exercise_name.toLowerCase().includes(ex.name.toLowerCase())
      );

      if (!matchedExercise) {
        console.log(
          `⚠ No matching exercise found in database for: "${analysis.exercise_name}"`
        );
        console.log(
          "Available exercises:",
          exercises?.map((e) => e.name).join(", ")
        );
        continue;
      }

      console.log(
        `✓ Matched to database exercise: "${matchedExercise.name}" (ID: ${matchedExercise.exercise_id})`
      );

      const key = matchedExercise.exercise_id;

      if (!exerciseGroups.has(key)) {
        exerciseGroups.set(key, {
          exercise_id: matchedExercise.exercise_id,
          exercise_name: matchedExercise.name,
          exercise_type: matchedExercise.type,
          video_urls: [],
          reps: [],
          confidence: 0,
          sets: 0,
        });
      }

      const group = exerciseGroups.get(key)!;
      group.video_urls.push(videoUrl);
      group.reps.push(Math.round(analysis.reps_or_duration));
      group.confidence = Math.max(group.confidence, analysis.confidence);
      group.sets = group.video_urls.length;
    }

    // Convert map to array
    const results = Array.from(exerciseGroups.values());

    console.log(
      `\n=== Success: Returning ${results.length} grouped exercise(s) ===`
    );
    results.forEach((result, idx) => {
      console.log(
        `${idx + 1}. ${result.exercise_name}: ${result.sets} set(s), reps: [${result.reps.join(", ")}]`
      );
    });

    // Capture PostHog analytics events for each video
    if (posthog && videoAnalytics.length > 0) {
      try {
        for (const analytics of videoAnalytics) {
          posthog.capture({
            distinctId: userId || "anonymous",
            event: "$ai_generation",
            properties: {
              $ai_model: "gemini-2.5-flash",
              $ai_latency: analytics.latency,
              $ai_input_tokens: analytics.inputTokens,
              $ai_output_tokens: analytics.outputTokens,
              $ai_total_cost_usd: analytics.cost,
              analysis_type: "video_workout",
              video_index: analytics.videoIndex,
              total_videos: videoUrls.length,
              total_exercises_detected: results.length,
            },
          });
        }
        await posthog.shutdown();
      } catch (phError) {
        console.error("PostHog error:", phError);
        // Don't fail the request if PostHog fails
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("\n=== FATAL ERROR in analyze-workout-videos function ===");
    console.error("Error type:", error?.constructor?.name);
    console.error(
      "Error message:",
      error instanceof Error ? error.message : String(error)
    );
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    console.error("Full error object:", JSON.stringify(error, null, 2));

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
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        error_code: "FUNCTION_ERROR",
        details: error instanceof Error ? error.stack : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
