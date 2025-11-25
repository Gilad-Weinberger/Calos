import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppTopBar from "../../../components/layout/AppTopBar";
import {
  PlanProgressHeader,
  PlanWeekScheduleCard,
} from "../../../components/plan/display";
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
  const router = useRouter();
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

  const handleCreatePlanWithPDF = () => {
    router.push("/plan/create-pdf" as any);
  };

  const handleCreatePlanWithAI = () => {
    router.push("/plan/create-ai" as any);
  };

  const handleManagePlan = () => {
    if (!activePlan?.plan_id) {
      console.error("Cannot navigate: plan_id is missing");
      return;
    }
    router.push({
      pathname: "/plan/manage/[id]",
      params: { id: activePlan.plan_id },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["bottom", "left", "right"]}
      >
        <AppTopBar title="Your Plan" icons={[]} />
        <View className="flex-1 items-center justify-center bg-gray-50">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-600 mt-4">Loading plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <AppTopBar title="Your Plan" icons={[]} />
      <SafeAreaView className="flex-1 bg-gray-100" edges={["left", "right"]}>
        {!activePlan ? (
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
              Create Your Workout Plan
            </Text>
            <Text className="text-base text-gray-600 text-center mb-8 px-4">
              Choose how you&apos;d like to create your personalized workout
              plan
            </Text>

            {/* Create Plan by Uploading PDF Option */}
            <TouchableOpacity
              onPress={handleCreatePlanWithPDF}
              className="w-full max-w-sm bg-white rounded-2xl p-6 mb-4 shadow-lg border border-gray-200"
            >
              <View className="flex-row items-center mb-3">
                <View className="w-12 h-12 rounded-full bg-purple-100 items-center justify-center mr-4">
                  <MaterialCommunityIcons
                    name="file-pdf-box"
                    size={26}
                    color="#7c3aed"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900">
                    Create Plan by Uploading PDF
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    Upload a PDF workout plan and let AI analyze it
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Create Plan with AI Option */}
            <TouchableOpacity
              onPress={handleCreatePlanWithAI}
              className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
            >
              <View className="flex-row items-center mb-3">
                <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-4">
                  <Ionicons name="sparkles" size={24} color="#2563eb" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900">
                    Create Plan with AI
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    Let AI generate a custom workout plan for you
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
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
                {/* Manage Plan Button */}
                <TouchableOpacity
                  onPress={handleManagePlan}
                  className="w-full bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
                      <Ionicons
                        name="settings-outline"
                        size={20}
                        color="#374151"
                      />
                    </View>
                    <Text className="text-base font-semibold text-gray-900">
                      Manage Plan
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                {/* Week Schedule Cards */}
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
