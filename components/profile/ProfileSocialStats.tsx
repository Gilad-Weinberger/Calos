import React from "react";
import { Text, View } from "react-native";

interface ProfileSocialStatsProps {
  followingCount: number;
  followerCount: number;
}

const ProfileSocialStats: React.FC<ProfileSocialStatsProps> = ({
  followingCount,
  followerCount,
}) => {
  return (
    <View>
      <View className="flex-row items-center mb-4 gap-4">
        <View className="flex-col items-start">
          <Text className="text-center text-sm text-gray-500">Following</Text>
          <Text className="text-center text-lg font-bold text-gray-800">
            {followingCount}
          </Text>
        </View>
        <View className="flex-col items-start">
          <Text className="text-center text-sm text-gray-500">Followers</Text>
          <Text className="text-center text-lg font-bold text-gray-800">
            {followerCount}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ProfileSocialStats;

