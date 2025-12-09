import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PlanWorkoutScreen from "../../../components/plan-workout/PlanWorkoutScreen";
import {
  PlanWorkoutExercise,
  PlanWorkoutViewModel,
} from "../../../components/plan-workout/types";
import { useAuth } from "../../../lib/context/AuthContext";
import { getPlanById } from "../../../lib/functions/planFunctions";
import { getWorkoutById } from "../../../lib/functions/workoutFunctions";

const PlanWorkoutRoute: React.FC = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewModel, setViewModel] = useState<PlanWorkoutViewModel | null>(null);

  const loadWorkout = useCallback(async () => {
    if (!user?.user_id) {
      setViewModel(null);
      setIsLoading(false);
      return;
    }

    if (!id || typeof id !== "string") {
      setError("Missing workout identifier.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const workout = await getWorkoutById(id, user.user_id);

      if (!workout.plan_id || !workout.plan_workout_letter) {
        throw new Error("This workout is not associated with an active plan.");
      }

      const plan = await getPlanById(workout.plan_id, user.user_id);

      if (!plan) {
        throw new Error("Unable to load the plan for this workout.");
      }

      const workoutDefinition =
        plan.workouts?.[workout.plan_workout_letter] || null;

      const scheduledDate = workout.scheduled_date
        ? new Date(workout.scheduled_date)
        : null;

      const exercises = [...workout.workout_exercises]
        .sort((a, b) => a.order_index - b.order_index)
        .map((exercise) => {
          // First try to match by exercise_id
          let definitionMatch = workoutDefinition?.exercises.find(
            (def) => def.exercise_id === exercise.exercise_id
          );

          // If no match by ID, try matching by exercise name (case-insensitive)
          // This handles cases where exercise IDs might differ but names match
          if (!definitionMatch) {
            definitionMatch = workoutDefinition?.exercises.find(
              (def) =>
                def.exercise_name.toLowerCase() ===
                exercise.exercises.name.toLowerCase()
            );
          }

          const isStatic = exercise.exercises.type === "static";
          const duration = isStatic
            ? (definitionMatch?.duration ?? exercise.reps[0] ?? null)
            : null;

          return {
            exerciseId: exercise.exercise_id,
            name: exercise.exercises.name,
            type: exercise.exercises.type,
            sets: definitionMatch?.sets ?? exercise.sets,
            reps: exercise.reps,
            duration,
            restSeconds: definitionMatch?.rest_seconds,
            supersetGroup:
              definitionMatch?.superset_group ??
              exercise.superset_group ??
              null,
            orderIndex: exercise.order_index,
            unilateralType: definitionMatch?.unilateral_type ?? null,
            alternating: definitionMatch?.alternating ?? false,
          } satisfies PlanWorkoutExercise;
        });

      const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
      const totalSupersets = new Set(
        exercises
          .map((ex) => ex.supersetGroup)
          .filter((group): group is string => Boolean(group))
      ).size;

      const view: PlanWorkoutViewModel = {
        workoutId: workout.workout_id,
        planId: workout.plan_id,
        planName: plan.name,
        planWorkoutLetter: workout.plan_workout_letter,
        scheduledDate,
        isCompleted: Boolean(workout.done),
        title:
          workout.title ||
          workoutDefinition?.name ||
          `Workout ${workout.plan_workout_letter}`,
        description: workout.description,
        exercises,
        totalSets,
        totalExercises: exercises.length,
        totalSupersets,
        definition: workoutDefinition,
        workoutRecord: workout,
        plan,
      };

      setViewModel(view);
    } catch (err) {
      console.error("Error loading plan workout:", err);
      setError(
        err instanceof Error ? err.message : "Unable to load workout details."
      );
    } finally {
      setIsLoading(false);
    }
  }, [id, user?.user_id]);

  useEffect(() => {
    loadWorkout();
  }, [loadWorkout]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/plan");
    }
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-800 text-lg font-semibold mb-2">
          Sign in required
        </Text>
        <Text className="text-gray-500 text-center px-8">
          You need to be signed in to view this workout.
        </Text>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-4">Loading workout...</Text>
      </SafeAreaView>
    );
  }

  if (error || !viewModel) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
        <Text className="text-red-600 text-lg font-semibold mb-2">
          Unable to open workout
        </Text>
        <Text className="text-gray-600 text-center mb-6">
          {error || "We could not find this workout. It may have been removed."}
        </Text>
        <View className="rounded-2xl bg-black px-6 py-3">
          <Text className="text-white" onPress={handleBack}>
            Go back
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return <PlanWorkoutScreen viewModel={viewModel} onBack={handleBack} />;
};

export default PlanWorkoutRoute;
