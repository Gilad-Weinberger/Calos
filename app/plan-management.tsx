import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../lib/context/AuthContext";
import {
  deactivateCurrentPlan,
  deletePlan,
  getActivePlan,
  Plan,
} from "../lib/functions/planFunctions";

const PlanManagement = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);

  useEffect(() => {
    loadPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPlan = async () => {
    if (!user) {
      router.back();
      return;
    }

    try {
      setIsLoading(true);
      const plan = await getActivePlan(user.user_id);
      setActivePlan(plan);
    } catch (error) {
      console.error("Error loading plan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = () => {
    Alert.alert(
      "Deactivate Plan",
      "Are you sure you want to deactivate this plan? You can reactivate it later.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            try {
              await deactivateCurrentPlan(user.user_id);
              router.back();
            } catch {
              Alert.alert("Error", "Failed to deactivate plan");
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    if (!activePlan || !user) return;

    Alert.alert(
      "Delete Plan",
      "Are you sure you want to delete this plan? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePlan(activePlan.plan_id, user.user_id);
              router.back();
            } catch {
              Alert.alert("Error", "Failed to delete plan");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  if (!activePlan) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="p-4 border-b border-gray-200 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">
            Plan Management
          </Text>
        </View>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-lg text-gray-600">No active plan found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const workoutLetters = Object.keys(activePlan.workouts);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="p-4 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Plan Management</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Plan Info */}
          <View className="bg-blue-50 rounded-lg p-4 mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              {activePlan.name}
            </Text>
            {activePlan.description && (
              <Text className="text-base text-gray-700 mb-3">
                {activePlan.description}
              </Text>
            )}
            <View className="flex-row flex-wrap">
              <View className="bg-white rounded-lg px-3 py-2 mr-2 mb-2">
                <Text className="text-sm text-gray-600">
                  {activePlan.num_weeks}{" "}
                  {activePlan.num_weeks === 1 ? "week" : "weeks"}
                </Text>
              </View>
              <View className="bg-white rounded-lg px-3 py-2 mr-2 mb-2">
                <Text className="text-sm text-gray-600">
                  Type:{" "}
                  {activePlan.plan_type === "repeat" ? "Repeating" : "One-time"}
                </Text>
              </View>
              <View className="bg-white rounded-lg px-3 py-2 mb-2">
                <Text className="text-sm text-gray-600">
                  Started:{" "}
                  {new Date(activePlan.start_date).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Workouts */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Workouts
            </Text>
            {workoutLetters.map((letter) => {
              const workout = activePlan.workouts[letter];
              return (
                <View
                  key={letter}
                  className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200"
                >
                  <Text className="text-lg font-semibold text-gray-900 mb-2">
                    Workout {letter}: {workout.name}
                  </Text>
                  <Text className="text-sm text-gray-600 mb-2">
                    {workout.exercises.length} exercises
                  </Text>
                  {workout.exercises.map((ex, index) => (
                    <Text key={index} className="text-sm text-gray-700">
                      • {ex.exercise_name} - {ex.sets}x{ex.reps}
                    </Text>
                  ))}
                </View>
              );
            })}
          </View>

          {/* Schedule */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Schedule
            </Text>
            {activePlan.schedule.map((week, weekIndex) => {
              // Calculate which day of week the plan started (0=Sunday, 1=Monday, etc.)
              const startDate = new Date(activePlan.start_date);
              const startDayOfWeek = startDate.getDay();

              // Day names starting with Sunday
              const dayNames = [
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
              ];

              return (
                <View key={weekIndex} className="mb-4">
                  <Text className="text-base font-semibold text-gray-800 mb-2">
                    Week {weekIndex + 1}
                  </Text>
                  <View className="flex-row flex-wrap">
                    {dayNames.map((dayName, dayOfWeekIndex) => {
                      // Calculate which day this is in the plan (0-based from start)
                      const dayInPlan =
                        weekIndex * 7 + dayOfWeekIndex - startDayOfWeek;

                      // If before plan start, show empty/disabled
                      if (dayInPlan < 0) {
                        return (
                          <View
                            key={dayOfWeekIndex}
                            className="rounded-lg px-3 py-2 mr-2 mb-2 bg-gray-100 opacity-50"
                          >
                            <Text className="text-xs text-gray-400 mb-1">
                              {dayName}
                            </Text>
                            <Text className="text-sm font-semibold text-gray-400">
                              -
                            </Text>
                          </View>
                        );
                      }

                      // Get the workout for this day from the schedule
                      const weekInSchedule = Math.floor(dayInPlan / 7);
                      const dayInWeek = dayInPlan % 7;
                      const workout =
                        activePlan.schedule[weekInSchedule]?.[dayInWeek];

                      // If no workout found (beyond plan duration), show empty
                      if (!workout) {
                        return (
                          <View
                            key={dayOfWeekIndex}
                            className="rounded-lg px-3 py-2 mr-2 mb-2 bg-gray-100 opacity-50"
                          >
                            <Text className="text-xs text-gray-400 mb-1">
                              {dayName}
                            </Text>
                            <Text className="text-sm font-semibold text-gray-400">
                              -
                            </Text>
                          </View>
                        );
                      }

                      const isRest = workout.toLowerCase() === "rest";
                      return (
                        <View
                          key={dayOfWeekIndex}
                          className={`rounded-lg px-3 py-2 mr-2 mb-2 ${
                            isRest ? "bg-gray-200" : "bg-blue-100"
                          }`}
                        >
                          <Text className="text-xs text-gray-600 mb-1">
                            {dayName}
                          </Text>
                          <Text
                            className={`text-sm font-semibold ${
                              isRest ? "text-gray-600" : "text-blue-700"
                            }`}
                          >
                            {workout}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Actions */}
          <View className="mb-6">
            <TouchableOpacity
              onPress={handleDeactivate}
              className="bg-yellow-600 rounded-lg py-3 mb-3"
            >
              <Text className="text-white font-semibold text-center">
                Deactivate Plan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              className="bg-red-600 rounded-lg py-3"
            >
              <Text className="text-white font-semibold text-center">
                Delete Plan
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PlanManagement;
