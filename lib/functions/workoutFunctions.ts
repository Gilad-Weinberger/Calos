import { supabase } from "../utils/supabase";

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
}

export interface WorkoutData {
  title: string;
  exercises: WorkoutExercise[];
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
  limit: number = 5
) => {
  try {
    const { data, error } = await supabase
      .from("workouts")
      .select(
        `
        workout_id,
        workout_date,
        created_at,
        workout_exercises (
          exercise_id,
          sets,
          reps,
          order_index,
          exercises (
            name,
            type
          )
        )
      `
      )
      .eq("user_id", userId)
      .order("workout_date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching recent workouts:", error);
      throw error;
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
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  return workoutDate.toLocaleString("en-US", options).replace(",", " at");
};

export interface Achievement {
  icon: string;
  message: string;
}

/**
 * Get achievements for a specific workout
 */
export const getWorkoutAchievements = async (
  userId: string,
  workoutId: string
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

    // Check for personal records in each exercise
    for (const exercise of workoutExercises) {
      const { data: personalRecord, error: prError } = await supabase.rpc(
        "get_user_personal_record",
        {
          p_user_id: userId,
          p_exercise_id: exercise.exercise_id,
        }
      );

      if (prError) {
        console.error("Error fetching personal record:", prError);
        continue;
      }

      if (personalRecord && personalRecord.length > 0) {
        const record = personalRecord[0];
        const currentWorkoutMax = Math.max(...exercise.reps);

        // Check if this workout set a new personal record
        if (record.workout_id === workoutId) {
          const exerciseData = Array.isArray(exercise.exercises)
            ? exercise.exercises[0]
            : exercise.exercises;
          const unit = exerciseData?.type === "static" ? "seconds" : "reps";
          achievements.push({
            icon: "trophy",
            message: `New personal record! ${currentWorkoutMax} ${unit} in ${exerciseData?.name || "exercise"}`,
          });
        }
      }
    }

    // Check for ranking achievements (top 3 performances)
    for (const exercise of workoutExercises) {
      const { data: rankings, error: rankingsError } = await supabase.rpc(
        "get_user_exercise_rankings",
        {
          p_user_id: userId,
          p_exercise_id: exercise.exercise_id,
          p_limit: 5,
        }
      );

      if (rankingsError) {
        console.error("Error fetching rankings:", rankingsError);
        continue;
      }

      if (rankings && rankings.length > 0) {
        // Check if any of the current workout's sets are in top 3
        for (const rep of exercise.reps) {
          const ranking = rankings.find(
            (r: any) => r.amount === rep && r.workout_id === workoutId
          );
          if (ranking && ranking.rank_position <= 3) {
            const exerciseData = Array.isArray(exercise.exercises)
              ? exercise.exercises[0]
              : exercise.exercises;
            const unit = exerciseData?.type === "static" ? "seconds" : "reps";
            const position =
              ranking.rank_position === 1
                ? "1st"
                : ranking.rank_position === 2
                  ? "2nd"
                  : "3rd";
            achievements.push({
              icon: "medal",
              message: `${position} best performance! ${rep} ${unit} in ${exerciseData?.name || "exercise"}`,
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
