import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useAuth } from "../../../lib/context/AuthContext";
import {
  getWeekWorkoutsWithDetails,
  Plan,
} from "../../../lib/functions/planFunctions";
import {
  DatabaseWorkout,
  getTodaysCompletedWorkout,
} from "../../../lib/functions/workoutFunctions";
import {
  calculateDaysSinceScheduled,
  getLateworkoutMessage,
  getWeekStartDateForIndex,
} from "../../../lib/utils/schedule";
import PlanWorkoutCTA from "../../plan-workout/PlanWorkoutCTA";
import RecordWorkoutCard from "./RecordWorkoutCard";
import PlanWeekSlider from "./schedule/PlanWeekSlider";
import WeekOverviewCard from "./WeekOverviewCard";

interface RecordDayWorkoutViewProps {
  plan: Plan;
  weekIndex: number;
  selectedDayIndex: number;
  onDaySelect: (dayIndex: number) => void;
  onWeekChange: (weekIndex: number) => void;
}

const RecordDayWorkoutView: React.FC<RecordDayWorkoutViewProps> = ({
  plan,
  weekIndex,
  selectedDayIndex,
  onDaySelect,
  onWeekChange,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [weekWorkouts, setWeekWorkouts] = useState<
    {
      workoutLetter: string;
      workoutName: string;
      scheduledDate: Date;
      dayName: string;
      dayIndex: number;
      isCompleted: boolean;
      exerciseCount: number;
      workoutId?: string | null;
    }[]
  >([]);
  const [completedWorkout, setCompletedWorkout] =
    useState<DatabaseWorkout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialMount = React.useRef(true);

  // Calculate week start date using absolute week index
  const weekStartDate = useMemo(() => {
    const planStart = new Date(plan.start_date);
    planStart.setHours(0, 0, 0, 0);
    return getWeekStartDateForIndex(planStart, weekIndex);
  }, [plan.start_date, weekIndex]);

  // Get the schedule index for this week (for recurring plans, use modulo)
  const weekScheduleIndex = useMemo(() => {
    if (plan.plan_type === "repeat") {
      return weekIndex % plan.num_weeks;
    }
    return weekIndex;
  }, [plan.plan_type, plan.num_weeks, weekIndex]);

  // Get all selected day workouts (can be multiple per day)
  const selectedDayWorkouts = weekWorkouts.filter(
    (w) => w.dayIndex === selectedDayIndex
  );

  // Check if it's a rest day (no workouts or all workouts are rest)
  const daySchedule = plan.schedule[weekScheduleIndex]?.[selectedDayIndex];
  const isRestDay = (() => {
    if (!daySchedule) return true;

    // Handle both string and array formats
    let workoutLetters = Array.isArray(daySchedule)
      ? daySchedule
      : [daySchedule];

    // Handle comma-separated strings from AI
    workoutLetters = workoutLetters.flatMap((letter) => {
      if (typeof letter === "string" && letter.includes(",")) {
        return letter.split(",").map((l) => l.trim());
      }
      return letter;
    });

    const allRest = workoutLetters.every(
      (letter) => !letter || letter.toLowerCase() === "rest"
    );

    return selectedDayWorkouts.length === 0 || allRest;
  })();

  // Load week workouts
  useEffect(() => {
    const loadWeekWorkouts = async () => {
      if (!user) {
        setIsLoading(false);
        isInitialMount.current = false;
        return;
      }

      try {
        // Only show loading on initial mount, not when switching weeks
        if (isInitialMount.current) {
          setIsLoading(true);
        }
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);
        weekEndDate.setHours(23, 59, 59, 999);

        const workouts = await getWeekWorkoutsWithDetails(
          plan,
          weekStartDate,
          weekEndDate,
          weekScheduleIndex,
          user.user_id
        );
        setWeekWorkouts(workouts);
      } catch (error) {
        console.error("Error loading week workouts:", error);
      } finally {
        setIsLoading(false);
        isInitialMount.current = false;
      }
    };

    loadWeekWorkouts();
  }, [user, plan, weekIndex, weekStartDate, weekScheduleIndex]);

  // Check if any workout has been completed (for showing completion banner)
  useEffect(() => {
    const checkCompletedWorkout = async () => {
      if (!user || selectedDayWorkouts.length === 0 || isRestDay) {
        setCompletedWorkout(null);
        return;
      }

      try {
        // Check the first workout for completion status
        // (We'll show completion banner if at least one is completed)
        const firstWorkout = selectedDayWorkouts[0];
        if (firstWorkout && firstWorkout.workoutLetter) {
          const workout = await getTodaysCompletedWorkout(
            user.user_id,
            plan.plan_id,
            firstWorkout.workoutLetter,
            firstWorkout.scheduledDate
          );

          setCompletedWorkout(workout);
        }
      } catch (error) {
        console.error("Error checking completed workout:", error);
        setCompletedWorkout(null);
      }
    };

    checkCompletedWorkout();
  }, [user, plan.plan_id, selectedDayWorkouts, isRestDay]);

  const handleStartWorkout = (workoutLetter?: string) => {
    // If workout letter is provided, start that specific workout
    // Otherwise, start the first incomplete workout
    const targetWorkout = workoutLetter
      ? selectedDayWorkouts.find((w) => w.workoutLetter === workoutLetter)
      : selectedDayWorkouts.find((w) => !w.isCompleted) ||
        selectedDayWorkouts[0];

    if (!targetWorkout) return;

    router.push({
      pathname: "/workout/workout-session",
      params: {
        planId: plan.plan_id,
        workoutLetter: targetWorkout.workoutLetter,
        scheduledDate: targetWorkout.scheduledDate.toISOString(),
      },
    });
  };

  // Calculate if any workout is late
  const daysLate =
    selectedDayWorkouts.length > 0
      ? calculateDaysSinceScheduled(selectedDayWorkouts[0].scheduledDate)
      : 0;
  const lateMessage =
    selectedDayWorkouts.length > 0 && daysLate > 0
      ? getLateworkoutMessage(selectedDayWorkouts[0].scheduledDate)
      : null;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-gray-600">Loading...</Text>
      </View>
    );
  }

  // If all workouts are completed, show the completed banner
  const allWorkoutsCompleted =
    selectedDayWorkouts.length > 0 &&
    selectedDayWorkouts.every((w) => w.isCompleted);

  if (completedWorkout && !isRestDay && allWorkoutsCompleted) {
    return (
      <View className="flex-1 bg-gray-100">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Week Schedule */}
          <PlanWeekSlider
            plan={plan}
            initialWeekIndex={weekIndex}
            selectedDayIndex={selectedDayIndex}
            onDaySelect={onDaySelect}
            onWeekChange={onWeekChange}
          />

          <View className="p-4">
            {/* Workout Complete Banner */}
            <View className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 mb-6 shadow-lg">
              <View className="flex-row items-center justify-center">
                <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-4">
                  <Ionicons name="checkmark" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-white mb-1">
                    {selectedDayWorkouts.length > 1
                      ? "All Workouts Complete!"
                      : "Workout Complete!"}
                  </Text>
                  <Text className="text-green-100 text-sm">
                    Great job! You&apos;ve finished{" "}
                    {selectedDayWorkouts.length > 1
                      ? "all workouts"
                      : "this workout"}{" "}
                    for today.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Default view
  return (
    <View className="flex-1 bg-gray-100">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Week Schedule */}
        <PlanWeekSlider
          plan={plan}
          initialWeekIndex={weekIndex}
          selectedDayIndex={selectedDayIndex}
          onDaySelect={onDaySelect}
          onWeekChange={onWeekChange}
        />

        <View className="p-4">
          {/* Conditional Content */}
          {isRestDay ? (
            /* Rest Day Content */
            <View className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
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
          ) : selectedDayWorkouts.length > 0 ? (
            /* Workout Day Content */
            <>
              <Text className="text-gray-900 text-md font-bold mb-5 mt-1">
                {selectedDayWorkouts.length > 1 ? "Workouts" : "Workout"}
              </Text>

              {/* Multiple Workout Cards - stacked vertically */}
              {selectedDayWorkouts.map((workout, index) => (
                <View
                  key={`${workout.workoutLetter}-${index}`}
                  className="mb-4"
                >
                  <RecordWorkoutCard
                    workout={{
                      workoutLetter: workout.workoutLetter,
                      workoutName: workout.workoutName,
                      scheduledDate: workout.scheduledDate,
                      dayName: workout.dayName,
                      dayIndex: workout.dayIndex,
                      exerciseCount: workout.exerciseCount,
                      workoutId: workout.workoutId,
                    }}
                  />
                </View>
              ))}

              {/* Week Overview Card */}
              {weekWorkouts.length > 0 && (
                <WeekOverviewCard
                  plan={plan}
                  weekIndex={weekIndex}
                  weekWorkouts={weekWorkouts}
                />
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
            </>
          ) : null}
        </View>
      </ScrollView>

      {/* Fixed Record Workout Button - Only show for workout days with incomplete workouts */}
      {!isRestDay &&
        selectedDayWorkouts.length > 0 &&
        !allWorkoutsCompleted && (
          <PlanWorkoutCTA
            onStart={() => handleStartWorkout()}
            disabled={false}
            label={
              selectedDayWorkouts.length > 1
                ? "Start Next Workout"
                : "Start Workout"
            }
          />
        )}
    </View>
  );
};

export default RecordDayWorkoutView;
