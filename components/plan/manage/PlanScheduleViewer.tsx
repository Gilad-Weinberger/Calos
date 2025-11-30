import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, View } from "react-native";
import type { Plan } from "../../../lib/functions/planFunctions";

interface PlanScheduleViewerProps {
  plan: Plan;
}

const PlanScheduleViewer: React.FC<PlanScheduleViewerProps> = ({ plan }) => {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Determine if workout is running/walking (green) or strength (blue)
  const isRunningWorkout = (workoutName: string): boolean => {
    const name = workoutName.toLowerCase();
    return (
      name.includes("run") ||
      name.includes("walk") ||
      name.includes("km") ||
      name.includes("distance") ||
      name.includes("cardio") ||
      name.includes("jog")
    );
  };

  // Get exercise count for strength workouts
  const getExerciseCount = (workoutLetter: string): number | null => {
    const workout = plan.workouts[workoutLetter];
    if (!workout || workout.exercises.length === 0) return null;
    return workout.exercises.length;
  };

  // Format workout name for display
  const formatWorkoutName = (workoutLetter: string): string => {
    const workout = plan.workouts[workoutLetter];
    if (!workout) return workoutLetter;

    const name = workout.name;

    // For strength workouts, add exercise count
    const exerciseCount = getExerciseCount(workoutLetter);
    if (exerciseCount !== null) {
      return `${name} · ${exerciseCount} exercises`;
    }

    return name;
  };

  // Extract distance from workout name
  const extractDistance = (workoutName: string): number | null => {
    const distanceMatch = workoutName.match(/(\d+\.?\d*)\s*km/i);
    if (distanceMatch) {
      return parseFloat(distanceMatch[1]);
    }
    return null;
  };

  // Calculate total distance for a week
  const calculateWeekDistance = (
    weekSchedule: (string | string[])[]
  ): number => {
    let totalDistance = 0;
    weekSchedule.forEach((day) => {
      const workoutLetters = Array.isArray(day) ? day : [day];
      workoutLetters.forEach((workoutLetter) => {
        if (
          workoutLetter &&
          typeof workoutLetter === "string" &&
          workoutLetter.toLowerCase() !== "rest"
        ) {
          const workout = plan.workouts[workoutLetter];
          if (workout && isRunningWorkout(workout.name)) {
            const distance = extractDistance(workout.name);
            if (distance) {
              totalDistance += distance;
            }
          }
        }
      });
    });
    return totalDistance;
  };

  // Calculate total workouts for a week (non-rest days)
  const calculateTotalWorkouts = (
    weekSchedule: (string | string[])[]
  ): number => {
    return weekSchedule.filter((day) => {
      if (!day) return false;
      const workoutLetters = Array.isArray(day) ? day : [day];
      return workoutLetters.some(
        (letter) =>
          letter &&
          typeof letter === "string" &&
          letter.toLowerCase() !== "rest" &&
          letter.trim() !== ""
      );
    }).length;
  };

  return (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200">
      {/* Header */}
      <View className="mb-4">
        <Text className="text-lg font-bold text-gray-900 mb-1">Schedule</Text>
        <Text className="text-sm text-gray-600">
          {plan.num_weeks} {plan.num_weeks === 1 ? "week" : "weeks"} ·{" "}
          {plan.plan_type === "repeat" ? "Repeating" : "Single cycle"}
        </Text>
      </View>

      {/* Week Cards */}
      {plan.schedule.map((weekSchedule, weekIndex) => {
        const totalWorkouts = calculateTotalWorkouts(weekSchedule);
        const weekDistance = calculateWeekDistance(weekSchedule);

        return (
          <View
            key={weekIndex}
            className="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-100"
          >
            {/* Week Header */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold text-gray-900">
                Week {weekIndex + 1}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-xs text-gray-600 mr-3">
                  {totalWorkouts} workout{totalWorkouts !== 1 ? "s" : ""}
                </Text>
                {weekDistance > 0 && (
                  <Text className="text-xs text-gray-600">
                    {weekDistance.toFixed(1)}km
                  </Text>
                )}
              </View>
            </View>

            {/* Daily Schedule */}
            <View>
              {dayNames.map((dayName, dayIndex) => {
                const day = weekSchedule[dayIndex];
                const workoutLetters = Array.isArray(day) ? day : [day];
                
                // Check if it's a rest day
                const isRest = !day || workoutLetters.every(
                  (letter) => !letter || (typeof letter === 'string' && (letter.toLowerCase() === "rest" || letter.trim() === ""))
                );

                if (isRest) {
                  return null; // Don't show rest days
                }

                // Handle multiple workouts per day
                const workoutNames = workoutLetters
                  .filter((letter) => letter && typeof letter === 'string' && letter.toLowerCase() !== "rest" && letter.trim() !== "")
                  .map((letter) => {
                    const workout = plan.workouts[letter];
                    return workout ? formatWorkoutName(letter) : letter;
                  });

                if (workoutNames.length === 0) {
                  return null;
                }

                // Determine color based on first workout
                const firstLetter = workoutLetters[0];
                const firstWorkout = typeof firstLetter === 'string' ? plan.workouts[firstLetter] : null;
                const isRunning = firstWorkout && isRunningWorkout(firstWorkout.name);

                return (
                  <View key={dayIndex} className="flex-row items-center mb-2">
                    {/* Color indicator */}
                    <LinearGradient
                      colors={
                        isRunning
                          ? ["#10b981", "#34d399", "#6ee7b7"]
                          : ["#3b82f6", "#60a5fa", "#93c5fd"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="w-3 h-3 rounded mr-2"
                    />
                    {/* Day and workout */}
                    <View className="flex-1">
                      <Text className="text-gray-900 text-xs">
                        <Text className="font-semibold">{dayName}:</Text>{" "}
                        {workoutNames.join(" + ")}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default PlanScheduleViewer;
