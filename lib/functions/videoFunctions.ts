import { File } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "../utils/supabase";

export interface VideoAnalysisResult {
  exercise_id: string;
  exercise_name: string;
  exercise_type: "static" | "dynamic";
  video_urls: string[];
  reps: number[];
  confidence: number;
  sets: number;
}

export interface GeminiAnalysisMetadata {
  detected_exercise_name: string;
  confidence: number;
  reps_or_duration: number;
  analyzed_at: string;
}

/**
 * Upload a workout video to Supabase Storage
 * @param userId - The user's ID
 * @param videoUri - Local URI of the video file
 * @returns Public URL of the uploaded video
 */
export const uploadWorkoutVideo = async (
  userId: string,
  videoUri: string
): Promise<string> => {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = videoUri.split(".").pop() || "mp4";
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;

    // Check if file exists using the new File API
    const file = new File(videoUri);
    const exists = await file.exists;
    if (!exists) {
      throw new Error("Video file does not exist");
    }

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(videoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to Uint8Array for React Native compatibility
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to Supabase Storage using Uint8Array directly
    const { data, error } = await supabase.storage
      .from("workout-videos")
      .upload(filePath, bytes, {
        contentType: "video/mp4",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading video:", error);
      throw error;
    }

    if (!data) {
      throw new Error("No data returned from upload");
    }

    // Get the public URL (though bucket is private, we'll use authenticated URLs)
    const { data: urlData } = supabase.storage
      .from("workout-videos")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error in uploadWorkoutVideo:", error);
    throw error;
  }
};

/**
 * Analyze workout videos using Gemini AI via Edge Function
 * @param videoUrls - Array of video URLs from Supabase Storage
 * @returns Array of analyzed workout exercises grouped by exercise type
 */
export const analyzeWorkoutVideos = async (
  videoUrls: string[]
): Promise<VideoAnalysisResult[]> => {
  try {
    if (videoUrls.length === 0) {
      return [];
    }

    console.log(
      `🔄 Calling edge function with ${videoUrls.length} video(s)...`
    );
    console.log("Video URLs:", videoUrls);

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke(
      "analyze-workout-videos",
      {
        body: { videoUrls },
      }
    );

    console.log("Edge function response:", { data, error });

    if (error) {
      console.error("❌ Error calling analyze function:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));

      // Extract error details from the error object
      let errorMessage = "Failed to analyze videos. Please try again.";
      let errorDetails = "";

      // Check if error has context property (FunctionsHttpError)
      if (error.context) {
        console.error("Error context:", error.context);
        errorDetails = JSON.stringify(error.context);
      }

      // Provide user-friendly error messages based on error type
      if (error.message?.includes("Memory limit exceeded")) {
        errorMessage =
          "Video is too large to process. Please compress your video to under 20MB.";
      } else if (error.message?.includes("too large")) {
        errorMessage =
          "Video exceeds the 20MB size limit. Please compress your video and try again.";
      } else if (error.message?.includes("GEMINI_API_KEY")) {
        errorMessage =
          "Video analysis service is not configured. Please contact support.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      const finalError = new Error(
        errorDetails
          ? `${errorMessage}\n\nDetails: ${errorDetails}`
          : errorMessage
      );
      console.error("Final error to throw:", finalError.message);
      throw finalError;
    }

    if (!data) {
      console.error("❌ No response from analysis service");
      throw new Error("No response from analysis service");
    }

    console.log(
      "✅ Edge function returned data:",
      JSON.stringify(data, null, 2)
    );

    // Check for error in data response
    if (data.error) {
      const errorMsg = data.details || data.error;
      console.error("❌ Analysis error from data:", errorMsg);
      console.error("Error code:", data.error_code);

      // Provide specific error messages based on error code
      if (data.error_code === "NO_ANALYSIS_RESULTS") {
        throw new Error(
          "Could not analyze any videos. Ensure videos are under 20MB after compression and in MP4 format."
        );
      } else if (data.error_code === "MISSING_API_KEY") {
        throw new Error(
          "Video analysis service is not configured. Please contact support."
        );
      } else if (data.error_code === "MISSING_SUPABASE_CONFIG") {
        throw new Error("Storage configuration error. Please contact support.");
      } else if (data.error_code === "INVALID_JSON") {
        throw new Error("Invalid request format. Please try again.");
      } else if (data.error_code === "NO_VIDEO_URLS") {
        throw new Error("No videos were provided for analysis.");
      }

      throw new Error(errorMsg);
    }

    if (!data.results) {
      console.error("❌ No analysis results in response");
      throw new Error("No analysis results returned");
    }

    console.log(
      `✅ Successfully analyzed ${data.results.length} exercise group(s)`
    );
    return data.results as VideoAnalysisResult[];
  } catch (error) {
    console.error("❌ Error in analyzeWorkoutVideos:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    throw error;
  }
};

/**
 * Delete a workout video from Supabase Storage
 * @param videoUrl - Full URL of the video to delete
 */
export const deleteWorkoutVideo = async (videoUrl: string): Promise<void> => {
  try {
    // Extract the file path from the URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/workout-videos/{userId}/{filename}
    const urlParts = videoUrl.split("/workout-videos/");
    if (urlParts.length !== 2) {
      throw new Error("Invalid video URL format");
    }

    const filePath = urlParts[1];

    // Delete from storage
    const { error } = await supabase.storage
      .from("workout-videos")
      .remove([filePath]);

    if (error) {
      console.error("Error deleting video:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteWorkoutVideo:", error);
    throw error;
  }
};

/**
 * Delete multiple workout videos from Supabase Storage
 * @param videoUrls - Array of video URLs to delete
 */
export const deleteWorkoutVideos = async (
  videoUrls: string[]
): Promise<void> => {
  try {
    if (videoUrls.length === 0) {
      return;
    }

    // Extract file paths from URLs, handling both regular and signed URLs
    const filePaths = videoUrls
      .map((url) => {
        try {
          // Remove query parameters if present (for signed URLs)
          const cleanUrl = url.split("?")[0];

          // Extract the path after /workout-videos/
          const parts = cleanUrl.split("/workout-videos/");
          if (parts.length === 2) {
            return parts[1];
          }

          return null;
        } catch (err) {
          console.error(`Error processing URL ${url}:`, err);
          return null;
        }
      })
      .filter((path): path is string => path !== null);

    if (filePaths.length === 0) {
      return;
    }

    // Delete all videos at once
    const { error } = await supabase.storage
      .from("workout-videos")
      .remove(filePaths);

    if (error) {
      console.error("Error deleting videos from storage:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteWorkoutVideos:", error);
    throw error;
  }
};

/**
 * Get a signed URL for a private video (valid for 1 hour)
 * @param videoUrl - Full URL of the video
 * @returns Signed URL that can be used to access the video
 */
export const getSignedVideoUrl = async (videoUrl: string): Promise<string> => {
  try {
    // Extract the file path from the URL
    const urlParts = videoUrl.split("/workout-videos/");
    if (urlParts.length !== 2) {
      throw new Error("Invalid video URL format");
    }

    const filePath = urlParts[1];

    // Get signed URL (valid for 1 hour)
    const { data, error } = await supabase.storage
      .from("workout-videos")
      .createSignedUrl(filePath, 3600);

    if (error) {
      console.error("Error creating signed URL:", error);
      throw error;
    }

    if (!data || !data.signedUrl) {
      throw new Error("No signed URL returned");
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Error in getSignedVideoUrl:", error);
    throw error;
  }
};
