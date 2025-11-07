import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppTopBar from "../../../components/layout/AppTopBar";
import PlanProgressHeader from "../../../components/plan/PlanProgressHeader";
import PlanWeekScheduleCard from "../../../components/plan/PlanWeekScheduleCard";
import PlanCreationPrompt from "../../../components/plan/PlanCreationPrompt";
import { useAuth } from "../../../lib/context/AuthContext";
import {
  getActivePlan,
  getPlanProgress,
  type Plan as PlanType,
} from "../../../lib/functions/planFunctions";

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
          "../../../lib/functions/planFunctions"
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

  const handlePlanCreated = useCallback(() => {
    // Reload the plan after creation
    loadActivePlan();
  }, [loadActivePlan]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-white">
        <AppTopBar title="Your Plan" icons={[]} />
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
    <View className="flex-1 bg-white">
      <AppTopBar title="Your Plan" icons={[]} />
      <SafeAreaView className="flex-1 bg-gray-100" edges={["left", "right"]}>
        {!activePlan ? (
          <PlanCreationPrompt onPlanCreated={handlePlanCreated} />
        ) : (
          <ScrollView className="flex-1 p-4">
            {planProgress && (
              <PlanProgressHeader
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
                    <PlanWeekScheduleCard
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
