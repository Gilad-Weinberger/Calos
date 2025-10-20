import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { getTodaysWorkout, Plan } from "../../lib/functions/planFunctions";
import {
  calculateDaysSinceScheduled,
  formatWeekDay,
  getLateworkoutMessage,
} from "../../lib/utils/schedule";
import { groupExercisesBySuperset } from "../../lib/utils/superset";

interface TodaysWorkoutProps {
  plan: Plan;
}

const TodaysWorkout: React.FC<TodaysWorkoutProps> = ({ plan }) => {
  const router = useRouter();
  const todaysWorkout = getTodaysWorkout(plan);

  if (!todaysWorkout) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
          <Ionicons name="checkmark-circle" size={40} color="#10b981" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
          Plan Completed!
        </Text>
        <Text className="text-base text-gray-600 text-center">
          You've finished your workout plan. Time to create a new one or extend
          your current plan.
        </Text>
      </View>
    );
  }

  const {
    workoutLetter,
    workout,
    scheduledDate,
    weekNumber,
    dayInWeek,
    isRestDay,
  } = todaysWorkout;

  // Calculate if workout is late
  const daysLate = calculateDaysSinceScheduled(scheduledDate);
  const lateMessage =
    daysLate > 0 ? getLateworkoutMessage(scheduledDate) : null;

  const handleStartWorkout = () => {
    router.push({
      pathname: "/workout-session",
      params: {
        planId: plan.plan_id,
        workoutLetter: workoutLetter,
      },
    });
  };

  if (isRestDay) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center mb-4">
          <Ionicons name="bed" size={40} color="#2563eb" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
          Rest Day
        </Text>
        <Text className="text-base text-gray-600 text-center mb-4">
          {plan.name}
        </Text>
        {weekNumber !== null && (
          <Text className="text-sm text-gray-500">
            {formatWeekDay(weekNumber, dayInWeek)}
          </Text>
        )}
        <Text className="text-base text-gray-600 text-center mt-6">
          Take it easy today. Recovery is an essential part of your training!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
    >
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          {/* Plan Name */}
          <Text className="text-sm font-medium text-gray-600 mb-1">
            {plan.name}
          </Text>

          {/* Workout Name */}
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {workout.name}
            <Text className="text-blue-600"> (Workout {workoutLetter})</Text>
          </Text>

          {/* Week/Day Info */}
          {weekNumber !== null && (
            <Text className="text-sm text-gray-600 mb-2">
              {formatWeekDay(weekNumber, dayInWeek)}
            </Text>
          )}

          {/* Late Warning */}
          {lateMessage && (
            <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex-row items-center mb-4">
              <Ionicons name="warning" size={20} color="#f59e0b" />
              <Text className="text-sm text-yellow-800 ml-2 flex-1">
                {lateMessage}
              </Text>
            </View>
          )}
        </View>

        {/* Workout Overview */}
        <View className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Today's Exercises
          </Text>

          {groupExercisesBySuperset(workout.exercises).map(
            (group, groupIndex) => {
              if (group.isSuperset) {
                return (
                  <View
                    key={`superset-${groupIndex}`}
                    className="border-l-4 border-blue-500 pl-3 bg-blue-50 rounded-r-lg mb-3 py-2"
                  >
                    <Text className="text-xs font-bold text-blue-600 mb-2">
                      SUPERSET
                    </Text>
                    {group.exercises.map((exercise, exIndex) => (
                      <View key={exIndex} className="mb-2">
                        <Text className="text-base font-medium text-gray-900 mb-1">
                          {exercise.exercise_name}
                        </Text>
                        <View className="flex-row items-center flex-wrap">
                          <View className="flex-row items-center mr-4 mb-1">
                            <Ionicons name="list" size={14} color="#6b7280" />
                            <Text className="text-sm text-gray-600 ml-1">
                              {exercise.sets} sets
                            </Text>
                          </View>
                          <View className="flex-row items-center mr-4 mb-1">
                            <Ionicons
                              name="fitness"
                              size={14}
                              color="#6b7280"
                            />
                            <Text className="text-sm text-gray-600 ml-1">
                              {exercise.reps} reps
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                    <Text className="text-xs text-blue-600 mt-1 italic">
                      No rest between exercises •{" "}
                      {group.exercises[0]?.rest_seconds}s rest after superset
                    </Text>
                  </View>
                );
              } else {
                const exercise = group.exercises[0];
                return (
                  <View
                    key={`exercise-${groupIndex}`}
                    className="border-b border-gray-100 pb-3 mb-3 last:border-b-0 last:mb-0 last:pb-0"
                  >
                    <Text className="text-base font-medium text-gray-900 mb-1">
                      {exercise.exercise_name}
                    </Text>
                    <View className="flex-row items-center flex-wrap">
                      <View className="flex-row items-center mr-4 mb-1">
                        <Ionicons name="list" size={14} color="#6b7280" />
                        <Text className="text-sm text-gray-600 ml-1">
                          {exercise.sets} sets
                        </Text>
                      </View>
                      <View className="flex-row items-center mr-4 mb-1">
                        <Ionicons name="fitness" size={14} color="#6b7280" />
                        <Text className="text-sm text-gray-600 ml-1">
                          {exercise.reps} reps
                        </Text>
                      </View>
                      {exercise.rest_seconds > 0 && (
                        <View className="flex-row items-center mb-1">
                          <Ionicons name="time" size={14} color="#6b7280" />
                          <Text className="text-sm text-gray-600 ml-1">
                            {exercise.rest_seconds}s rest
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              }
            }
          )}
        </View>

        {/* Start Workout Button */}
        <TouchableOpacity
          onPress={handleStartWorkout}
          className="bg-blue-600 rounded-lg py-4 px-6 shadow-md"
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="play-circle" size={24} color="white" />
            <Text className="text-white font-bold text-lg ml-2">
              Start Workout
            </Text>
          </View>
        </TouchableOpacity>

        {/* Info Card */}
        <View className="mt-6 bg-blue-50 rounded-lg p-4">
          <Text className="text-sm text-blue-900">
            <Text className="font-semibold">Ready to train?</Text> The
            interactive workout will guide you through each exercise with rest
            timers and rep tracking.
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </View>
    </ScrollView>
  );
};

export default TodaysWorkout;
