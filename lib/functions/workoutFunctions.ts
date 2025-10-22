import { posthog } from "../utils/posthog";
import { supabase } from "../utils/supabase";
import { deleteWorkoutVideos } from "./videoFunctions";

/**
 * Convert a storage URL to a signed URL for secure access to private videos
 * @param videoUrl - The storage URL to convert
 * @returns A signed URL valid for 1 hour
 */
export const convertToSignedUrl = async (videoUrl: string): Promise<string> => {
  try {
    // Extract file path from URL
    const urlParts = videoUrl.split("/workout-videos/");
    if (urlParts.length !== 2) {
      // If URL format is unexpected, return as-is
      return videoUrl;
    }

    const filePath = urlParts[1];

    // Get signed URL (valid for 1 hour)
    const { data: signedData, error: signedError } = await supabase.storage
      .from("workout-videos")
      .createSignedUrl(filePath, 3600);

    if (!signedError && signedData?.signedUrl) {
      return signedData.signedUrl;
    } else {
      console.error("Error creating signed URL for:", videoUrl, signedError);
      // Return original URL as fallback
      return videoUrl;
    }
  } catch (err) {
    console.error("Error processing video URL:", videoUrl, err);
    // Return original URL as fallback
    return videoUrl;
  }
};

/**
 * Convert an array of storage URLs to signed URLs
 * @param videoUrls - Array of storage URLs
 * @returns Array of signed URLs
 */
export const convertToSignedUrls = async (
  videoUrls: string[]
): Promise<string[]> => {
  const signedUrls = await Promise.all(
    videoUrls.map((url) => convertToSignedUrl(url))
  );
  return signedUrls;
};

export interface Exercise {
  exercise_id: string;
  name: string;
  description: string;
  type: "static" | "dynamic";
}

export interface WorkoutExercise {
  exercise_id: string;
  exercise_name: string;
  exercise_type: "static" | "dynamic";
  sets: number;
  reps: number[];
  order_index: number;
  superset_group?: string;
  video_urls?: string[];
  analysis_metadata?: Record<string, any>;
  duration?: number; // For static exercises
  unilateral_type?: string; // For unilateral exercises
  alternating?: boolean; // For alternating unilateral exercises
}

export interface WorkoutData {
  title: string;
  exercises: WorkoutExercise[];
  plan_id?: string;
  plan_workout_letter?: string;
  scheduled_date?: string;
  start_time?: string;
  end_time?: string;
}

export interface DatabaseWorkout {
  workout_id: string;
  workout_date: string;
  created_at: string;
  start_time?: string;
  end_time?: string;
  plan_id?: string;
  plan_workout_letter?: string;
  scheduled_date?: string;
  plans?: {
    name: string;
  };
  workout_exercises: {
    exercise_id: string;
    sets: number;
    reps: number[];
    order_index: number;
    superset_group?: string;
    video_urls?: string[];
    exercises: {
      name: string;
      type: "static" | "dynamic";
    };
  }[];
}

/**
 * Fetch all available exercises from the database
 */
