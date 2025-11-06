import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import FullPageTopBar from "../layout/FullPageTopBar";

const ProfileLoadingState: React.FC = () => {
  return (
    <View className="flex-1 bg-white">
      <FullPageTopBar
        title="Profile"
        rightIcons={[
          {
            name: "share-social-outline",
            onPress: () => {},
          },
        ]}
      />
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0066FF" />
        <Text className="text-gray-600 mt-2">Loading profile...</Text>
      </View>
    </View>
  );
};

export default ProfileLoadingState;


