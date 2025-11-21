import {
  formatDistanceToNow,
  isThisWeek,
  isThisYear,
  isToday,
  isYesterday,
} from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FullPageTopBar from "../../components/layout/FullPageTopBar";
import ProfileActionButtons from "../../components/profile/ProfileActionButtons";
import ProfileErrorState from "../../components/profile/ProfileErrorState";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileLoadingState from "../../components/profile/ProfileLoadingState";
import ProfileMediaGrid from "../../components/profile/ProfileMediaGrid";
import ProfileSocialStats from "../../components/profile/ProfileSocialStats";
import ProfileStats from "../../components/profile/ProfileStats";
import ProfileWorkoutSection from "../../components/profile/ProfileWorkoutSection";
import { useAuth } from "../../lib/context/AuthContext";
import {
  followUser,
  getUserLastWorkoutDate,
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
  const [lastWorkoutDate, setLastWorkoutDate] = useState<string | null>(null);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to format date in a friendly way
  const getFriendlyDate = (date: Date): string => {
    if (isToday(date)) {
      return "Today";
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else if (isThisWeek(date)) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else if (isThisYear(date)) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

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

      // Fetch last workout date
      const { data: lastWorkout } = await getUserLastWorkoutDate(id);
      setLastWorkoutDate(lastWorkout);

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

  const isOwnProfile = currentUser?.user_id === id;

  if (loading) {
    return <ProfileLoadingState />;
  }

  if (error) {
    return <ProfileErrorState error={error} onShare={handleShare} />;
  }

  if (!profileUser) {
    return null;
  }

  const followerCount = profileUser.followers?.length || 0;
  const followingCount = profileUser.following?.length || 0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FullPageTopBar
        title="Profile"
        rightIcons={[
          {
            name: "share-social-outline",
            onPress: handleShare,
          },
        ]}
      />
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
          {recentMedia.length > 0 && (
            <ProfileMediaGrid mediaItems={recentMedia} />
          )}
          {/* Profile Information Section */}
          <View className="p-6 pb-2">
            <ProfileHeader
              profileImageUrl={profileUser.profile_image_url}
              name={profileUser.name}
              description={profileUser.description}
            />

            <ProfileSocialStats
              followingCount={followingCount}
              followerCount={followerCount}
            />

            <ProfileActionButtons
              isOwnProfile={isOwnProfile}
              isFollowing={isFollowingUser}
              followingLoading={followingLoading}
              userId={id}
              onFollow={handleFollow}
            />
          </View>
          <View className="h-px bg-gray-200 my-6" />
          {/* Workout Statistics Section */}
          {workoutStats && <ProfileStats stats={workoutStats} />}

          <View className="h-px bg-gray-200 my-6" />
          <View className="px-6 py-2">
            <ProfileWorkoutSection
              userId={id}
              totalWorkouts={workoutStats?.totalWorkouts || 0}
              lastWorkoutDate={lastWorkoutDate}
              getFriendlyDate={getFriendlyDate}
            />
          </View>
        </SafeAreaView>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfilePage;