export const getAllExercises = async (): Promise<Exercise[]> => {
  try {
    const { data, error } = await supabase
      .from("exercises")
      .select("exercise_id, name, description, type")
      .order("name");

    if (error) {
      console.error("Error fetching exercises:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAllExercises:", error);
    throw error;
  }
};

/**
 * Create a new workout and all its exercises in a single transaction
 */
export const saveCompleteWorkout = async (
  userId: string,
  workoutData: WorkoutData
): Promise<{ workout_id: string }> => {
  try {
    // First, create the workout record
    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .insert({
        user_id: userId,
        workout_date: new Date().toISOString(),
        plan_id: workoutData.plan_id || null,
        plan_workout_letter: workoutData.plan_workout_letter || null,
        scheduled_date: workoutData.scheduled_date || null,
        start_time: workoutData.start_time || null,
        end_time: workoutData.end_time || null,
      })
      .select("workout_id")
      .single();

    if (workoutError) {
      console.error("Error creating workout:", workoutError);
      throw workoutError;
    }

    if (!workout) {
      throw new Error("Failed to create workout");
    }

    // Then, create all workout exercises
    const workoutExercises = workoutData.exercises.map((exercise, index) => ({
      workout_id: workout.workout_id,
      exercise_id: exercise.exercise_id,
      sets: exercise.sets,
      reps: exercise.reps,
      order_index: index + 1,
      superset_group: exercise.superset_group || null,
      video_urls: exercise.video_urls || null,
      analysis_metadata: exercise.analysis_metadata || null,
    }));

    const { error: exercisesError } = await supabase
      .from("workout_exercises")
      .insert(workoutExercises);

    if (exercisesError) {
      console.error("Error creating workout exercises:", exercisesError);
      // If exercises fail, we should clean up the workout record
      await supabase
        .from("workouts")
        .delete()
        .eq("workout_id", workout.workout_id);
      throw exercisesError;
    }

    // Calculate workout statistics
    const totalSets = workoutData.exercises.reduce(
      (sum, ex) => sum + ex.sets,
      0
    );
    const totalReps = workoutData.exercises.reduce((sum, ex) => {
      return sum + ex.reps.reduce((repSum, rep) => repSum + rep, 0);
    }, 0);
    const exerciseTypes = workoutData.exercises.map((ex) => ex.exercise_type);
    const uniqueExerciseTypes = [...new Set(exerciseTypes)];

    // Track workout creation in PostHog
    posthog.capture("workout_created", {
      workout_id: workout.workout_id,
      user_id: userId,
      exercise_count: workoutData.exercises.length,
      total_sets: totalSets,
      total_reps: totalReps,
      exercise_types: uniqueExerciseTypes,
      exercises: workoutData.exercises.map((ex) => ex.exercise_name),
      timestamp: new Date().toISOString(),
    });

    return { workout_id: workout.workout_id };
  } catch (error) {
    console.error("Error in saveCompleteWorkout:", error);
    throw error;
  }
};

/**
 * Get user's recent workouts for reference
 */
export const getUserRecentWorkouts = async (
  userId: string,
  limit: number = 5,
  offset: number = 0
) => {
  try {
    const { data, error } = await supabase
      .from("workouts")
      .select(
        `
        workout_id,
        workout_date,
        created_at,
        start_time,
        end_time,
        plan_id,
        plan_workout_letter,
        scheduled_date,
        plans (
          name
        ),
        workout_exercises (
          exercise_id,
          sets,
          reps,
          order_index,
          video_urls,
          exercises (
            name,
            type
          )
        )
      `
      )
      .eq("user_id", userId)
      .order("workout_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching recent workouts:", error);
      throw error;
    }

    // Convert video URLs to signed URLs for secure access
    if (data) {
      for (const workout of data) {
        if (workout.workout_exercises) {
          for (const exercise of workout.workout_exercises) {
            if (exercise.video_urls && exercise.video_urls.length > 0) {
              exercise.video_urls = await convertToSignedUrls(
                exercise.video_urls
              );
            }
          }
        }
      }
    }

    return data || [];
  } catch (error) {
    console.error("Error in getUserRecentWorkouts:", error);
    throw error;
  }
};

/**
 * Calculate total sets from workout exercises
 */
export const calculateTotalSets = (exercises: WorkoutExercise[]): number => {
  return exercises.reduce((total, exercise) => total + exercise.sets, 0);
};

/**
 * Calculate total reps from workout exercises
 */
export const calculateTotalReps = (exercises: WorkoutExercise[]): number => {
  return exercises.reduce((total, exercise) => {
    const exerciseReps = exercise.reps.reduce((sum, rep) => sum + rep, 0);
    return total + exerciseReps;
  }, 0);
};

/**
 * Format workout date to readable string
 * Example: "August 18, 2025 at 7:56 AM"
 */
export const formatWorkoutDate = (date: string): string => {
  const workoutDate = new Date(date);

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  return workoutDate.toLocaleString("en-US", options);
};

export interface Achievement {
  icon: string;
  message: string;
  rank?: number; // 1 for gold/PR, 2 for silver, 3 for bronze
}

/**
 * Get the best achievement from a list of achievements
 * Priority: Trophy (rank 1) > Medal (rank 2-3)
 */
export const getBestAchievement = (
  achievements: Achievement[]
): Achievement | null => {
  if (!achievements || achievements.length === 0) {
    return null;
  }

  // Find trophy achievements first (personal records)
  const trophyAchievement = achievements.find(
    (achievement) => achievement.icon === "trophy"
  );

  if (trophyAchievement) {
    return trophyAchievement;
  }

  // If no trophy, return the first medal achievement
  const medalAchievement = achievements.find(
    (achievement) => achievement.icon === "medal"
  );

  return medalAchievement || achievements[0];
};

/**
 * Get achievements for a specific workout based on historical data up to and including this workout
 */
