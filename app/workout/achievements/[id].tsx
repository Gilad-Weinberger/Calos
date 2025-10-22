import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AchievementIcon from "../../../components/ui/AchievementIcon";
import { useAuth } from "../../../lib/context/AuthContext";
import {
  Achievement,
  formatWorkoutDate,
  getWorkoutAchievements,
} from "../../../lib/functions/workoutFunctions";
import { supabase } from "../../../lib/utils/supabase";

interface WorkoutData {
  workout_id: string;
  workout_date: string;
  created_at: string;
  user_id: string;
  workout_exercises: {
    exercise_id: string;
    sets: number;
    reps: number[];
    order_index: number;
    exercises: {
      name: string;
      type: "static" | "dynamic";
    };
  }[];
}

const WorkoutAchievementsPage: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [workout, setWorkout] = useState<WorkoutData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkoutData = useCallback(async () => {
    if (!id || !user?.user_id) return;

    try {
      setIsLoading(true);
      setError(null);

      // First, fetch the workout and verify ownership
      const { data: workoutData, error: workoutError } = await supabase
        .from("workouts")
        .select(
          `
          workout_id,
          workout_date,
          created_at,
          user_id,
          workout_exercises (
            exercise_id,
            sets,
            reps,
            order_index,
            exercises (
              name,
              type
            )
          )
        `
        )
        .eq("workout_id", id)
        .single();

      if (workoutError) {
        console.error("Error fetching workout:", workoutError);
        setError("Workout not found");
        return;
      }

      // Verify the workout belongs to the authenticated user
      if (workoutData.user_id !== user.user_id) {
        setError("You don't have permission to view this workout");
        return;
      }

      setWorkout(workoutData as unknown as WorkoutData);

      // Fetch achievements for this workout
      const workoutAchievements = await getWorkoutAchievements(
        user.user_id,
        id,
        "individual"
      );
      setAchievements(workoutAchievements);
    } catch (err) {
      console.error("Error fetching workout data:", err);
      setError("Failed to load workout data");
    } finally {
      setIsLoading(false);
    }
  }, [id, user?.user_id]);

  useEffect(() => {
    fetchWorkoutData();
  }, [fetchWorkoutData]);

  const handleBackPress = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-600 mt-4">Loading achievements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !workout) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text className="text-lg font-semibold text-red-600 mb-2 mt-4">
            {error || "Workout not found"}
          </Text>
          <Pressable
            onPress={handleBackPress}
            className="bg-blue-500 px-6 py-3 rounded-lg mt-4"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const formattedDate = formatWorkoutDate(workout.workout_date);
  const totalExercises = workout.workout_exercises.length;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <Pressable onPress={handleBackPress} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-800">Results</Text>
        <View className="w-8" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Summary Section */}
        <View className="px-4 py-6">
          <View className="flex-row justify-between mb-6">
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-gray-800">
                {achievements.length}
              </Text>
              <Text className="text-sm text-gray-600">Achievements</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-gray-800">
                {totalExercises}
              </Text>
              <Text className="text-sm text-gray-600">Exercises</Text>
            </View>
          </View>

          {/* Workout Info */}
          <View className="bg-gray-50 rounded-lg p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name="barbell" size={20} color="#6B7280" />
              <Text className="text-base font-semibold text-gray-800 ml-2">
                Workout Session
              </Text>
            </View>
            <Text className="text-sm text-gray-600">{formattedDate}</Text>
          </View>
        </View>

        {/* Achievements Section */}
        {achievements.length > 0 ? (
          <View className="px-4">
            <View className="flex-row items-center mb-4">
              <Text className="text-xl font-bold text-gray-800">
                Achievements
              </Text>
              <View className="bg-orange-100 rounded-full px-3 py-1 ml-3">
                <Text className="text-sm font-semibold text-orange-800">
                  {achievements.length}
                </Text>
              </View>
            </View>

            <View className="space-y-3">
              {achievements.map((achievement, index) => (
                <View
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4 shadow-sm">
                      <AchievementIcon
                        type={achievement.icon as "trophy" | "medal"}
                        rank={achievement.rank}
                        size={24}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-800 mb-1">
                        {achievement.icon === "trophy"
                          ? "Personal Record!"
                          : "Great Performance!"}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        {achievement.message}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View className="px-4 py-8">
            <View className="items-center">
              <Ionicons name="trophy-outline" size={64} color="#D1D5DB" />
              <Text className="text-lg font-semibold text-gray-600 mt-4 mb-2">
                No Achievements Yet
              </Text>
              <Text className="text-sm text-gray-500 text-center">
                Keep working out to unlock achievements and personal records!
              </Text>
            </View>
          </View>
        )}

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default WorkoutAchievementsPage;
