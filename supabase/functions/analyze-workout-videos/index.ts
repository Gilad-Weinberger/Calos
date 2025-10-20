// Follow this setup guide to integrate the Deno runtime into your Supabase Edge Functions:
// https://supabase.com/docs/guides/functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

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

    const { videoUrls } = requestBody as VideoAnalysisRequest;

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

    for (const videoUrl of videoUrls) {
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
        const prompt = `Analyze this workout video and provide a JSON response with the following structure:
{
  "exercise_name": "name of the exercise (e.g., Push-ups, Plank, Squats)",
  "exercise_type": "dynamic" or "static",
  "reps_or_duration": number (reps for dynamic exercises, seconds for static exercises),
  "confidence": number between 0-1
}

For dynamic exercises (push-ups, squats, pull-ups, etc.), count the number of repetitions performed.
For static exercises (plank, wall sit, etc.), measure the duration in seconds.
Be as accurate as possible. Only respond with valid JSON.`;

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
