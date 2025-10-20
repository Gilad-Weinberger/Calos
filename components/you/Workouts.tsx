import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../lib/context/AuthContext";
import {
  Achievement,
  getUserRecentWorkouts,
  getWorkoutAchievements,
} from "../../lib/functions/workoutFunctions";
import WorkoutCard from "./workouts/WorkoutCard";

interface WorkoutData {
  workout_id: string;
  workout_date: string;
  created_at: string;
  workout_exercises: {
    exercise_id: string;
    sets: number;
    reps: number[];
    order_index: number;
    video_urls?: string[];
    exercises: {
      name: string;
      type: "static" | "dynamic";
    };
  }[];
}

const Workouts: React.FC = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workoutAchievements, setWorkoutAchievements] = useState<
    Record<string, Achievement[]>
  >({});

  const fetchWorkouts = useCallback(
    async (isRefresh = false) => {
      if (!user?.user_id) return;

      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const data = await getUserRecentWorkouts(user.user_id, 20);
        setWorkouts(data as unknown as WorkoutData[]);

        // Fetch achievements for each workout
        const achievementsMap: Record<string, Achievement[]> = {};
        for (const workout of data as unknown as WorkoutData[]) {
          try {
            const achievements = await getWorkoutAchievements(
              user.user_id,
              workout.workout_id,
              "individual" // Compare each set individually against historical data
            );
            achievementsMap[workout.workout_id] = achievements;
          } catch (err) {
            console.error(
              `Error fetching achievements for workout ${workout.workout_id}:`,
              err
            );
            achievementsMap[workout.workout_id] = [];
          }
        }
        setWorkoutAchievements(achievementsMap);
      } catch (err) {
        console.error("Error fetching workouts:", err);
        setError("Failed to load workouts. Please try again.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.user_id]
  );

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const handleRefresh = () => {
    fetchWorkouts(true);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Loading workouts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-4">
        <Text className="text-lg font-semibold text-red-600 mb-2">{error}</Text>
        <Text className="text-base text-gray-600 text-center">
          Pull down to refresh
        </Text>
      </View>
    );
  }

  if (workouts.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <FlatList
          data={[]}
          renderItem={null}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center px-4 py-20">
              <Text className="text-6xl mb-4">💪</Text>
              <Text className="text-lg font-semibold text-gray-800 mb-2">
                No Workouts Yet
              </Text>
              <Text className="text-base text-gray-600 text-center">
                Start recording your workouts to see them here
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#3B82F6"
            />
          }
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.workout_id}
        renderItem={({ item }) => (
          <WorkoutCard
            workout={item}
            userName={user?.name || "User"}
            userProfileImage={user?.profile_image_url || null}
            achievements={workoutAchievements[item.workout_id] || []}
            onWorkoutDeleted={() => fetchWorkouts(true)}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
          />
        }
      />
    </View>
  );
};

export default Workouts;
