import * as FileSystem from "expo-file-system/legacy";
import {
  getDaysElapsed,
  getScheduledWorkoutForDate,
  getTodayScheduledDate,
} from "../utils/schedule";
import { supabase } from "../utils/supabase";

/**
 * Plan type definition
 */
export interface Plan {
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

/**
 * Workout definitions by letter (A, B, C, etc.)
 */
export interface WorkoutDefinitions {
  [key: string]: WorkoutDefinition;
}

/**
 * Single workout definition
 */
export interface WorkoutDefinition {
  name: string;
  exercises: ExerciseDefinition[];
}

/**
 * Exercise definition within a workout
 */
export interface ExerciseDefinition {
  exercise_id: string; // Now required (was optional)
  exercise_name: string;
  sets: number;
  reps?: number; // Now optional (only for dynamic exercises)
  duration?: number; // New field (only for static exercises, in seconds)
  rest_seconds: number;
  superset_group?: string; // Identifier for grouping exercises into supersets
  unilateral_type?: string; // New field for unilateral exercises (e.g., "single_arm", "single_leg")
  alternating?: boolean; // New field: true if alternating per set, false if grouped by side
}

/**
 * PDF analysis result from Edge Function
 */
export interface PDFAnalysisResult {
  name: string;
  description: string;
  num_weeks: number;
  workouts: WorkoutDefinitions;
  schedule: string[][];
}

/**
 * Upload a PDF file to storage
 * @param userId - User ID
 * @param fileUri - Local file URI
 * @param fileName - File name
 * @returns Storage URL
 */
export const uploadPlanPdf = async (
  userId: string,
  fileUri: string,
  fileName: string
): Promise<string> => {
  try {
    // Read file as base64
    const fileData = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to Uint8Array for React Native compatibility
    const byteCharacters = atob(fileData);
    const bytes = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      bytes[i] = byteCharacters.charCodeAt(i);
    }

    // Sanitize filename to be URL-safe (remove non-ASCII characters)
    const sanitizedFileName = fileName
      .replace(/[^\x00-\x7F]/g, "") // Remove non-ASCII characters
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .replace(/[^a-zA-Z0-9._-]/g, "") // Remove any remaining special characters
      .substring(0, 100); // Limit length

    // Generate a safe filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const safeFileName =
      sanitizedFileName || `workout-plan-${randomString}.pdf`;
    const filePath = `${userId}/${timestamp}_${safeFileName}`;

    // Upload to storage using Uint8Array directly (no Blob needed in React Native)
    const { error } = await supabase.storage
      .from("workout-plans")
      .upload(filePath, bytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading PDF:", error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("workout-plans")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error in uploadPlanPdf:", error);
    throw error;
  }
};

/**
 * Call the Edge Function to analyze a PDF workout plan
 * @param pdfUrl - URL of the uploaded PDF
 * @param aiNotes - Optional instructions for the AI analyzer
 * @returns Analyzed plan data
 */
export const analyzePlanPdf = async (
  pdfUrl: string,
  aiNotes?: string
): Promise<PDFAnalysisResult> => {
  try {
    console.log("🔄 Calling analyze-workout-plan edge function...");
    console.log("PDF URL:", pdfUrl);
    console.log("AI Notes:", aiNotes);

    const { data, error } = await supabase.functions.invoke(
      "analyze-workout-plan",
      {
        body: { pdfUrl, aiNotes },
      }
    );

    console.log("Edge function response:", { data, error });

    if (error) {
      console.error("❌ Error from edge function:", error);

      // Extract detailed error message
      let errorMessage = "Failed to analyze PDF. Please try again.";

      // Check if error has context property (FunctionsHttpError)
      if (error.context) {
        console.error("Error context:", error.context);
        errorMessage = JSON.stringify(error.context);
      }

      // Check if data contains error details
      if (data && data.error) {
        errorMessage = data.error;
      }

      // Provide user-friendly error messages
      if (error.message?.includes("GEMINI_API_KEY")) {
        errorMessage =
          "PDF analysis service is not configured. Please contact support.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }

    if (!data) {
      throw new Error("No data returned from PDF analysis");
    }

    console.log("✅ PDF analyzed successfully");
    return data as PDFAnalysisResult;
  } catch (error) {
    console.error("Error in analyzePlanPdf:", error);
    throw error;
  }
};

/**
 * Get the Sunday of the week containing the given date
 * @param date - Any date
 * @returns Date object set to Sunday of that week at 00:00:00
 */
const getSundayOfWeek = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const dayOfWeek = result.getDay(); // 0 = Sunday, 1 = Monday, etc.
  result.setDate(result.getDate() - dayOfWeek);
  return result;
};

/**
 * Create a plan from analyzed PDF data
 * @param userId - User ID
 * @param analysisResult - Analyzed plan data from PDF
 * @param planType - 'repeat' or 'once'
 * @returns Created plan
 */
export const createPlanFromAnalysis = async (
  userId: string,
  analysisResult: PDFAnalysisResult,
  planType: "repeat" | "once" = "repeat"
): Promise<Plan> => {
  try {
    // Deactivate any existing active plans first
    await deactivateCurrentPlan(userId);

    // Create new plan with today as start date
    const { data, error } = await supabase
      .from("plans")
      .insert({
        user_id: userId,
        name: analysisResult.name,
        description: analysisResult.description,
        is_active: true,
        plan_type: planType,
        num_weeks: analysisResult.num_weeks,
        workouts: analysisResult.workouts,
        schedule: analysisResult.schedule,
        start_date: getSundayOfWeek(new Date()).toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating plan:", error);
      throw error;
    }

    return data as Plan;
  } catch (error) {
    console.error("Error in createPlanFromAnalysis:", error);
    throw error;
  }
};

/**
 * Get the user's active plan
 * @param userId - User ID
 * @returns Active plan or null
 */
export const getActivePlan = async (userId: string): Promise<Plan | null> => {
  try {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No active plan found
        return null;
      }
      console.error("Error fetching active plan:", error);
      throw error;
    }

    return data as Plan;
  } catch (error) {
    console.error("Error in getActivePlan:", error);
    throw error;
  }
};

