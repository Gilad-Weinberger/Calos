/**
 * Utility functions for superset operations
 */

import { ExerciseDefinition } from "../functions/planFunctions";
import { WorkoutExercise } from "../functions/workoutFunctions";

export type Exercise = ExerciseDefinition | WorkoutExercise;

export interface ExerciseGroup {
  isSuperset: boolean;
  supersetGroup?: string;
  exercises: Exercise[];
}

/**
 * Group exercises by superset_group
 * Exercises with the same non-null superset_group are grouped together
 * Regular exercises (no superset_group) are returned as individual groups
 *
 * @param exercises - Array of exercises to group
 * @returns Array of exercise groups with superset information
 */
export const groupExercisesBySuperset = (
  exercises: Exercise[]
): ExerciseGroup[] => {
  if (!exercises || exercises.length === 0) {
    return [];
  }

  const groups: ExerciseGroup[] = [];
  const supersetMap = new Map<string, Exercise[]>();

  exercises.forEach((exercise) => {
    if (exercise.superset_group) {
      // Add to superset group
      if (!supersetMap.has(exercise.superset_group)) {
        supersetMap.set(exercise.superset_group, []);
      }
      supersetMap.get(exercise.superset_group)!.push(exercise);
    } else {
      // Regular exercise - add as individual group
      groups.push({
        isSuperset: false,
        exercises: [exercise],
      });
    }
  });

  // Add superset groups to result
  supersetMap.forEach((exercises, groupId) => {
    groups.push({
      isSuperset: true,
      supersetGroup: groupId,
      exercises,
    });
  });

  // Sort to maintain original order based on first exercise in each group
  const originalIndices = new Map<Exercise, number>();
  exercises.forEach((ex, idx) => {
    originalIndices.set(ex, idx);
  });

  groups.sort((a, b) => {
    const aFirstIndex = originalIndices.get(a.exercises[0]) ?? 0;
    const bFirstIndex = originalIndices.get(b.exercises[0]) ?? 0;
    return aFirstIndex - bFirstIndex;
  });

  return groups;
};

/**
 * Get all unique superset groups in a workout
 *
 * @param exercises - Array of exercises
 * @returns Array of superset group identifiers
 */
export const getSupersetsInWorkout = (exercises: Exercise[]): string[] => {
  const supersetGroups = new Set<string>();

  exercises.forEach((exercise) => {
    if (exercise.superset_group) {
      supersetGroups.add(exercise.superset_group);
    }
  });

  return Array.from(supersetGroups).sort();
};

/**
 * Check if an exercise is part of a superset
 *
 * @param exercise - Exercise to check
 * @returns True if exercise is in a superset
 */
export const isInSuperset = (exercise: Exercise): boolean => {
  return !!exercise.superset_group;
};

/**
 * Get all exercises in the same superset as the given exercise
 *
 * @param exercise - Exercise to check
 * @param allExercises - Array of all exercises in the workout
 * @returns Array of exercises in the same superset (including the given exercise)
 */
export const getSupersetExercises = (
  exercise: Exercise,
  allExercises: Exercise[]
): Exercise[] => {
  if (!exercise.superset_group) {
    return [exercise];
  }

  return allExercises.filter(
    (ex) => ex.superset_group === exercise.superset_group
  );
};

/**
 * Get the position of an exercise within its superset
 *
 * @param exercise - Exercise to check
 * @param allExercises - Array of all exercises in the workout
 * @returns Object with position info (index, total, isLast)
 */
export const getExercisePositionInSuperset = (
  exercise: Exercise,
  allExercises: Exercise[]
): { index: number; total: number; isLast: boolean } => {
  const supersetExercises = getSupersetExercises(exercise, allExercises);

  // Find index by comparing exercise_name (works for both types)
  const index = supersetExercises.findIndex(
    (ex) => ex.exercise_name === exercise.exercise_name
  );

  return {
    index: index,
    total: supersetExercises.length,
    isLast: index === supersetExercises.length - 1,
  };
};

/**
 * Get the next exercise in a superset
 *
 * @param currentExercise - Current exercise
 * @param allExercises - Array of all exercises in the workout
 * @returns Next exercise in the superset, or null if current is last
 */
export const getNextExerciseInSuperset = (
  currentExercise: Exercise,
  allExercises: Exercise[]
): Exercise | null => {
  if (!currentExercise.superset_group) {
    return null;
  }

  const supersetExercises = getSupersetExercises(currentExercise, allExercises);
  const currentIndex = supersetExercises.findIndex(
    (ex) => ex.exercise_name === currentExercise.exercise_name
  );

  if (currentIndex === -1 || currentIndex === supersetExercises.length - 1) {
    return null;
  }

  return supersetExercises[currentIndex + 1];
};

/**
 * Get the first exercise in a superset
 *
 * @param supersetGroup - Superset group identifier
 * @param allExercises - Array of all exercises in the workout
 * @returns First exercise in the superset, or null if not found
 */
export const getFirstExerciseInSuperset = (
  supersetGroup: string,
  allExercises: Exercise[]
): Exercise | null => {
  const supersetExercises = allExercises.filter(
    (ex) => ex.superset_group === supersetGroup
  );

  return supersetExercises.length > 0 ? supersetExercises[0] : null;
};
