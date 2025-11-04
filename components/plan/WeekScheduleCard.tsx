import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
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

  // Get workout duration estimate (55m - 65m for strength workouts)
  const getWorkoutDuration = (workoutLetter: string): string | null => {
    const workout = plan.workouts[workoutLetter];
    if (!workout) return null;

    // Estimate duration based on number of exercises and sets
    const totalExercises = workout.exercises.length;
    if (totalExercises === 0) return null;

    const avgSets =
      workout.exercises.reduce((sum, ex) => sum + ex.sets, 0) / totalExercises;
    const avgRest =
      workout.exercises.reduce((sum, ex) => sum + ex.rest_seconds, 0) /
      totalExercises;

    // Rough estimate: 2-3 minutes per set + rest time
    const estimatedMinutes = Math.round(
      (totalExercises * avgSets * 2.5 + (totalExercises * avgRest) / 60) / 60
    );

    if (estimatedMinutes < 45) return "45m - 55m";
    if (estimatedMinutes < 65) return "55m - 65m";
    if (estimatedMinutes < 75) return "65m - 75m";
    return "75m - 85m";
  };

  // Format workout name for display
  const formatWorkoutName = (
    workoutLetter: string
  ): { name: string; distance: number | null } => {
    const workout = plan.workouts[workoutLetter];
    if (!workout) return { name: workoutLetter, distance: null };

    const name = workout.name;

    // If it's a running workout, try to extract distance
    if (isRunningWorkout(name)) {
      const distance = extractDistance(name);
      if (distance) {
        // Clean up the name to remove distance info if already there
        const cleanName = name.replace(/\s*[·•]\s*\d+\.?\d*\s*km/i, "").trim();
        return { name: `${cleanName} · ${distance}km`, distance };
      }
      return { name, distance: null };
    }

    // For strength workouts, add duration
    const duration = getWorkoutDuration(workoutLetter);
    if (duration) {
      return { name: `${name} · ${duration}`, distance: null };
    }

    return { name, distance: null };
  };

  const weekDistance = calculateWeekDistance();

  // Check if current week
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isCurrentWeek = today >= weekStart && today <= weekEnd;

  return (
    <View
      className={`bg-white rounded-lg p-4 mb-4 ${isCurrentWeek ? "border-2 border-black" : ""}`}
    >
      {/* Header */}
      <View className="mb-3">
        <Text className="text-gray-600 text-sm mb-1">
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
            : { name: workoutLetter, distance: null };
          const isRunning = workout && isRunningWorkout(workout.name);

          return (
            <View key={dayIndex} className="flex-row items-center mb-2">
              {/* Color indicator */}
              <View
                className={`w-4 h-4 rounded mr-3 ${
                  isRunning ? "bg-green-500" : "bg-blue-500"
                }`}
              />
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
    </View>
  );
};

export default WeekScheduleCard;
