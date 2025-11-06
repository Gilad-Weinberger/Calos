import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppTopBar from "../../../components/layout/AppTopBar";
import WorkoutCard from "../../../components/you/workouts/WorkoutCard";
import { useAuth } from "../../../lib/context/AuthContext";
import { getUserProfile } from "../../../lib/functions/userFunctions";
import { getUserRecentWorkouts } from "../../../lib/functions/workoutFunctions";

const UserWorkoutsPage = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!id) return;

    try {
      setError(null);

      // Fetch user profile
      const { data: userProfile, error: profileError } =
        await getUserProfile(id);
      if (profileError) {
        setError("Failed to load user profile");
        return;
      }

      if (!userProfile) {
        setError("User not found");
        return;
      }

      // Check if profile is public or if it's the current user
      if (!userProfile.is_public && currentUser?.user_id !== id) {
        router.replace("/(tabs)/home");
        return;
      }

      setProfileUser(userProfile);

      // Fetch user workouts
      const userWorkouts = await getUserRecentWorkouts(id, 50, 0);
      setWorkouts(userWorkouts);
    } catch (err) {
      console.error("Error fetching user workouts:", err);
      setError("Failed to load workouts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderWorkout = ({ item }: { item: any }) => (
    <WorkoutCard
      workout={item}
      userName={profileUser?.name || "Unknown User"}
      userProfileImage={profileUser?.profile_image_url}
      userId={profileUser?.user_id}
      onWorkoutDeleted={() => {
        // Refresh the list when a workout is deleted
        handleRefresh();
      }}
    />
  );

  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <AppTopBar
          title="Workouts"
          icons={[
            {
              name: "arrow-back",
              onPress: () => router.back(),
            },
          ]}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF8C00" />
          <Text className="text-gray-600 mt-2">Loading workouts...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white">
        <AppTopBar
          title="Workouts"
          icons={[
            {
              name: "arrow-back",
              onPress: () => router.back(),
            },
          ]}
        />
        <View className="flex-1 items-center justify-center p-4">
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text className="text-lg font-semibold text-gray-800 mt-4 text-center">
            {error}
          </Text>
          <Text className="text-gray-600 mt-2 text-center">
            Please try again later
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <TopBar
        title="Workouts"
        icons={[
          {
            name: "arrow-back",
            onPress: () => router.back(),
          },
        ]}
      />
      <SafeAreaView className="flex-1" edges={["bottom", "left", "right"]}>
        {workouts.length === 0 ? (
          <View className="flex-1 items-center justify-center p-4">
            <Ionicons name="barbell-outline" size={48} color="#9CA3AF" />
            <Text className="text-lg font-semibold text-gray-800 mt-4 text-center">
              No workouts yet
            </Text>
            <Text className="text-gray-600 mt-2 text-center">
              {profileUser?.name || "This user"} hasn&apos;t completed any workouts
            </Text>
          </View>
        ) : (
          <FlatList
            data={workouts}
            renderItem={renderWorkout}
            keyExtractor={(item) => item.workout_id}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#FF8C00"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default UserWorkoutsPage;
