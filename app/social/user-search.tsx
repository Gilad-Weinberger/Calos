import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../lib/context/AuthContext";
import {
  followUser,
  isFollowing,
  SearchUserResult,
  searchUsers,
  unfollowUser,
} from "../../lib/functions/userFunctions";

const UserSearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [followingStates, setFollowingStates] = useState<
    Record<string, boolean>
  >({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const { user } = useAuth();

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await searchUsers(query);
        if (error) {
          Alert.alert("Error", "Failed to search users");
          return;
        }

        setSearchResults(data || []);

        // Check follow status for each user
        if (user?.user_id && data) {
          const followStates: Record<string, boolean> = {};
          for (const searchUser of data) {
            const { isFollowing: following } = await isFollowing(
              user.user_id,
              searchUser.user_id
            );
            followStates[searchUser.user_id] = following;
          }
          setFollowingStates(followStates);
        }
      } catch (error) {
        console.error("Search error:", error);
        Alert.alert("Error", "Failed to search users");
      } finally {
        setIsSearching(false);
      }
    },
    [user?.user_id]
  );

  const debouncedSearch = useCallback(
    (query: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    },
    [performSearch]
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const handleFollowToggle = async (targetUserId: string) => {
    if (!user?.user_id) {
      Alert.alert("Error", "You must be logged in to follow users");
      return;
    }

    if (targetUserId === user.user_id) {
      Alert.alert("Error", "You cannot follow yourself");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, [targetUserId]: true }));

    try {
      const isCurrentlyFollowing = followingStates[targetUserId];

      const { error } = isCurrentlyFollowing
        ? await unfollowUser(user.user_id, targetUserId)
        : await followUser(user.user_id, targetUserId);

      if (error) {
        Alert.alert(
          "Error",
          `Failed to ${isCurrentlyFollowing ? "unfollow" : "follow"} user`
        );
        return;
      }

      setFollowingStates((prev) => ({
        ...prev,
        [targetUserId]: !isCurrentlyFollowing,
      }));
    } catch (error) {
      console.error("Follow toggle error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  const handleUserPress = (userId: string) => {
    router.push({
      pathname: "/profile/[id]",
      params: { id: userId },
    });
  };

  const renderUserItem = ({ item }: { item: SearchUserResult }) => {
    const isCurrentlyFollowing = followingStates[item.user_id] || false;
    const isLoading = loadingStates[item.user_id] || false;

    return (
      <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => handleUserPress(item.user_id)}
            className="flex-row items-center flex-1"
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center overflow-hidden mr-3">
              {item.profile_image_url ? (
                <Image
                  source={{ uri: item.profile_image_url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={24} color="white" />
              )}
            </View>

            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">
                {item.name || "Unknown User"}
              </Text>
              {item.description && (
                <Text className="text-sm text-gray-500" numberOfLines={1}>
                  {item.description}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          {item.user_id !== user?.user_id && (
            <TouchableOpacity
              onPress={() => handleFollowToggle(item.user_id)}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg ${
                isCurrentlyFollowing ? "bg-gray-200" : "bg-blue-500"
              } ${isLoading ? "opacity-50" : ""}`}
            >
              {isLoading ? (
                <ActivityIndicator
                  size="small"
                  color={isCurrentlyFollowing ? "#6B7280" : "white"}
                />
              ) : (
                <Text
                  className={`text-sm font-medium ${
                    isCurrentlyFollowing ? "text-gray-700" : "text-white"
                  }`}
                >
                  {isCurrentlyFollowing ? "Following" : "Follow"}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (isSearching) {
      return (
        <View className="flex-1 justify-center items-center py-20">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-500 mt-4">Searching users...</Text>
        </View>
      );
    }

    if (searchQuery.trim()) {
      return (
        <View className="flex-1 justify-center items-center py-20">
          <Ionicons name="search" size={48} color="#9CA3AF" />
          <Text className="text-gray-500 mt-4 text-center">
            No users found for &quot;{searchQuery}&quot;
          </Text>
          <Text className="text-gray-400 mt-2 text-center text-sm">
            Try searching with a different name
          </Text>
        </View>
      );
    }

    return (
      <View className="flex-1 justify-center items-center py-20">
        <Ionicons name="people" size={48} color="#9CA3AF" />
        <Text className="text-gray-500 mt-4 text-center">
          Search for users to follow
        </Text>
        <Text className="text-gray-400 mt-2 text-center text-sm">
          Enter a name to find other users
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
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
            Search Users
          </Text>
        </View>

        {/* Search Input */}
        <View className="mt-4">
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-800"
              placeholder="Search by name..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="ml-2"
              >
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Results */}
      <View className="flex-1 px-4 pt-4">
        {searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.user_id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          renderEmptyState()
        )}
      </View>
    </View>
  );
};

export default UserSearchScreen;
