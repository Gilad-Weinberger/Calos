import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TodaysWorkout from "../../components/record/TodaysWorkout";
import WorkoutForm from "../../components/record/WorkoutForm";
import { useAuth } from "../../lib/context/AuthContext";
import { getActivePlan, Plan } from "../../lib/functions/planFunctions";

const Record = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [showManualWorkout, setShowManualWorkout] = useState(false);

  const loadActivePlan = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const plan = await getActivePlan(user.user_id);
      setActivePlan(plan);

      // Check and create next week workouts if needed (for recurring plans)
      if (plan) {
        const { checkAndCreateNextWeekWorkouts } = await import(
          "../../lib/functions/planFunctions"
        );
        await checkAndCreateNextWeekWorkouts(plan, user.user_id);
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
    router.push("/(tabs)/plan/create" as any);
  };

  // Show manual workout form modal
  if (showManualWorkout) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="px-4 py-3 border-b border-gray-200 bg-white flex-row items-center justify-between">
          <Text className="text-xl font-bold text-gray-900">
            Create Workout Manually
          </Text>
          <TouchableOpacity onPress={handleManualWorkoutClose} className="p-2">
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        <WorkoutForm />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header with Calendar */}
      {activePlan && (
        <View className="px-4 py-3 border-b border-gray-200 bg-white flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">Record</Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/plan" as any)}
            className="p-2"
          >
            <Ionicons name="calendar-outline" size={24} color="#374151" />
          </TouchableOpacity>
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
        <TodaysWorkout plan={activePlan} />
      )}
    </SafeAreaView>
  );
};

export default Record;
