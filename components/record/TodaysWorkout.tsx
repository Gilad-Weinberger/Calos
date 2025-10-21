import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { getTodaysWorkout, Plan } from "../../lib/functions/planFunctions";
import {
  calculateDaysSinceScheduled,
  getLateworkoutMessage,
} from "../../lib/utils/schedule";
import { groupExercisesBySuperset } from "../../lib/utils/superset";

interface TodaysWorkoutProps {
  plan: Plan;
}

const TodaysWorkout: React.FC<TodaysWorkoutProps> = ({ plan }) => {
  const router = useRouter();
  const todaysWorkout = getTodaysWorkout(plan);

  // Format rest time in mm:ss format
  const formatRestTime = (seconds: number): string => {
    if (seconds === 0) return "0s";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0
      ? `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
      : `${seconds}s`;
  };

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
          You&apos;ve finished your workout plan. Time to create a new one or
          extend your current plan.
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

  return (
    <View className="flex-1 bg-gray-50">
      {/* Scrollable Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="p-4">
          {/* Header - Centered */}
          <View
            className="mb-1"
            style={{ maxWidth: 672, alignSelf: "center", width: "100%" }}
          >
            {/* Plan Name */}
            <Text className="text-sm font-medium text-gray-600 mb-2 text-center">
              {plan.name}
            </Text>

            {/* Workout Name */}
            <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
              {isRestDay ? "Rest Day" : workout.name}
              {!isRestDay && workout.name !== `Workout ${workoutLetter}` && (
                <Text className="text-blue-600">
                  {" "}
                  (Workout {workoutLetter})
                </Text>
              )}
            </Text>

            {/* Week/Day Info - Block Style */}
            {weekNumber !== null && (
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-600 mb-2 text-center">
                  Week {weekNumber + 1}
                </Text>
                <View className="flex-row flex-wrap justify-center">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (dayName, dayIndex) => {
                      const isToday = dayIndex === dayInWeek;
                      const dayWorkout = plan.schedule[weekNumber]?.[dayIndex];
                      const isRest = dayWorkout?.toLowerCase() === "rest";

                      return (
                        <View
                          key={dayIndex}
                          className={`rounded-lg px-3 py-2 mr-2 mb-2 ${
                            isToday
                              ? "bg-blue-600"
                              : isRest
                                ? "bg-gray-200"
                                : "bg-green-100"
                          }`}
                        >
                          <Text
                            className={`text-xs mb-1 ${
                              isToday ? "text-blue-100" : "text-gray-600"
                            }`}
                          >
                            {dayName}
                          </Text>
                          <Text
                            className={`text-sm font-semibold ${
                              isToday
                                ? "text-white"
                                : isRest
                                  ? "text-gray-600"
                                  : "text-green-700"
                            }`}
                          >
                            {dayWorkout || "-"}
                          </Text>
                        </View>
                      );
                    }
                  )}
                </View>
              </View>
            )}

            {/* Late Warning */}
            {lateMessage && (
              <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex-row items-center mb-6">
                <Ionicons name="warning" size={20} color="#f59e0b" />
                <Text className="text-sm text-yellow-800 ml-2 flex-1">
                  {lateMessage}
                </Text>
              </View>
            )}
          </View>

          {/* Conditional Content */}
          {isRestDay ? (
            /* Rest Day Content */
            <View
              className="bg-white rounded-2xl p-6 mb-6 shadow-lg"
              style={{ maxWidth: 672, alignSelf: "center", width: "100%" }}
            >
              <View className="items-center">
                <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center mb-4">
                  <Ionicons name="bed" size={40} color="#2563eb" />
                </View>
                <Text className="text-base text-gray-600 text-center leading-6">
                  Take it easy today. Recovery is an essential part of your
                  training!
                </Text>
              </View>
            </View>
          ) : (
            /* Workout Day Content */
            <>
              {/* Workout Overview - Centered */}
              <View
                className="bg-white rounded-2xl p-6 mb-6 shadow-lg"
                style={{ maxWidth: 672, alignSelf: "center", width: "100%" }}
              >
                <Text className="text-xl font-bold text-gray-900 mb-6 text-center">
                  Today&apos;s Exercises
                </Text>

                {groupExercisesBySuperset(workout.exercises).map(
                  (group, groupIndex) => {
                    if (group.isSuperset) {
                      return (
                        <View
                          key={`superset-${groupIndex}`}
                          className="border-l-4 border-blue-500 pl-4 bg-blue-50 rounded-r-xl mb-4 py-3"
                        >
                          <Text className="text-xs font-bold text-blue-600 mb-3 uppercase tracking-wide">
                            Superset
                          </Text>
                          {group.exercises.map((exercise, exIndex) => (
                            <View key={exIndex} className="mb-3 last:mb-0">
                              <Text className="text-base font-semibold text-gray-900 mb-2">
                                {exercise.exercise_name}
                              </Text>
                              <View className="flex-row items-center flex-wrap">
                                <View className="flex-row items-center mr-6 mb-1">
                                  <Ionicons
                                    name="list"
                                    size={16}
                                    color="#6b7280"
                                  />
                                  <Text className="text-sm text-gray-600 ml-2 font-medium">
                                    {exercise.sets} sets
                                  </Text>
                                </View>
                                <View className="flex-row items-center mr-6 mb-1">
                                  <Ionicons
                                    name={
                                      exercise.duration ? "time" : "fitness"
                                    }
                                    size={16}
                                    color="#6b7280"
                                  />
                                  <Text className="text-sm text-gray-600 ml-2 font-medium">
                                    {exercise.duration
                                      ? `${exercise.duration} sec`
                                      : `${exercise.reps} reps`}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          ))}
                          <Text className="text-xs text-blue-600 mt-2 italic">
                            No rest between exercises •{" "}
                            {formatRestTime(
                              (group.exercises[0] as any)?.rest_seconds || 0
                            )}{" "}
                            rest after superset
                          </Text>
                        </View>
                      );
                    } else {
                      const exercise = group.exercises[0];
                      return (
                        <View
                          key={`exercise-${groupIndex}`}
                          className="border-l-4 border-green-500 pl-4 bg-green-50 rounded-r-xl mb-4 py-3"
                        >
                          <Text className="text-xs font-bold text-green-600 mb-2 uppercase tracking-wide">
                            Exercise
                          </Text>
                          <Text className="text-base font-semibold text-gray-900 mb-2">
                            {exercise.exercise_name}
                          </Text>
                          <View className="flex-row items-center flex-wrap">
                            <View className="flex-row items-center mr-6 mb-1">
                              <Ionicons name="list" size={16} color="#6b7280" />
                              <Text className="text-sm text-gray-600 ml-2 font-medium">
                                {exercise.sets} sets
                              </Text>
                            </View>
                            <View className="flex-row items-center mr-6 mb-1">
                              <Ionicons
                                name={exercise.duration ? "time" : "fitness"}
                                size={16}
                                color="#6b7280"
                              />
                              <Text className="text-sm text-gray-600 ml-2 font-medium">
                                {exercise.duration
                                  ? `Hold for ${exercise.duration}s`
                                  : `${exercise.reps} reps`}
                              </Text>
                            </View>
                            {(exercise as any).rest_seconds > 0 && (
                              <View className="flex-row items-center mb-1">
                                <Ionicons
                                  name="bed"
                                  size={16}
                                  color="#6b7280"
                                />
                                <Text className="text-sm text-gray-600 ml-2 font-medium">
                                  {formatRestTime(
                                    (exercise as any).rest_seconds
                                  )}{" "}
                                  rest
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

              {/* Info Card - Centered */}
              <View
                className="bg-blue-50 rounded-2xl p-6"
                style={{ maxWidth: 672, alignSelf: "center", width: "100%" }}
              >
                <Text className="text-sm text-blue-900 text-center leading-6">
                  <Text className="font-bold">Ready to train?</Text> The
                  interactive workout will guide you through each exercise with
                  rest timers and rep tracking.
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Fixed Start Workout Button - Only show for workout days */}
      {!isRestDay && (
        <View className="absolute -bottom-10 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-4">
          <TouchableOpacity
            onPress={handleStartWorkout}
            className="bg-blue-600 rounded-2xl py-4 px-6 shadow-lg"
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="play-circle" size={24} color="white" />
              <Text className="text-white font-bold text-lg ml-2">
                Start Workout
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default TodaysWorkout;
