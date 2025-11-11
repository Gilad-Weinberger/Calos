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
 * @param userId - Optional user ID for analytics tracking
 * @returns Analyzed plan data
 */
export const analyzePlanPdf = async (
  pdfUrl: string,
  aiNotes?: string,
  userId?: string
): Promise<PDFAnalysisResult> => {
  try {
    console.log("🔄 Calling analyze-workout-plan edge function...");
    console.log("PDF URL:", pdfUrl);
    console.log("AI Notes:", aiNotes);
    console.log("User ID:", userId);

    const { data, error } = await supabase.functions.invoke(
      "analyze-workout-plan",
      {
        body: { pdfUrl, aiNotes, userId },
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

    const plan = data as Plan;

    // Create workout records for the plan
    await createWorkoutRecordsForPlan(plan, userId);

    return plan;
  } catch (error) {
    console.error("Error in createPlanFromAnalysis:", error);
    throw error;
  }
};

/**
 * Form data interface for AI plan generation
 */
export interface AIPlanFormData {
  planTarget: "calisthenics" | "specific_exercise" | null;
  specificExercise: string;
  maxReps: {
    pushups: number;
    pullups: number;
    dips: number;
    squats: number;
  };
  birthDate: Date | null;
  age: number | null;
  height: number | null;
  heightUnit: "cm" | "ft";
  weight: number | null;
  weightUnit: "kg" | "lbs";
  activityLevel: "beginner" | "intermediate" | "advanced" | null;
  currentWorkoutDays: number | null;
  workoutsPerWeek: number | null;
  availableDays: number[]; // Array of day indices (0=Sunday, 6=Saturday)
  startDate: Date | null;
}

/**
 * Generate a workout plan using AI based on form data
 * @param formData - Form data from the multi-step form
 * @param userId - User ID
 * @returns Generated plan
 */
export const generateAIPlan = async (
  formData: AIPlanFormData,
  userId: string
): Promise<Plan> => {
  try {
    console.log("🔄 Calling generate-ai-workout-plan edge function...");
    console.log("Form Data:", formData);
    console.log("User ID:", userId);

    // Convert Date to ISO string for the Edge Function
    const formDataForAPI = {
      ...formData,
      birthDate: formData.birthDate ? formData.birthDate.toISOString() : null,
      startDate: formData.startDate ? formData.startDate.toISOString() : null,
    };

    const { data, error } = await supabase.functions.invoke(
      "generate-ai-workout-plan",
      {
        body: { formData: formDataForAPI, userId },
      }
    );

    console.log("Edge function response:", { data, error });

    if (error) {
      console.error("❌ Error from edge function:", error);

      // Extract detailed error message
      let errorMessage = "Failed to generate plan. Please try again.";

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
          "AI plan generation service is not configured. Please contact support.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }

    if (!data) {
      throw new Error("No data returned from AI plan generation");
    }

    console.log("✅ Plan generated successfully");

    // The data returned matches PDFAnalysisResult structure
    const analysisResult = data as PDFAnalysisResult;

    // Deactivate any existing active plans first
    await deactivateCurrentPlan(userId);

    // Use the start date from form data, or default to Sunday of this week
    const startDate = formData.startDate
      ? getSundayOfWeek(formData.startDate)
      : getSundayOfWeek(new Date());
    const planType = formData.planTarget === "calisthenics" ? "repeat" : "once";

    // Create new plan
    const { data: planData, error: createError } = await supabase
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
        start_date: startDate.toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating plan:", createError);
      throw createError;
    }

    const plan = planData as Plan;

    // Create workout records for the plan
    await createWorkoutRecordsForPlan(plan, userId);

    return plan;
  } catch (error) {
    console.error("Error in generateAIPlan:", error);
    throw error;
  }
};

/**
 * Get a specific plan by ID
 * @param planId - Plan ID
 * @param userId - User ID (for security)
 * @returns Plan or null
 */
export const getPlanById = async (
  planId: string,
  userId: string
): Promise<Plan | null> => {
  try {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("plan_id", planId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Plan not found
        return null;
      }
      console.error("Error fetching plan:", error);
      throw error;
    }

    return data as Plan;
  } catch (error) {
    console.error("Error in getPlanById:", error);
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
 * Delete all undone workouts for a plan
 * @param planId - Plan ID
 */
export const deleteUndoneWorkoutsForPlan = async (
  planId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("workouts")
      .delete()
      .eq("plan_id", planId)
      .eq("done", false);

    if (error) {
      console.error("Error deleting undone workouts:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteUndoneWorkoutsForPlan:", error);
    throw error;
  }
};

/**
 * Deactivate the user's current active plan
 * @param userId - User ID
 */
export const deactivateCurrentPlan = async (userId: string): Promise<void> => {
  try {
    // Get the active plan before deactivating
    const activePlan = await getActivePlan(userId);

    // Deactivate the plan
    const { error } = await supabase
      .from("plans")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) {
      console.error("Error deactivating plan:", error);
      throw error;
    }

    // Delete all undone workouts for the deactivated plan
    if (activePlan) {
      await deleteUndoneWorkoutsForPlan(activePlan.plan_id);
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

/**
 * Validate plan data structure
 * @param plan - Plan object to validate
 * @returns Validation result with errors if any
 */
export const validatePlanData = (
  plan: Plan
): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // Check plan name
  if (!plan.name || plan.name.trim() === "") {
    errors.push("Plan name is required");
  }

  // Check schedule has correct number of weeks
  if (!plan.schedule || plan.schedule.length !== plan.num_weeks) {
    errors.push(
      `Schedule must have ${plan.num_weeks} weeks, but has ${plan.schedule?.length || 0}`
    );
  }

  // Check each week has 7 days
  if (plan.schedule) {
    plan.schedule.forEach((week, weekIndex) => {
      if (!week || week.length !== 7) {
        errors.push(
          `Week ${weekIndex + 1} must have 7 days, but has ${week?.length || 0}`
        );
      }
    });
  }

  // Check all workout letters in schedule exist in workouts object
  if (plan.schedule && plan.workouts) {
    const workoutLetters = new Set(Object.keys(plan.workouts));
    const scheduleLetters = new Set<string>();

    plan.schedule.forEach((week) => {
      week.forEach((day) => {
        const dayLower = day?.toLowerCase().trim();
        if (dayLower && dayLower !== "rest" && dayLower !== "") {
          scheduleLetters.add(day.toUpperCase());
        }
      });
    });

    scheduleLetters.forEach((letter) => {
      if (!workoutLetters.has(letter)) {
        errors.push(
          `Workout "${letter}" is referenced in schedule but not defined in workouts`
        );
      }
    });
  }

  // Check for orphaned workouts (workouts not in schedule)
  if (plan.workouts && plan.schedule) {
    const scheduleLetters = new Set<string>();
    plan.schedule.forEach((week) => {
      week.forEach((day) => {
        const dayLower = day?.toLowerCase().trim();
        if (dayLower && dayLower !== "rest" && dayLower !== "") {
          scheduleLetters.add(day.toUpperCase());
        }
      });
    });

    Object.keys(plan.workouts).forEach((letter) => {
      if (!scheduleLetters.has(letter)) {
        errors.push(
          `Workout "${letter}" is defined but never used in the schedule`
        );
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Recreate undone workouts for a plan after editing
 * @param planId - Plan ID
 * @param userId - User ID
 * @param plan - Updated plan object
 */
export const recreateUndoneWorkoutsForPlan = async (
  planId: string,
  userId: string,
  plan: Plan
): Promise<void> => {
  try {
    // Delete all undone workouts
    await deleteUndoneWorkoutsForPlan(planId);

    const startDate = new Date(plan.start_date);
    startDate.setHours(0, 0, 0, 0);

    if (plan.plan_type === "once") {
      // For "once" plans: Create all workouts for all weeks
      for (let weekIndex = 0; weekIndex < plan.num_weeks; weekIndex++) {
        await createWorkoutsForWeek(plan, userId, weekIndex, startDate);
      }
    } else {
      // For "repeat" plans: Create workouts for current cycle and next 1-2 cycles
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const daysElapsed = Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate current cycle
      const cycleLength = plan.num_weeks * 7;
      const currentCycle = Math.floor(daysElapsed / cycleLength);

      // Create workouts for current cycle and next 2 cycles (as buffer)
      const cyclesToCreate = [currentCycle, currentCycle + 1, currentCycle + 2];

      for (const cycle of cyclesToCreate) {
        const cycleStartDate = new Date(startDate);
        cycleStartDate.setDate(startDate.getDate() + cycle * cycleLength);

        // Create workouts for all weeks in this cycle
        for (let weekIndex = 0; weekIndex < plan.num_weeks; weekIndex++) {
          await createWorkoutsForWeek(plan, userId, weekIndex, cycleStartDate);
        }
      }
    }
  } catch (error) {
    console.error("Error in recreateUndoneWorkoutsForPlan:", error);
    throw error;
  }
};

/**
 * Update a plan and recreate undone workouts
 * @param planId - Plan ID
 * @param userId - User ID (for security)
 * @param updates - Fields to update
 * @returns Updated plan
 */
export const updatePlanWithWorkoutRecreation = async (
  planId: string,
  userId: string,
  updates: Partial<
    Omit<Plan, "plan_id" | "user_id" | "created_at" | "updated_at">
  >
): Promise<Plan> => {
  try {
    // First, get the current plan to merge updates
    const currentPlan = await getPlanById(planId, userId);
    if (!currentPlan) {
      throw new Error("Plan not found");
    }

    // Merge updates with current plan
    const updatedPlan: Plan = {
      ...currentPlan,
      ...updates,
    };

    // Validate the updated plan
    const validation = validatePlanData(updatedPlan);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    // Update plan in database
    const plan = await updatePlan(planId, userId, updates);

    // Recreate undone workouts with the updated plan data
    await recreateUndoneWorkoutsForPlan(planId, userId, updatedPlan);

    return plan;
  } catch (error) {
    console.error("Error in updatePlanWithWorkoutRecreation:", error);
    throw error;
  }
};

/**
 * Calculate total workouts from schedule (count non-rest days)
 * @param plan - Plan object
 * @returns Total number of workout days
 */
export const getTotalWorkoutsFromSchedule = (plan: Plan): number => {
  let total = 0;
  plan.schedule.forEach((week) => {
    week.forEach((day) => {
      const dayLower = day.toLowerCase().trim();
      if (dayLower !== "rest" && dayLower !== "" && day !== null) {
        total++;
      }
    });
  });
  return total;
};

/**
 * Get count of completed workouts for a plan
 * @param planId - Plan ID
 * @returns Number of completed workouts
 */
export const getCompletedWorkoutsCount = async (
  planId: string
): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from("workouts")
      .select("*", { count: "exact", head: true })
      .eq("plan_id", planId)
      .eq("done", true)
      .not("plan_workout_letter", "is", null);

    if (error) {
      console.error("Error counting completed workouts:", error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error("Error in getCompletedWorkoutsCount:", error);
    throw error;
  }
};

/**
 * Calculate completed weeks based on workouts completed
 * @param plan - Plan object
 * @returns Number of completed weeks (weeks with at least one workout)
 */
export const getCompletedWeeks = async (plan: Plan): Promise<number> => {
  try {
    // Get all completed workouts for this plan
    const { data: workouts, error } = await supabase
      .from("workouts")
      .select("scheduled_date")
      .eq("plan_id", plan.plan_id)
      .eq("done", true)
      .not("scheduled_date", "is", null);

    if (error) {
      console.error("Error fetching workouts for completed weeks:", error);
      throw error;
    }

    if (!workouts || workouts.length === 0) {
      return 0;
    }

    // Calculate which week each workout belongs to
    const startDate = new Date(plan.start_date);
    startDate.setHours(0, 0, 0, 0);

    const completedWeeks = new Set<number>();

    workouts.forEach((workout) => {
      if (workout.scheduled_date) {
        const workoutDate = new Date(workout.scheduled_date);
        workoutDate.setHours(0, 0, 0, 0);

        const daysElapsed = Math.floor(
          (workoutDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysElapsed >= 0) {
          const weekNumber = Math.floor(daysElapsed / 7);
          if (plan.plan_type === "once" && weekNumber < plan.num_weeks) {
            completedWeeks.add(weekNumber);
          } else if (plan.plan_type === "repeat") {
            // For recurring plans, use modulo to handle cycles
            const weekInCycle = weekNumber % plan.num_weeks;
            completedWeeks.add(weekInCycle);
          }
        }
      }
    });

    return completedWeeks.size;
  } catch (error) {
    console.error("Error in getCompletedWeeks:", error);
    throw error;
  }
};

/**
 * Get plan end date (for 'once' type plans)
 * @param plan - Plan object
 * @returns End date or null if plan is recurring
 */
export const getPlanEndDate = (plan: Plan): Date | null => {
  if (plan.plan_type === "repeat") {
    return null;
  }

  const startDate = new Date(plan.start_date);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + plan.num_weeks * 7);
  return endDate;
};

/**
 * Calculate the maximum number of workouts in any week
 * @param schedule - Array of weekly schedules
 * @returns Maximum workouts per week
 */
export const calculateMaxWorkoutsPerWeek = (schedule: string[][]): number => {
  let maxWorkouts = 0;
  schedule.forEach((week) => {
    const weekWorkouts = week.filter(
      (day) =>
        day && day.toLowerCase() !== "rest" && day.trim() !== "" && day !== null
    ).length;
    maxWorkouts = Math.max(maxWorkouts, weekWorkouts);
  });
  return maxWorkouts;
};

/**
 * Create workout records for a specific week of a plan
 * @param plan - Plan object
 * @param userId - User ID
 * @param weekNumber - Week number (0-indexed)
 * @param cycleStartDate - Start date for this cycle (for recurring plans)
 */
const createWorkoutsForWeek = async (
  plan: Plan,
  userId: string,
  weekNumber: number,
  cycleStartDate: Date
): Promise<void> => {
  const weekSchedule = plan.schedule[weekNumber];
  if (!weekSchedule) return;

  const weekStartDate = new Date(cycleStartDate);
  weekStartDate.setDate(cycleStartDate.getDate() + weekNumber * 7);
  weekStartDate.setHours(0, 0, 0, 0);

  const workoutsToCreate: {
    user_id: string;
    workout_date: string;
    plan_id: string;
    plan_workout_letter: string;
    scheduled_date: string;
    done: boolean;
  }[] = [];

  weekSchedule.forEach((workoutLetter, dayIndex) => {
    const dayLower = workoutLetter?.toLowerCase().trim();
    if (!dayLower || dayLower === "rest" || dayLower === "") {
      return; // Skip rest days
    }

    const workout = plan.workouts[workoutLetter];
    if (!workout) {
      console.warn(`Workout ${workoutLetter} not found in plan`);
      return;
    }

    const scheduledDate = new Date(weekStartDate);
    scheduledDate.setDate(weekStartDate.getDate() + dayIndex);
    scheduledDate.setHours(0, 0, 0, 0);

    workoutsToCreate.push({
      user_id: userId,
      workout_date: scheduledDate.toISOString(),
      plan_id: plan.plan_id,
      plan_workout_letter: workoutLetter,
      scheduled_date: scheduledDate.toISOString(),
      done: false,
    });
  });

  if (workoutsToCreate.length > 0) {
    // Get all exercises to map exercise names to IDs
    const { getAllExercises } = await import("./workoutFunctions");
    const allExercises = await getAllExercises();

    // Create workouts and their exercises
    for (const workoutData of workoutsToCreate) {
      const workoutLetter = workoutData.plan_workout_letter;
      const workoutDef = plan.workouts[workoutLetter];

      // Create workout record
      const { data: workout, error: workoutError } = await supabase
        .from("workouts")
        .insert(workoutData)
        .select("workout_id")
        .single();

      if (workoutError) {
        console.error(
          `Error creating workout ${workoutLetter} for week ${weekNumber}:`,
          workoutError
        );
        continue;
      }

      // Create workout exercises
      const workoutExercises = workoutDef.exercises
        .map((exDef, index) => {
          // Find exercise by name
          const exercise = allExercises.find(
            (e) => e.name.toLowerCase() === exDef.exercise_name.toLowerCase()
          );

          if (!exercise) {
            console.warn(
              `Exercise ${exDef.exercise_name} not found in database`
            );
            return null;
          }

          // Convert reps/duration to array format
          // For static exercises: use duration (in seconds) for each set
          // For dynamic exercises: use reps for each set
          let repsArray: number[];
          if (exercise.type === "static") {
            // Static exercise: use duration value repeated for each set
            const durationValue = exDef.duration || 30; // Default 30 seconds
            repsArray = new Array(exDef.sets).fill(durationValue);
          } else {
            // Dynamic exercise: use reps value repeated for each set
            // Handle both single number and array formats
            if (Array.isArray(exDef.reps)) {
              repsArray = exDef.reps;
            } else if (typeof exDef.reps === "number") {
              repsArray = new Array(exDef.sets).fill(exDef.reps);
            } else {
              // Default to 0 if no reps specified
              repsArray = new Array(exDef.sets).fill(0);
            }
          }

          return {
            workout_id: workout.workout_id,
            exercise_id: exercise.exercise_id,
            sets: exDef.sets,
            reps: repsArray,
            order_index: index + 1,
            rest_seconds: exDef.rest_seconds || 0,
            superset_group: exDef.superset_group || null,
          };
        })
        .filter((ex) => ex !== null);

      if (workoutExercises.length > 0) {
        const { error: exercisesError } = await supabase
          .from("workout_exercises")
          .insert(workoutExercises);

        if (exercisesError) {
          console.error(
            `Error creating exercises for workout ${workoutLetter}:`,
            exercisesError
          );
          // Clean up the workout if exercises fail
          await supabase
            .from("workouts")
            .delete()
            .eq("workout_id", workout.workout_id);
        }
      }
    }
  }
};

/**
 * Create workout records for a plan
 * @param plan - Plan object
 * @param userId - User ID
 */
export const createWorkoutRecordsForPlan = async (
  plan: Plan,
  userId: string
): Promise<void> => {
  try {
    const startDate = new Date(plan.start_date);
    startDate.setHours(0, 0, 0, 0);

    if (plan.plan_type === "once") {
      // For "once" plans, create all workouts for the entire duration
      for (let weekIndex = 0; weekIndex < plan.num_weeks; weekIndex++) {
        await createWorkoutsForWeek(plan, userId, weekIndex, startDate);
      }
    } else {
      // For "repeat" plans, create workouts for the first cycle (all weeks)
      for (let weekIndex = 0; weekIndex < plan.num_weeks; weekIndex++) {
        await createWorkoutsForWeek(plan, userId, weekIndex, startDate);
      }
    }
  } catch (error) {
    console.error("Error in createWorkoutRecordsForPlan:", error);
    throw error;
  }
};

/**
 * Create workouts for the next week in a recurring plan
 * @param plan - Plan object
 * @param userId - User ID
 * @param weekNumber - Week number to create workouts for (0-indexed)
 */
export const createWorkoutsForNextWeek = async (
  plan: Plan,
  userId: string,
  weekNumber: number
): Promise<void> => {
  try {
    if (plan.plan_type !== "repeat") {
      return; // Only for recurring plans
    }

    const startDate = new Date(plan.start_date);
    startDate.setHours(0, 0, 0, 0);

    // Calculate which cycle we're in
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysElapsed = Math.floor(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const currentCycle = Math.floor(daysElapsed / (plan.num_weeks * 7));
    const cycleLength = plan.num_weeks * 7;

    // Calculate the start date for the current cycle
    const cycleStartDate = new Date(startDate);
    cycleStartDate.setDate(startDate.getDate() + currentCycle * cycleLength);

    // Determine the target week (handle wrap-around)
    let targetWeekNumber = weekNumber;
    if (weekNumber >= plan.num_weeks) {
      // Wrap around to next cycle, week 0
      targetWeekNumber = 0;
      cycleStartDate.setDate(cycleStartDate.getDate() + cycleLength);
    }

    // Check if workouts for this week already exist
    const weekStartDate = new Date(cycleStartDate);
    weekStartDate.setDate(cycleStartDate.getDate() + targetWeekNumber * 7);

    const { count } = await supabase
      .from("workouts")
      .select("*", { count: "exact", head: true })
      .eq("plan_id", plan.plan_id)
      .eq("done", false)
      .gte("scheduled_date", weekStartDate.toISOString())
      .lt(
        "scheduled_date",
        new Date(
          weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000
        ).toISOString()
      );

    if (count && count > 0) {
      // Workouts already exist for this week
      return;
    }

    // Create workouts for the target week
    await createWorkoutsForWeek(plan, userId, targetWeekNumber, cycleStartDate);
  } catch (error) {
    console.error("Error in createWorkoutsForNextWeek:", error);
    throw error;
  }
};

/**
 * Check and create next week workouts if needed
 * @param plan - Plan object
 * @param userId - User ID
 */
export const checkAndCreateNextWeekWorkouts = async (
  plan: Plan,
  userId: string
): Promise<void> => {
  try {
    if (plan.plan_type !== "repeat") {
      return; // Only for recurring plans
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(plan.start_date);
    startDate.setHours(0, 0, 0, 0);

    const daysElapsed = Math.floor(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const currentWeek = Math.floor(daysElapsed / 7) % plan.num_weeks;
    const nextWeek = (currentWeek + 1) % plan.num_weeks;

    // Check if we have workouts for the current week
    const currentWeekStart = new Date(startDate);
    const currentCycle = Math.floor(daysElapsed / (plan.num_weeks * 7));
    currentWeekStart.setDate(
      startDate.getDate() + currentCycle * plan.num_weeks * 7 + currentWeek * 7
    );

    const { count: currentWeekCount } = await supabase
      .from("workouts")
      .select("*", { count: "exact", head: true })
      .eq("plan_id", plan.plan_id)
      .eq("done", false)
      .gte("scheduled_date", currentWeekStart.toISOString())
      .lt(
        "scheduled_date",
        new Date(
          currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000
        ).toISOString()
      );

    // If we have workouts for current week but not next week, create next week
    if (currentWeekCount && currentWeekCount > 0) {
      await createWorkoutsForNextWeek(plan, userId, nextWeek);
    }
  } catch (error) {
    console.error("Error in checkAndCreateNextWeekWorkouts:", error);
    // Don't throw - this is a background operation
  }
};

/**
 * Get workout progress for a specific week
 * @param plan - Plan object
 * @param weekStartDate - Start date of the week
 * @param weekEndDate - End date of the week
 * @param weekIndex - Week index (0-indexed) to get schedule from
 * @returns Object with total workouts this week and completed workouts this week
 */
export const getWeekWorkoutProgress = async (
  plan: Plan,
  weekStartDate: Date,
  weekEndDate: Date,
  weekIndex: number
): Promise<{
  totalWorkoutsThisWeek: number;
  completedWorkoutsThisWeek: number;
}> => {
  try {
    // Get total workouts scheduled for this week from schedule
    const weekSchedule = plan.schedule[weekIndex] || [];
    // Filter out rest days, empty strings, null, and undefined
    const totalWorkoutsThisWeek = weekSchedule.filter((workout) => {
      if (!workout) return false;
      const workoutStr = workout.toString().trim().toLowerCase();
      return workoutStr !== "" && workoutStr !== "rest";
    }).length;

    // Get completed workouts for this week from database
    const { data: workouts, error } = await supabase
      .from("workouts")
      .select("done")
      .eq("plan_id", plan.plan_id)
      .gte("scheduled_date", weekStartDate.toISOString())
      .lte("scheduled_date", weekEndDate.toISOString())
      .not("plan_workout_letter", "is", null);

    if (error) {
      console.error("Error fetching week's workouts:", error);
      throw error;
    }

    const completedWorkoutsThisWeek =
      workouts?.filter((w) => w.done === true).length || 0;

    return {
      totalWorkoutsThisWeek,
      completedWorkoutsThisWeek,
    };
  } catch (error) {
    console.error("Error in getWeekWorkoutProgress:", error);
    throw error;
  }
};

/**
 * Get this week's workout progress
 * @param plan - Plan object
 * @returns Object with total workouts this week and completed workouts this week
 */
export const getThisWeekWorkoutProgress = async (
  plan: Plan
): Promise<{
  totalWorkoutsThisWeek: number;
  completedWorkoutsThisWeek: number;
}> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(plan.start_date);
    startDate.setHours(0, 0, 0, 0);

    // Calculate days elapsed and current week
    const daysElapsed = Math.floor(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If plan hasn't started yet, return zeros
    if (daysElapsed < 0) {
      return { totalWorkoutsThisWeek: 0, completedWorkoutsThisWeek: 0 };
    }

    let currentWeek: number;
    let weekStartDate: Date;

    if (plan.plan_type === "repeat") {
      // For recurring plans, calculate current cycle and week
      const cycleLength = plan.num_weeks * 7;
      const currentCycle = Math.floor(daysElapsed / cycleLength);
      currentWeek = Math.floor((daysElapsed % cycleLength) / 7);

      // Calculate the start date for the current cycle
      weekStartDate = new Date(startDate);
      weekStartDate.setDate(
        startDate.getDate() + currentCycle * cycleLength + currentWeek * 7
      );
    } else {
      // For 'once' type plans
      currentWeek = Math.floor(daysElapsed / 7);
      if (currentWeek >= plan.num_weeks) {
        // Plan is completed
        return { totalWorkoutsThisWeek: 0, completedWorkoutsThisWeek: 0 };
      }
      weekStartDate = new Date(startDate);
      weekStartDate.setDate(startDate.getDate() + currentWeek * 7);
    }

    weekStartDate.setHours(0, 0, 0, 0);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    weekEndDate.setHours(23, 59, 59, 999);

    return getWeekWorkoutProgress(
      plan,
      weekStartDate,
      weekEndDate,
      currentWeek
    );
  } catch (error) {
    console.error("Error in getThisWeekWorkoutProgress:", error);
    throw error;
  }
};

/**
 * Get comprehensive plan progress statistics
 * @param plan - Plan object
 * @returns Progress statistics including completed workouts, total workouts, and completed weeks
 */
export const getPlanProgress = async (
  plan: Plan
): Promise<{
  completedWorkouts: number;
  totalWorkouts: number;
  completedWeeks: number;
  endDate: Date | null;
}> => {
  const [completedWorkouts, completedWeeks] = await Promise.all([
    getCompletedWorkoutsCount(plan.plan_id),
    getCompletedWeeks(plan),
  ]);

  const totalWorkouts = getTotalWorkoutsFromSchedule(plan);
  const endDate = getPlanEndDate(plan);

  return {
    completedWorkouts,
    totalWorkouts,
    completedWeeks,
    endDate,
  };
};

/**
 * Get workouts for a specific week with all details
 * @param plan - Plan object
 * @param weekStartDate - Start date of the week
 * @param weekEndDate - End date of the week
 * @param weekIndex - Week index (0-indexed)
 * @param userId - User ID to check completion status
 * @returns Array of workout details for the week
 */
export const getWeekWorkoutsWithDetails = async (
  plan: Plan,
  weekStartDate: Date,
  weekEndDate: Date,
  weekIndex: number,
  userId: string
): Promise<
  {
    workoutLetter: string;
    workoutName: string;
    scheduledDate: Date;
    dayName: string;
    dayIndex: number;
    isCompleted: boolean;
    exerciseCount: number;
    workoutId?: string | null;
  }[]
> => {
  try {
    const weekSchedule = plan.schedule[weekIndex] || [];
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    // Get completed workouts for this week from database
    const { data: completedWorkouts, error } = await supabase
      .from("workouts")
      .select("workout_id, scheduled_date, plan_workout_letter, done")
      .eq("plan_id", plan.plan_id)
      .eq("user_id", userId)
      .gte("scheduled_date", weekStartDate.toISOString())
      .lte("scheduled_date", weekEndDate.toISOString())
      .not("plan_workout_letter", "is", null);

    if (error) {
      console.error("Error fetching week's workouts:", error);
    }

    // Create a map of completed workouts by scheduled date and workout letter
    const completedMap = new Map<string, boolean>();
    const workoutIdMap = new Map<string, string>();
    completedWorkouts?.forEach((workout) => {
      if (workout.scheduled_date && workout.plan_workout_letter) {
        const dateKey = new Date(workout.scheduled_date)
          .toISOString()
          .split("T")[0];
        const key = `${dateKey}-${workout.plan_workout_letter}`;
        if (workout.done) {
          completedMap.set(key, true);
        }
        if (workout.workout_id) {
          workoutIdMap.set(key, workout.workout_id);
        }
      }
    });

    const workouts: {
      workoutLetter: string;
      workoutName: string;
      scheduledDate: Date;
      dayName: string;
      dayIndex: number;
      isCompleted: boolean;
      exerciseCount: number;
      workoutId?: string | null;
    }[] = [];

    weekSchedule.forEach((workoutLetter, dayIndex) => {
      if (
        !workoutLetter ||
        workoutLetter.toLowerCase().trim() === "rest" ||
        workoutLetter.trim() === ""
      ) {
        return; // Skip rest days
      }

      const workout = plan.workouts[workoutLetter];
      if (!workout) {
        return;
      }

      const scheduledDate = new Date(weekStartDate);
      scheduledDate.setDate(weekStartDate.getDate() + dayIndex);
      scheduledDate.setHours(0, 0, 0, 0);

      const dateKey = scheduledDate.toISOString().split("T")[0];
      const completionKey = `${dateKey}-${workoutLetter}`;
      const isCompleted = completedMap.get(completionKey) || false;
      const workoutId = workoutIdMap.get(completionKey) || null;

      workouts.push({
        workoutLetter,
        workoutName: workout.name,
        scheduledDate,
        dayName: dayNames[dayIndex],
        dayIndex,
        isCompleted,
        exerciseCount: workout.exercises.length,
        workoutId,
      });
    });

    return workouts;
  } catch (error) {
    console.error("Error in getWeekWorkoutsWithDetails:", error);
    throw error;
  }
};
