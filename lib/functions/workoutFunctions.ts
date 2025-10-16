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
