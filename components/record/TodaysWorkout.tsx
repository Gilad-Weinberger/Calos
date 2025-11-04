import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../lib/context/AuthContext";
import { getTodaysWorkout, Plan } from "../../lib/functions/planFunctions";
import {
  Achievement,
  DatabaseWorkout,
  getTodaysCompletedWorkout,
  getWorkoutAchievements,
} from "../../lib/functions/workoutFunctions";
import {
  calculateDaysSinceScheduled,
  getDaysElapsed,
  getLateworkoutMessage,
  getNextScheduledWorkout,
  getWeekNumber,
} from "../../lib/utils/schedule";
import { groupExercisesBySuperset } from "../../lib/utils/superset";
import WorkoutCard from "../you/workouts/WorkoutCard";
import WeekSchedule from "./WeekSchedule";

interface TodaysWorkoutProps {
  plan: Plan;
}

const TodaysWorkout: React.FC<TodaysWorkoutProps> = ({ plan }) => {
  const router = useRouter();
  const { user } = useAuth();
  const todaysWorkout = getTodaysWorkout(plan);
  const [completedWorkout, setCompletedWorkout] =
    useState<DatabaseWorkout | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Calculate next scheduled workout for rest days
  const nextWorkout = todaysWorkout?.isRestDay
    ? getNextScheduledWorkout(
        new Date(plan.start_date),
        plan.schedule,
        plan.num_weeks,
        plan.plan_type
      )
    : null;

  // Format rest time in mm:ss format
  const formatRestTime = (seconds: number): string => {
    if (seconds === 0) return "0s";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0
      ? `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
      : `${seconds}s`;
  };

  // Check if today's workout has been completed
  useEffect(() => {
    const checkCompletedWorkout = async () => {
      if (!user || !todaysWorkout || todaysWorkout.isRestDay) {
        setCompletedWorkout(null);
        setAchievements([]);
        return;
      }

      try {
        const workout = await getTodaysCompletedWorkout(
          user.user_id,
          plan.plan_id,
          todaysWorkout.workoutLetter,
          todaysWorkout.scheduledDate
        );

        setCompletedWorkout(workout);

        if (workout) {
          const achs = await getWorkoutAchievements(
            user.user_id,
            workout.workout_id,
            "individual"
          );
          setAchievements(achs);
        } else {
          setAchievements([]);
        }
      } catch (error) {
        console.error("Error checking completed workout:", error);
        setCompletedWorkout(null);
        setAchievements([]);
      }
    };

    checkCompletedWorkout();
  }, [user, plan.plan_id, todaysWorkout]);

  const handleWorkoutDeleted = () => {
    setCompletedWorkout(null);
    setAchievements([]);
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
    weekNumber: todaysWorkoutWeekNumber,
    dayInWeek,
    isRestDay,
  } = todaysWorkout;

  // Calculate week number for rest days (it's null for rest days in getTodaysWorkout)
  const daysElapsed = getDaysElapsed(new Date(plan.start_date));
  const weekNumber =
    todaysWorkoutWeekNumber !== null
      ? todaysWorkoutWeekNumber
      : getWeekNumber(daysElapsed, plan.num_weeks, plan.plan_type);

  // Calculate if workout is late
  const daysLate = calculateDaysSinceScheduled(scheduledDate);
  const lateMessage =
    daysLate > 0 ? getLateworkoutMessage(scheduledDate) : null;

  const handleStartWorkout = () => {
    router.push({
      pathname: "/workout/workout-session",
      params: {
        planId: plan.plan_id,
        workoutLetter: workoutLetter,
      },
    });
  };

  const handleStartNextWorkout = () => {
    if (!nextWorkout) return;

    router.push({
      pathname: "/workout/workout-session",
      params: {
        planId: plan.plan_id,
        workoutLetter: nextWorkout.workoutLetter,
        scheduledDate: nextWorkout.scheduledDate.toISOString(),
      },
    });
  };

  // If workout is completed, show the completed workout card with banner
  if (completedWorkout && !isRestDay) {
    return (
      <View className="flex-1 bg-gray-50">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <View className="p-4">
            {/* Header - Centered */}
            <View
              className="mb-4"
              style={{ maxWidth: 672, alignSelf: "center", width: "100%" }}
            >
              {/* Week Schedule - Above titles */}
              <WeekSchedule
                plan={plan}
                weekNumber={weekNumber}
                dayInWeek={dayInWeek}
              />

              {/* Plan Name */}
              <Text className="text-sm font-medium text-gray-600 mb-2 text-center">
                {plan.name}
              </Text>

              {/* Workout Name */}
              <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
                {workout.name}
                {!workout.name.includes(`${" "}${workoutLetter}`) && (
                  <Text className="text-blue-600">
                    {" "}
                    (Workout {workoutLetter})
                  </Text>
                )}
              </Text>

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

            {/* Workout Complete Banner */}
            <View
              className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 mb-6 shadow-lg"
              style={{ maxWidth: 672, alignSelf: "center", width: "100%" }}
            >
              <View className="flex-row items-center justify-center">
                <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-4">
                  <Ionicons name="checkmark" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-white mb-1">
                    Workout Complete!
                  </Text>
                  <Text className="text-green-100 text-sm">
                    Great job! You&apos;ve finished today&apos;s workout.
                  </Text>
                </View>
              </View>
            </View>

            {/* Completed Workout Card */}
            <WorkoutCard
              workout={completedWorkout}
              userName={user?.name || "User"}
              userProfileImage={user?.profile_image_url || null}
              userId={user?.user_id}
              planName={plan.name}
              achievements={achievements}
              onWorkoutDeleted={handleWorkoutDeleted}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // Default view - show exercise list and start button
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
            {/* Week Schedule - Above titles */}
            <WeekSchedule
              plan={plan}
              weekNumber={weekNumber}
              dayInWeek={dayInWeek}
            />

            {/* Plan Name */}
            <Text className="text-sm font-medium text-gray-600 mb-2 text-center">
              {plan.name}
            </Text>

            {/* Workout Name */}
            <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
              {isRestDay ? "Rest Day" : workout.name}
              {!isRestDay &&
                !workout.name.includes(`${" "}${workoutLetter}`) && (
                  <Text className="text-blue-600">
                    {" "}
                    (Workout {workoutLetter})
                  </Text>
                )}
            </Text>

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
            <>
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

              {/* Next Workout Card */}
              {nextWorkout && (
                <View
                  className="bg-white rounded-2xl p-6 mb-6 shadow-lg border-2 border-green-100"
                  style={{ maxWidth: 672, alignSelf: "center", width: "100%" }}
                >
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                      <Ionicons name="fitness" size={20} color="#10b981" />
                    </View>
                    <Text className="text-lg font-bold text-gray-900">
                      Next Scheduled Workout
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-xl font-bold text-gray-900 mb-2">
                      {plan.workouts[nextWorkout.workoutLetter]?.name ||
                        `Workout ${nextWorkout.workoutLetter}`}
                    </Text>

                    <View className="flex-row items-center mb-2">
                      <Ionicons name="calendar" size={16} color="#6b7280" />
                      <Text className="text-sm text-gray-600 ml-2">
                        {nextWorkout.daysUntil === 1
                          ? "Tomorrow"
                          : `In ${nextWorkout.daysUntil} days`}
                        {nextWorkout.weekNumber !== null && (
                          <Text className="text-gray-500">
                            {" "}
                            • Week {nextWorkout.weekNumber + 1}
                          </Text>
                        )}
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <Ionicons name="list" size={16} color="#6b7280" />
                      <Text className="text-sm text-gray-600 ml-2">
                        {plan.workouts[nextWorkout.workoutLetter]?.exercises
                          ?.length || 0}{" "}
                        exercises
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleStartNextWorkout}
                    className="bg-green-600 rounded-xl py-3 px-4"
                  >
                    <View className="flex-row items-center justify-center">
                      <Ionicons name="play-circle" size={20} color="white" />
                      <Text className="text-white font-bold text-base ml-2">
                        Do This Workout Now
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </>
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
