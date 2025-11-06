import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
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
import PlanWeekSlider from "../../plan/schedule/PlanWeekSlider";
import CompletedWorkoutCard from "./CompletedWorkoutCard";

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

  // Get selected day workout
  const selectedDayWorkout = weekWorkouts.find(
    (w) => w.dayIndex === selectedDayIndex
  );

  const isRestDay =
    !selectedDayWorkout ||
    !plan.schedule[weekScheduleIndex]?.[selectedDayIndex] ||
    plan.schedule[weekScheduleIndex][selectedDayIndex].toLowerCase() === "rest";

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

  // Check if selected day workout has been completed
  useEffect(() => {
    const checkCompletedWorkout = async () => {
      if (
        !user ||
        !selectedDayWorkout ||
        isRestDay ||
        !selectedDayWorkout.workoutLetter
      ) {
        setCompletedWorkout(null);
        return;
      }

      try {
        const workout = await getTodaysCompletedWorkout(
          user.user_id,
          plan.plan_id,
          selectedDayWorkout.workoutLetter,
          selectedDayWorkout.scheduledDate
        );

        setCompletedWorkout(workout);
      } catch (error) {
        console.error("Error checking completed workout:", error);
        setCompletedWorkout(null);
      }
    };

    checkCompletedWorkout();
  }, [user, plan.plan_id, selectedDayWorkout, isRestDay]);

  const handleStartWorkout = () => {
    if (!selectedDayWorkout) return;

    router.push({
      pathname: "/workout/workout-session",
      params: {
        planId: plan.plan_id,
        workoutLetter: selectedDayWorkout.workoutLetter,
        scheduledDate: selectedDayWorkout.scheduledDate.toISOString(),
      },
    });
  };

  // Calculate if workout is late
  const daysLate = selectedDayWorkout
    ? calculateDaysSinceScheduled(selectedDayWorkout.scheduledDate)
    : 0;
  const lateMessage =
    selectedDayWorkout && daysLate > 0
      ? getLateworkoutMessage(selectedDayWorkout.scheduledDate)
      : null;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-gray-600">Loading...</Text>
      </View>
    );
  }

  // If workout is completed, show the completed workout card
  if (completedWorkout && !isRestDay && selectedDayWorkout) {
    return (
      <View className="flex-1 bg-gray-100">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <View className="p-4">
            {/* Week Schedule */}
            <PlanWeekSlider
              plan={plan}
              initialWeekIndex={weekIndex}
              selectedDayIndex={selectedDayIndex}
              onDaySelect={onDaySelect}
              onWeekChange={onWeekChange}
            />

            {/* Workout Complete Banner */}
            <View className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 mb-6 shadow-lg">
              <View className="flex-row items-center justify-center">
                <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-4">
                  <Ionicons name="checkmark" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-white mb-1">
                    Workout Complete!
                  </Text>
                  <Text className="text-green-100 text-sm">
                    Great job! You&apos;ve finished this workout.
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
          ) : selectedDayWorkout ? (
            /* Workout Day Content */
            <>
              <Text className="text-gray-900 text-md font-bold mb-5 mt-1">
                Workouts
              </Text>
              {/* Workout Card */}
              <CompletedWorkoutCard
                workout={{
                  workoutLetter: selectedDayWorkout.workoutLetter,
                  workoutName: selectedDayWorkout.workoutName,
                  scheduledDate: selectedDayWorkout.scheduledDate,
                  dayName: selectedDayWorkout.dayName,
                  dayIndex: selectedDayWorkout.dayIndex,
                  exerciseCount: selectedDayWorkout.exerciseCount,
                }}
              />

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

      {/* Fixed Record Workout Button - Only show for workout days */}
      {!isRestDay && selectedDayWorkout && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-4 pb-8">
          <TouchableOpacity
            onPress={handleStartWorkout}
            className="bg-black rounded-2xl py-4 px-6 shadow-lg"
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="play" size={20} color="white" />
              <Text className="text-white font-bold text-lg ml-2">
                Record workout
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default RecordDayWorkoutView;