export const getWorkoutAchievements = async (
  userId: string,
  workoutId: string,
  compareMode: "individual" | "best" = "best"
): Promise<Achievement[]> => {
  try {
    const achievements: Achievement[] = [];

    // Get all exercises in this workout
    const { data: workoutExercises, error: exercisesError } = await supabase
      .from("workout_exercises")
      .select(
        `
        exercise_id,
        reps,
        exercises (
          name,
          type
        )
      `
      )
      .eq("workout_id", workoutId);

    if (exercisesError) {
      console.error("Error fetching workout exercises:", exercisesError);
      return achievements;
    }

    if (!workoutExercises || workoutExercises.length === 0) {
      return achievements;
    }

    // Check for personal records and ranking achievements in each exercise
    for (const exercise of workoutExercises) {
      const exerciseData = Array.isArray(exercise.exercises)
        ? exercise.exercises[0]
        : exercise.exercises;
      const unit = exerciseData?.type === "static" ? "seconds" : "reps";

      // Get historical rankings up to this workout
      const { data: rankings, error: rankingsError } = await supabase.rpc(
        "get_user_exercise_rankings_until_workout",
        {
          p_user_id: userId,
          p_exercise_id: exercise.exercise_id,
          p_workout_id: workoutId,
          p_limit: 5,
        }
      );

      if (rankingsError) {
        console.error("Error fetching historical rankings:", rankingsError);
        continue;
      }

      if (rankings && rankings.length > 0) {
        // Determine which sets to check based on compareMode
        const setsToCheck =
          compareMode === "best" ? [Math.max(...exercise.reps)] : exercise.reps;

        // Check each set for achievements
        for (const rep of setsToCheck) {
          const ranking = rankings.find(
            (r: any) => r.amount === rep && r.workout_id === workoutId
          );

          if (ranking) {
            // Check if it's a PR (1st place)
            if (ranking.rank_position === 1) {
              achievements.push({
                icon: "trophy",
                message: `Congrats for the new PR! ${rep} ${unit} in ${exerciseData?.name || "exercise"}!`,
                rank: 1,
              });
            }
            // Check if it's in top 3 rankings
            else if (ranking.rank_position <= 3) {
              const position = ranking.rank_position === 2 ? "2nd" : "3rd";
              achievements.push({
                icon: "medal",
                message: `Congrats! That's the ${position} best performance: ${rep} ${unit} in ${exerciseData?.name || "exercise"}`,
                rank: ranking.rank_position,
              });
            }
          }
        }
      }

      // Check for total reps achievements
      const totalReps = exercise.reps.reduce(
        (sum: number, rep: number) => sum + rep,
        0
      );

      const { data: totalRepsRankings, error: totalRepsError } =
        await supabase.rpc(
          "get_user_exercise_total_reps_rankings_until_workout",
          {
            p_user_id: userId,
            p_exercise_id: exercise.exercise_id,
            p_workout_id: workoutId,
            p_limit: 5,
          }
        );

      if (totalRepsError) {
        console.error("Error fetching total reps rankings:", totalRepsError);
      } else if (totalRepsRankings && totalRepsRankings.length > 0) {
        // Find if current workout's total is in rankings
        const totalRanking = totalRepsRankings.find(
          (r: any) => r.amount === totalReps && r.workout_id === workoutId
        );

        if (totalRanking) {
          // Check if it's a personal record (1st place)
          if (totalRanking.rank_position === 1) {
            achievements.push({
              icon: "trophy",
              message: `New total reps record! ${totalReps} ${unit} total in ${exerciseData?.name || "exercise"}`,
              rank: 1,
            });
          }
          // Check if it's in top 3 total reps rankings
          else if (totalRanking.rank_position <= 3) {
            const position = totalRanking.rank_position === 2 ? "2nd" : "3rd";
            achievements.push({
              icon: "medal",
              message: `${position} best total! ${totalReps} ${unit} in ${exerciseData?.name || "exercise"}`,
              rank: totalRanking.rank_position,
            });
          }
        }
      }
    }

    return achievements;
  } catch (error) {
    console.error("Error in getWorkoutAchievements:", error);
    return [];
  }
};

/**
 * Delete a workout and all associated data including videos
 */
export const deleteWorkout = async (
  workoutId: string,
  userId: string
): Promise<void> => {
  try {
    // First, get all video URLs from workout exercises
    const { data: exercises, error: fetchError } = await supabase
      .from("workout_exercises")
      .select("video_urls")
      .eq("workout_id", workoutId);

    if (fetchError) {
      console.error("Error fetching workout exercises:", fetchError);
      throw new Error(
        `Failed to fetch workout exercises: ${fetchError.message}`
      );
    }

    // Collect all video URLs
    const allVideoUrls: string[] = [];
    if (exercises) {
      exercises.forEach((exercise) => {
        if (exercise.video_urls && Array.isArray(exercise.video_urls)) {
          allVideoUrls.push(...exercise.video_urls);
        }
      });
    }

    // Delete the workout (cascade will delete workout_exercises)
    const { error: deleteError } = await supabase
      .from("workouts")
      .delete()
      .eq("workout_id", workoutId)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error deleting workout:", deleteError);
      throw new Error(`Failed to delete workout: ${deleteError.message}`);
    }

    // Delete associated videos from storage
    if (allVideoUrls.length > 0) {
      try {
        await deleteWorkoutVideos(allVideoUrls);
      } catch (videoError) {
        console.error("Error deleting workout videos:", videoError);
        // Don't throw here - workout is already deleted, just log the error
      }
    }
  } catch (error) {
    console.error("Error in deleteWorkout:", error);
    throw error;
  }
};

