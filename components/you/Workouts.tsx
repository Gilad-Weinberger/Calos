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
  convertWorkoutVideoUrls,
  getUserRecentWorkouts,
  getWorkoutAchievements,
} from "../../lib/functions/workoutFunctions";
import WorkoutCard from "./workouts/WorkoutCard";

interface WorkoutData {
  workout_id: string;
  workout_date: string;
  created_at: string;
  start_time?: string;
  end_time?: string;
  plan_id?: string;
  plan_workout_letter?: string;
  scheduled_date?: string;
  title?: string;
  description?: string;
  plans?: {
    name: string;
  };
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workoutAchievements, setWorkoutAchievements] = useState<
    Record<string, Achievement[]>
  >({});
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [achievementsCache, setAchievementsCache] = useState<
    Record<string, Achievement[]>
  >({});

  const BATCH_SIZE = 5;

  // Intentionally exclude hasMore, isLoadingMore, offset from dependencies to prevent infinite loop
  // These values are read from state but don't need to recreate the function
  const fetchWorkouts = useCallback(
    async (isRefresh = false, loadMore = false) => {
      if (!user?.user_id) return;
      if (loadMore && (!hasMore || isLoadingMore)) return;

      try {
        if (isRefresh) {
          setIsRefreshing(true);
          setOffset(0);
          setHasMore(true);
        } else if (loadMore) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const currentOffset = isRefresh ? 0 : loadMore ? offset : 0;
        const data = await getUserRecentWorkouts(
          user.user_id,
          BATCH_SIZE,
          currentOffset
        );

        // Check if we received fewer items than requested (end of list)
        if (data.length < BATCH_SIZE) {
          setHasMore(false);
        }

        // Update workouts list
        if (isRefresh) {
          setWorkouts(data as unknown as WorkoutData[]);
          setOffset(BATCH_SIZE);
        } else if (loadMore) {
          setWorkouts((prev) => [
            ...prev,
            ...(data as unknown as WorkoutData[]),
          ]);
          setOffset((prev) => prev + BATCH_SIZE);
        } else {
          setWorkouts(data as unknown as WorkoutData[]);
          setOffset(BATCH_SIZE);
        }

        // Fetch achievements for workouts that aren't cached
        const workoutsToFetch = (data as unknown as WorkoutData[]).filter(
          (workout) => !achievementsCache[workout.workout_id]
        );

        const achievementsPromises = workoutsToFetch.map(async (workout) => {
          try {
            const achievements = await getWorkoutAchievements(
              user.user_id,
              workout.workout_id,
              "individual" // Compare each set individually against historical data
            );
            return { workoutId: workout.workout_id, achievements };
          } catch (err) {
            console.error(
              `Error fetching achievements for workout ${workout.workout_id}:`,
              err
            );
            return { workoutId: workout.workout_id, achievements: [] };
          }
        });

        // Wait for all achievement fetches to complete
        const achievementsResults = await Promise.all(achievementsPromises);

        // Convert results to map and update cache
        const achievementsMap: Record<string, Achievement[]> = {};
        achievementsResults.forEach(({ workoutId, achievements }) => {
          achievementsMap[workoutId] = achievements;
        });

        // Update cache with new achievements
        setAchievementsCache((prev) => ({
          ...prev,
          ...achievementsMap,
        }));

        // Merge cached and new achievements
        const allAchievements = {
          ...achievementsCache,
          ...achievementsMap,
        };

        // Merge achievements with existing ones
        setWorkoutAchievements((prev) => ({
          ...(isRefresh ? {} : prev),
          ...allAchievements,
        }));

        // Convert video URLs asynchronously after UI is updated
        convertWorkoutVideoUrls(data as unknown as WorkoutData[])
          .then(() => {
            // Trigger a re-render to show converted video URLs
            setWorkouts((currentWorkouts) => [...currentWorkouts]);
          })
          .catch((error) => {
            console.error("Error converting video URLs:", error);
          });
      } catch (err) {
        console.error("Error fetching workouts:", err);
        setError("Failed to load workouts. Please try again.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.user_id]
  );

  // Only fetch on mount or when user changes to prevent infinite loop
  // fetchWorkouts is intentionally excluded from dependencies
  useEffect(() => {
    fetchWorkouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]);

  const handleRefresh = () => {
    fetchWorkouts(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore && !isLoading) {
      fetchWorkouts(false, true);
    }
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
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
            userId={user?.user_id}
            planName={item.plans?.name || undefined}
            achievements={workoutAchievements[item.workout_id] || []}
            onWorkoutDeleted={() => fetchWorkouts(true)}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
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
