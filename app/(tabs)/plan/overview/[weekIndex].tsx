import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FullPageTopBar from "../../../../components/layout/FullPageTopBar";
import PlanOverviewWorkoutCard from "../../../../components/plan/PlanOverviewWorkoutCard";
import ProgressBars from "../../../../components/ui/ProgressBars";
import { useAuth } from "../../../../lib/context/AuthContext";
import {
  getActivePlan,
  getWeekWorkoutsWithDetails,
  type Plan as PlanType,
} from "../../../../lib/functions/planFunctions";

interface WeekWorkout {
  workoutLetter: string;
  workoutName: string;
  scheduledDate: Date;
  dayName: string;
  dayIndex: number;
  isCompleted: boolean;
  exerciseCount: number;
}

const PlanOverview = () => {
  const { user } = useAuth();
  const { weekIndex: weekIndexParam } = useLocalSearchParams<{
    weekIndex: string;
  }>();
  const weekIndex = parseInt(weekIndexParam || "0", 10);

  const [isLoading, setIsLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<PlanType | null>(null);
  const [weekWorkouts, setWeekWorkouts] = useState<WeekWorkout[]>([]);

  const loadWeekData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const plan = await getActivePlan(user.user_id);
      setActivePlan(plan);

      if (plan) {
        // Calculate week dates
        let effectiveStartDate = new Date(plan.start_date);

        if (plan.plan_type === "repeat") {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const planStart = new Date(plan.start_date);
          planStart.setHours(0, 0, 0, 0);

          const daysElapsed = Math.floor(
            (today.getTime() - planStart.getTime()) / (1000 * 60 * 60 * 24)
          );

          const cycleLength = plan.num_weeks * 7;
          const currentCycle = Math.floor(daysElapsed / cycleLength);

          effectiveStartDate = new Date(planStart);
          effectiveStartDate.setDate(
            planStart.getDate() + currentCycle * cycleLength
          );
        }

        const weekStartDate = new Date(effectiveStartDate);
        weekStartDate.setDate(effectiveStartDate.getDate() + weekIndex * 7);
        weekStartDate.setHours(0, 0, 0, 0);
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);
        weekEndDate.setHours(23, 59, 59, 999);

        // Get week workouts
        const workouts = await getWeekWorkoutsWithDetails(
          plan,
          weekStartDate,
          weekEndDate,
          weekIndex,
          user.user_id
        );
        setWeekWorkouts(workouts);
      }
    } catch (error) {
      console.error("Error loading week data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, weekIndex]);

  useFocusEffect(
    useCallback(() => {
      loadWeekData();
    }, [loadWeekData])
  );

  const handlePrevWeek = () => {
    if (weekIndex > 0) {
      router.replace({
        pathname: "/plan/overview/[weekIndex]",
        params: { weekIndex: (weekIndex - 1).toString() },
      });
    }
  };

  const handleNextWeek = () => {
    if (activePlan && weekIndex < activePlan.num_weeks - 1) {
      router.replace({
        pathname: "/plan/overview/[weekIndex]",
        params: { weekIndex: (weekIndex + 1).toString() },
      });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["bottom", "left", "right"]}
      >
        <FullPageTopBar title="Plan Overview" rightIcons={[]} />
        <View className="flex-1 items-center justify-center bg-gray-50">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-600 mt-4">Loading week overview...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activePlan) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["bottom", "left", "right"]}
      >
        <FullPageTopBar title="Plan Overview" rightIcons={[]} />
        <View className="flex-1 items-center justify-center bg-gray-50">
          <Text className="text-gray-600 text-center">
            No active plan found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate total exercises
  const totalExercises = weekWorkouts.reduce(
    (sum, workout) => sum + workout.exerciseCount,
    0
  );

  // Calculate completed days for progress bars (7 bars for the week)
  const completedDays = weekWorkouts.filter((w) => w.isCompleted).length;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FullPageTopBar title="Plan Overview" rightIcons={[]} />
      <View className="flex-1 bg-gray-50">
        <ScrollView className="flex-1 p-4">
          {/* Week Selector */}
          <View className="flex-row items-center justify-center mb-4">
            <TouchableOpacity
              onPress={handlePrevWeek}
              disabled={weekIndex === 0}
              className={`p-2 ${weekIndex === 0 ? "opacity-30" : ""}`}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={weekIndex === 0 ? "#999" : "#000"}
              />
            </TouchableOpacity>
            <View className="flex-row items-center mx-4">
              <Text className="text-lg font-bold text-gray-900">
                Week {weekIndex + 1}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#000" />
            </View>
            <TouchableOpacity
              onPress={handleNextWeek}
              disabled={weekIndex >= activePlan.num_weeks - 1}
              className={`p-2 ${
                weekIndex >= activePlan.num_weeks - 1 ? "opacity-30" : ""
              }`}
            >
              <Ionicons
                name="chevron-forward"
                size={24}
                color={weekIndex >= activePlan.num_weeks - 1 ? "#999" : "#000"}
              />
            </TouchableOpacity>
          </View>

          {/* Progress Bars - 7 bars for the week */}
          <View className="mb-4">
            <ProgressBars total={7} completed={completedDays} />
          </View>

          {/* Summary Stats */}
          <View className="mb-6">
            <Text className="text-gray-600 text-sm mb-1">
              Total Workouts:{" "}
              <Text className="font-semibold text-gray-900">
                {weekWorkouts.length}
              </Text>
            </Text>
            <Text className="text-gray-600 text-sm">
              Total Exercises:{" "}
              <Text className="font-semibold text-gray-900">
                {totalExercises}
              </Text>
            </Text>
          </View>

          {/* Workout List */}
          <View>
            {weekWorkouts.map((workout, index) => (
              <PlanOverviewWorkoutCard
                key={`${workout.workoutLetter}-${workout.dayIndex}`}
                workout={workout}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default PlanOverview;
