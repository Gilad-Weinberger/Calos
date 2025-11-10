import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FullPageTopBar from "../../../components/layout/FullPageTopBar";
import { PlanWeekOverviewContent } from "../../../components/plan/week-overview";
import { useAuth } from "../../../lib/context/AuthContext";
import {
  getActivePlan,
  getWeekWorkoutsWithDetails,
  type Plan as PlanType,
} from "../../../lib/functions/planFunctions";
import {
  getAbsoluteWeekNumber,
  getWeekStartDateForIndex,
} from "../../../lib/utils/schedule";

interface WeekWorkout {
  workoutLetter: string;
  workoutName: string;
  scheduledDate: Date;
  dayName: string;
  dayIndex: number;
  isCompleted: boolean;
  exerciseCount: number;
  workoutId?: string | null;
}

const PlanWeekOverview = () => {
  const { user } = useAuth();
  const { weekIndex: weekIndexParam } = useLocalSearchParams<{
    weekIndex?: string;
  }>();

  // Parse weekIndex from params or default to 0 (will be set to current week after plan loads)
  const [weekIndex, setWeekIndex] = useState(() => {
    if (weekIndexParam && !isNaN(parseInt(weekIndexParam, 10))) {
      return parseInt(weekIndexParam, 10);
    }
    return 0; // Will be set to current week after plan loads
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<PlanType | null>(null);
  const [allWeeksData, setAllWeeksData] = useState<Map<number, WeekWorkout[]>>(
    new Map()
  );

  const loadAllWeeksData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const plan = await getActivePlan(user.user_id);
      setActivePlan(plan);

      if (plan) {
        // Calculate current week if weekIndex wasn't provided in params
        if (!weekIndexParam || isNaN(parseInt(weekIndexParam, 10))) {
          const planStart = new Date(plan.start_date);
          const currentWeek = getAbsoluteWeekNumber(planStart);
          setWeekIndex(currentWeek);
        } else {
          // Use the weekIndex from params
          const parsedWeekIndex = parseInt(weekIndexParam, 10);
          setWeekIndex((prevWeekIndex) =>
            prevWeekIndex !== parsedWeekIndex ? parsedWeekIndex : prevWeekIndex
          );
        }

        // Calculate effective start date for recurring plans
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

        // Fetch all weeks data
        const weeksDataMap = new Map<number, WeekWorkout[]>();

        // For recurring plans, we'll fetch a reasonable number of weeks
        // For non-recurring plans, fetch all weeks
        const maxWeeks =
          plan.plan_type === "repeat"
            ? Math.max(plan.num_weeks * 2, 20) // At least 2 cycles or 20 weeks
            : plan.num_weeks;

        // Fetch data for all weeks
        const fetchPromises = [];
        for (let weekIdx = 0; weekIdx < maxWeeks; weekIdx++) {
          const weekStartDate = getWeekStartDateForIndex(
            effectiveStartDate,
            weekIdx
          );
          weekStartDate.setHours(0, 0, 0, 0);
          const weekEndDate = new Date(weekStartDate);
          weekEndDate.setDate(weekStartDate.getDate() + 6);
          weekEndDate.setHours(23, 59, 59, 999);

          // For recurring plans, use modulo for schedule index
          const scheduleWeekIndex =
            plan.plan_type === "repeat" ? weekIdx % plan.num_weeks : weekIdx;

          fetchPromises.push(
            getWeekWorkoutsWithDetails(
              plan,
              weekStartDate,
              weekEndDate,
              scheduleWeekIndex,
              user.user_id
            ).then((workouts) => {
              weeksDataMap.set(weekIdx, workouts);
            })
          );
        }

        await Promise.all(fetchPromises);
        setAllWeeksData(weeksDataMap);
      }
    } catch (error) {
      console.error("Error loading all weeks data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, weekIndexParam]);

  useFocusEffect(
    useCallback(() => {
      loadAllWeeksData();
    }, [loadAllWeeksData])
  );

  const handlePrevWeek = () => {
    if (weekIndex > 0) {
      setWeekIndex(weekIndex - 1);
    }
  };

  const handleNextWeek = () => {
    if (activePlan) {
      const maxWeekIndex =
        activePlan.plan_type === "repeat"
          ? Infinity // No limit for recurring plans
          : activePlan.num_weeks - 1;

      if (weekIndex < maxWeekIndex) {
        setWeekIndex(weekIndex + 1);
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "bottom", "left", "right"]}
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
        edges={["top", "bottom", "left", "right"]}
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

  // Get current week's data from the map
  const currentWeekWorkouts = allWeeksData.get(weekIndex) || [];

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      edges={["top", "bottom", "left", "right"]}
    >
      <FullPageTopBar title="Plan Overview" rightIcons={[]} />
      <PlanWeekOverviewContent
        weekIndex={weekIndex}
        weekWorkouts={currentWeekWorkouts}
        activePlan={activePlan}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
      />
    </SafeAreaView>
  );
};

export default PlanWeekOverview;
