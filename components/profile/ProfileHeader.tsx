import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Text, View } from "react-native";

interface ProfileHeaderProps {
  profileImageUrl: string | null;
  name: string;
  description: string | null;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profileImageUrl,
  name,
  description,
}) => {
  return (
    <View className="mb-6">
      <View className="flex-row items-center mb-4">
        <View className="w-20 h-20 rounded-full bg-gray-200 items-center justify-center overflow-hidden mr-4">
          {profileImageUrl ? (
            <Image
              source={{ uri: profileImageUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person" size={32} color="#9CA3AF" />
          )}
        </View>
        <View className="flex-1 h-10">
          <Text className="text-2xl font-bold text-gray-800">
            {name || "Unknown User"}
          </Text>
        </View>
      </View>

      {/* Bio/Description */}
      {description ? (
        <Text className="text-sm text-gray-700 leading-5 mt-1">
          {description}
        </Text>
      ) : (
        <Text className="text-sm text-gray-500 italic mt-1">
          No description provided
        </Text>
      )}
    </View>
  );
};

export default ProfileHeader;


