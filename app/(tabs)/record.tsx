import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ManualWorkoutForm from "../../components/workout/create/ManualWorkoutForm";
import RecordDayWorkoutView from "../../components/workout/display/RecordDayWorkoutView";
import { useAuth } from "../../lib/context/AuthContext";
import { getActivePlan, Plan } from "../../lib/functions/planFunctions";
import {
  getAbsoluteWeekNumber,
  getDaysElapsed,
} from "../../lib/utils/schedule";

const Record = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [showManualWorkout, setShowManualWorkout] = useState(false);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

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
        // Set current week based on today (use absolute week for slider)
        const planStart = new Date(plan.start_date);
        planStart.setHours(0, 0, 0, 0);
        const absoluteWeekNumber = getAbsoluteWeekNumber(planStart);
        setCurrentWeekIndex(absoluteWeekNumber);
        // Set selected day to today
        const today = new Date();
        const daysSinceStart = getDaysElapsed(planStart, today);
        setSelectedDayIndex(daysSinceStart % 7);
      }
    } catch (error) {
      console.error("Error loading active plan:", error);
      setActivePlan(null);
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

  const handleManualWorkoutClose = () => {
    setShowManualWorkout(false);
  };

  const handleCreateNewPlan = () => {
    router.push("/(tabs)/plan" as any);
  };

  const handleDaySelect = (dayIndex: number) => {
    setSelectedDayIndex(dayIndex);
  };

  const handleGoToToday = () => {
    if (!activePlan) return;

    const planStart = new Date(activePlan.start_date);
    planStart.setHours(0, 0, 0, 0);
    const absoluteWeekNumber = getAbsoluteWeekNumber(planStart);
    setCurrentWeekIndex(absoluteWeekNumber);
    // Set selected day to today
    const today = new Date();
    const daysSinceStart = getDaysElapsed(planStart, today);
    setSelectedDayIndex(daysSinceStart % 7);
  };

  const handleWeekChange = (weekIndex: number) => {
    setCurrentWeekIndex(weekIndex);
  };

  // Get today's date for display
  const getTodayDate = (): string => {
    const today = new Date();
    return today.getDate().toString();
  };

  // Check if user is currently viewing today
  const isViewingToday = (): boolean => {
    if (!activePlan) return false;

    const planStart = new Date(activePlan.start_date);
    planStart.setHours(0, 0, 0, 0);
    const absoluteWeekNumber = getAbsoluteWeekNumber(planStart);
    const today = new Date();
    const daysSinceStart = getDaysElapsed(planStart, today);
    const currentDayIndex = daysSinceStart % 7;

    return (
      currentWeekIndex === absoluteWeekNumber &&
      selectedDayIndex === currentDayIndex
    );
  };

  // Get week display text
  const getWeekDisplayText = (): string => {
    if (!activePlan) return "";

    if (activePlan.plan_type === "repeat") {
      // For recurring plans, show the cycle week number (1-indexed)
      const cycleWeekNumber = (currentWeekIndex % activePlan.num_weeks) + 1;
      return `Week ${cycleWeekNumber}`;
    } else {
      // For non-recurring plans, show current week / total weeks
      const displayWeek = Math.min(currentWeekIndex + 1, activePlan.num_weeks);
      return `Week ${displayWeek}/${activePlan.num_weeks}`;
    }
  };

  // Show manual workout form modal
  if (showManualWorkout) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        {/* Header */}
        <View className="px-4 py-3 border-b border-gray-200 bg-white flex-row items-center justify-between">
          <Text className="text-xl font-bold text-gray-900">
            Create Workout Manually
          </Text>
          <TouchableOpacity onPress={handleManualWorkoutClose} className="p-2">
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        <ManualWorkoutForm />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={["left", "right", "top"]}>
      {/* Header with Week Indicator */}
      {activePlan && (
        <View className="px-4 py-3 border-b border-gray-200 bg-white flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900 mr-2">Record</Text>
          <Text className="text-sm text-gray-600">{getWeekDisplayText()}</Text>
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handleGoToToday}
              className="p-2 ml-2 flex-row items-center"
            >
              <Ionicons
                name={isViewingToday() ? "calendar" : "calendar-outline"}
                size={20}
                color="#374151"
              />
              <Text className="text-sm font-semibold text-gray-900 ml-1">
                {getTodayDate()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/plan" as any)}
              className="p-2 ml-2"
            >
              <Ionicons name="calendar-outline" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Content */}
      {!activePlan ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
            Get Started
          </Text>
          <Text className="text-base text-gray-600 text-center mb-8 px-4">
            Create a workout plan or record a standalone workout
          </Text>

          {/* Create Workout Manually Option */}
          <TouchableOpacity
            onPress={() => setShowManualWorkout(true)}
            className="w-full max-w-sm bg-white rounded-2xl p-6 mb-4 shadow-lg border border-gray-200"
          >
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-4">
                <Ionicons name="create" size={24} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900">
                  Create Workout Manually
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  Add a custom workout with video or manual entry
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Create New Plan Option */}
          <TouchableOpacity
            onPress={handleCreateNewPlan}
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
          >
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mr-4">
                <Ionicons name="document-text" size={24} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900">
                  Create New Plan
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  Upload a PDF workout plan and let AI analyze it
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <RecordDayWorkoutView
          plan={activePlan}
          weekIndex={currentWeekIndex}
          selectedDayIndex={selectedDayIndex}
          onDaySelect={handleDaySelect}
          onWeekChange={handleWeekChange}
        />
      )}
    </SafeAreaView>
  );
};

export default Record;