/**
 * Calculate workout duration in seconds
 * @param startTime - Workout start time
 * @param endTime - Workout end time
 * @returns Duration in seconds, or null if times are not set
 */
export const calculateWorkoutDuration = (
  startTime: string | null,
  endTime: string | null
): number | null => {
  if (!startTime || !endTime) {
    return null;
  }

  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const durationMs = end - start;

  return Math.floor(durationMs / 1000);
};

/**
 * Get today's completed workout if it exists
 * @param userId - User ID
 * @param planId - Plan ID
 * @param workoutLetter - Workout letter (A, B, C, etc.)
 * @param scheduledDate - The scheduled date for the workout
 * @returns Completed workout data or null if not found
 */
export const getTodaysCompletedWorkout = async (
  userId: string,
  planId: string,
  workoutLetter: string,
  scheduledDate: Date
): Promise<DatabaseWorkout | null> => {
  try {
    // Format scheduled date to match the format used when saving workouts (today at midnight)
    const today = new Date(scheduledDate);
    today.setHours(0, 0, 0, 0);
    const scheduledDateStr = today.toISOString();

    const { data, error } = await supabase
      .from("workouts")
      .select(
        `
        workout_id,
        workout_date,
        created_at,
        start_time,
        end_time,
        plan_id,
        plan_workout_letter,
        scheduled_date,
        plans (
          name
        ),
        workout_exercises (
          exercise_id,
          sets,
          reps,
          order_index,
          superset_group,
          video_urls,
          exercises (
            name,
            type
          )
        )
      `
      )
      .eq("user_id", userId)
      .eq("plan_id", planId)
      .eq("plan_workout_letter", workoutLetter)
      .eq("scheduled_date", scheduledDateStr)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No workout found for today
        return null;
      }
      console.error("Error fetching today's completed workout:", error);
      throw error;
    }

    // Convert video URLs to signed URLs for secure access
    if (data && data.workout_exercises) {
      for (const exercise of data.workout_exercises) {
        if (exercise.video_urls && exercise.video_urls.length > 0) {
          exercise.video_urls = await convertToSignedUrls(exercise.video_urls);
        }
      }
    }

    return data as unknown as DatabaseWorkout;
  } catch (error) {
    console.error("Error in getTodaysCompletedWorkout:", error);
    throw error;
  }
};

export interface FollowedUserWorkout extends DatabaseWorkout {
  users: {
    user_id: string;
    name: string | null;
    username: string | null;
    profile_image_url: string | null;
  };
}

/**
 * Get recent workouts from users that the current user follows
 * @param userId - Current user ID
 * @param limit - Number of workouts to fetch
 * @param offset - Offset for pagination
 * @returns Array of workouts from followed users
 */
export const getFollowedUsersWorkouts = async (
  userId: string,
  limit: number = 10,
  offset: number = 0
): Promise<{ data: FollowedUserWorkout[] | null; error: any }> => {
  try {
    // First get the list of users that the current user follows
    const { data: followedUsers, error: followedError } = await supabase
      .from("users")
      .select("user_id")
      .contains("followers", [userId]);

    if (followedError) {
      console.error("Error fetching followed users:", followedError);
      return { data: null, error: followedError };
    }

    if (!followedUsers || followedUsers.length === 0) {
      return { data: [], error: null };
    }

    const followedUserIds = followedUsers.map((u) => u.user_id);

    const { data, error } = await supabase
      .from("workouts")
      .select(
        `
        workout_id,
        workout_date,
        created_at,
        start_time,
        end_time,
        plan_id,
        plan_workout_letter,
        scheduled_date,
        plans (
          name
        ),
        users!workouts_user_id_fkey (
          user_id,
          name,
          username,
          profile_image_url
        ),
        workout_exercises (
          exercise_id,
          sets,
          reps,
          order_index,
          superset_group,
          video_urls,
          exercises (
            name,
            type
          )
        )
      `
      )
      .in("user_id", followedUserIds)
      .order("workout_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching followed users workouts:", error);
      return { data: null, error };
    }

    // Convert video URLs to signed URLs for secure access
    if (data) {
      for (const workout of data) {
        if (workout.workout_exercises) {
          for (const exercise of workout.workout_exercises) {
            if (exercise.video_urls && exercise.video_urls.length > 0) {
              exercise.video_urls = await convertToSignedUrls(
                exercise.video_urls
              );
            }
          }
        }
      }
    }

    return {
      data: (data as unknown as FollowedUserWorkout[]) || [],
      error: null,
    };
  } catch (error) {
    console.error("Exception in getFollowedUsersWorkouts:", error);
    return { data: null, error };
  }
};
