import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

interface ProfileActionButtonsProps {
  isOwnProfile: boolean;
  isFollowing: boolean;
  followingLoading: boolean;
  userId: string;
  onFollow: () => void;
}

const ProfileActionButtons: React.FC<ProfileActionButtonsProps> = ({
  isOwnProfile,
  isFollowing,
  followingLoading,
  userId,
  onFollow,
}) => {
  return (
    <View className="flex-row items-center gap-2">
      {!isOwnProfile && (
        <TouchableOpacity
          onPress={onFollow}
          disabled={followingLoading}
          className={`h-8 rounded-lg flex-row items-center justify-center ${
            isFollowing
              ? "border border-blue-500 w-32"
              : "bg-blue-500 w-24"
          }`}
        >
          {followingLoading ? (
            <ActivityIndicator
              size="small"
              color={isFollowing ? "#6B7280" : "white"}
            />
          ) : (
            <>
              <Ionicons
                name={isFollowing ? "checkmark" : "add"}
                size={16}
                color={isFollowing ? "#0066FF" : "white"}
              />
              <Text
                className={`font-medium text-sm ml-2 ${
                  isFollowing ? "text-blue-500" : "text-white"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={() => router.push(`/profile/share/${userId}`)}
        className="h-8 rounded-lg flex-row items-center justify-center bg-white border border-blue-500 w-32"
      >
        <Ionicons name="qr-code-outline" size={16} color="#0066FF" />
        <Text className="font-medium text-sm ml-2 text-blue-500">Share QR</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileActionButtons;

