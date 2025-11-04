import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "../../components/layout/TopBar";
import PlanCardHeader from "../../components/plan/PlanCardHeader";
import WeekScheduleCard from "../../components/plan/WeekScheduleCard";
import { useAuth } from "../../lib/context/AuthContext";
import {
  getActivePlan,
  getPlanProgress,
  type Plan as PlanType,
} from "../../lib/functions/planFunctions";

interface PlanProgress {
  completedWorkouts: number;
  totalWorkouts: number;
  completedWeeks: number;
  endDate: Date | null;
}

const Plan = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<PlanType | null>(null);
  const [planProgress, setPlanProgress] = useState<PlanProgress | null>(null);

  const loadActivePlan = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const plan = await getActivePlan(user.user_id);
      setActivePlan(plan);

      if (plan) {
        // Check and create next week workouts if needed (for recurring plans)
        const { checkAndCreateNextWeekWorkouts } = await import(
          "../../lib/functions/planFunctions"
        );
        await checkAndCreateNextWeekWorkouts(plan, user.user_id);

        // Load plan progress statistics
        const progress = await getPlanProgress(plan);
        setPlanProgress(progress);
      } else {
        setPlanProgress(null);
      }
    } catch (error) {
      console.error("Error loading active plan:", error);
      setActivePlan(null);
      setPlanProgress(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Reload plan when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadActivePlan();
    }, [loadActivePlan])
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-white">
        <TopBar title="Your Plan" icons={[]} />
        <SafeAreaView
          className="flex-1 items-center justify-center bg-gray-50"
          edges={["bottom", "left", "right"]}
        >
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-600 mt-4">Loading plan...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1bg-white">
      <TopBar title="Your Plan" icons={[]} />
      <SafeAreaView
        className="flex-1 bg-gray-50"
        edges={["bottom", "left", "right"]}
      >
        {!activePlan ? (
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-gray-600 text-center">
              No active plan found. Create a plan to get started.
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1 p-4">
            {planProgress && (
              <PlanCardHeader
                plan={activePlan}
                completedWorkouts={planProgress.completedWorkouts}
                totalWorkouts={planProgress.totalWorkouts}
                completedWeeks={planProgress.completedWeeks}
                endDate={planProgress.endDate}
              />
            )}
            {activePlan && (
              <>
                {Array.from({ length: activePlan.num_weeks }).map(
                  (_, weekIndex) => (
                    <WeekScheduleCard
                      key={weekIndex}
                      plan={activePlan}
                      weekIndex={weekIndex}
                      startDate={new Date(activePlan.start_date)}
                    />
                  )
                )}
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
};

export default Plan;