/**
 * Deactivate the user's current active plan
 * @param userId - User ID
 */
export const deactivateCurrentPlan = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("plans")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) {
      console.error("Error deactivating plan:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deactivateCurrentPlan:", error);
    throw error;
  }
};

/**
 * Get today's workout from the active plan
 * @param plan - Active plan
 * @returns Today's workout info or null if rest day or plan completed
 */
export const getTodaysWorkout = (
  plan: Plan
): {
  workoutLetter: string;
  workout: WorkoutDefinition;
  scheduledDate: Date;
  weekNumber: number | null;
  dayInWeek: number;
  isRestDay: boolean;
} | null => {
  const today = new Date();
  const workoutLetter = getScheduledWorkoutForDate(
    new Date(plan.start_date),
    plan.schedule,
    plan.num_weeks,
    plan.plan_type,
    today
  );

  if (!workoutLetter) {
    return null;
  }

  const isRestDay = workoutLetter.toLowerCase() === "rest";

  if (isRestDay) {
    return {
      workoutLetter,
      workout: { name: "Rest Day", exercises: [] },
      scheduledDate: getTodayScheduledDate(new Date(plan.start_date)),
      weekNumber: null,
      dayInWeek: getDaysElapsed(new Date(plan.start_date), today) % 7,
      isRestDay: true,
    };
  }

  const workout = plan.workouts[workoutLetter];

  if (!workout) {
    console.error(`Workout ${workoutLetter} not found in plan`);
    return null;
  }

  const daysElapsed = getDaysElapsed(new Date(plan.start_date), today);
  const weekNumber = Math.floor(daysElapsed / 7) % plan.num_weeks;
  const dayInWeek = daysElapsed % 7;

  return {
    workoutLetter,
    workout,
    scheduledDate: getTodayScheduledDate(new Date(plan.start_date)),
    weekNumber,
    dayInWeek,
    isRestDay: false,
  };
};

/**
 * Get all plans for a user
 * @param userId - User ID
 * @returns Array of plans
 */
export const getUserPlans = async (userId: string): Promise<Plan[]> => {
  try {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user plans:", error);
      throw error;
    }

    return data as Plan[];
  } catch (error) {
    console.error("Error in getUserPlans:", error);
    throw error;
  }
};

/**
 * Delete a plan
 * @param planId - Plan ID
 * @param userId - User ID (for security)
 */
export const deletePlan = async (
  planId: string,
  userId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("plans")
      .delete()
      .eq("plan_id", planId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting plan:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deletePlan:", error);
    throw error;
  }
};

/**
 * Update a plan
 * @param planId - Plan ID
 * @param userId - User ID (for security)
 * @param updates - Fields to update
 */
export const updatePlan = async (
  planId: string,
  userId: string,
  updates: Partial<
    Omit<Plan, "plan_id" | "user_id" | "created_at" | "updated_at">
  >
): Promise<Plan> => {
  try {
    const { data, error } = await supabase
      .from("plans")
      .update(updates)
      .eq("plan_id", planId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating plan:", error);
      throw error;
    }

    return data as Plan;
  } catch (error) {
    console.error("Error in updatePlan:", error);
    throw error;
  }
};
