import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MediaGrid from "../../components/profile/MediaGrid";
import ProfileStats from "../../components/profile/ProfileStats";
import { useAuth } from "../../lib/context/AuthContext";
import {
  followUser,
  getUserProfile,
  getUserRecentMedia,
  getUserWorkoutStats,
  isFollowing,
  unfollowUser,
} from "../../lib/functions/userFunctions";

const ProfilePage = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [workoutStats, setWorkoutStats] = useState<any>(null);
  const [recentMedia, setRecentMedia] = useState<any[]>([]);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
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

      // Fetch workout stats
      const { data: stats } = await getUserWorkoutStats(id);
      setWorkoutStats(stats);

      // Fetch recent media
      const { data: media } = await getUserRecentMedia(id);
      setRecentMedia(media || []);

      // Check if current user is following this user
      if (currentUser && currentUser.user_id !== id) {
        const { isFollowing: following } = await isFollowing(
          currentUser.user_id,
          id
        );
        setIsFollowingUser(following);
      }
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [id, currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !profileUser) return;

    setFollowingLoading(true);
    try {
      if (isFollowingUser) {
        const { error } = await unfollowUser(
          currentUser.user_id,
          profileUser.user_id
        );
        if (error) {
          Alert.alert("Error", "Failed to unfollow user");
          return;
        }
        setIsFollowingUser(false);
      } else {
        const { error } = await followUser(
          currentUser.user_id,
          profileUser.user_id
        );
        if (error) {
          Alert.alert("Error", "Failed to follow user");
          return;
        }
        setIsFollowingUser(true);
      }
    } catch (err) {
      console.error("Error following/unfollowing user:", err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleShare = async () => {
    if (!profileUser) return;

    try {
      const shareMessage = `Check out ${profileUser.name}'s profile on Calos!`;
      await Sharing.shareAsync(shareMessage);
    } catch (err) {
      console.error("Error sharing profile:", err);
    }
  };

  const handleViewWorkouts = () => {
    router.push({
      pathname: "/profile/workouts/[id]",
      params: { id },
    });
  };

  const isOwnProfile = currentUser?.user_id === id;

  if (loading) {
    return (
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-4">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800 flex-1">
              Profile
            </Text>
            <TouchableOpacity
              onPress={handleShare}
              className="p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="share-social-outline" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0066FF" />
          <Text className="text-gray-600 mt-2">Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-4">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800 flex-1">
              Profile
            </Text>
            <TouchableOpacity
              onPress={handleShare}
              className="p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="share-social-outline" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
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

  if (!profileUser) {
    return null;
  }

  const followerCount = profileUser.followers?.length || 0;
  const followingCount = profileUser.following?.length || 0;

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-4">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 p-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800 flex-1">
            Profile
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            className="p-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="share-social-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#0066FF"
          />
        }
      >
        <SafeAreaView className="flex-1" edges={["bottom", "left", "right"]}>
          {/* Media Grid Section */}
          {recentMedia.length > 0 && <MediaGrid mediaItems={recentMedia} />}
          {/* Profile Information Section */}
          <View className="p-6">
            <View className="mb-6">
              <View className="flex-row items-center mb-4">
                <View className="w-20 h-20 rounded-full bg-gray-200 items-center justify-center overflow-hidden mr-4">
                  {profileUser.profile_image_url ? (
                    <Image
                      source={{ uri: profileUser.profile_image_url }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="person" size={32} color="#9CA3AF" />
                  )}
                </View>
                <View className="flex-1 h-10">
                  <Text className="text-2xl font-bold text-gray-800">
                    {profileUser.name || "Unknown User"}
                  </Text>
                </View>
              </View>

              {/* Bio/Description */}
              {profileUser.description ? (
                <Text className="text-sm text-gray-700 leading-5 mt-1">
                  {profileUser.description}
                </Text>
              ) : (
                <Text className="text-sm text-gray-500 italic mt-1">
                  No description provided
                </Text>
              )}
            </View>

            {/* Social Stats Section */}
            <View className="mb-6">
              <View className="flex-row items-center mb-4 gap-4">
                <View className="flex-col items-start">
                  <Text className="text-center text-sm text-gray-500">
                    Following
                  </Text>
                  <Text className="text-center text-lg font-bold text-gray-800">
                    {followingCount}
                  </Text>
                </View>
                <View className="flex-col items-start">
                  <Text className="text-center text-sm text-gray-500">
                    Followers
                  </Text>
                  <Text className="text-center text-lg font-bold text-gray-800">
                    {followerCount}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-2 mb-4">
              {!isOwnProfile && (
                <TouchableOpacity
                  onPress={handleFollow}
                  disabled={followingLoading}
                  className={`h-8 rounded-lg flex-row items-center justify-center ${
                    isFollowingUser
                      ? "border border-blue-500 w-32"
                      : "bg-blue-500 w-24"
                  }`}
                >
                  {followingLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={isFollowingUser ? "#6B7280" : "white"}
                    />
                  ) : (
                    <>
                      <Ionicons
                        name={isFollowingUser ? "checkmark" : "add"}
                        size={16}
                        color={isFollowingUser ? "#0066FF" : "white"}
                      />
                      <Text
                        className={`font-medium text-sm ml-2 ${
                          isFollowingUser ? "text-blue-500" : "text-white"
                        }`}
                      >
                        {isFollowingUser ? "Following" : "Follow"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleViewWorkouts}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <View className="flex-row items-center">
                  <Ionicons name="chatbox-outline" size={20} color="#6B7280" />
                </View>
                <Text className="text-sm text-gray-600 ml-2">
                  Messages
                </Text>
              </TouchableOpacity>
              </View>
            </View>

            {/* Workout Statistics Section */}
            {workoutStats && <ProfileStats stats={workoutStats} />}

            {/* Workouts Section */}
            <View className="mb-6">
              <TouchableOpacity
                onPress={handleViewWorkouts}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons
                      name="barbell-outline"
                      size={20}
                      color="#6B7280"
                    />
                    <Text className="text-lg font-semibold text-gray-800 ml-2">
                      Workouts
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-sm text-gray-600 mr-2">
                      {workoutStats?.totalWorkouts || 0} workouts
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#9CA3AF"
                    />
                  </View>
                </View>
                {workoutStats && workoutStats.totalWorkouts > 0 && (
                  <Text className="text-sm text-gray-500 mt-1">
                    Most recent: {new Date().toLocaleDateString()}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
};

export default ProfilePage;
