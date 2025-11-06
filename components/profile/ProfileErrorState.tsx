import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import FullPageTopBar from "../layout/FullPageTopBar";

interface ProfileErrorStateProps {
  error: string;
  onShare: () => void;
}

const ProfileErrorState: React.FC<ProfileErrorStateProps> = ({
  error,
  onShare,
}) => {
  return (
    <View className="flex-1 bg-white">
      <FullPageTopBar
        title="Profile"
        rightIcons={[
          {
            name: "share-social-outline",
            onPress: onShare,
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
};

export default ProfileErrorState;


