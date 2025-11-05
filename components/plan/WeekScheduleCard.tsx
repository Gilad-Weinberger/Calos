import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Plan } from "../../lib/functions/planFunctions";
import { getWeekWorkoutProgress } from "../../lib/functions/planFunctions";
import ProgressBars from "../ui/ProgressBars";

interface WeekScheduleCardProps {
  plan: Plan;
  weekIndex: number;
  startDate: Date;
}

const WeekScheduleCard: React.FC<WeekScheduleCardProps> = ({
  plan,
  weekIndex,
  startDate,
}) => {
  // For recurring plans, calculate current cycle and use those dates
  let effectiveStartDate = new Date(startDate);

  if (plan.plan_type === "repeat") {
    // Calculate which cycle we're currently in
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const planStart = new Date(startDate);
    planStart.setHours(0, 0, 0, 0);

    const daysElapsed = Math.floor(
      (today.getTime() - planStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate current cycle (0-indexed)
    const cycleLength = plan.num_weeks * 7;
    const currentCycle = Math.floor(daysElapsed / cycleLength);

    // Calculate the start date for the current cycle
    effectiveStartDate = new Date(planStart);
    effectiveStartDate.setDate(
      planStart.getDate() + currentCycle * cycleLength
    );
  }

  // Calculate week start and end dates based on effective start date
  const weekStart = new Date(effectiveStartDate);
  weekStart.setDate(effectiveStartDate.getDate() + weekIndex * 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Format date range
  const formatDateRange = (start: Date, end: Date): string => {
    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    const startMonth = months[start.getMonth()];
    const endMonth = months[end.getMonth()];
    const startDay = start.getDate();
    const endDay = end.getDate();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  };

  // Get week schedule
  const weekSchedule = plan.schedule[weekIndex] || [];

  // Calculate total workouts (non-rest days)
  const totalWorkouts = weekSchedule.filter(
    (day) => day && day.toLowerCase() !== "rest" && day.trim() !== ""
  ).length;

  // State for workout progress
  const [workoutProgress, setWorkoutProgress] = useState<{
    total: number;
    completed: number;
  }>({ total: totalWorkouts, completed: 0 });

  // Fetch workout progress for this week
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const progress = await getWeekWorkoutProgress(
          plan,
          weekStart,
          weekEnd,
          weekIndex
        );
        setWorkoutProgress({
          total: progress.totalWorkoutsThisWeek,
          completed: progress.completedWorkoutsThisWeek,
        });
      } catch (error) {
        console.error("Error fetching week workout progress:", error);
        // Keep default values on error
      }
    };

    fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.plan_id, weekIndex, weekStart.toISOString(), weekEnd.toISOString()]);

  // Day names
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

  // Extract distance from workout name
  const extractDistance = (workoutName: string): number | null => {
    const distanceMatch = workoutName.match(/(\d+\.?\d*)\s*km/i);
    if (distanceMatch) {
      return parseFloat(distanceMatch[1]);
    }
    return null;
  };

  // Calculate total distance for the week
  const calculateWeekDistance = (): number => {
    let totalDistance = 0;
    weekSchedule.forEach((workoutLetter) => {
      if (workoutLetter && workoutLetter.toLowerCase() !== "rest") {
        const workout = plan.workouts[workoutLetter];
        if (workout && isRunningWorkout(workout.name)) {
          const distance = extractDistance(workout.name);
          if (distance) {
            totalDistance += distance;
          }
        }
      }
    });
    return totalDistance;
  };

  // Get exercise count for strength workouts
  const getExerciseCount = (workoutLetter: string): number | null => {
    const workout = plan.workouts[workoutLetter];
    if (!workout || workout.exercises.length === 0) return null;
    return workout.exercises.length;
  };

  // Format workout name for display
  const formatWorkoutName = (workoutLetter: string): { name: string } => {
    const workout = plan.workouts[workoutLetter];
    if (!workout) return { name: workoutLetter };

    const name = workout.name;

    // For strength workouts, add exercise count
    const exerciseCount = getExerciseCount(workoutLetter);
    if (exerciseCount !== null) {
      return { name: `${name} · ${exerciseCount} exercises` };
    }

    return { name };
  };

  const weekDistance = calculateWeekDistance();

  // Check if current week
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isCurrentWeek = today >= weekStart && today <= weekEnd;

  const handlePress = () => {
    router.push({
      pathname: "/plan/overview/[weekIndex]",
      params: { weekIndex: weekIndex.toString() },
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      className={`bg-white rounded-lg p-4 mb-4 ${isCurrentWeek ? "border-2 border-black" : ""}`}
    >
      {/* Header */}
      <View className="mb-3">
        <Text className="text-gray-600 text-xs font-semibold mb-1">
          {formatDateRange(weekStart, weekEnd)}
        </Text>
        <Text className="text-xl font-bold text-gray-900">
          Week {weekIndex + 1}
        </Text>
      </View>

      {/* Progress Bars - Workouts Done This Week */}
      <View className="mb-4">
        <ProgressBars
          total={workoutProgress.total}
          completed={workoutProgress.completed}
        />
      </View>

      {/* Summary Stats */}
      <View className="flex-row justify-between mb-4">
        <Text className="text-gray-600 text-sm">
          Total Workouts:{" "}
          <Text className="font-semibold text-gray-900">{totalWorkouts}</Text>
        </Text>
        {weekDistance > 0 && (
          <Text className="text-gray-600 text-sm">
            Distance:{" "}
            <Text className="font-semibold text-gray-900">
              {weekDistance.toFixed(2)}km
            </Text>
          </Text>
        )}
      </View>

      {/* Daily Schedule */}
      <View>
        {dayNames.map((dayName, dayIndex) => {
          const workoutLetter = weekSchedule[dayIndex];
          const isRest =
            !workoutLetter ||
            workoutLetter.toLowerCase() === "rest" ||
            workoutLetter.trim() === "";

          if (isRest) {
            return null; // Don't show rest days
          }

          const workout = plan.workouts[workoutLetter];
          const workoutInfo = workout
            ? formatWorkoutName(workoutLetter)
            : { name: workoutLetter };
          const isRunning = workout && isRunningWorkout(workout.name);

          return (
            <View key={dayIndex} className="flex-row items-center mb-2">
              {/* Color indicator */}
              {isRunning ? (
                <LinearGradient
                  colors={["#22c55e", "#4ade80", "#86efac"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="w-4 h-4 rounded mr-3"
                />
              ) : (
                <LinearGradient
                  colors={["#3b82f6", "#60a5fa", "#93c5fd"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="w-4 h-4 rounded mr-3"
                />
              )}
              {/* Day and workout */}
              <View className="flex-1">
                <Text className="text-gray-900 text-sm">
                  <Text className="font-semibold">{dayName}:</Text>{" "}
                  {workoutInfo.name}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
};

export default WeekScheduleCard;
