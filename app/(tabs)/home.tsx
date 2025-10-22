import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "../../components/layout/TopBar";
import WorkoutCard from "../../components/you/workouts/WorkoutCard";
import { useAuth } from "../../lib/context/AuthContext";
import {
  FollowedUserWorkout,
  getFollowedUsersWorkouts,
} from "../../lib/functions/workoutFunctions";

const Home = () => {
  const [workouts, setWorkouts] = useState<FollowedUserWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const { user } = useAuth();

  const loadWorkouts = useCallback(
    async (reset = false) => {
      if (!user?.user_id) return;

      const currentOffset = reset ? 0 : offset;

      try {
        const { data, error } = await getFollowedUsersWorkouts(
          user.user_id,
          10,
          currentOffset
        );

        if (error) {
          console.error("Error loading workouts:", error);
          return;
        }

        const newWorkouts = data || [];

        if (reset) {
          setWorkouts(newWorkouts);
          setOffset(10);
        } else {
          setWorkouts((prev) => [...prev, ...newWorkouts]);
          setOffset((prev) => prev + 10);
        }

        setHasMore(newWorkouts.length === 10);
      } catch (error) {
        console.error("Exception loading workouts:", error);
      }
    },
    [user?.user_id, offset]
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadWorkouts(true);
    setIsRefreshing(false);
  }, [loadWorkouts]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadWorkouts(false);
    }
  }, [isLoading, hasMore, loadWorkouts]);

  useEffect(() => {
    const initializeFeed = async () => {
      setIsLoading(true);
      await loadWorkouts(true);
      setIsLoading(false);
    };

    if (user?.user_id) {
      initializeFeed();
    }
  }, [user?.user_id, loadWorkouts]);

  const renderWorkoutItem = ({ item }: { item: FollowedUserWorkout }) => {
    const userInfo = item.users;

    return (
      <WorkoutCard
        workout={item}
        userName={userInfo.name || "Unknown User"}
        userProfileImage={userInfo.profile_image_url}
        hideAchievements={true}
        onWorkoutDeleted={() => {
          // Refresh the feed when a workout is deleted
          handleRefresh();
        }}
      />
    );
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-500 mt-4">Loading workouts...</Text>
        </View>
      );
    }

    return (
      <View className="flex-1 justify-center items-center px-8">
        <Ionicons name="people" size={64} color="#9CA3AF" />
        <Text className="text-xl font-semibold text-gray-800 mt-4 text-center">
          No workouts to show
        </Text>
        <Text className="text-gray-500 mt-2 text-center">
          Follow some users to see their workouts in your feed
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/social/user-search")}
          className="bg-blue-500 rounded-xl px-6 py-3 mt-6"
        >
          <Text className="text-white font-semibold">Find Users to Follow</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore || workouts.length === 0) return null;

    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text className="text-gray-500 mt-2">Loading more...</Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <TopBar
        title="Home"
        icons={[
          {
            name: "notifications",
            onPress: () => console.log("Bell pressed"),
          },
          {
            name: "search",
            onPress: () => router.push("/social/user-search"),
          },
        ]}
      />
      <SafeAreaView className="flex-1" edges={["bottom", "left", "right"]}>
        {workouts.length > 0 ? (
          <FlatList
            data={workouts}
            renderItem={renderWorkoutItem}
            keyExtractor={(item) => item.workout_id}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={["#3B82F6"]}
                tintColor="#3B82F6"
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
          />
        ) : (
          renderEmptyState()
        )}
      </SafeAreaView>
    </View>
  );
};

export default Home;
